from os import path
from shutil import copyfileobj
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import date, datetime
from models import get_db_session, add_object
from models.elevage.bovin import Bovin, Velage, ControleQualiteLaitBovin
from models.elevage import ProductionLait
from schemas import PaginatedResponse
from schemas.elevage import (
    ProductionLaitCreate, ProductionLaitResponse, 
    ControleLaitierCreate, ControleLaitierResponse,
    AlerteResponse, PerformanceModel, StatsProductionLait, StatsReproduction
)
from schemas.elevage.bovin import (
    BovinCreate, BovinResponse, BovinUpdate,
    VelageCreate, VelageResponse, BovinCriteria
)
from enums.elevage.bovin import TypeProductionBovinEnum, StatutReproductionBovinEnum
from enums.elevage import StatutAnimalEnum
from machine_learning.analyse.elevage.bovin import BovinAnalysis
from machine_learning.prediction.elevage.bovin import BovinProductionPredictor
from utils.security import get_current_manager
from api import check_permissions_manager, IMAGE_EXTENSIONS, UPLOAD_IMAGE_DIR_Bovin
import logging

router = APIRouter(
    prefix="/api/elevage/bovin",
    tags=["Élevage Bovin"],
    responses={
        404: {"description": "Non trouvé"},
        403: {"description": "Accès refusé"},
        401: {"description": "Non authentifié"}
    },
)

logger = logging.getLogger(__name__)

# ----------------------------
# Endpoints Bovins - Améliorés
# ----------------------------

@router.post("/create-bovin", response_model=BovinResponse, status_code=status.HTTP_201_CREATED)
async def create_bovin(
    bovin: BovinCreate,
    image_file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Crée un nouveau bovin dans le système avec validation avancée.
    
    Exemple de body:
    {
        "type_production": "LAITIERE",
        "statut_reproduction": "VIDE",
        "race_id": 1,
        "date_naissance": "2020-01-15",
        "robe": "Noire et blanche"
    }
    """
    check_permissions_manager(db, current_user)
    
    try:
        # Validation supplémentaire
        if bovin.date_naissance and bovin.date_naissance > date.today():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La date de naissance ne peut pas être dans le futur"
            )

        filename = image_file.filename.lower()
        file_extension = filename.rsplit(".", 1)[-1] if "." in filename else ""

        db_bovin = Bovin(
            **bovin.model_dump(exclude_unset=True),
            created_by=current_user['id'],
            photo_url = f'{bovin.numero_identification}.{file_extension}'
        )

        if file_extension in IMAGE_EXTENSIONS:
            upload_dir = UPLOAD_IMAGE_DIR_Bovin
        else:
            raise HTTPException
        
        # Sauvegarde du fichier
        file_location = path.join(upload_dir, db_bovin.photo_url)
        with open(file_location, "wb") as buffer:
            copyfileobj(image_file.file, buffer)
        
        await add_object(db, db_bovin)
        logger.info(f"Nouveau bovin créé: {db_bovin.numero_identification} par l'utilisateur {current_user['id']}")
        return db_bovin
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur création bovin: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création du bovin: {str(e)}"
        )

@router.get("/{bovin_id}", response_model=BovinResponse)
def get_bovin(
    bovin_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les informations détaillées d'un bovin spécifique avec ses relations.
    Inclut les informations de production, reproduction et santé.
    """
    check_permissions_manager(db, current_user)
    
    try:
        bovin = db.query(Bovin).options(
            joinedload(Bovin.race),
            joinedload(Bovin.lot),
            joinedload(Bovin.pesees),
            joinedload(Bovin.productions_lait),
            joinedload(Bovin.controles_laitiers)
        ).filter(Bovin.id == bovin_id).first()
        
        if not bovin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bovin non trouvé"
            )
            
        return bovin
        
    except Exception as e:
        logger.error(f"Erreur récupération bovin {bovin_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des données"
        )

@router.get("/", response_model=PaginatedResponse[BovinResponse])
def list_bovins(
    search: BovinCriteria = Depends(),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=500),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Liste tous les bovins avec pagination, filtres avancés et tri.
    
    Filtres disponibles:
    - type_production: LAITIERE, VIANDE, MIXTE
    - statut_reproduction: VIDE, PLEINE, EN_CHALEUR
    - race_id: ID de la race
    - statut: ACTIF, VENDU, MORT
    - date_naissance_min/max: Plage de dates
    - lot_id: ID du lot
    """
    check_permissions_manager(db, current_user)
    
    try:
        query = db.query(Bovin).options(
            joinedload(Bovin.race),
            joinedload(Bovin.lot)
        )
        
        # Filtres de base
        if search.type_production:
            query = query.filter(Bovin.type_production == search.type_production)
        if search.statut_reproduction:
            query = query.filter(Bovin.statut_reproduction == search.statut_reproduction)
        if search.race_id:
            query = query.filter(Bovin.race_id == search.race_id)
        if search.statut:
            query = query.filter(Bovin.statut == search.statut)
        if search.lot_id:
            query = query.filter(Bovin.lot_id == search.lot_id)
            
        # Filtres avancés sur dates
        if search.date_naissance_min:
            query = query.filter(Bovin.date_naissance >= search.date_naissance_min)
        if search.date_naissance_max:
            query = query.filter(Bovin.date_naissance <= search.date_naissance_max)
            
        # Tri
        if search.sort_by:
            if search.sort_by == "numero_identification":
                query = query.order_by(Bovin.numero_identification.asc() if search.sort_asc else Bovin.numero_identification.desc())
            elif search.sort_by == "date_naissance":
                query = query.order_by(Bovin.date_naissance.asc() if search.sort_asc else Bovin.date_naissance.desc())
        
        # Pagination
        total = query.count()
        offset = (page - 1) * limit
        bovins = query.offset(offset).limit(limit).all()
        
        return {
            "items": bovins,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "pages": (total + limit - 1) // limit
            }
        }
        
    except Exception as e:
        logger.error(f"Erreur liste bovins: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des données"
        )

@router.put("/{bovin_id}", response_model=BovinResponse)
def update_bovin(
    bovin_id: int,
    bovin_data: BovinUpdate,
    image_file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Met à jour les informations d'un bovin avec validation avancée.
    """
    check_permissions_manager(db, current_user)
    
    try:
        bovin = db.query(Bovin).filter(Bovin.id == bovin_id).first()
        if not bovin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bovin non trouvé"
            )
            
        # Validation des données
        if bovin_data.date_naissance and bovin_data.date_naissance > date.today():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La date de naissance ne peut pas être dans le futur"
            )
            
        filename = image_file.filename.lower()
        file_extension = filename.rsplit(".", 1)[-1] if "." in filename else ""

        if file_extension in IMAGE_EXTENSIONS:
            upload_dir = UPLOAD_IMAGE_DIR_Bovin
        else:
            raise HTTPException

        # Mise à jour des champs
        update_data = bovin_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(bovin, key, value)
            
        bovin.updated_at = datetime.now()
        bovin.updated_by = current_user['id']

        # Sauvegarde du fichier
        file_location = path.join(upload_dir, bovin.photo_url)
        with open(file_location, "wb") as buffer:
            copyfileobj(image_file.file, buffer)
        
        db.commit()
        db.refresh(bovin)
        logger.info(f"Bovin {bovin_id} mis à jour par l'utilisateur {current_user['id']}")
        return bovin
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur mise à jour bovin {bovin_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la mise à jour: {str(e)}"
        )

# ----------------------------
# Endpoints Production Laitière - Améliorés
# ----------------------------

@router.post("/production-lait", response_model=ProductionLaitResponse, status_code=status.HTTP_201_CREATED)
def create_production_lait(
    production: ProductionLaitCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Enregistre une production laitière avec validation des données.
    
    Valide que:
    - L'animal existe
    - La date n'est pas dans le futur
    - La quantité est positive
    """
    check_permissions_manager(db, current_user, required_roles=['admin', 'elevage', 'traite'])
    
    try:
        # Validation de l'animal
        animal = db.query(Bovin).filter(Bovin.id == production.animal_id).first()
        if not animal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Animal non trouvé"
            )
            
        if production.date_production > datetime.now().date():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La date de production ne peut pas être dans le futur"
            )
            
        if production.quantite <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La quantité doit être positive"
            )
            
        db_production = ProductionLait(
            **production.model_dump(),
            recorded_by=current_user['id']
        )
        add_object(db, db_production)

        logger.info(f"Production laitière enregistrée pour l'animal {production.animal_id} par l'utilisateur {current_user['id']}")
        return db_production
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur enregistrement production laitière: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de l'enregistrement: {str(e)}"
        )

@router.get("/{bovin_id}/production-lait/stats", response_model=StatsProductionLait)
def get_production_stats(
    bovin_id: int,
    start_date: date = Query(..., description="Date de début de la période"),
    end_date: date = Query(..., description="Date de fin de la période"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les statistiques de production laitière pour un bovin sur une période donnée.
    
    Retourne:
    - moyenne journalière
    - évolution sur 7 jours
    - meilleur jour de production
    - pire jour de production
    - tendance
    """
    check_permissions_manager(db, current_user)
    
    try:
        # Validation de la période
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La date de début doit être antérieure à la date de fin"
            )
            
        if (end_date - start_date).days > 365:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La période ne peut pas excéder 1 an"
            )
            
        # Récupération des données
        productions = db.query(ProductionLait).filter(
            ProductionLait.animal_id == bovin_id,
            ProductionLait.date_production.between(start_date, end_date)
        ).order_by(ProductionLait.date_production).all()
        
        if not productions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aucune donnée de production trouvée pour cette période"
            )
            
        # Calcul des statistiques
        quantites = [p.quantite for p in productions]
        dates = [p.date_production for p in productions]
        
        moyenne = sum(quantites) / len(quantites)
        max_prod = max(quantites)
        min_prod = min(quantites)
        max_date = dates[quantites.index(max_prod)]
        min_date = dates[quantites.index(min_prod)]
        
        # Calcul de l'évolution sur 7 jours (si suffisamment de données)
        evolution_7j = None
        if len(productions) >= 7:
            last_7 = quantites[-7:]
            evolution_7j = ((last_7[-1] - last_7[0]) / last_7[0]) * 100 if last_7[0] != 0 else 0
            
        # Calcul de la tendance (simplifié)
        tendance = "stable"
        if len(productions) >= 3:
            first_avg = sum(quantites[:3]) / 3
            last_avg = sum(quantites[-3:]) / 3
            if last_avg > first_avg * 1.1:
                tendance = "hausse"
            elif last_avg < first_avg * 0.9:
                tendance = "baisse"
                
        return {
            "moyenne_journaliere": round(moyenne, 2),
            "evolution_7j": round(evolution_7j, 2) if evolution_7j is not None else None,
            "meilleur_jour": {
                "date": max_date,
                "quantite": max_prod
            },
            "pire_jour": {
                "date": min_date,
                "quantite": min_prod
            },
            "tendance": tendance,
            "total_periode": sum(quantites)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur stats production {bovin_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du calcul des statistiques"
        )

# ----------------------------
# Endpoints Contrôles Laitiers - Améliorés
# ----------------------------

@router.post("/controle-laitier", response_model=ControleLaitierResponse, status_code=status.HTTP_201_CREATED)
def create_controle_laitier(
    controle: ControleLaitierCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Enregistre un contrôle laitier avec validation des paramètres.
    
    Valide:
    - L'animal existe
    - Les taux sont dans des plages réalistes
    - Les cellules somatiques sont positives
    """
    check_permissions_manager(db, current_user, required_roles=['admin', 'elevage', 'qualite'])
    
    try:
        # Validation de l'animal
        animal = db.query(Bovin).filter(Bovin.id == controle.animal_id).first()
        if not animal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Animal non trouvé"
            )
            
        # Validation des paramètres
        if controle.cellules_somatiques <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Les cellules somatiques doivent être positives"
            )
            
        if not (2.5 <= controle.taux_butyreux <= 6.0):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Le taux butyreux doit être entre 2.5% et 6.0%"
            )
            
        if not (2.5 <= controle.taux_proteine <= 4.5):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Le taux protéique doit être entre 2.5% et 4.5%"
            )
            
        db_controle = ControleQualiteLaitBovin(
            **controle.model_dump(),
            recorded_by=current_user['id']
        )
        db.add(db_controle)
        db.commit()
        db.refresh(db_controle)
        
        logger.info(f"Contrôle laitier enregistré pour l'animal {controle.animal_id} par l'utilisateur {current_user['id']}")
        return db_controle
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur enregistrement contrôle laitier: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de l'enregistrement: {str(e)}"
        )

# ----------------------------
# Endpoints Reproduction - Améliorés
# ----------------------------

@router.post("/velage", response_model=VelageResponse, status_code=status.HTTP_201_CREATED)
def create_velage(
    velage: VelageCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Enregistre un vêlage avec mise à jour automatique du statut de la mère.
    
    Valide:
    - La mère existe
    - La date n'est pas dans le futur
    - La facilité de vêlage est entre 1 et 5
    """
    check_permissions_manager(db, current_user, required_roles=['admin', 'elevage', 'reproduction'])
    
    try:
        # Validation de la mère
        mere = db.query(Bovin).filter(Bovin.id == velage.mere_id).first()
        if not mere:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mère non trouvée"
            )
            
        if velage.date_velage > datetime.now().date():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La date de vêlage ne peut pas être dans le futur"
            )
            
        if not (1 <= velage.facilite_velage <= 5):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La facilité de vêlage doit être entre 1 et 5"
            )
            
        db_velage = Velage(
            **velage.model_dump(),
            recorded_by=current_user['id']
        )
        db.add(db_velage)
        
        # Mise à jour de la mère
        mere.nombre_velages += 1
        mere.statut_reproduction = None
        mere.date_mise_bas = None
        mere.updated_at = datetime.now()
        mere.updated_by = current_user['id']
        
        db.commit()
        db.refresh(db_velage)
        
        logger.info(f"Vêlage enregistré pour la mère {velage.mere_id} par l'utilisateur {current_user['id']}")
        return db_velage
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur enregistrement vêlage: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de l'enregistrement: {str(e)}"
        )

# ----------------------------
# Endpoints Analyse et Alertes - Améliorés
# ----------------------------

@router.get("/alertes", response_model=List[AlerteResponse])
def get_alertes(
    days: int = Query(7, ge=1, le=30, description="Nombre de jours à analyser"),
    severity: Optional[str] = Query(None, description="Filtrer par sévérité (LOW, MEDIUM, HIGH, CRITICAL)"),
    bovin_id: Optional[int] = Query(None, description="Filtrer par ID de bovin"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les alertes pour l'élevage bovin avec filtres avancés.
    
    Les alertes sont triées par sévérité (CRITICAL en premier).
    """
    check_permissions_manager(db, current_user)
    
    try:
        analyzer = BovinAnalysis(db)
        alerts = analyzer.generate_alerts(animal_id=bovin_id, days=days)
        
        # Filtrage par sévérité si spécifié
        if severity:
            severity = severity.upper()
            valid_severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            if severity not in valid_severities:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Sévérité invalide. Doit être parmi: {', '.join(valid_severities)}"
                )
                
            alerts = [alert for alert in alerts if alert['severity'] == severity]
            
        return alerts
        
    except Exception as e:
        logger.error(f"Erreur récupération alertes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la génération des alertes"
        )

@router.get("/{bovin_id}/resume", response_model=dict)
def get_animal_summary(
    bovin_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère un résumé complet pour un bovin spécifique.
    
    Inclut:
    - Informations de base
    - Dernières productions
    - Derniers contrôles
    - Alertes actives
    - Recommandations
    """
    check_permissions_manager(db, current_user)
    
    try:
        analyzer = BovinAnalysis(db)
        summary = analyzer.get_animal_summary(bovin_id)
        
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bovin non trouvé"
            )
            
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur résumé bovin {bovin_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la génération du résumé"
        )

@router.get("/model-performance", response_model=PerformanceModel)
def get_model_performance(
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les métriques de performance du modèle de prédiction.
    
    Inclut:
    - Score R²
    - Erreur moyenne absolue (MAE)
    - Erreur quadratique moyenne (MSE)
    - Score de validation croisée
    """
    check_permissions_manager(db, current_user, required_roles=['admin', 'technicien'])
    
    try:
        predictor = BovinProductionPredictor()
        performance = predictor.get_performance_metrics()
        
        if not performance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aucune donnée de performance disponible"
            )
            
        return performance
        
    except Exception as e:
        logger.error(f"Erreur récupération performance modèle: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des métriques"
        )

# ----------------------------
# Endpoints Statistiques - Améliorés
# ----------------------------

@router.get("/stats/production-lait", response_model=StatsProductionLait)
def get_milk_production_stats(
    start_date: date = Query(..., description="Date de début de la période"),
    end_date: date = Query(..., description="Date de fin de la période"),
    race_id: Optional[int] = Query(None, description="Filtrer par ID de race"),
    lot_id: Optional[int] = Query(None, description="Filtrer par ID de lot"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les statistiques avancées de production laitière pour une période.
    
    Inclut:
    - Moyenne journalière par animal
    - Évolution sur 7 jours
    - Top 5 des meilleurs producteurs
    - Paramètres de qualité moyens
    """
    check_permissions_manager(db, current_user)
    
    try:
        # Validation de la période
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La date de début doit être antérieure à la date de fin"
            )
            
        if (end_date - start_date).days > 365:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La période ne peut pas excéder 1 an"
            )
            
        # Construction de la requête de base
        query = db.query(
            ProductionLait.animal_id,
            Bovin.numero_identification,
            func.avg(ProductionLait.quantite).label("moyenne_journaliere"),
            func.count(ProductionLait.id).label("nombre_traites")
        ).join(
            Bovin, ProductionLait.animal_id == Bovin.id
        ).filter(
            ProductionLait.date_production.between(start_date, end_date),
            or_(
                Bovin.type_production == TypeProductionBovinEnum.LAITIERE,
                Bovin.type_production == TypeProductionBovinEnum.MIXTE
            )
        ).group_by(
            ProductionLait.animal_id,
            Bovin.numero_identification
        )
        
        # Application des filtres
        if race_id:
            query = query.filter(Bovin.race_id == race_id)
        if lot_id:
            query = query.filter(Bovin.lot_id == lot_id)
            
        # Exécution de la requête
        results = query.all()
        
        if not results:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aucune donnée de production trouvée pour la période spécifiée"
            )
            
        # Calcul des statistiques globales
        moyennes = [r.moyenne_journaliere for r in results]
        moyenne_globale = sum(moyennes) / len(moyennes) if moyennes else 0
        
        # Top 5 des producteurs
        top_5 = sorted(results, key=lambda x: x.moyenne_journaliere, reverse=True)[:5]
        top_5_formatted = [{
            "animal_id": r.animal_id,
            "numero_identification": r.numero_identification,
            "moyenne_journaliere": round(r.moyenne_journaliere, 2)
        } for r in top_5]
        
        # Paramètres de qualité moyens (si disponibles)
        qualite_query = db.query(
            func.avg(ControleQualiteLaitBovin.taux_butyreux).label("taux_butyreux_moyen"),
            func.avg(ControleQualiteLaitBovin.taux_proteine).label("taux_proteine_moyen"),
            func.avg(ControleQualiteLaitBovin.cellules_somatiques).label("cellules_somatiques_moyen")
        ).filter(
            ControleQualiteLaitBovin.date_controle.between(start_date, end_date)
        )
        
        if race_id:
            qualite_query = qualite_query.join(Bovin).filter(Bovin.race_id == race_id)
        if lot_id:
            qualite_query = qualite_query.join(Bovin).filter(Bovin.lot_id == lot_id)
            
        qualite_result = qualite_query.first()
        
        return {
            "moyenne_journaliere": round(moyenne_globale, 2),
            "nombre_animaux": len(results),
            "top_producteurs": top_5_formatted,
            "parametres_qualite": {
                "taux_butyreux": round(qualite_result.taux_butyreux_moyen, 2) if qualite_result.taux_butyreux_moyen else None,
                "taux_proteine": round(qualite_result.taux_proteine_moyen, 2) if qualite_result.taux_proteine_moyen else None,
                "cellules_somatiques": int(qualite_result.cellules_somatiques_moyen) if qualite_result.cellules_somatiques_moyen else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur stats production laitière: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du calcul des statistiques"
        )

@router.get("/stats/reproduction", response_model=StatsReproduction)
def get_reproduction_stats(
    start_date: date = Query(..., description="Date de début de la période"),
    end_date: date = Query(..., description="Date de fin de la période"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les statistiques avancées de reproduction pour une période.
    
    Inclut:
    - Taux de gestation
    - Intervalle vêlage moyen
    - Nombre de vêlages
    - Répartition des difficultés de vêlage
    """
    check_permissions_manager(db, current_user)
    
    try:
        # Validation de la période
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La date de début doit être antérieure à la date de fin"
            )
            
        # Calcul du nombre de vêlages
        velages_total = db.query(Velage).filter(
            Velage.date_velage.between(start_date, end_date)
        ).count()
        
        # Calcul des difficultés de vêlage
        difficulte_stats = db.query(
            Velage.facilite_velage,
            func.count(Velage.id).label("count")
        ).filter(
            Velage.date_velage.between(start_date, end_date)
        ).group_by(Velage.facilite_velage).all()

        # Calcul du taux de gestation
        femelles = db.query(Bovin).filter(
            Bovin.sexe == "FEMELLE",
            Bovin.statut == StatutAnimalEnum.ACTIF
        ).count()

        gestantes = db.query(Bovin).filter(
            Bovin.sexe == "FEMELLE",
            Bovin.statut == StatutAnimalEnum.ACTIF,
            Bovin.statut_reproduction == StatutReproductionBovinEnum.PLEINE
        ).count()

        taux_gestation = (gestantes / femelles * 100) if femelles > 0 else 0

        # Calcul de l'intervalle vêlage moyen (simplifié)
        interval_query = db.query(
            func.avg(Velage.date_velage - func.lag(Velage.date_velage).over(
                partition_by=Velage.mere_id,
                order_by=Velage.date_velage
            ))
        ).filter(
            Velage.date_velage.between(start_date, end_date)
        ).subquery()

        interval_moyen = db.query(
            func.avg(interval_query)
        ).scalar()

        return {
            "velages_total": velages_total,
            "taux_gestation": round(taux_gestation, 1),
            "interval_velage_moyen": interval_moyen.days if interval_moyen else None,
            "difficulte_velage": [
                {"facilite": d.facilite_velage, "count": d.count}
                for d in difficulte_stats
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur stats reproduction: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du calcul des statistiques"
        )
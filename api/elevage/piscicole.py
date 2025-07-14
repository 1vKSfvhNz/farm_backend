from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import pandas as pd
import os

# Import des dépendances
from models import get_db, add_object
from models.elevage.piscicole import (
    BassinPiscicole,
    Poisson,
    ControleEau,
    RecoltePoisson
)
from utils.security import get_current_manager
from schemas.elevage.piscicole import (
    BassinBase,
    BassinCreate,
    BassinResponse,
    PoissonBase,
    PoissonResponse,
    ControleEauCreate,
    ControleEauResponse,
    RecolteCreate,
    RecolteResponse,
    AlertePiscicole,
    PredictionCroissanceOutput,
    PredictionCroissanceInput
)
from api import check_permissions_manager
from machine_learning.analyse.elevage.piscicole import AnalyseurPiscicole
from machine_learning.prediction.elevage.piscicole import PisciculturePredictor

router = APIRouter(
    prefix="/api/elevage/piscicole",
    tags=["Élevage Piscicole"],
    responses={
        404: {"description": "Non trouvé"},
        403: {"description": "Accès refusé"},
        401: {"description": "Non authentifié"}
    },
)

# ==============================================
# Routes pour la gestion des bassins
# ==============================================

@router.post("/bassins", response_model=BassinResponse)
def create_bassin(
    bassin: BassinCreate,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Créer un nouveau bassin piscicole"""
    check_permissions_manager(db, current_user)
    
    try:
        db_bassin = BassinPiscicole(**bassin.model_dump())
        add_object(db, db_bassin)
        return db_bassin
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création : {str(e)}"
        )

@router.get("/bassins", response_model=List[BassinResponse])
def read_bassins(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Lister tous les bassins piscicoles"""
    check_permissions_manager(db, current_user, required_roles=['admin', 'piscicole_manager', 'piscicole_technicien'])
    
    bassins = db.query(BassinPiscicole).offset(skip).limit(limit).all()
    return bassins

@router.get("/bassins/{bassin_id}", response_model=BassinResponse)
def read_bassin(
    bassin_id: int,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Obtenir les détails d'un bassin spécifique"""
    check_permissions_manager(db, current_user, required_roles=['admin', 'piscicole_manager', 'piscicole_technicien'])
    
    bassin = db.query(BassinPiscicole).filter(BassinPiscicole.id == bassin_id).first()
    if bassin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bassin non trouvé"
        )
    return bassin

@router.put("/bassins/{bassin_id}", response_model=BassinResponse)
def update_bassin(
    bassin_id: int,
    bassin: BassinBase,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Mettre à jour un bassin piscicole"""
    check_permissions_manager(db, current_user)
    
    db_bassin = db.query(BassinPiscicole).filter(BassinPiscicole.id == bassin_id).first()
    if db_bassin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bassin non trouvé"
        )
    
    try:
        update_data = bassin.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_bassin, key, value)
        
        db.commit()
        db.refresh(db_bassin)
        return db_bassin
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la mise à jour : {str(e)}"
        )

@router.delete("/bassins/{bassin_id}")
def delete_bassin(
    bassin_id: int,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Supprimer un bassin piscicole"""
    check_permissions_manager(db, current_user, required_roles=['admin'])
    
    db_bassin = db.query(BassinPiscicole).filter(BassinPiscicole.id == bassin_id).first()
    if db_bassin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bassin non trouvé"
        )
    
    try:
        db.delete(db_bassin)
        db.commit()
        return {"message": "Bassin supprimé avec succès"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la suppression : {str(e)}"
        )

# ==============================================
# Routes pour la gestion des poissons
# ==============================================

@router.post("/poissons", response_model=PoissonResponse)
def create_poisson(
    poisson: PoissonBase,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Créer un nouveau poisson"""
    check_permissions_manager(db, current_user)
    
    try:
        db_poisson = Poisson(**poisson.model_dump())
        add_object(db, db_poisson)
        return db_poisson
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création : {str(e)}"
        )

@router.get("/poissons  ", response_model=List[PoissonResponse])
def read_poissons(
    bassin_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Lister les poissons (optionnellement filtrés par bassin)"""
    check_permissions_manager(db, current_user, required_roles=['admin', 'piscicole_manager', 'piscicole_technicien'])
    
    query = db.query(Poisson)
    if bassin_id:
        query = query.filter(Poisson.bassin_id == bassin_id)
    
    poissons = query.offset(skip).limit(limit).all()
    return poissons

@router.get("/poissons/{poisson_id}", response_model=PoissonResponse)
def read_poisson(
    poisson_id: int,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Obtenir les détails d'un poisson spécifique"""
    check_permissions_manager(db, current_user, required_roles=['admin', 'piscicole_manager', 'piscicole_technicien'])
    
    poisson = db.query(Poisson).filter(Poisson.id == poisson_id).first()
    if poisson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poisson non trouvé"
        )
    return poisson

# ==============================================
# Routes pour la gestion des contrôles d'eau
# ==============================================

@router.post("/controles-eau/", response_model=ControleEauResponse)
def create_controle_eau(
    controle: ControleEauCreate,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Créer un nouveau contrôle d'eau"""
    check_permissions_manager(db, current_user)
    
    try:
        db_controle = ControleEau(**controle.model_dump())
        add_object(db, db_controle)
        return db_controle
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création : {str(e)}"
        )

@router.get("/controles-eau/", response_model=List[ControleEauResponse])
def read_controles_eau(
    bassin_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Lister les contrôles d'eau (optionnellement filtrés par bassin)"""
    check_permissions_manager(db, current_user, required_roles=['admin', 'piscicole_manager', 'piscicole_technicien'])
    
    query = db.query(ControleEau)
    if bassin_id:
        query = query.filter(ControleEau.bassin_id == bassin_id)
    
    controles = query.order_by(ControleEau.date_controle.desc()).offset(skip).limit(limit).all()
    return controles

# ==============================================
# Routes pour la gestion des récoltes
# ==============================================

@router.post("/recoltes/", response_model=RecolteResponse)
def create_recolte(
    recolte: RecolteCreate,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle récolte"""
    check_permissions_manager(db, current_user)
    
    try:
        db_recolte = RecoltePoisson(**recolte.model_dump())
        add_object(db, db_recolte)
        return db_recolte
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création : {str(e)}"
        )

@router.get("/recoltes/", response_model=List[RecolteResponse])
def read_recoltes(
    bassin_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Lister les récoltes (optionnellement filtrées par bassin)"""
    check_permissions_manager(db, current_user, required_roles=['admin', 'piscicole_manager', 'piscicole_technicien'])
    
    query = db.query(RecoltePoisson)
    if bassin_id:
        query = query.filter(RecoltePoisson.bassin_id == bassin_id)
    
    recoltes = query.order_by(RecoltePoisson.date_recolte.desc()).offset(skip).limit(limit).all()
    return recoltes

# ==============================================
# Routes pour les analyses et prédictions
# ==============================================

@router.get("/analyses/alertes", response_model=List[AlertePiscicole])
def get_alertes_piscicoles(
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Obtenir les alertes pour l'élevage piscicole"""
    check_permissions_manager(db, current_user)
    
    analyzer = AnalyseurPiscicole()
    alertes = analyzer.analyser_bassins()
    return alertes

@router.post("/predictions/croissance", response_model=PredictionCroissanceOutput)
def predict_croissance(
    input_data: PredictionCroissanceInput,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Prédire le taux de croissance des poissons"""
    check_permissions_manager(db, current_user)
    
    try:
        predictor = PisciculturePredictor()
        prediction = predictor.predict('croissance', input_data.model_dump())
        return {
            "taux_croissance": prediction,
            "confiance": 0.85,  # Valeur exemple
            "facteurs_influence": {
                "temperature": 0.35,
                "oxygene_dissous": 0.25,
                "ph": 0.15,
                "ammoniac": -0.20,
                "nitrites": -0.15
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la prédiction : {str(e)}"
        )

@router.get("/export/data")
def export_data(
    file_type: str = Query("csv", description="Type de fichier (csv ou excel)", regex="^(csv|excel)$"),
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Exporter des données piscicoles vers un fichier (CSV ou Excel)"""
    check_permissions_manager(db, current_user, required_roles=['admin'])
    
    try:
        bassins = db.query(BassinPiscicole).all()
        df = pd.DataFrame([b.__dict__ for b in bassins])
        
        # Supprimer la colonne '_sa_instance_state' ajoutée par SQLAlchemy
        if '_sa_instance_state' in df.columns:
            df.drop('_sa_instance_state', axis=1, inplace=True)
        
        file_path = f"temp_export_piscicole.{'csv' if file_type == 'csv' else 'xlsx'}"
        
        if file_type == "csv":
            df.to_csv(file_path, index=False)
            media_type = 'text/csv'
        else:
            df.to_excel(file_path, index=False)
            media_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        
        return FileResponse(
            file_path,
            media_type=media_type,
            filename=f"export_piscicole_{datetime.now().date()}.{'csv' if file_type == 'csv' else 'xlsx'}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération de l'export : {str(e)}"
        )
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
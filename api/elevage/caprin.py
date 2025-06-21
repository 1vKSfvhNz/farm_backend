import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from fastapi.responses import StreamingResponse
from models import get_db_session, add_object_async
from models.elevage.caprin import Caprin, ControleLaitierCaprin
from models.elevage import ProductionLait
from schemas import PaginatedResponse
from schemas.elevage import PerformanceTroupeauResponse, SearchQuery, AlerteResponse
from schemas.elevage.caprin import (
    CaprinCreate, CaprinResponse,
    ControleLaitierCreate, ControleLaitierResponse
)
from schemas.elevage import ProductionLaitCreate, ProductionLaitResponse
from machine_learning.analyse.elevage.caprin import CaprinAnalysis
from machine_learning.prediction.elevage.caprin import CaprinProductionPredictor
from utils.security import get_current_manager
from api import check_permissions_manager

router = APIRouter(
    prefix="/api/elevage/caprin",
    tags=["Élevage Caprin"],
    responses={
        404: {"description": "Non trouvé"},
        403: {"description": "Accès refusé"},
        401: {"description": "Non authentifié"}
    },
)
# ----------------------------
# Endpoints Caprins
# ----------------------------

@router.post("/", response_model=CaprinResponse, status_code=status.HTTP_201_CREATED)
def create_caprin(
    caprin: CaprinCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Crée un nouveau caprin dans le système.
    """
    check_permissions_manager(db, current_user, ['admin', 'caprin_manager'])
    try:
        num = db.query(Caprin).count()
        db_caprin = Caprin(
            **caprin.model_dump(),
            periode_lactation=0,
            production_lait_cumulee=0
        )
        add_object_async(db, db_caprin)
        return db_caprin
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création du caprin: {str(e)}"
        )

@router.get("/{caprin_id}", response_model=CaprinResponse)
def get_caprin(
    caprin_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les détails d'un caprin spécifique.
    """
    check_permissions_manager(db, current_user)
    caprin = db.query(Caprin).filter(Caprin.id == caprin_id).first()
    if not caprin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caprin non trouvé"
        )
    return caprin

@router.get("/", response_model=PaginatedResponse)
def list_caprins(
    skip: int = 0,
    limit: int = 100,
    search: SearchQuery = Depends(),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Liste tous les caprins avec pagination et filtres.
    """
    check_permissions_manager(db, current_user)
    
    query = db.query(Caprin)
    
    # Appliquer les filtres
    if search.query:
        query = query.filter(
            (Caprin.nom.ilike(f"%{search.query}%")) |
            (Caprin.numero_identification.ilike(f"%{search.query}%"))
        )
    
    if search.statut:
        query = query.filter(Caprin.statut == search.statut)
    
    if search.sexe:
        query = query.filter(Caprin.sexe == search.sexe)
    
    if search.date_debut and search.date_fin:
        query = query.filter(
            Caprin.date_naissance.between(search.date_debut, search.date_fin)
        )
    
    total = query.count()
    caprins = query.offset(skip).limit(limit).all()
    
    return {
        "items": caprins,
        "total": total,
        "skip": skip,
        "limit": limit
    }

# ----------------------------
# Endpoints Production Laitière
# ----------------------------

@router.post("/production-lait", response_model=ProductionLaitResponse, status_code=status.HTTP_201_CREATED)
def create_production_lait(
    production: ProductionLaitCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Enregistre une production laitière pour un caprin.
    """
    check_permissions_manager(db, current_user, ['admin', 'caprin_manager'])
    try:
        db_production = ProductionLait(**production.model_dump())
        add_object_async(db, db_production)
        
        # Mettre à jour les statistiques du caprin
        caprin = db.query(Caprin).filter(Caprin.id == production.animal_id).first()
        if caprin:
            caprin.production_lait_cumulee = (caprin.production_lait_cumulee or 0) + production.quantite
            db.commit()
            
        return db_production
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de l'enregistrement: {str(e)}"
        )

@router.get("/{caprin_id}/production-lait", response_model=List[ProductionLaitResponse])
def get_production_history(
    caprin_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère l'historique de production laitière d'un caprin.
    """
    check_permissions_manager(db, current_user)
    query = db.query(ProductionLait).filter(ProductionLait.animal_id == caprin_id)
    
    if start_date:
        query = query.filter(ProductionLait.date_production >= start_date)
    if end_date:
        query = query.filter(ProductionLait.date_production <= end_date)
    
    return query.order_by(ProductionLait.date_production.desc()).all()

# ----------------------------
# Endpoints Contrôles Laitiers
# ----------------------------

@router.post("/controle-laitier", response_model=ControleLaitierResponse, status_code=status.HTTP_201_CREATED)
def create_controle_laitier(
    controle: ControleLaitierCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Enregistre un contrôle laitier pour un caprin.
    """
    check_permissions_manager(db, current_user, ['admin', 'caprin_manager'])
    try:
        db_controle = ControleLaitierCaprin(**controle.model_dump())
        add_object_async(db, db_controle)
        return db_controle
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de l'enregistrement: {str(e)}"
        )

# ----------------------------
# Endpoints Analyses et Alertes
# ----------------------------

@router.get("/alertes", response_model=List[AlerteResponse])
def get_alertes(
    severity: Optional[str] = None,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les alertes pour l'élevage caprin.
    """
    check_permissions_manager(db, current_user)
    analyzer = CaprinAnalysis()
    alerts = analyzer.generate_alerts()
    
    if severity:
        alerts = [alert for alert in alerts if alert['severity'] == severity.upper()]
    
    return alerts

# ----------------------------
# Endpoints Statistiques
# ----------------------------

@router.get("/stats/production-lait", response_model=PerformanceTroupeauResponse)
def get_milk_production_stats(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les statistiques de production laitière.
    """
    check_permissions_manager(db, current_user)
    
    productions = db.query(ProductionLait)\
        .filter(ProductionLait.date_production.between(start_date, end_date))\
        .all()
    
    if not productions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée de production trouvée pour la période spécifiée"
        )
    
    quantites = [p.quantite for p in productions]
    moyenne = sum(quantites) / len(quantites)
    
    return {
        "production_moyenne": moyenne,
        "production_totale": sum(quantites),
        "nombre_caprins": len({p.animal_id for p in productions})
    }

# ----------------------------
# Endpoints Export
# ----------------------------

@router.get("/export/data")
def export_data(
    file_type: str = Query("csv", description="Type de fichier (csv ou excel)", regex="^(csv|excel)$"),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Exporter des données caprines vers un fichier (CSV ou Excel)
    """
    check_permissions_manager(db, current_user, required_roles=['admin'])
    
    try:
        caprins = db.query(Caprin).all()
        
        data = []
        for caprin in caprins:
            data.append({
                'id': caprin.id,
                'numero_identification': caprin.numero_identification,
                'type_production': caprin.type_production.value if caprin.type_production else None,
                'periode_lactation': caprin.periode_lactation,
                'production_lait_cumulee': caprin.production_lait_cumulee,
                'date_naissance': caprin.date_naissance
            })
        
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        
        if file_type == "csv":
            csv_data = df.to_csv(index=False, encoding='utf-8-sig')
            output.write(csv_data.encode('utf-8-sig'))
            media_type = "text/csv"
            file_extension = "csv"
        else:
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name='Caprins')
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            file_extension = "xlsx"
        
        output.seek(0)
        
        filename = f"export_caprins_{datetime.now().strftime('%Y%m%d_%H%M')}.{file_extension}"
        
        return StreamingResponse(
            output,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'export: {str(e)}"
        )
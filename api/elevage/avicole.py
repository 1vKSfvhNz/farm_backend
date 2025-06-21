from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timedelta
import pandas as pd
import os

# Import des dépendances
from models import get_db, get_async_db
from models.elevage.avicole import (
    LotAvicole, 
    ControlePonteLot, 
    PerformanceLotAvicole,
    PeseeLotAvicole
)
from schemas.elevage.avicole import (
    LotAvicoleCreate,
    LotAvicoleUpdate,
    LotAvicoleResponse,
    ControlePonteCreate,
    ControlePonteResponse,
    PerformanceCroissanceBase,
    PerformanceCroissanceResponse
)
from utils.security import get_current_manager
from api import check_permissions_manager
from machine_learning.analyse.elevage.avicole import AvicoleAnalyzer, AvicoleAlert
from machine_learning.prediction.elevage.avicole import AvicolePredictor

router = APIRouter(
    prefix="/api/elevage/avicole",
    tags=["Élevage Avicole"],
    responses={
        404: {"description": "Non trouvé"},
        403: {"description": "Accès refusé"},
        401: {"description": "Non authentifié"}
    },
)

# ==============================================
# Routes pour la gestion des lots avicoles
# ==============================================

@router.post("/lots/", response_model=LotAvicoleResponse)
async def create_lot_avicole(
    lot: LotAvicoleCreate,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Créer un nouveau lot avicole"""
    check_permissions_manager(current_user, ['avicole_manager', 'admin'])
    
    try:
        db_lot = LotAvicole(**lot.model_dump())
        db.add(db_lot)
        db.commit()
        db.refresh(db_lot)
        return db_lot
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création : {str(e)}"
        )

@router.get("/lots/", response_model=List[LotAvicoleResponse])
async def read_lots_avicoles(
    skip: int = 0,
    limit: int = 100,
    type_production: Optional[str] = None,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Lister les lots avicoles"""
    check_permissions_manager(current_user, ['avicole_manager', 'avicole_technicien', 'admin'])
    
    query = db.query(LotAvicole)
    if type_production:
        query = query.filter(LotAvicole.type_production == type_production)
    
    lots = query.offset(skip).limit(limit).all()
    return lots

@router.get("/lots/{lot_id}", response_model=LotAvicoleResponse)
async def read_lot_avicole(
    lot_id: int,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Obtenir les détails d'un lot avicole"""
    check_permissions_manager(current_user, ['avicole_manager', 'avicole_technicien', 'admin'])
    
    lot = db.query(LotAvicole).filter(LotAvicole.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lot avicole non trouvé"
        )
    return lot

@router.put("/lots/{lot_id}", response_model=LotAvicoleResponse)
async def update_lot_avicole(
    lot_id: int,
    lot: LotAvicoleUpdate,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Mettre à jour un lot avicole"""
    check_permissions_manager(current_user, ['avicole_manager', 'admin'])
    
    db_lot = db.query(LotAvicole).filter(LotAvicole.id == lot_id).first()
    if not db_lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lot avicole non trouvé"
        )
    
    try:
        update_data = lot.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_lot, key, value)
        
        db.commit()
        db.refresh(db_lot)
        return db_lot
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la mise à jour : {str(e)}"
        )

# ==============================================
# Routes pour la gestion des contrôles de ponte
# ==============================================

@router.post("/controles-ponte/", response_model=ControlePonteResponse)
async def create_controle_ponte(
    controle: ControlePonteCreate,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Créer un nouveau contrôle de ponte"""
    check_permissions_manager(current_user, ['avicole_technicien', 'avicole_manager', 'admin'])
    
    try:
        db_controle = ControlePonteLot(**controle.model_dump())
        db.add(db_controle)
        db.commit()
        db.refresh(db_controle)
        return db_controle
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création : {str(e)}"
        )

@router.get("/controles-ponte/", response_model=List[ControlePonteResponse])
async def read_controles_ponte(
    lot_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Lister les contrôles de ponte"""
    check_permissions_manager(current_user, ['avicole_technicien', 'avicole_manager', 'admin'])
    
    query = db.query(ControlePonteLot)
    
    if lot_id:
        query = query.filter(ControlePonteLot.lot_id == lot_id)
    if start_date:
        query = query.filter(ControlePonteLot.date_controle >= start_date)
    if end_date:
        query = query.filter(ControlePonteLot.date_controle <= end_date)
    
    controles = query.order_by(ControlePonteLot.date_controle.desc()).offset(skip).limit(limit).all()
    return controles

# ==============================================
# Routes pour la gestion des performances
# ==============================================

@router.post("/performances/", response_model=PerformanceCroissanceResponse)
async def create_performance(
    performance: PerformanceCroissanceBase,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle performance"""
    check_permissions_manager(current_user, ['avicole_technicien', 'avicole_manager', 'admin'])
    
    try:
        db_perf = PerformanceLotAvicole(**performance.model_dump())
        db.add(db_perf)
        db.commit()
        db.refresh(db_perf)
        return db_perf
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création : {str(e)}"
        )

# ==============================================
# Routes pour la gestion des pesées
# ==============================================

@router.post("/pesees/")
async def create_pesee(
    pesee_data: dict,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle pesée"""
    check_permissions_manager(current_user, ['avicole_technicien', 'avicole_manager', 'admin'])
    
    try:
        db_pesee = PeseeLotAvicole(**pesee_data)
        db.add(db_pesee)
        db.commit()
        db.refresh(db_pesee)
        return db_pesee
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création : {str(e)}"
        )

# ==============================================
# Routes pour les analyses et prédictions
# ==============================================

@router.get("/analyses/alertes", response_model=List[AvicoleAlert])
async def get_alertes_avicoles(
    current_user: dict = Depends(get_current_manager),
    async_db: AsyncSession = Depends(get_async_db)
):
    """Obtenir les alertes pour l'élevage avicole"""
    check_permissions_manager(current_user, ['avicole_manager', 'admin'])
    
    analyzer = AvicoleAnalyzer(async_db)
    alertes = await analyzer.analyze_farm()
    return alertes

@router.get("/predictions/ponte")
async def predict_ponte(
    lot_id: int,
    days_ahead: int = 7,
    current_user: dict = Depends(get_current_manager),
    async_db: AsyncSession = Depends(get_async_db)
):
    """Prédire les performances de ponte"""
    check_permissions_manager(current_user, ['avicole_manager', 'admin'])
    
    predictor = AvicolePredictor(async_db)
    await predictor.prepare_training_data()
    
    # Récupérer les données du lot
    result = await async_db.execute(select(LotAvicole).filter(LotAvicole.id == lot_id))
    lot = result.scalar_one_or_none()
    
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lot avicole non trouvé"
        )
    
    # Préparer les données pour la prédiction
    prediction_data = {
        'type_volaille': lot.type_volaille.name,
        'type_production': lot.type_production.name,
        'systeme_elevage': lot.systeme_elevage.name if lot.systeme_elevage else None,
        'souche': lot.souche,
        'date_mise_en_place': lot.date_mise_en_place,
        'date_controle': datetime.now().date() + timedelta(days=days_ahead),
        'effectif_initial': lot.effectif_initial,
        'statut': lot.statut
    }
    
    prediction = await predictor.predict_ponte_async(prediction_data)
    return prediction

@router.get("/export/data")
async def export_data(
    file_type: str = Query("csv", description="Type de fichier (csv ou excel)", regex="^(csv|excel)$"),
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """Exporter des données avicoles vers un fichier (CSV ou Excel)"""
    check_permissions_manager(current_user, ['admin'])
    
    try:
        # Récupérer toutes les données pertinentes
        lots = db.query(LotAvicole).all()
        controles = db.query(ControlePonteLot).all()
        performances = db.query(PerformanceLotAvicole).all()
        pesees = db.query(PeseeLotAvicole).all()
        
        # Créer des DataFrames
        lots_df = pd.DataFrame([{
            'id': l.id,
            'identifiant_lot': l.identifiant_lot,
            'type_volaille': l.type_volaille.name,
            'type_production': l.type_production.name,
            'date_mise_en_place': l.date_mise_en_place,
            'date_reforme': l.date_reforme,
            'effectif_initial': l.effectif_initial,
            'effectif_actuel': l.effectif_actuel
        } for l in lots])
        
        controles_df = pd.DataFrame([{
            'lot_id': c.lot_id,
            'date_controle': c.date_controle,
            'nombre_oeufs': c.nombre_oeufs,
            'taux_ponte': c.taux_ponte,
            'taux_casses': c.taux_casses,
            'taux_sales': c.taux_sales
        } for c in controles])
        
        # Fusionner les données
        full_df = lots_df.merge(controles_df, left_on='id', right_on='lot_id', how='left')
        
        file_path = f"temp_export_avicole.{'csv' if file_type == 'csv' else 'xlsx'}"
        
        if file_type == "csv":
            full_df.to_csv(file_path, index=False)
            media_type = 'text/csv'
        else:
            full_df.to_excel(file_path, index=False)
            media_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        
        return FileResponse(
            file_path,
            media_type=media_type,
            filename=f"export_avicole_{datetime.now().date()}.{'csv' if file_type == 'csv' else 'xlsx'}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération de l'export : {str(e)}"
        )
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
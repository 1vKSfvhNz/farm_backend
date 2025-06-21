import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from fastapi.responses import StreamingResponse
from models import get_db_session, add_object
from models.elevage.ovin import Ovin, MiseBasOvin, Tonte
from schemas import PaginatedResponse
from schemas.elevage import AlerteResponse, PerformanceTroupeauResponse, SearchQuery
from schemas.elevage.ovin import (
    OvinCreate, OvinResponse,
    TonteCreate, TonteResponse
)
from utils.security import get_current_manager
from api import check_permissions_manager
from machine_learning.analyse.elevage.ovin import OvinAnalysis

router = APIRouter(
    prefix="/api/elevage/ovin",
    tags=["Élevage Ovin"],
    responses={
        404: {"description": "Non trouvé"},
        403: {"description": "Accès refusé"},
        401: {"description": "Non authentifié"}
    },
)

# ----------------------------
# Endpoints Ovins
# ----------------------------

@router.post("/", response_model=OvinResponse, status_code=status.HTTP_201_CREATED)
def create_ovin(
    ovin: OvinCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Crée un nouvel ovin dans le système.
    """
    check_permissions_manager(db, current_user, ['admin', 'ovin_manager'])
    try:
        db_ovin = Ovin(**ovin.model_dump())
        add_object(db, db_ovin)
        return db_ovin
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création de l'ovin: {str(e)}"
        )

@router.get("/{ovin_id}", response_model=OvinResponse)
def get_ovin(
    ovin_id: int,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les détails d'un ovin spécifique.
    """
    check_permissions_manager(db, current_user)
    ovin = db.query(Ovin).filter(Ovin.id == ovin_id).first()
    if not ovin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ovin non trouvé"
        )
    return ovin

@router.get("/", response_model=PaginatedResponse)
def list_ovins(
    skip: int = 0,
    limit: int = 100,
    search: SearchQuery = Depends(),
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Liste tous les ovins avec pagination et filtres.
    """
    check_permissions_manager(db, current_user)
    
    query = db.query(Ovin)
    
    # Appliquer les filtres
    if search.query:
        query = query.filter(
            (Ovin.nom.ilike(f"%{search.query}%")) |
            (Ovin.numero_identification.ilike(f"%{search.query}%"))
        )
    
    if search.statut:
        query = query.filter(Ovin.statut == search.statut)
    
    if search.sexe:
        query = query.filter(Ovin.sexe == search.sexe)
    
    if search.date_debut and search.date_fin:
        query = query.filter(
            Ovin.date_naissance.between(search.date_debut, search.date_fin)
        )
    
    total = query.count()
    ovins = query.offset(skip).limit(limit).all()
    
    return {
        "items": ovins,
        "total": total,
        "skip": skip,
        "limit": limit
    }

# ----------------------------
# Endpoints Tontes
# ----------------------------

@router.post("/tontes", response_model=TonteResponse, status_code=status.HTTP_201_CREATED)
def create_tonte(
    tonte: TonteCreate,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Enregistre une tonte pour un ovin.
    """
    check_permissions_manager(db, current_user, ['admin', 'ovin_manager'])
    try:
        db_tonte = Tonte(**tonte.model_dump())
        add_object(db, db_tonte)
        
        # Mettre à jour les statistiques de l'ovin
        ovin = db.query(Ovin).filter(Ovin.id == tonte.animal_id).first()
        if ovin:
            ovin.date_derniere_tonte = tonte.date_tonte
            ovin.poids_derniere_tonte = tonte.poids_laine
            ovin.qualite_derniere_tonte = tonte.qualite_laine
            db.commit()
            
        return db_tonte
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de l'enregistrement: {str(e)}"
        )

@router.get("/{ovin_id}/tontes", response_model=List[TonteResponse])
def get_tontes(
    ovin_id: int,
    limit: int = 10,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère l'historique des tontes d'un ovin.
    """
    check_permissions_manager(db, current_user)
    tontes = db.query(Tonte)\
        .filter(Tonte.animal_id == ovin_id)\
        .order_by(Tonte.date_tonte.desc())\
        .limit(limit)\
        .all()
    
    return tontes

# ----------------------------
# Endpoints Analyses et Alertes
# ----------------------------

@router.get("/alertes", response_model=List[AlerteResponse])
def get_alertes(
    id: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les alertes pour l'élevage ovin.
    """
    check_permissions_manager(db, current_user)
    analyzer = OvinAnalysis()
    alerts = analyzer.generate_alerts(animal_id=id)
    
    if severity:
        alerts = [alert for alert in alerts if alert['severity'] == severity.upper()]
    
    return alerts

# ----------------------------
# Endpoints Statistiques
# ----------------------------

@router.get("/stats/production-laine", response_model=PerformanceTroupeauResponse)
def get_wool_production_stats(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db_session),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les statistiques de production de laine.
    """
    check_permissions_manager(db, current_user)
    
    tontes = db.query(Tonte)\
        .filter(Tonte.date_tonte.between(start_date, end_date))\
        .all()
    
    if not tontes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée de production trouvée pour la période spécifiée"
        )
    
    poids = [t.poids_laine for t in tontes]
    moyenne = sum(poids) / len(poids)
    
    return {
        "production_moyenne": moyenne,
        "production_totale": sum(poids),
        "nombre_ovins": len({t.animal_id for t in tontes})
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
    Exporter des données ovines vers un fichier (CSV ou Excel)
    """
    check_permissions_manager(db, current_user, required_roles=['admin'])
    
    try:
        ovins = db.query(Ovin).all()
        
        data = []
        for ovin in ovins:
            data.append({
                'id': ovin.id,
                'numero_identification': ovin.numero_identification,
                'type_production': ovin.type_production.value if ovin.type_production else None,
                'type_toison': ovin.type_toison.value if ovin.type_toison else None,
                'date_naissance': ovin.date_naissance,
                'date_derniere_tonte': ovin.date_derniere_tonte,
                'poids_derniere_tonte': ovin.poids_derniere_tonte
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
                df.to_excel(writer, index=False, sheet_name='Ovins')
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            file_extension = "xlsx"
        
        output.seek(0)
        
        filename = f"export_ovins_{datetime.now().strftime('%Y%m%d_%H%M')}.{file_extension}"
        
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
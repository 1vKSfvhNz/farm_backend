import logging
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select, literal, func, String
from datetime import datetime
from typing import List

from utils.security import get_current_manager
from api import check_permissions_manager
from schemas.elevage import FarmData, AnimalStats, GlobalStats, BatimentCreate, BatimentResponse
from models.elevage import TypeElevage, Batiment
from models.elevage.bovin import Bovin
from models.elevage.caprin import Caprin
from models.elevage.ovin import Ovin
from models.elevage.avicole import LotAvicole
from models.elevage.piscicole import Poisson
from models import get_db, add_object

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/elevage",
    tags=["Élevage"],
    responses={
        404: {"description": "Non trouvé"},
        403: {"description": "Accès refusé"},
        401: {"description": "Non authentifié"}
    },
)

@router.post("/batiments", 
             response_model=BatimentResponse, 
             status_code=status.HTTP_201_CREATED,
             tags=["Bâtiments"])
def create_batiment(
    batiment_data: BatimentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager)
):
    """
    Créer un nouveau bâtiment d'élevage
    """
    check_permissions_manager(db, current_user)
    
    try:
        # Conversion du modèle Pydantic en modèle SQLAlchemy
        batiment_db = Batiment(**batiment_data.model_dump())
        add_object(db, batiment_db)

        return batiment_db
    except SQLAlchemyError as e:
        logger.error(f"Erreur création bâtiment: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création du bâtiment"
        )

@router.get("/batiments", 
            response_model=List[BatimentResponse],
            tags=["Bâtiments"])
def get_all_batiments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager)
):
    """
    Lister tous les bâtiments d'élevage
    """
    check_permissions_manager(db, current_user)
    
    try:
        result = db.execute(select(Batiment))
        batiments = result.scalars().all()
        return batiments
    except SQLAlchemyError as e:
        logger.error(f"Erreur récupération bâtiments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des bâtiments"
        )

@router.get("/batiments/{batiment_id}", 
            response_model=BatimentResponse,
            tags=["Bâtiments"])
def get_batiment(
    batiment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupérer un bâtiment spécifique par son ID
    """
    check_permissions_manager(db, current_user)
    
    try:
        batiment = db.get(Batiment, batiment_id)
        if not batiment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bâtiment non trouvé"
            )
        return batiment
    except SQLAlchemyError as e:
        logger.error(f"Erreur récupération bâtiment {batiment_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération du bâtiment"
        )

@router.put("/batiments/{batiment_id}", 
            response_model=BatimentResponse,
            tags=["Bâtiments"])
def update_batiment(
    batiment_id: int,
    batiment_data: BatimentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager)
):
    """
    Mettre à jour un bâtiment existant
    """
    check_permissions_manager(db, current_user)
    
    try:
        batiment = db.get(Batiment, batiment_id)
        if not batiment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bâtiment non trouvé"
            )
            
        # Mise à jour des champs
        for key, value in batiment_data.model_dump().items():
            setattr(batiment, key, value)
            
        db.commit()
        db.refresh(batiment)
        
        return batiment
    except SQLAlchemyError as e:
        logger.error(f"Erreur mise à jour bâtiment {batiment_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la mise à jour du bâtiment"
        )

@router.delete("/batiments/{batiment_id}", 
               status_code=status.HTTP_204_NO_CONTENT,
               tags=["Bâtiments"])
def delete_batiment(
    batiment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager)
):
    """
    Supprimer un bâtiment
    """
    check_permissions_manager(db, current_user)
    
    try:
        batiment = db.get(Batiment, batiment_id)
        if not batiment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bâtiment non trouvé"
            )
            
        db.delete(batiment)
        db.commit()
        
        return None
    except SQLAlchemyError as e:
        logger.error(f"Erreur suppression bâtiment {batiment_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la suppression du bâtiment"
        )
    
@router.get("/stats", response_model=FarmData)
def get_farm_data(
    db: Session = Depends(get_db),  # Modification ici pour utiliser get_async_db_session
    current_user: dict = Depends(get_current_manager)
):
    """
    Récupère les données complètes de la ferme avec :
    - Les statistiques pour chaque type d'animal
    - Les statistiques globales
    """
    check_permissions_manager(db, current_user)  # Modification: retirer db si non nécessaire

    # Requêtes pour compter les animaux par type d'élevage
    queries = [
        select(
            func.count(Bovin.id).label("count"),
            literal(TypeElevage.BOVIN.value).cast(String).label("type_elevage")
        ).select_from(Bovin),

        select(
            func.count(Caprin.id).label("count"),
            literal(TypeElevage.CAPRIN.value).cast(String).label("type_elevage")
        ).select_from(Caprin),

        select(
            func.count(Ovin.id).label("count"),
            literal(TypeElevage.OVIN.value).cast(String).label("type_elevage")
        ).select_from(Ovin),

        select(
            func.count(LotAvicole.id).label("count"),
            literal(TypeElevage.AVICOLE.value).cast(String).label("type_elevage")
        ).select_from(LotAvicole),

        select(
            func.count(Poisson.id).label("count"),
            literal(TypeElevage.PISCICOLE.value).cast(String).label("type_elevage")
        ).select_from(Poisson)
    ]

    results = []
    for query in queries:
        try:
            result = db.execute(query)  # Exécution synchrone
            row = result.mappings().first()
            results.append(row)
        except SQLAlchemyError as e:
            logger.error(f"Erreur SQL: {e}")
            continue

    # Calculer le total global
    total_animals = sum(r["count"] for r in results if r and r["count"] is not None)

    # Création des statistiques globales AVANT FarmData
    global_stats = GlobalStats(
        totalAnimals=total_animals or 0,
        averageHealth=75.0,
        averageProduction=50.0,
        lastSync=datetime.now()
    )

    # Statistiques par animal
    animal_stats = []
    for result in results:
        if result is None:
            continue

        animal_stats.append(
            AnimalStats(
                variant=result["type_elevage"],
                count=result["count"],
                health=75,
                production=50,
                lastUpdate=datetime.now(),
                is_new=False
            )
        )

    # Création de FarmData avec les données complètes
    return FarmData(
        animals=animal_stats,
        globalStats=global_stats  # Assurez-vous que cet objet est bien une instance de GlobalStats
    )
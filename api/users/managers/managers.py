from datetime import timezone, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import Session
from typing import Optional, Dict
import logging

from utils.config import get_error_key
from utils.security import create_access_token, get_current_manager, ACCESS_KEY
from models import get_db
from models.user import Manager, Client
from models.auth import GenerateCodeManager
from models.elevage.bovin import Bovin
from models.elevage.caprin import Caprin
from models.elevage.ovin import Ovin
from schemas.auth import OTPRequestManager, ResetPasswordRequestManager
from schemas.users import ManagerLogin, UserManagerCreate, UsersResponse
from schemas.elevage import AnimalNumberResponse
from lifespan import train_all_models_sync, predictors
from api import check_permissions_manager

router = APIRouter(
    prefix="/api/v1/managers",
    tags=["Managers"],
    responses={404: {"description": "Not found"}},
)

@router.post(
    "/create",
    summary="Créer un nouveau manager",
    description="Crée un nouveau compte manager (nécessite une clé d'accès spéciale)",
    response_description="Confirmation de création"
)
async def create_manager(
    manager: UserManagerCreate,
    db: Session = Depends(get_db)
):
    if manager.key != ACCESS_KEY:
        raise HTTPException()
    
    # Check if manager already exists
    existing_user = db.query(Manager).filter(Manager.phone == manager.phone).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail=get_error_key("users", "create", "email_or_phone_exists")
        )
    
    # Create the manager
    db_user = Manager(
        **manager.to_user_dict(),
        role='manager'
    )
    db_user.save_user(db)
        
    return {"message": "Manager bien enrégistrer"}

@router.post(
    "/auth/login",
    summary="Connexion manager",
    description="Authentifie un manager et retourne un token JWT",
    response_description="Token d'accès et date d'expiration"
)
async def login(
    form_data: ManagerLogin, 
    db: Session = Depends(get_db)
):
    try:
        manager = db.query(Manager).filter(Manager.phone == form_data.phone).first()
        if not manager or not manager.verify_password(form_data.code):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_error_key("auth", "errors", "invalid_credentials"))
        
        # Mettre à jour la date de dernière connexion
        manager.last_login = datetime.now(timezone.utc)
        db.commit()

        access_token, expire = create_access_token(data={"sub": manager.phone, 'id': manager.id})
        return {"access_token": access_token, 'token_expire': expire}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Erreur lors de la connexion: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=get_error_key("auth", "errors", "login_failed"))

@router.post(
    "/auth/reset-password",
    summary="Réinitialisation du code d'accès",
    description="Permet de définir un nouveau code d'accès après vérification",
    response_description="Confirmation de la réinitialisation"
)
def reset_password(
    request: ResetPasswordRequestManager, 
    db: Session = Depends(get_db)
):
    try:
        db_user = db.query(Manager).filter(Manager.phone == request.phone).first()
        if not db_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_error_key("auth", "forgot_password", "user_not_found"))
            
        user_code = db.query(GenerateCodeManager).filter(GenerateCodeManager.phone == request.phone).first()
        if not user_code:
            raise HTTPException(status_code=400, detail=get_error_key("auth", "reset_password", "no_request"))
            
        if user_code.is_expired():
            raise HTTPException(status_code=400, detail=get_error_key("auth", "reset_password", "expired_code"))
            
        if user_code.code != request.code:
            raise HTTPException(status_code=400, detail=get_error_key("auth", "reset_password", "invalid_code"))
            
        if request.new_code != request.confirm_code:
            raise HTTPException(status_code=400, detail=get_error_key("auth", "reset_password", "password_mismatch"))

        db_user.update_password(request.new_code, db)
        return {'response': True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Erreur lors de la réinitialisation du mot de passe : {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=get_error_key("auth", "reset_password", "update_failed"))

@router.post(
    "/auth/verify-code",
    summary="Vérification de code OTP",
    description="Vérifie la validité d'un code OTP envoyé par SMS",
    response_description="Confirmation de la validité du code"
)
def verify_code(
    request: OTPRequestManager, 
    db: Session = Depends(get_db)
):
    try:
        user_code = db.query(GenerateCodeManager).filter(GenerateCodeManager.code == request.code).first()
        if not user_code:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_error_key("auth", "verify_code", "no_request"))
            
        if user_code.is_expired():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_error_key("auth", "verify_code", "expired_code"))
            
        if user_code.code != request.code:
            raise HTTPException(status_code=400, detail=get_error_key("auth", "verify_code", "invalid_code"))
            
        return {'response': True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Erreur lors de la vérification du code : {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=get_error_key("auth", "verify_code", "verification_failed"))
    
@router.post(
    "/preferences/language/{lang}",
    summary="Changer la langue du manager",
    description="Met à jour la préférence linguistique du manager",
    response_description="Statut vide en cas de succès"
)
async def user_lang(
    lang: str,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    user = db.query(Manager).filter(Manager.phone == current_user['phone']).first()
    if not user:
        raise HTTPException(status_code=404, detail=get_error_key("users", "not_found"))

    user.lang = lang
    db.commit()
    return {}

@router.get(
    "/profile",
    summary="Obtenir les données du profil utilisateur",
    description="Retourne les informations du profil de l'utilisateur connecté",
    response_description="Détails du profil utilisateur"
)
async def user_data(
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    user = db.query(Manager).filter(Manager.phone == current_user['phone']).first()
    if not user:
        raise HTTPException(status_code=404, detail=get_error_key("users", "not_found"))
    user.last_login = datetime.now(timezone.utc)

    return {
        'username': user.username,
        'phone': user.phone,
        'role': user.role,
    }

@router.get(
    "/users",
    summary="Liste des utilisateurs",
    description="Retourne une liste paginée et filtrable des utilisateurs",
    response_model=UsersResponse,
    response_description="Liste des utilisateurs avec informations de pagination"
)
async def user_list(
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None, alias="q"),
    page: int = Query(1, alias="page"),
    limit: int = Query(10, alias="limit"),
    sort: Optional[str] = Query(None, alias="sort"),
    order: Optional[str] = Query("asc", alias="order")
):
    check_permissions_manager(db, current_user)
    query = db.query(Client)

    if q:
        search_terms = q.lower().split()
        search_filters = []
        for term in search_terms:
            term_filter = or_(
                func.lower(Client.username).contains(term),
                func.lower(Client.email).contains(term),
                func.lower(Client.role).contains(term),
            )
            search_filters.append(term_filter)
        
        query = query.filter(and_(*search_filters))
    
    if sort is not None:
        if hasattr(Client, sort):
            if order == "desc":
                query = query.order_by(getattr(Client, sort).desc())
            else:
                query = query.order_by(getattr(Client, sort).asc())
        else:
            query = query.order_by(Client.created_at.desc())
    else:
        query = query.order_by(Client.created_at.desc())

    total_items = query.count()
    total_pages = (total_items + limit - 1) // limit

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    users = query.all()
    db.commit()
    
    return {
        "users": users,
        "pagination": {
            "currentPage": page,
            "totalPages": total_pages,
            "totalItems": total_items,
            "itemsPerPage": limit
        }
    }

@router.post(
    "/animals/generate-id",
    summary="Générer un identifiant animal",
    description="Génère un identifiant unique pour un animal selon son espèce",
    response_model=AnimalNumberResponse,
    response_description="Identifiant généré au format spécifique"
)
def generer_numero_animal_valid(
    espece: str = "vache",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager)
) -> str:
    check_permissions_manager(db, current_user)

    prefix_map = {
        "vache": "V",
        "chevre": "C",
        "mouton": "M"
    }

    if espece == 'vache':
        numero_ordre = db.query(Bovin).count()
    elif espece == 'chevre':
        numero_ordre = db.query(Caprin).count()
    elif espece == 'mouton':
        numero_ordre = db.query(Ovin).count()

    prefix = prefix_map.get(espece.lower())
    if not prefix:
        raise ValueError(f"Espèce inconnue: {espece}")

    annee = datetime.now().year
    suffix_annee = str(annee)[-2:]
    numero_str = f"{numero_ordre:05d}"

    return f"{prefix}{suffix_annee}{numero_str}"

@router.get("/force-training")
async def force_training(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager)
):
    """Endpoint pour forcer un entraînement immédiat"""
    # Vérification des permissions - seulement admin ou ml_manager
    check_permissions_manager(db, current_user)
    
    try:
        success = await train_all_models_sync()
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Échec de l'entraînement des modèles"
            )
        return {"message": "Entraînement des modèles forcé avec succès"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'entraînement: {str(e)}"
        )

@router.get("/model-status")
async def model_status(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager)
):
    """Retourne l'état des modèles"""
    # Vérification des permissions - lecture seule pour plus de rôles
    check_permissions_manager(db, current_user)
    
    try:
        status: Dict[str, Any] = {}
        for name, predictor in predictors.items():
            status[name] = {
                "last_trained": datetime.now().isoformat(),  # À remplacer par un vrai timestamp
                "status": "ready" if predictor else "not_ready",
                "loaded": predictor is not None,
                "model_type": type(predictor).__name__ if predictor else "N/A"
            }
        return status
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération du statut: {str(e)}"
        )

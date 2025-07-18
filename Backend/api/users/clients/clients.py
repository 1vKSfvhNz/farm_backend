from datetime import timezone, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import logging

from utils.config import get_error_key
from utils.send_email import send_email_async
from utils.security import create_access_token, get_current_client
from models import get_db
from models.user import Client
from models.auth import GenerateCodeUser
from schemas.auth import ForgotPasswordRequest, OTPRequest, ResetPasswordRequest
from schemas.users import UserCreate

router = APIRouter(
    prefix="/api/v1/clients",
    tags=["Clients"],
    responses={404: {"description": "Not found"}},
)

@router.post(
    "/create",
    summary="Créer un nouvel utilisateur",
    description="Crée un nouvel utilisateur avec un processus en 2 étapes (envoi de code de vérification puis validation)",
    response_description="Message de succès ou demande de code de vérification"
)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if user already exists
    existing_user = db.query(Client).filter(
        or_(Client.email == user.email, Client.phone == user.phone)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail=get_error_key("users", "create", "email_or_phone_exists")
        )
    
    # Step 1: Generate verification code if code is not provided
    if not user.code:
        code_user = db.query(GenerateCodeUser).filter(GenerateCodeUser.email == user.email).first()
        if not code_user:
            code_user = GenerateCodeUser(email=user.email)
            code_user.save_to_db(db)
        else:
            code_user.update_code(db)
            
        try:
            await send_email_async(
                to_email=user.email,
                subject="Bienvenue sur notre plateforme",
                body_file="user_created.html",
                context={'username': user.username, 'Code': code_user.code},
            )
        except Exception as e:
            logging.error(f"Erreur lors de l'envoi de l'email : {e}", exc_info=True)
            
        return {"message": True}
    
    # Step 2: Verify code and create user if code is provided
    else:
        code_user = db.query(GenerateCodeUser).filter(
            GenerateCodeUser.email == user.email,
            GenerateCodeUser.code == user.code
        ).first()
        
        if not code_user:
            raise HTTPException(
                status_code=400,
                detail=get_error_key("users", "create", "invalid_code")
            )
            
        # Create the user
        db_user = Client(
            email=user.email,
            username=user.username,
            password=user.password,
            phone=user.phone
        )
        db_user.save_user(db)
        
        # Delete the verification code entry
        db.delete(code_user)
        db.commit()
        
        return {"message": "FIN"}

@router.post(
    "/auth/login",
    summary="Connexion utilisateur",
    description="Authentifie un utilisateur et retourne un token JWT",
    response_description="Token d'accès et date d'expiration"
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    try:
        user = db.query(Client).filter(Client.email == form_data.username).first()
        if not user or not user.verify_password(form_data.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_error_key("auth", "errors", "invalid_credentials"))
        
        # Mettre à jour la date de dernière connexion
        user.last_login = datetime.now(timezone.utc)
        db.commit()

        access_token, expire = create_access_token(data={"sub": user.email, 'id': user.id})
        return {"access_token": access_token, 'token_expire': expire}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Erreur lors de la connexion: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=get_error_key("auth", "errors", "login_failed"))

@router.post(
    "/auth/forget-password",
    summary="Demande de réinitialisation de mot de passe",
    description="Envoie un code de réinitialisation par email",
    response_description="Confirmation de l'envoi"
)
async def forget_password(
    request: ForgotPasswordRequest, 
    db: Session = Depends(get_db)
):
    try:
        db_user = db.query(Client).filter(Client.email == request.email).first()
        if not db_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_error_key("auth", "forgot_password", "user_not_found"))

        code_user = db.query(GenerateCodeUser).filter(GenerateCodeUser.email == request.email).first()
        if not code_user:
            code_user = GenerateCodeUser(email=db_user.email)
            code_user.save_to_db(db)
        else:
            code_user.update_code(db)
            
        await send_email_async(
            to_email=db_user.email,
            subject="Réinitialisation de mot de passe",
            body_file="user_forget_password.html",
            context={'username': db_user.username, 'otp_code': code_user.code, 'otp_expiry': 15},
        )
        return {'response': True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Erreur lors de l'envoi de l'email : {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=get_error_key("auth", "forgot_password", "email_failed"))

@router.post(
    "/auth/reset-password",
    summary="Réinitialisation du mot de passe",
    description="Permet de définir un nouveau mot de passe après vérification du code",
    response_description="Confirmation de la réinitialisation"
)
def reset_password(
    request: ResetPasswordRequest, 
    db: Session = Depends(get_db)
):
    try:
        db_user = db.query(Client).filter(Client.email == request.email).first()
        if not db_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_error_key("auth", "forgot_password", "user_not_found"))
            
        user_code = db.query(GenerateCodeUser).filter(GenerateCodeUser.email == request.email).first()
        if not user_code:
            raise HTTPException(status_code=400, detail=get_error_key("auth", "reset_password", "no_request"))
            
        if user_code.is_expired():
            raise HTTPException(status_code=400, detail=get_error_key("auth", "reset_password", "expired_code"))
            
        if user_code.code != request.code:
            raise HTTPException(status_code=400, detail=get_error_key("auth", "reset_password", "invalid_code"))
            
        if request.new_password != request.confirm_password:
            raise HTTPException(status_code=400, detail=get_error_key("auth", "reset_password", "password_mismatch"))

        db_user.update_password(request.new_password, db)
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
    description="Vérifie la validité d'un code OTP envoyé par email",
    response_description="Confirmation de la validité du code"
)
def verify_code(
    request: OTPRequest, 
    db: Session = Depends(get_db)
):
    try:
        user_code = db.query(GenerateCodeUser).filter(GenerateCodeUser.email == request.email).first()
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
    summary="Changer la langue de l'utilisateur",
    description="Met à jour la préférence linguistique de l'utilisateur",
    response_description="Statut vide en cas de succès"
)
async def user_lang(
    lang: str,
    current_user: dict = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    user = db.query(Client).filter(Client.email == current_user['email']).first()
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
    current_user: dict = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    user = db.query(Client).filter(Client.email == current_user['email']).first()
    if not user:
        raise HTTPException(status_code=404, detail=get_error_key("users", "not_found"))
    user.last_login = datetime.now(timezone.utc)

    return {
        'username': user.username,
        'email': user.email,
        'phone': user.phone,
        'role': user.role,
    }
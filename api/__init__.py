from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Union, List
from os import makedirs
import logging

from models.user import Client, Manager

logger = logging.getLogger(__name__)

IMAGE_EXTENSIONS = ['jpg', 'png', 'jpeg']
UPLOAD_IMAGE_DIR_Bovin = "uploads/images/bovins"
UPLOAD_IMAGE_DIR_Caprin = "uploads/images/caprins"
UPLOAD_IMAGE_DIR_Ovin = "uploads/images/ovins"

# Création des dossiers s'ils n'existent pas
makedirs(UPLOAD_IMAGE_DIR_Bovin, exist_ok=True)
makedirs(UPLOAD_IMAGE_DIR_Caprin, exist_ok=True)
makedirs(UPLOAD_IMAGE_DIR_Ovin, exist_ok=True)

def check_permissions_user(
    db: Session,
    current_user: dict,
    required_roles: Union[str, List[str]] = ['user', 'vip'],
    user_email_field: str = 'email'
) -> None:
    """
    Vérifie si l'utilisateur courant a les permissions requises
    
    Args:
        db: Session SQLAlchemy
        current_user: Dictionnaire contenant les infos de l'utilisateur courant
        required_roles: Rôle(s) requis (peut être une string ou une liste)
        user_email_field: Champ email dans current_user
        
    Raises:
        HTTPException 403 si permission refusée
    """
    # Convertir required_roles en liste si c'est une string
    if isinstance(required_roles, str):
        required_roles = [required_roles]
    
    user = db.query(Client).filter(Client.email == current_user[user_email_field]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilisateur non trouvé"
        )
    
    if user.role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission refusée"
        )
    
def check_permissions_manager(
    db: Session,
    current_user: dict,
    required_roles: Union[str, List[str]] = ['admin', 'avicole_manager'],
    user_email_field: str = 'phone'
) -> None:
    """
    Vérifie si l'utilisateur courant a les permissions requises
    
    Args:
        db: Session SQLAlchemy
        current_user: Dictionnaire contenant les infos de l'utilisateur courant
        required_roles: Rôle(s) requis (peut être une string ou une liste)
        user_email_field: Champ email dans current_user
        
    Raises:
        HTTPException 403 si permission refusée
    """
    # Convertir required_roles en liste si c'est une string
    if isinstance(required_roles, str):
        required_roles = [required_roles]
    
    user = db.query(Manager).filter(Manager.phone == current_user[user_email_field]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilisateur non trouvé"
        )
    
    if user.role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission refusée"
        )
    

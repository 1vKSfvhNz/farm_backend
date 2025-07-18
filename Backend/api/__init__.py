from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy.future import select
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
    user_id_field: str = 'email'
) -> None:
    """
    Vérifie si l'utilisateur courant a les permissions requises
    
    Args:
        db: Session SQLAlchemy
        current_user: Dictionnaire contenant les infos de l'utilisateur courant
        required_roles: Rôle(s) requis (peut être une string ou une liste)
        user_id_field: Champ email dans current_user
        
    Raises:
        HTTPException 403 si permission refusée
    """
    # Convertir required_roles en liste si c'est une string
    if isinstance(required_roles, str):
        required_roles = [required_roles]
    
    user = db.query(Client).filter(Client.email == current_user[user_id_field]).first()
    
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
    
async def check_permissions_manager(
    db: Union[Session, AsyncSession],
    current_user: dict,
    required_roles: Union[str, List[str]] = ['admin', 'manager', 'avicole_manager'],
    user_id_field: str = 'phone'
) -> None:
    """
    Vérifie si l'utilisateur courant a les permissions requises (compatible sync/async)

    Args:
        db: Session SQLAlchemy (sync ou async)
        current_user: Dictionnaire contenant les infos de l'utilisateur courant
        required_roles: Rôle(s) requis
        user_id_field: Champ d'identification dans current_user (par défaut: 'phone')

    Raises:
        HTTPException 403 si permission refusée
    """
    if isinstance(required_roles, str):
        required_roles = [required_roles]

    user_identifier = current_user.get(user_id_field)
    if not user_identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Champ {user_id_field} manquant chez l'utilisateur courant"
        )

    # Vérifie si la session est asynchrone
    if isinstance(db, AsyncSession):
        stmt = select(Manager).where(getattr(Manager, user_id_field) == user_identifier)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
    else:
        user = db.query(Manager).filter(getattr(Manager, user_id_field) == user_identifier).first()

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

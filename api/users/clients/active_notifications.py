# notifications.py
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models import get_db
from models.user import Client
from utils.security import get_current_client

router = APIRouter(prefix="/client/notification", tags=["Notifications"])

@router.get("/preferences")
async def get_notification_preferences(
    current_user: dict = Depends(get_current_client),  # Utilisateur authentifié (Client ou Manager)
    db: Session = Depends(get_db)
) -> Dict[str, bool]:
    """
    Récupère les préférences de notification de l'utilisateur courant
    """
    user_id = current_user.get("id")
    user = db.query(Client).filter(Client.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"enabled": user.notifications}

@router.put("/preferences")
async def update_notification_preferences(
    enabled: bool,
    current_user: dict = Depends(get_current_client),  # Utilisateur authentifié (Client ou Manager)
    db: Session = Depends(get_db)
) -> Dict[str, bool]:
    """
    Met à jour les préférences de notification de l'utilisateur courant
    """
    user_id = current_user.get("id")
    user = db.query(Client).filter(Client.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.notifications = enabled
    db.commit()
    
    return {"enabled": user.notifications}

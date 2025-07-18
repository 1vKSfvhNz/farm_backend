# notifications.py
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models import get_db
from models.user import UserDevice, Client, Manager
from schemas.devices import DeviceInfo
from utils.security import get_current_client

router = APIRouter(prefix="/client/device", tags=["Device"])

@router.post("/register")
async def register(
    device_info: DeviceInfo,
    current_user: dict = Depends(get_current_client),  # Utilisateur authentifié (Client ou Manager)
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Enregistre ou met à jour un appareil pour les notifications
    """
    user_id = current_user.get("id")
    
    # Vérifier si l'utilisateur existe et ses préférences de notification
    user = db.query(Client).filter(Client.id == user_id).first()
    
    if not user:
        return {
            "registered": False,
            "enabled": False,
            "message": "User not found"
        }

    # Vérifier si l'appareil existe déjà
    device = db.query(UserDevice).filter(
        UserDevice.device_token == device_info.device_token
    ).first()

    if device:
        # Mise à jour de l'appareil existant
        device.app_version = device_info.app_version
        device.device_name = device_info.device_name
        device.platform = device_info.platform
        registered = False
    else:
        # Création d'un nouvel appareil
        device = UserDevice(
            user_id=user_id,
            device_token=device_info.device_token,
            app_version=device_info.app_version,
            device_name=device_info.device_name,
            platform=device_info.platform
        )
        db.add(device)
        registered = True
    
    db.commit()
    
    return {
        "registered": registered,
        "enabled": user.notifications,
        "device_id": device.id,
        "message": "Device registered successfully" if registered else "Device updated successfully"
    }

@router.post("/verify")
async def verify(
    device_info: DeviceInfo,
    current_user: dict = Depends(get_current_client),  # Utilisateur authentifié (Client ou Manager)
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Enregistre ou met à jour un appareil pour les notifications
    """
    user_id = current_user.get("id")
    
    # Vérifier si l'utilisateur existe et ses préférences de notification
    user = db.query(Client).filter(Client.id == user_id).first()
    
    if not user: return { "registered": False}

    # Vérifier si l'appareil existe déjà
    existing_device = db.query(UserDevice).filter(
        UserDevice.device_token == device_info.device_token
    ).first()

    return { "registered": existing_device is not None }


# schemas.py
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class DeviceInfo(BaseModel):
    device_token: str
    app_version: Optional[str] = None
    device_name: Optional[str] = None
    platform: Optional[str] = None

class DeviceInfoBase(BaseModel):
    device_token: str
    app_version: Optional[str] = None
    device_name: Optional[str] = None
    platform: Optional[str] = None

class DeviceInfoCreate(DeviceInfoBase):
    user_id: int

class DeviceInfoResponse(DeviceInfoBase):
    id: int
    user_id: int
    last_used_at: Optional[datetime] = None

    class Config:
        orm_mode = True
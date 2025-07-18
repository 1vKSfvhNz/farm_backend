from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional
from schemas import Pagination

class ManagerLogin(BaseModel):
    phone: str
    code: str

class UserBase(BaseModel):
    username: str
    phone: str

class UserManagerCreate(UserBase):
    key: str
    code: str

    def to_user_dict(self) -> dict:
        """Transforme l'objet en dict compatible avec SQLAlchemy, sans 'key', et avec 'password'."""
        data = self.model_dump(exclude={"key", "code"})
        data["password"] = self.code
        return data

class UserManager(UserBase):
    pass

class UserCreate(UserBase):
    email: EmailStr
    password: str
    code: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponseBase(UserBase):
    id: int
    role: str
    created_at: datetime
    last_login: Optional[datetime]  # Peut être null si l'utilisateur ne s'est jamais connecté

    class Config:
        from_attributes = True  # Active la compatibilité avec les ORM (SQLAlchemy)

class UserResponseManager(UserResponseBase):
    pass

class UserResponse(UserResponseBase):
    id: int
    email: str
    role: str
    created_at: datetime
    last_login: Optional[datetime]  # Peut être null si l'utilisateur ne s'est jamais connecté

    class Config:
        from_attributes = True  # Active la compatibilité avec les ORM (SQLAlchemy)

class UsersResponse(BaseModel):
    users: list[UserResponse]
    pagination: Pagination

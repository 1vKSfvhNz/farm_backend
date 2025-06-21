from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import Session, relationship, validates
import json

from utils.security import hash_passw, verify_passw
from models import Base, add_object


class UserBaseModel(Base):
    """Modèle de base abstrait pour les utilisateurs avec fonctionnalités communes"""
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    password = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    notifications = Column(Boolean, default=True, nullable=False)
    role = Column(String(16), default='user', nullable=False)  # Changed default from 'admin' to 'user'
    lang = Column(String(2), default='fr', nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)

    @validates('phone')
    def validate_phone(self, key, phone):
        """Validation basique du numéro de téléphone"""
        if not phone or len(phone) < 8:
            raise ValueError("Numéro de téléphone invalide")
        return phone

    @validates('role')
    def validate_role(self, key, role):
        """Validation du rôle utilisateur"""
        valid_roles = {'user', 'admin', 'manager', 'guest'}
        if role not in valid_roles:
            raise ValueError(f"Rôle invalide. Doit être parmi: {valid_roles}")
        return role

    def save_user(self, db: Session) -> None:
        """Sauvegarde l'utilisateur avec le mot de passe hashé"""
        self.password = hash_passw(self.password)
        add_object(db, self)

    def update_password(self, new_password: str, db: Session) -> None:
        """Met à jour le mot de passe de l'utilisateur"""
        self.password = hash_passw(new_password)
        db.commit()

    def verify_password(self, plain_password: str) -> bool:
        """Vérifie si le mot de passe fourni correspond"""
        return verify_passw(plain_password, self.password)

    def to_dict(self) -> Dict[str, Any]:
        """Retourne une représentation dictionnaire de l'utilisateur"""
        return {
            'id': self.id,
            'username': self.username,
            'phone': self.phone,
            'is_active': self.is_active,
            'notifications': self.notifications,
            'role': self.role,
            'lang': self.lang,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class Client(UserBaseModel):
    """Modèle pour les utilisateurs standard avec email"""
    __tablename__ = "users"
    __mapper_args__ = {"polymorphic_identity": "user", "concrete": True}

    email = Column(String(64), unique=True, nullable=False)
    devices = relationship(
        "UserDevice",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )

    @validates('email')
    def validate_email(self, key, email):
        """Validation basique de l'email"""
        if '@' not in email:
            raise ValueError("Email invalide")
        return email

    def to_dict(self) -> Dict[str, Any]:
        """Extension de la méthode to_dict pour inclure l'email"""
        base_dict = super().to_dict()
        base_dict.update({'email': self.email})
        return base_dict


class Manager(UserBaseModel):
    """Modèle pour les gestionnaires d'utilisateurs"""
    __tablename__ = "users_management"
    __mapper_args__ = {"polymorphic_identity": "manager", "concrete": True}

    devices = relationship(
        "UserDevice",
        back_populates="manager",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )


class UserDevice(Base):
    """Modèle pour les appareils associés aux utilisateurs"""
    __tablename__ = "user_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    manager_id = Column(Integer, ForeignKey('users_management.id'), nullable=True)
    app_version = Column(String(32), nullable=True)
    device_name = Column(String(64), nullable=True)
    device_token = Column(String(256), nullable=False, unique=True)
    platform = Column(String(32), nullable=False)
    last_used_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Relations
    user = relationship("Client", back_populates="devices")
    manager = relationship("Manager", back_populates="devices")

    def to_dict(self) -> Dict[str, Any]:
        """Retourne une représentation dictionnaire de l'appareil"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'manager_id': self.manager_id,
            'app_version': self.app_version,
            'device_name': self.device_name,
            'platform': self.platform,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None
        }


class UserConnection(Base):
    """Modèle pour le suivi des connexions utilisateur"""
    __tablename__ = "user_connections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    last_connected = Column(DateTime(timezone=True), default=datetime.now)
    last_disconnected = Column(DateTime(timezone=True), nullable=True)
    connection_data = Column(JSON, nullable=True)  # Utilisation du type JSON natif
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    @property
    def connection_metadata(self) -> Optional[Dict[str, Any]]:
        """Retourne les métadonnées de connexion désérialisées"""
        return json.loads(self.connection_data) if self.connection_data else None

    @connection_metadata.setter
    def connection_metadata(self, value: Dict[str, Any]) -> None:
        """Définit les métadonnées de connexion sérialisées"""
        self.connection_data = json.dumps(value) if value else None

    def to_dict(self) -> Dict[str, Any]:
        """Retourne une représentation dictionnaire de la connexion"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'last_connected': self.last_connected.isoformat() if self.last_connected else None,
            'last_disconnected': self.last_disconnected.isoformat() if self.last_disconnected else None,
            'connection_metadata': self.connection_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
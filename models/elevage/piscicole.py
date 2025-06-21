from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey, Enum as SqlEnum, func
from sqlalchemy.orm import relationship, validates
from models import Base
from enums import QualiteEauEnum
from enums.elevage import TypeElevage
from enums.elevage.piscicole import (
    EspecePoissonEnum,
    TypeAlimentPoissonEnum,
    TypeMilieuPiscicoleEnum,
    TypeElevagePiscicoleEnum
)
from typing import Optional

class Poisson(Base):
    __tablename__ = 'poissons'
    
    id = Column(Integer, primary_key=True)
    espece = Column(SqlEnum(EspecePoissonEnum), nullable=False, doc="Espèce de poisson")
    bassin_id = Column(Integer, ForeignKey('bassins_piscicoles.id'), doc="ID du bassin associé")
    date_ensemencement = Column(Date, default=date.today, doc="Date d'ensemencement du poisson")
    origine = Column(String(100), nullable=False, comment="Origine du poisson: Ecloserie, pêche, etc.")
    poids_ensemencement = Column(Float, nullable=False, comment="Poids en grammes (g)")
    taille_ensemencement = Column(Float, nullable=False, comment="Taille en centimètres (cm)")
    alimentation_type = Column(SqlEnum(TypeAlimentPoissonEnum), nullable=False, doc="Type d'alimentation")
    
    bassin = relationship("BassinPiscicole", back_populates="poissons")
    
    __mapper_args__ = {
        'polymorphic_identity': TypeElevage.PISCICOLE
    }

    @validates('poids_ensemencement', 'taille_ensemencement')
    def validate_positive_values(self, key: str, value: float) -> float:
        """Valide que les valeurs de poids et taille sont positives."""
        if value <= 0:
            raise ValueError(f"{key} doit être une valeur positive")
        return value

    def __repr__(self) -> str:
        return f"<Poisson(id={self.id}, espece={self.espece}, bassin_id={self.bassin_id})>"


class BassinPiscicole(Base):
    __tablename__ = 'bassins_piscicoles'
    
    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False, unique=True, doc="Nom du bassin")
    type_milieu = Column(SqlEnum(TypeMilieuPiscicoleEnum), nullable=False, doc="Type de milieu aquatique")
    type_elevage = Column(SqlEnum(TypeElevagePiscicoleEnum), nullable=False, doc="Type d'élevage piscicole")
    volume = Column(Float, nullable=False, comment="Volume en mètres cubes (m3)")
    superficie = Column(Float, nullable=False, comment="Superficie en mètres carrés (m2)")
    profondeur_moyenne = Column(Float, nullable=False, comment="Profondeur en mètres (m)")
    capacite_max = Column(Integer, nullable=False, comment="Capacité maximale en nombre de poissons")
    date_mise_en_service = Column(Date, default=date.today, doc="Date de mise en service")
    systeme_filtration = Column(String(200), nullable=False, doc="Système de filtration")
    systeme_aeration = Column(String(200), nullable=False, doc="Système d'aération")
    notes = Column(Text, doc="Notes complémentaires")
    
    poissons = relationship("Poisson", back_populates="bassin", cascade="all, delete-orphan")
    controles_eau = relationship("ControleEau", back_populates="bassin", cascade="all, delete-orphan")
    recoltes = relationship("RecoltePoisson", back_populates="bassin", cascade="all, delete-orphan")

    @validates('volume', 'superficie', 'profondeur_moyenne', 'capacite_max')
    def validate_positive_values(self, key: str, value: float) -> float:
        """Valide que les valeurs sont positives."""
        if value <= 0:
            raise ValueError(f"{key} doit être une valeur positive")
        return value

    def __repr__(self) -> str:
        return f"<BassinPiscicole(id={self.id}, nom={self.nom}, type={self.type_elevage})>"

    @property
    def taux_occupation(self) -> Optional[float]:
        """Calcule le taux d'occupation du bassin en pourcentage."""
        if not self.capacite_max or not self.poissons:
            return None
        return (len(self.poissons) / self.capacite_max) * 100


class ControleEau(Base):
    __tablename__ = 'controles_eau'
    
    id = Column(Integer, primary_key=True)
    bassin_id = Column(Integer, ForeignKey('bassins_piscicoles.id'), nullable=False, doc="ID du bassin contrôlé")
    date_controle = Column(DateTime, nullable=False, default=datetime.now, doc="Date et heure du contrôle")
    temperature = Column(Float, nullable=False, comment="Température en degrés Celsius (°C)")
    ph = Column(Float, nullable=False, doc="pH de l'eau")
    oxygene_dissous = Column(Float, nullable=False, comment="Oxygène dissous en milligrammes par litre (mg/l)")
    ammoniac = Column(Float, nullable=False, comment="Ammoniac en milligrammes par litre (mg/l)")
    nitrites = Column(Float, nullable=False, comment="Nitrites en milligrammes par litre (mg/l)")
    nitrates = Column(Float, nullable=False, comment="Nitrates en milligrammes par litre (mg/l)")
    salinite = Column(Float, comment="Salinité en parties par mille (ppt)")
    turbidite = Column(Float, comment="Turbidité en NTU")
    qualite_eau = Column(SqlEnum(QualiteEauEnum), nullable=False, doc="Qualité globale de l'eau")
    notes = Column(Text, doc="Observations complémentaires")
    
    bassin = relationship("BassinPiscicole", back_populates="controles_eau")

    @validates('ph')
    def validate_ph(self, key: str, value: float) -> float:
        """Valide que le pH est dans une plage raisonnable."""
        if value < 0 or value > 14:
            raise ValueError("Le pH doit être entre 0 et 14")
        return value

    def __repr__(self) -> str:
        return f"<ControleEau(id={self.id}, bassin_id={self.bassin_id}, date={self.date_controle})>"


class RecoltePoisson(Base):
    __tablename__ = 'recoltes_poissons'
    
    id = Column(Integer, primary_key=True)
    bassin_id = Column(Integer, ForeignKey('bassins_piscicoles.id'), nullable=False, doc="ID du bassin récolté")
    date_recolte = Column(Date, nullable=False, default=date.today, doc="Date de récolte")
    nombre_poissons = Column(Integer, nullable=False, doc="Nombre de poissons récoltés")
    poids_total = Column(Float, nullable=False, comment="Poids total en kilogrammes (kg)")
    poids_moyen = Column(Float, nullable=False, comment="Poids moyen en grammes (g/poisson)")
    taux_survie = Column(Float, nullable=False, comment="Taux de survie en pourcentage (%)")
    destination = Column(String(100), nullable=False, comment="Destination: Vente, transformation, etc.")
    notes = Column(Text, doc="Notes complémentaires")
    
    bassin = relationship("BassinPiscicole", back_populates="recoltes")

    @validates('taux_survie')
    def validate_taux_survie(self, key: str, value: float) -> float:
        """Valide que le taux de survie est entre 0 et 100%."""
        if value < 0 or value > 100:
            raise ValueError("Le taux de survie doit être entre 0 et 100%")
        return value

    def __repr__(self) -> str:
        return f"<RecoltePoisson(id={self.id}, bassin_id={self.bassin_id}, date={self.date_recolte})>"
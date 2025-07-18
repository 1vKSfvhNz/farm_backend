from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime, Enum as SqlEnum
from enums import SexeEnum
from models import Base
from sqlalchemy.orm import relationship
from models.elevage import Animal, TypeElevage
from enums.elevage import TypeProductionCaprinOvinEnum
from enums.elevage.ovin import TypeToisonEnum

class Ovin(Animal):
    __tablename__ = 'ovins'
    
    id = Column(Integer, ForeignKey('animaux.id'), primary_key=True)
    type_production = Column(SqlEnum(TypeProductionCaprinOvinEnum))
    type_toison = Column(SqlEnum(TypeToisonEnum))
    date_derniere_tonte = Column(Date)
    poids_derniere_tonte = Column(Float)  # kg
    qualite_derniere_tonte = Column(String(50))
    aptitudes_boucherie = Column(String(50))
    
    __mapper_args__ = {
        'polymorphic_identity': TypeElevage.OVIN
    }

class MiseBasOvin(Base):
    __tablename__ = 'mises_bas_ovins'
    
    id = Column(Integer, primary_key=True)
    mere_id = Column(Integer, ForeignKey('ovins.id'), nullable=False)
    date_mise_bas = Column(Date, nullable=False)
    nombre_agneaux = Column(Integer, default=1)
    poids_agneau_principal = Column(Float)
    sexe_agneau_principal = Column(SqlEnum(SexeEnum))
    notes = Column(Text)
    
    mere = relationship("Ovin")

class Tonte(Base):
    __tablename__ = 'tontes'
    
    id = Column(Integer, primary_key=True)
    animal_id = Column(Integer, ForeignKey('animaux.id'), nullable=False)
    date_tonte = Column(Date, nullable=False)
    poids_laine = Column(Float)  # kg
    qualite_laine = Column(String(50))
    longueur_fibre = Column(Float)  # mm
    finesse = Column(Float)  # microns
    rendement = Column(Float)  # %
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animal = relationship("Animal")


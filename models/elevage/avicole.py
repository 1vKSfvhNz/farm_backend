from sqlalchemy import Column, Integer, DateTime, String, Float, Date, ForeignKey, Text, Enum as SqlEnum
from sqlalchemy.orm import relationship
from models import Base
from models.elevage import TypeElevage
from enums.elevage.avicole import TypeVolailleEnum, TypeProductionAvicoleEnum, SystemeElevageAvicoleEnum
from datetime import datetime, timezone

class LotAvicole(Base):
    __tablename__ = 'lots_avicoles'
    
    id = Column(Integer, primary_key=True)
    identifiant_lot = Column(String(100), unique=True, nullable=False)
    type_volaille = Column(SqlEnum(TypeVolailleEnum), nullable=False)
    type_production = Column(SqlEnum(TypeProductionAvicoleEnum), nullable=False)
    systeme_elevage = Column(SqlEnum(SystemeElevageAvicoleEnum))
    souche = Column(String(100))
    date_mise_en_place = Column(Date, nullable=False)
    date_reforme = Column(Date)
    effectif_initial = Column(Integer, nullable=False)
    effectif_actuel = Column(Integer)
    batiment_id = Column(Integer, ForeignKey('batiments.id'))
    statut = Column(String(50))
    informations_specifiques = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relations
    batiment = relationship("Batiment")
    pesees = relationship("PeseeLotAvicole", back_populates="lot")
    traitements = relationship("TraitementLotAvicole", back_populates="lot")
    controles_ponte = relationship("ControlePonteLot", back_populates="lot")
    performances = relationship("PerformanceLotAvicole", back_populates="lot")

    __mapper_args__ = {
        'polymorphic_identity': TypeElevage.AVICOLE
    }

class PeseeLotAvicole(Base):
    __tablename__ = 'pesees_lots_avicoles'
    
    id = Column(Integer, primary_key=True)
    lot_id = Column(Integer, ForeignKey('lots_avicoles.id'), nullable=False)
    date_pesee = Column(DateTime, nullable=False)
    nombre_volailles_pesees = Column(Integer)  # Échantillon pesé
    poids_moyen = Column(Float, nullable=False)  # en kg
    poids_total = Column(Float)  # en kg
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    lot = relationship("LotAvicole", back_populates="pesees")

class TraitementLotAvicole(Base):
    __tablename__ = 'traitements_lots_avicoles'
    
    id = Column(Integer, primary_key=True)
    lot_id = Column(Integer, ForeignKey('lots_avicoles.id'), nullable=False)
    type_traitement = Column(String(100), nullable=False)
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date)
    produit = Column(String(200), nullable=False)
    posologie = Column(String(100))
    effectif_traite = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    lot = relationship("LotAvicole", back_populates="traitements")

class ControlePonteLot(Base):
    __tablename__ = 'controles_ponte_lots'
    
    id = Column(Integer, primary_key=True)
    lot_id = Column(Integer, ForeignKey('lots_avicoles.id'), nullable=False)
    date_controle = Column(Date, nullable=False)
    nombre_oeufs = Column(Integer)
    poids_moyen_oeuf = Column(Float)  # g
    taux_ponte = Column(Float)  # %
    taux_casses = Column(Float)  # %
    taux_sales = Column(Float)  # %
    notes = Column(Text)
    
    lot = relationship("LotAvicole", back_populates="controles_ponte")

class PerformanceLotAvicole(Base):
    __tablename__ = 'performances_lots_avicoles'
    
    id = Column(Integer, primary_key=True)
    lot_id = Column(Integer, ForeignKey('lots_avicoles.id'), nullable=False)
    date_controle = Column(Date, nullable=False)
    poids_moyen = Column(Float)  # g
    gain_moyen_journalier = Column(Float)  # g/jour
    consommation_aliment = Column(Float)  # kg
    indice_consommation = Column(Float)  # kg aliment/kg poids vif
    taux_mortalite = Column(Float)  # %
    uniformite = Column(Float)  # %
    notes = Column(Text)
    
    lot = relationship("LotAvicole", back_populates="performances")
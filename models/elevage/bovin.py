from sqlalchemy import Column, Integer, String, Boolean, Float, Text, Date, ForeignKey, Enum as SqlEnum, Table
from sqlalchemy.orm import relationship
from models import Base
from enums import SexeEnum
from models.elevage import Animal, TypeElevage
from enums.elevage.bovin import StatutReproductionBovinEnum, TypeProductionBovinEnum

# Définition de la table d'association pour la relation many-to-many entre Velage et Bovin
velages_veaux = Table(
    'velages_veaux',
    Base.metadata,
    Column('velage_id', Integer, ForeignKey('velages.id'), primary_key=True),
    Column('veau_id', Integer, ForeignKey('bovins.id'), primary_key=True)
)

class Bovin(Animal):
    __tablename__ = 'bovins'
    
    id = Column(Integer, ForeignKey('animaux.id'), primary_key=True)
    type_production = Column(SqlEnum(TypeProductionBovinEnum), nullable=False)
    statut_reproduction = Column(SqlEnum(StatutReproductionBovinEnum))
    numero_travail = Column(String(50))  # Numéro interne
    robe = Column(String(50))
    date_mise_bas = Column(Date)
    nombre_velages = Column(Integer, default=0)
    production_lait_305j = Column(Float)  # Production laitière sur 305 jours
    taux_cellulaires_moyen = Column(Float)  # Cellules somatiques moyennes
    aptitudes_viande = Column(String(50))  # Notes/conformation
    
    # Relations spécifiques
    velages = relationship("Velage", back_populates="mere")
    controles_qualite_lait = relationship("ControleQualiteLaitBovin", back_populates="bovin")
    naissance = relationship("Velage", secondary='velages_veaux', back_populates="veaux")
    
    __mapper_args__ = {
        'polymorphic_identity': TypeElevage.BOVIN
    }

class Velage(Base):
    __tablename__ = 'velages'
    
    id = Column(Integer, primary_key=True)
    mere_id = Column(Integer, ForeignKey('bovins.id'), nullable=False)
    date_velage = Column(Date, nullable=False)
    facilite_velage = Column(Integer)  # 1-5
    duree_velage = Column(Integer)  # minutes
    assistance = Column(Boolean, default=False)
    nombre_veaux = Column(Integer, default=1)
    poids_veau_principal = Column(Float)
    sexe_veau_principal = Column(SqlEnum(SexeEnum))
    vitalite_veau_principal = Column(String(50))
    notes = Column(Text)
    
    mere = relationship("Bovin", back_populates="velages")
    veaux = relationship("Bovin", secondary=velages_veaux, back_populates="naissance")

class ControleQualiteLaitBovin(Base):
    __tablename__ = 'controles_qualite_lait_bovin'
    
    id = Column(Integer, primary_key=True)
    bovin_id = Column(Integer, ForeignKey('bovins.id'), nullable=False)
    date_controle = Column(Date, nullable=False)
    taux_matiere_grasse = Column(Float)  # %
    taux_proteine = Column(Float)  # %
    taux_lactose = Column(Float)  # %
    cellules_somatiques = Column(Integer)  # cellules/ml
    bacteries = Column(Integer)  # UFC/ml
    point_congelation = Column(Float)  # °C
    inhibiteurs = Column(Boolean)  # Présence d'antibiotiques
    
    bovin = relationship("Bovin", back_populates="controles_qualite_lait")
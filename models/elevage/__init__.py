from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Date, ForeignKey, Boolean, Enum as SqlEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from models import Base
from enums.elevage import TypeElevage, StatutAnimalEnum
from enums import SexeEnum

## Modèles communs
class Race(Base):
    __tablename__ = 'races'
    
    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    description = Column(Text)
    origine = Column(String(100))
    type_elevage = Column(SqlEnum(TypeElevage, name="type_elevage_enum"), nullable=False)
    caracteristiques = Column(Text)  # JSON string pour stocker les caractéristiques spécifiques
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animaux = relationship("Animal", back_populates="race")

class Lot(Base):
    __tablename__ = 'lots'
    
    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    description = Column(Text)
    type_elevage = Column(SqlEnum(TypeElevage), nullable=False)
    type_lot = Column(String(50))  # spécifique à chaque type d'élevage
    batiment_id = Column(Integer, ForeignKey('batiments.id'))
    capacite_max = Column(Integer)
    responsable = Column(String(200))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animaux = relationship("Animal", back_populates="lot")
    batiment = relationship("Batiment")

class Pesee(Base):
    __tablename__ = 'pesees'
    
    id = Column(Integer, primary_key=True)
    animal_id = Column(Integer, ForeignKey('animaux.id'), nullable=False)
    date_pesee = Column(DateTime, nullable=False)
    poids = Column(Float, nullable=False)  # en kg
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animal = relationship("Animal", back_populates="pesees")

class Traitement(Base):
    __tablename__ = 'traitements'
    
    id = Column(Integer, primary_key=True)
    animal_id = Column(Integer, ForeignKey('animaux.id'), nullable=False)
    type_traitement = Column(String(100), nullable=False)
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date)
    produit = Column(String(200), nullable=False)
    posologie = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animal = relationship("Animal", back_populates="traitements")

class Animal(Base):
    __tablename__ = 'animaux'
    
    id = Column(Integer, primary_key=True)
    numero_identification = Column(String(100), unique=True, nullable=False)
    nom = Column(String(100))
    sexe = Column(SqlEnum(SexeEnum), nullable=False)
    date_naissance = Column(Date)
    race_id = Column(Integer, ForeignKey('races.id'), nullable=False)
    lot_id = Column(Integer, ForeignKey('lots.id'))
    mere_id = Column(Integer, ForeignKey('animaux.id'))
    pere_id = Column(Integer, ForeignKey('animaux.id'))
    statut = Column(SqlEnum(StatutAnimalEnum), default=StatutAnimalEnum.EN_CROISSANCE)
    date_mise_en_production = Column(Date)
    date_reforme = Column(Date)
    date_deces = Column(Date)
    cause_deces = Column(String(200))
    informations_specifiques = Column(Text)  # JSON string pour données spécifiques
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_by = Column(Integer)  # ID de l'utilisateur
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(Integer)  # ID de l'utilisateur
    photo_url = Column(String(255), nullable=True)
    
    # Relations
    race = relationship("Race", back_populates="animaux")
    lot = relationship("Lot", back_populates="animaux")
    mere = relationship("Animal", remote_side=[id], foreign_keys=[mere_id])
    pere = relationship("Animal", remote_side=[id], foreign_keys=[pere_id])
    evenements = relationship("Evenement", back_populates="animal")
    traitements = relationship("Traitement", back_populates="animal")
    pesees = relationship("Pesee", back_populates="animal")

    # Relations spécifiques bovin/caprin
    productions_lait = relationship("ProductionLait", back_populates="animal")
    controles_laitiers = relationship("ControleLaitier", back_populates="animal")
    inseminations = relationship("Insemination", foreign_keys="[Insemination.animal_id]", back_populates="animal")

### Modèles Bovins/Caprins/Ovins (production laitière)
class ProductionLait(Base):
    __tablename__ = 'production_lait'
    
    id = Column(Integer, primary_key=True)
    animal_id = Column(Integer, ForeignKey('animaux.id'), nullable=False)
    date_production = Column(Date, nullable=False)
    quantite = Column(Float)  # litres
    duree_traite = Column(Integer)  # secondes
    debit_moyen = Column(Float)  # litres/minute
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animal = relationship("Animal", back_populates="productions_lait")

class ControleLaitier(Base):
    __tablename__ = 'controles_laitiers'
    
    id = Column(Integer, primary_key=True)
    animal_id = Column(Integer, ForeignKey('animaux.id'), nullable=False)
    date_controle = Column(Date, nullable=False)
    production_jour = Column(Float)  # litres
    taux_butyreux = Column(Float)  # %
    taux_proteique = Column(Float)  # %
    cellules_somatiques = Column(Integer)  # cellules/ml
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animal = relationship("Animal", back_populates="controles_laitiers")

class Insemination(Base):
    __tablename__ = 'inseminations'
    
    id = Column(Integer, primary_key=True)
    animal_id = Column(Integer, ForeignKey('animaux.id'), nullable=False)
    date_insemination = Column(Date, nullable=False)
    taureau_id = Column(Integer, ForeignKey('animaux.id'))
    methode = Column(String(100))
    succes = Column(Boolean)
    date_verification_gestation = Column(Date)
    resultat_gestation = Column(Boolean)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animal = relationship("Animal", back_populates="inseminations", foreign_keys=[animal_id])
    taureau = relationship("Animal", foreign_keys=[taureau_id])

## Modèles communs supplémentaires
class Evenement(Base):
    __tablename__ = 'evenements'
    
    id = Column(Integer, primary_key=True)
    animal_id = Column(Integer, ForeignKey('animaux.id'))
    lot_id = Column(Integer, ForeignKey('lots.id'))
    type_evenement = Column(String(100), nullable=False)  # Naissance, Sevrage, Vaccination, etc.
    date_evenement = Column(DateTime, nullable=False)
    description = Column(Text)
    cout = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animal = relationship("Animal", back_populates="evenements")
    lot = relationship("Lot")

class Aliment(Base):
    __tablename__ = 'aliments'
    
    id = Column(Integer, primary_key=True)
    nom = Column(String(200), nullable=False)
    type_elevage = Column(SqlEnum(TypeElevage), nullable=False)
    description = Column(Text)
    energie = Column(Float)  # kcal/kg ou UFL
    proteine = Column(Float)  # %
    matiere_grasse = Column(Float)  # %
    fibre = Column(Float)  # %
    prix_kg = Column(Float)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

class RationAlimentation(Base):
    __tablename__ = 'rations_alimentation'
    
    id = Column(Integer, primary_key=True)
    nom = Column(String(200), nullable=False)
    type_elevage = Column(SqlEnum(TypeElevage), nullable=False)
    type_animal = Column(String(100))  # veau, vache laitière, poule pondeuse, etc.
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    compositions = relationship("CompositionRation", back_populates="ration")

class CompositionRation(Base):
    __tablename__ = 'compositions_rations'
    
    id = Column(Integer, primary_key=True)
    ration_id = Column(Integer, ForeignKey('rations_alimentation.id'), nullable=False)
    aliment_id = Column(Integer, ForeignKey('aliments.id'), nullable=False)
    quantite = Column(Float, nullable=False)  # kg ou %
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    ration = relationship("RationAlimentation", back_populates="compositions")
    aliment = relationship("Aliment")

class Batiment(Base):
    __tablename__ = 'batiments'
    
    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    type_elevage = Column(SqlEnum(TypeElevage), nullable=False)
    type_batiment = Column(String(100))  # étable, poulailler, nurserie, etc.
    capacite = Column(Integer)
    superficie = Column(Float)  # m2
    ventilation = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    lots = relationship("Lot", back_populates="batiment")

class Vaccination(Base):
    __tablename__ = 'vaccinations'
    
    id = Column(Integer, primary_key=True)
    animal_id = Column(Integer, ForeignKey('animaux.id'))
    lot_id = Column(Integer, ForeignKey('lots.id'))
    type_vaccin = Column(String(100), nullable=False)
    date_vaccination = Column(Date, nullable=False)
    date_rappel = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animal = relationship("Animal")
    lot = relationship("Lot")

class Reproduction(Base):
    __tablename__ = 'reproductions'
    
    id = Column(Integer, primary_key=True)
    animal_id = Column(Integer, ForeignKey('animaux.id'), nullable=False)
    date_saillie = Column(Date, nullable=False)
    male_id = Column(Integer, ForeignKey('animaux.id'))
    date_mise_bas_prevue = Column(Date)
    date_mise_bas_reelle = Column(Date)
    nombre_jeunes = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    animal = relationship("Animal", foreign_keys=[animal_id])
    male = relationship("Animal", foreign_keys=[male_id])
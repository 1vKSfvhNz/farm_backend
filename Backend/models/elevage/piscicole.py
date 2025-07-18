from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey, Enum as SqlEnum, func, Boolean
from sqlalchemy.orm import relationship, validates
from models import Base
from enums import QualiteEauEnum
from enums.elevage import TypeElevage
from enums.elevage.piscicole import (
    EspecePoissonEnum,
    TypeAlimentPoissonEnum,
    TypeMilieuPiscicoleEnum,
    TypeHabitatPiscicoleEnum,
    StadePoisson
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
    
    # Nouveaux champs pour l'élevage
    sexe = Column(String(1), nullable=True, comment="M pour Mâle, F pour Femelle")
    stade_developpement = Column(SqlEnum(StadePoisson), nullable=False, default=StadePoisson.JUVENILE, doc="Stade de développement")
    reproducteur = Column(Boolean, default=False, doc="Indique si c'est un reproducteur")
    numero_identification = Column(String(50), nullable=True, doc="Numéro d'identification individuel")
    
    # Relations
    bassin = relationship("BassinPiscicole", back_populates="poissons")
    suivis_journaliers = relationship("SuiviPopulationJournalier", back_populates="poisson", cascade="all, delete-orphan")
    
    __mapper_args__ = {
        'polymorphic_identity': TypeElevage.PISCICOLE
    }

    @validates('poids_ensemencement', 'taille_ensemencement')
    def validate_positive_values(self, key: str, value: float) -> float:
        """Valide que les valeurs de poids et taille sont positives."""
        if value <= 0:
            raise ValueError(f"{key} doit être une valeur positive")
        return value

    @validates('sexe')
    def validate_sexe(self, key: str, value: str) -> str:
        """Valide que le sexe est M ou F."""
        if value and value not in ['M', 'F']:
            raise ValueError("Le sexe doit être 'M' pour Mâle ou 'F' pour Femelle")
        return value

    def __repr__(self) -> str:
        return f"<Poisson(id={self.id}, espece={self.espece}, bassin_id={self.bassin_id})>"


class BassinPiscicole(Base):
    __tablename__ = 'bassins_piscicoles'
    
    id = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False, unique=True, doc="Nom du bassin")
    type_milieu = Column(SqlEnum(TypeMilieuPiscicoleEnum), nullable=False, doc="Type de milieu aquatique")
    type_habitat = Column(SqlEnum(TypeHabitatPiscicoleEnum), nullable=False, doc="Type d'élevage piscicole")
    superficie = Column(Float, nullable=False, comment="Superficie en mètres carrés (m2)")
    profondeur_moyenne = Column(Float, nullable=False, comment="Profondeur en mètres (m)")
    capacite_max = Column(Integer, nullable=False, comment="Capacité maximale en nombre de poissons")
    date_mise_en_service = Column(Date, default=date.today, doc="Date de mise en service")
    systeme_filtration = Column(String(200), nullable=True, doc="Système de filtration")
    systeme_aeration = Column(String(200), nullable=True, doc="Système d'aération")
    notes = Column(Text, nullable=True, doc="Notes complémentaires")
    
    # Nouveaux champs pour l'élevage
    bassin_reproduction = Column(Boolean, default=False, doc="Indique si c'est un bassin de reproduction")
    
    # Relations
    poissons = relationship("Poisson", back_populates="bassin", cascade="all, delete-orphan")
    controles_eau = relationship("ControleEau", back_populates="bassin", cascade="all, delete-orphan")
    recoltes = relationship("RecoltePoisson", back_populates="bassin", cascade="all, delete-orphan")
    populations = relationship("PopulationBassin", back_populates="bassin", cascade="all, delete-orphan")
    suivis_populations = relationship("SuiviPopulationJournalier", back_populates="bassin", cascade="all, delete-orphan")

    @validates('superficie', 'profondeur_moyenne', 'capacite_max')
    def validate_positive_values(self, key: str, value: float) -> float:
        """Valide que les valeurs sont positives."""
        if value <= 0:
            raise ValueError(f"{key} doit être une valeur positive")
        return value
    
    def __repr__(self) -> str:
        return f"<BassinPiscicole(id={self.id}, nom={self.nom}, type={self.type_habitat})>"

    @property
    def taux_occupation(self) -> Optional[float]:
        """Calcule le taux d'occupation du bassin en pourcentage."""
        if not self.capacite_max:
            return None
        
        # Compte les poissons individuels + les populations
        nb_poissons_individuels = len(self.poissons)
        nb_poissons_populations = sum(pop.nombre_poissons for pop in self.populations)
        total_poissons = nb_poissons_individuels + nb_poissons_populations
        
        return (total_poissons / self.capacite_max) * 100


class PopulationBassin(Base):
    """Gestion des populations de poissons par nombre fixé plutôt qu'individuellement."""
    __tablename__ = 'populations_bassins'
    
    id = Column(Integer, primary_key=True)
    bassin_id = Column(Integer, ForeignKey('bassins_piscicoles.id'), nullable=False)
    espece = Column(SqlEnum(EspecePoissonEnum), nullable=False, doc="Espèce de poisson")
    nombre_poissons = Column(Integer, nullable=False, doc="Nombre de poissons dans cette population")
    date_ensemencement = Column(Date, default=date.today, doc="Date d'ensemencement")
    origine = Column(String(100), nullable=False, comment="Origine des poissons")
    poids_moyen_ensemencement = Column(Float, nullable=False, comment="Poids moyen en grammes (g)")
    taille_moyenne_ensemencement = Column(Float, nullable=False, comment="Taille moyenne en centimètres (cm)")
    alimentation_type = Column(SqlEnum(TypeAlimentPoissonEnum), nullable=False, doc="Type d'alimentation")
    stade_developpement = Column(SqlEnum(StadePoisson), nullable=False, default=StadePoisson.JUVENILE)
    notes = Column(Text, nullable=True, doc="Notes complémentaires")
    
    # Relations
    bassin = relationship("BassinPiscicole", back_populates="populations")
    suivis_journaliers = relationship("SuiviPopulationJournalier", back_populates="population", cascade="all, delete-orphan")

    @validates('nombre_poissons', 'poids_moyen_ensemencement', 'taille_moyenne_ensemencement')
    def validate_positive_values(self, key: str, value: float) -> float:
        """Valide que les valeurs sont positives."""
        if value <= 0:
            raise ValueError(f"{key} doit être une valeur positive")
        return value

    def __repr__(self) -> str:
        return f"<PopulationBassin(id={self.id}, bassin_id={self.bassin_id}, espece={self.espece}, nombre={self.nombre_poissons})>"

class SuiviPopulationJournalier(Base):
    """Suivi journalier des populations de poissons (individuels ou groupes)."""
    __tablename__ = 'suivis_populations_journaliers'
    
    id = Column(Integer, primary_key=True)
    date_suivi = Column(Date, nullable=False, default=date.today, doc="Date du suivi")
    
    # Référence soit à un poisson individuel, soit à une population
    poisson_id = Column(Integer, ForeignKey('poissons.id'), nullable=True)
    population_id = Column(Integer, ForeignKey('populations_bassins.id'), nullable=True)
    bassin_id = Column(Integer, ForeignKey('bassins_piscicoles.id'), nullable=False)
    
    # Données de suivi
    nombre_poissons = Column(Integer, nullable=False, doc="Nombre de poissons à cette date")
    nombre_morts = Column(Integer, nullable=False, default=0, doc="Nombre de poissons morts depuis le dernier suivi")
    poids_moyen = Column(Float, nullable=True, comment="Poids moyen en grammes (g)")
    taille_moyenne = Column(Float, nullable=True, comment="Taille moyenne en centimètres (cm)")
    quantite_nourriture = Column(Float, nullable=True, comment="Quantité de nourriture donnée (g)")
    
    # Observations
    comportement = Column(String(200), nullable=True, doc="Comportement observé")
    observations = Column(Text, nullable=True, doc="Observations complémentaires")
    
    # Relations
    poisson = relationship("Poisson", back_populates="suivis_journaliers")
    population = relationship("PopulationBassin", back_populates="suivis_journaliers")
    bassin = relationship("BassinPiscicole", back_populates="suivis_populations")

    @validates('nombre_poissons', 'nombre_morts', 'poids_moyen', 'taille_moyenne', 'quantite_nourriture')
    def validate_positive_values(self, key: str, value: float) -> float:
        """Valide que les valeurs sont positives."""
        if value is not None and value < 0:
            raise ValueError(f"{key} doit être une valeur positive")
        return value

    @property
    def taux_mortalite(self) -> Optional[float]:
        """Calcule le taux de mortalité depuis le dernier suivi (en %)."""
        if self.population_id and self.population.nombre_poissons_initial:
            return (self.nombre_morts / self.population.nombre_poissons_initial) * 100
        return None

    def __repr__(self) -> str:
        return f"<SuiviPopulationJournalier(id={self.id}, date={self.date_suivi}, nombre={self.nombre_poissons}, morts={self.nombre_morts})>"

class ControleEau(Base):
    __tablename__ = 'controles_eau'
    
    id = Column(Integer, primary_key=True)
    bassin_id = Column(Integer, ForeignKey('bassins_piscicoles.id'), nullable=False, doc="ID du bassin contrôlé")
    date_controle = Column(DateTime, nullable=False, default=datetime.now, doc="Date et heure du contrôle")
    temperature = Column(Float, nullable=False, comment="Température en degrés Celsius (°C)")
    ph = Column(Float, nullable=False, doc="pH de l'eau")
    oxygene_dissous = Column(Float, nullable=True, comment="Oxygène dissous en milligrammes par litre (mg/l)")
    ammoniac = Column(Float, nullable=True, comment="Ammoniac en milligrammes par litre (mg/l)")
    nitrites = Column(Float, nullable=True, comment="Nitrites en milligrammes par litre (mg/l)")
    nitrates = Column(Float, nullable=True, comment="Nitrates en milligrammes par litre (mg/l)")
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
    
    # Nouveau champ pour identifier si c'est une récolte de population ou individuelle
    population_id = Column(Integer, ForeignKey('populations_bassins.id'), nullable=True, doc="ID de la population récoltée")
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
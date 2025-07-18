from pydantic import BaseModel, Field, field_validator, computed_field
from typing import Optional, List, Dict, Literal, Union
from datetime import date, datetime
from enums import QualiteEauEnum
from enums.elevage.piscicole import (
    TypeMilieuPiscicoleEnum,
    TypeHabitatPiscicoleEnum,
    EspecePoissonEnum,
    TypeAlimentPoissonEnum,
    StadePoisson
)
from enums.elevage import PhaseElevage

# Modèles de base
class PoissonBase(BaseModel):
    espece: EspecePoissonEnum = Field(..., description="Espèce de poisson")
    date_ensemencement: date = Field(default_factory=date.today, alias="dateEnsemencement", description="Date d'introduction dans le bassin")
    poids_ensemencement: float = Field(..., gt=0, alias="poidsEnsemencement", description="Poids initial en grammes")
    taille_ensemencement: float = Field(..., gt=0, alias="tailleEnsemencement", description="Taille initiale en cm")
    origine: str = Field(..., max_length=100, description="Origine du poisson")
    alimentation_type: TypeAlimentPoissonEnum = Field(..., alias="alimentationType", description="Type d'alimentation")
    sexe: Optional[Literal['M', 'F']] = Field(None, description="Sexe: M pour Mâle, F pour Femelle")
    stade_developpement: StadePoisson = Field(StadePoisson.JUVENILE, alias="stadeDeveloppement", description="Stade de développement")
    reproducteur: bool = Field(False, description="Indique si c'est un reproducteur")
    numero_identification: Optional[str] = Field(None, alias="numeroIdentification", max_length=50, description="Numéro d'identification individuel")

class PoissonCreate(PoissonBase):
    bassin_id: int = Field(..., alias="bassinId", description="ID du bassin")

class PoissonUpdate(BaseModel):
    espece: Optional[EspecePoissonEnum] = None
    bassin_id: Optional[int] = Field(None, alias="bassinId")
    poids_ensemencement: Optional[float] = Field(None, gt=0, alias="poidsEnsemencement")
    taille_ensemencement: Optional[float] = Field(None, gt=0, alias="tailleEnsemencement")
    origine: Optional[str] = Field(None, max_length=100)
    alimentation_type: Optional[TypeAlimentPoissonEnum] = Field(None, alias="alimentationType")
    sexe: Optional[Literal['M', 'F']] = None
    stade_developpement: Optional[StadePoisson] = Field(None, alias="stadeDeveloppement")
    reproducteur: Optional[bool] = None
    numero_identification: Optional[str] = Field(None, alias="numeroIdentification", max_length=50)

    class Config:
        from_attributes = True
        populate_by_name = True

class PoissonResponse(PoissonBase):
    id: int
    bassin_id: int = Field(..., alias="bassinId", description="ID du bassin")
    
    @computed_field
    @property
    def age_jours(self) -> int:
        """Retourne l'âge en jours depuis l'ensemencement."""
        return (date.today() - self.date_ensemencement).days

    class Config:
        from_attributes = True
        populate_by_name = True

# Modèles pour les populations
class PopulationBassinBase(BaseModel):
    espece: EspecePoissonEnum = Field(..., description="Espèce de poisson")
    nombre_poissons: int = Field(..., gt=0, alias="nombrePoissons", description="Nombre de poissons dans cette population")
    date_ensemencement: date = Field(default_factory=date.today, alias="dateEnsemencement", description="Date d'ensemencement")
    origine: str = Field(..., max_length=100, description="Origine des poissons")
    poids_moyen_ensemencement: float = Field(..., gt=0, alias="poidsMoyenEnsemencement", description="Poids moyen en grammes")
    taille_moyenne_ensemencement: float = Field(..., gt=0, alias="tailleMoyenneEnsemencement", description="Taille moyenne en cm")
    alimentation_type: TypeAlimentPoissonEnum = Field(..., alias="alimentationType", description="Type d'alimentation")
    stade_developpement: StadePoisson = Field(StadePoisson.JUVENILE, alias="stadeDeveloppement", description="Stade de développement")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

class PopulationBassinCreate(PopulationBassinBase):
    bassin_id: int = Field(..., alias="bassinId", description="ID du bassin")

class PopulationBassinUpdate(BaseModel):
    espece: Optional[EspecePoissonEnum] = None
    nombre_poissons: Optional[int] = Field(None, gt=0, alias="nombrePoissons")
    poids_moyen_ensemencement: Optional[float] = Field(None, gt=0, alias="poidsMoyenEnsemencement")
    taille_moyenne_ensemencement: Optional[float] = Field(None, gt=0, alias="tailleMoyenneEnsemencement")
    alimentation_type: Optional[TypeAlimentPoissonEnum] = Field(None, alias="alimentationType")
    stade_developpement: Optional[StadePoisson] = Field(None, alias="stadeDeveloppement")
    notes: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class PopulationBassinResponse(PopulationBassinBase):
    id: int
    bassin_id: int = Field(..., alias="bassinId")

    @computed_field
    @property
    def biomasse_totale_kg(self) -> float:
        """Calcule la biomasse totale en kilogrammes."""
        return (self.nombre_poissons * self.poids_moyen_ensemencement) / 1000

    class Config:
        from_attributes = True
        populate_by_name = True

# Modèles pour les bassins
class BassinBase(BaseModel):
    nom: str = Field(..., max_length=100, description="Nom du bassin")
    type_milieu: TypeMilieuPiscicoleEnum = Field(..., alias="typeMilieu", description="Type de milieu aquatique")
    type_habitat: TypeHabitatPiscicoleEnum = Field(..., alias="typeHabitat", description="Type d'élevage piscicole")
    superficie: float = Field(..., gt=0, description="Superficie en m²")
    profondeur_moyenne: float = Field(..., gt=0, alias="profondeurMoyenne", description="Profondeur moyenne en m")
    capacite_max: int = Field(..., gt=0, alias="capaciteMax", description="Capacité maximale en nombre de poissons")
    date_mise_en_service: date = Field(default_factory=date.today, alias="dateMiseEnService", description="Date de mise en service")
    systeme_filtration: Optional[str] = Field(None, alias="systemeFiltration", max_length=200)
    systeme_aeration: Optional[str] = Field(None, alias="systemeAeration", max_length=200)
    notes: Optional[str] = Field(None, description="Notes complémentaires")
    bassin_reproduction: bool = Field(False, alias="bassinReproduction", description="Indique si c'est un bassin de reproduction")

class BassinCreate(BassinBase):
    pass

class BassinUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    type_milieu: Optional[TypeMilieuPiscicoleEnum] = Field(None, alias="typeMilieu")
    type_habitat: Optional[TypeHabitatPiscicoleEnum] = Field(None, alias="typeHabitat")
    superficie: Optional[float] = Field(None, gt=0)
    profondeur_moyenne: Optional[float] = Field(None, gt=0, alias="profondeurMoyenne")
    capacite_max: Optional[int] = Field(None, gt=0, alias="capaciteMax")
    systeme_filtration: Optional[str] = Field(None, alias="systemeFiltration", max_length=200)
    systeme_aeration: Optional[str] = Field(None, alias="systemeAeration", max_length=200)
    notes: Optional[str] = None
    bassin_reproduction: Optional[bool] = Field(None, alias="bassinReproduction")

    class Config:
        from_attributes = True
        populate_by_name = True

class BassinResponse(BassinBase):
    id: int
    poissons: List[PoissonResponse] = Field(default_factory=list)
    populations: List[PopulationBassinResponse] = Field(default_factory=list)
    controles_eau: List["ControleEauResponse"] = Field(default_factory=list)
    recoltes: List["RecolteResponse"] = Field(default_factory=list)

    @computed_field
    @property
    def volume_m3(self) -> float:
        """Calcule le volume du bassin en m³."""
        return self.superficie * self.profondeur_moyenne

    @computed_field
    @property
    def nombre_total_poissons(self) -> int:
        """Calcule le nombre total de poissons (individuels + populations)."""
        individus = len(self.poissons)
        populations = sum(pop.nombre_poissons for pop in self.populations)
        return individus + populations

    @computed_field
    @property
    def taux_occupation(self) -> float:
        """Calcule le taux d'occupation du bassin en pourcentage."""
        return (self.nombre_total_poissons / self.capacite_max) * 100

    @computed_field
    @property
    def biomasse_totale_kg(self) -> float:
        """Calcule la biomasse totale en kg."""
        biomasse_individus = sum(p.poids_ensemencement for p in self.poissons) / 1000
        biomasse_populations = sum(pop.biomasse_totale_kg for pop in self.populations)
        return biomasse_individus + biomasse_populations

    class Config:
        from_attributes = True
        populate_by_name = True

# Modèles pour les récoltes
class RecolteBase(BaseModel):
    bassin_id: int = Field(..., alias="bassinId", description="ID du bassin")
    date_recolte: date = Field(default_factory=date.today, alias="dateRecolte", description="Date de récolte")
    nombre_poissons: int = Field(..., gt=0, alias="nombrePoissons", description="Nombre de poissons récoltés")
    poids_total: float = Field(..., gt=0, alias="poidsTotal", description="Poids total en kg")
    poids_moyen: float = Field(..., gt=0, alias="poidsMoyen", description="Poids moyen en g")
    taux_survie: float = Field(..., ge=0, le=100, alias="tauxSurvie", description="Taux de survie en %")
    destination: str = Field(..., max_length=100, description="Destination des poissons")
    population_id: Optional[int] = Field(None, alias="populationId", description="ID de la population récoltée")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

class RecolteCreate(RecolteBase):
    pass

class RecolteUpdate(BaseModel):
    nombre_poissons: Optional[int] = Field(None, gt=0, alias="nombrePoissons")
    poids_total: Optional[float] = Field(None, gt=0, alias="poidsTotal")
    poids_moyen: Optional[float] = Field(None, gt=0, alias="poidsMoyen")
    taux_survie: Optional[float] = Field(None, ge=0, le=100, alias="tauxSurvie")
    destination: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class RecolteResponse(RecolteBase):
    id: int

    @computed_field
    @property
    def rendement_kg_m2(self) -> Optional[float]:
        """Calcule le rendement en kg/m² si la superficie du bassin est disponible."""
        # Cette propriété sera calculée côté service avec les données du bassin
        return None

    class Config:
        from_attributes = True
        populate_by_name = True

# Modèles pour le suivi journalier
class SuiviPopulationJournalierBase(BaseModel):
    date_suivi: date = Field(default_factory=date.today, alias="dateSuivi", description="Date du suivi")
    bassin_id: int = Field(..., alias="bassinId", description="ID du bassin")
    poisson_id: Optional[int] = Field(None, alias="poissonId", description="ID du poisson individuel")
    population_id: Optional[int] = Field(None, alias="populationId", description="ID de la population")
    nombre_poissons: int = Field(..., gt=0, alias="nombrePoissons", description="Nombre de poissons à cette date")
    nombre_morts: int = Field(0, ge=0, alias="nombreMorts", description="Nombre de poissons morts")
    poids_moyen: Optional[float] = Field(None, gt=0, alias="poidsMoyen", description="Poids moyen en g")
    taille_moyenne: Optional[float] = Field(None, gt=0, alias="tailleMoyenne", description="Taille moyenne en cm")
    quantite_nourriture: Optional[float] = Field(None, ge=0, alias="quantiteNourriture", description="Quantité de nourriture en g")
    comportement: Optional[str] = Field(None, max_length=200, description="Comportement observé")
    observations: Optional[str] = Field(None, description="Observations complémentaires")

class SuiviPopulationJournalierCreate(SuiviPopulationJournalierBase):
    pass

class SuiviPopulationJournalierResponse(SuiviPopulationJournalierBase):
    id: int

    @computed_field
    @property
    def taux_mortalite(self) -> Optional[float]:
        """Calcule le taux de mortalité si les données sont disponibles."""
        if self.population_id and self.nombre_poissons > 0:
            return (self.nombre_morts / (self.nombre_poissons + self.nombre_morts)) * 100
        return None

    class Config:
        from_attributes = True
        populate_by_name = True

# Modèles pour les contrôles d'eau (améliorés)
class ControleEauCreate(BaseModel):
    bassin_id: int = Field(..., alias="bassinId", description="ID du bassin concerné")
    temperature: float = Field(..., gt=0, description="Température en °C")
    ph: float = Field(..., gt=0, le=14, description="pH de l'eau")
    oxygene_dissous: float = Field(..., gt=0, alias="oxygeneDissous", description="Oxygène dissous en mg/L")
    ammoniac: float = Field(0.0, ge=0, description="Taux d'ammoniac en mg/L")
    nitrites: float = Field(0.0, ge=0, description="Taux de nitrites en mg/L")
    nitrates: float = Field(0.0, ge=0, description="Taux de nitrates en mg/L")
    salinite: Optional[float] = Field(None, ge=0, description="Salinité en ppt")
    turbidite: Optional[float] = Field(None, ge=0, description="Turbidité en NTU")
    notes: Optional[str] = Field(None, description="Observations complémentaires")

    @field_validator('ph')
    @classmethod
    def validate_ph(cls, v):
        if v < 6.0 or v > 9.0:
            raise ValueError("Le pH doit être compris entre 6.0 et 9.0 pour la plupart des espèces")
        return v

    @field_validator('temperature')
    @classmethod
    def validate_temperature(cls, v):
        if v < 15 or v > 35:
            raise ValueError("La température doit être comprise entre 15°C et 35°C")
        return v

class ControleEauResponse(ControleEauCreate):
    id: int
    date_controle: datetime = Field(..., alias="dateControle")
    qualite_eau: Optional[QualiteEauEnum] = Field(None, alias="qualiteEau")

    @computed_field
    @property
    def parametres_critiques(self) -> List[str]:
        """Identifie les paramètres en situation critique."""
        critiques = []
        if self.ph < 6.5 or self.ph > 8.5:
            critiques.append("pH")
        if self.oxygene_dissous < 5.0:
            critiques.append("oxygène dissous")
        if self.ammoniac > 0.5:
            critiques.append("ammoniac")
        if self.nitrites > 0.3:
            critiques.append("nitrites")
        if self.temperature < 20 or self.temperature > 30:
            critiques.append("température")
        return critiques

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

# Modèles pour analyses et statistiques
class StatistiquesBassin(BaseModel):
    bassin_id: int = Field(..., alias="bassinId")
    periode_debut: date = Field(..., alias="periodeDebut")
    periode_fin: date = Field(..., alias="periodeFin")
    
    # Statistiques générales
    nombre_total_poissons: int = Field(..., alias="nombreTotalPoissons")
    biomasse_totale_kg: float = Field(..., alias="biomasseTotaleKg")
    densite_kg_m2: float = Field(..., alias="densiteKgM2")
    taux_occupation_moyen: float = Field(..., alias="tauxOccupationMoyen")
    
    # Statistiques de reproduction
    nombre_pontes: int = Field(..., alias="nombrePontes")
    taux_eclosion_moyen: Optional[float] = Field(None, alias="tauxEclosionMoyen")
    production_alevins: int = Field(..., alias="productionAlevins")
    
    # Statistiques de récolte
    nombre_recoltes: int = Field(..., alias="nombreRecoltes")
    poids_total_recolte: float = Field(..., alias="poidsTotalRecolte")
    taux_survie_moyen: float = Field(..., alias="tauxSurvieMoyen")
    
    # Qualité de l'eau
    temperature_moyenne: Optional[float] = Field(None, alias="temperatureMoyenne")
    ph_moyen: Optional[float] = Field(None, alias="phMoyen")
    oxygene_moyen: Optional[float] = Field(None, alias="oxygeneMoyen")
    nombre_controles_critiques: int = Field(..., alias="nombreControlesCritiques")

    class Config:
        allow_population_by_field_name = True

# Modèles pour prédictions améliorées
class PredictionCroissanceInput(BaseModel):
    temperature: float = Field(..., gt=0, description="Température en °C")
    ph: float = Field(..., gt=0, le=14, description="pH de l'eau")
    oxygene_dissous: float = Field(..., gt=0, alias="oxygeneDissous", description="Oxygène dissous en mg/L")
    ammoniac: float = Field(..., ge=0, description="Taux d'ammoniac en mg/L")
    nitrites: float = Field(..., ge=0, description="Taux de nitrites en mg/L")
    nitrates: float = Field(..., ge=0, description="Taux de nitrates en mg/L")
    salinite: Optional[float] = Field(None, ge=0, description="Salinité en ppt")
    turbidite: Optional[float] = Field(None, ge=0, description="Turbidité en NTU")
    densite_poissons: Optional[float] = Field(None, gt=0, alias="densitePoissons", description="Densité de poissons")
    espece: EspecePoissonEnum = Field(..., description="Espèce de poisson")
    stade_developpement: StadePoisson = Field(..., alias="stadeDeveloppement", description="Stade de développement")
    phase_elevage: Optional[PhaseElevage] = Field(None, alias="phaseElevage", description="Phase d'élevage")

    class Config:
        allow_population_by_field_name = True

class PredictionCroissanceOutput(BaseModel):
    taux_croissance: float = Field(..., ge=-100, alias="tauxCroissance", description="Taux de croissance prédit en %")
    confiance: float = Field(..., ge=0, le=100, description="Niveau de confiance de la prédiction")
    facteurs_influence: Dict[str, float] = Field(..., alias="facteursInfluence", description="Impact des différents facteurs")
    recommandations: List[str] = Field([], description="Recommandations pour optimiser la croissance")
    duree_prevue_jours: Optional[int] = Field(None, alias="dureePrevueJours", description="Durée prévue pour atteindre le stade suivant")

    class Config:
        allow_population_by_field_name = True

# Modèles pour alertes améliorées
class AlertePiscicole(BaseModel):
    type: Literal["qualite_eau", "mortalite", "reproduction", "croissance", "maladie", "equipement"] = Field(..., description="Type d'alerte")
    severite: Literal["info", "warning", "critical", "emergency"] = Field(..., description="Niveau de sévérité")
    titre: str = Field(..., max_length=200, description="Titre de l'alerte")
    description: str = Field(..., description="Description détaillée")
    bassin_id: Optional[int] = Field(None, alias="bassinId", description="ID du bassin concerné")
    date_detection: datetime = Field(..., alias="dateDetection", description="Date de détection")
    date_resolution: Optional[datetime] = Field(None, alias="dateResolution", description="Date de résolution")
    recommandations: List[str] = Field([], description="Liste de recommandations")
    parametres_concernes: List[str] = Field([], alias="parametresConcernes", description="Paramètres concernés")
    actions_requises: List[str] = Field([], alias="actionsRequises", description="Actions requises")
    urgence_heures: Optional[int] = Field(None, alias="urgenceHeures", description="Délai d'intervention en heures")

    class Config:
        allow_population_by_field_name = True

# Modèles pour rapports de production améliorés
class RapportProduction(BaseModel):
    periode_debut: date = Field(..., alias="periodeDebut", description="Date de début de période")
    periode_fin: date = Field(..., alias="periodeFin", description="Date de fin de période")
    bassin_id: Optional[int] = Field(None, alias="bassinId", description="ID du bassin")
    espece: Optional[EspecePoissonEnum] = Field(None, description="Espèce de poisson")
    
    # Production
    total_poissons_produits: int = Field(..., alias="totalPoissonsProduits", description="Nombre total de poissons produits")
    poids_total: float = Field(..., alias="poidsTotal", description="Poids total en kg")
    taux_survie_moyen: float = Field(..., alias="tauxSurvieMoyen", description="Taux de survie moyen en %")
    rendement_kg_m2: float = Field(..., alias="rendementKgM2", description="Rendement en kg/m²")
    
    # Reproduction
    nombre_pontes_periode: int = Field(..., alias="nombrePontesPeriode", description="Nombre de pontes sur la période")
    production_alevins: int = Field(..., alias="productionAlevins", description="Production d'alevins")
    taux_eclosion_moyen: Optional[float] = Field(None, alias="tauxEclosionMoyen", description="Taux d'éclosion moyen")
    
    # Économique
    consommation_aliment: Optional[float] = Field(None, alias="consommationAliment", description="Consommation d'aliment en kg")
    couts_production: Optional[float] = Field(None, alias="coutsProduction", description="Coûts de production")
    revenus: Optional[float] = Field(None, description="Revenus générés")
    marge_beneficiaire: Optional[float] = Field(None, alias="margeBeneficiaire", description="Marge bénéficiaire en %")
    
    # Indicateurs de performance
    indice_conversion_alimentaire: Optional[float] = Field(None, alias="indiceConversionAlimentaire", description="Indice de conversion alimentaire")
    taux_croissance_moyen: Optional[float] = Field(None, alias="tauxCroissanceMoyen", description="Taux de croissance moyen")

    class Config:
        allow_population_by_field_name = True

# Résolution des références circulaires
BassinResponse.model_rebuild()
ControleEauResponse.model_rebuild()
RecolteResponse.model_rebuild()
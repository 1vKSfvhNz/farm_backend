from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Union
from datetime import date, datetime
from enums import QualiteEauEnum
from enums.elevage.piscicole import (
    TypeMilieuPiscicoleEnum,
    TypeHabitatPiscicoleEnum,
    EspecePoissonEnum,
    TypeAlimentPoissonEnum,
    ComportementPoisson,
    PhaseElevage,
    CauseMortalite,
)

# Modèles de base
class PoissonBase(BaseModel):
    espece: EspecePoissonEnum = Field(..., description="Espèce de poisson")
    date_ensemencement: date = Field(..., alias="dateEnsemencement", description="Date d'introduction dans le bassin")
    poids_ensemencement: float = Field(..., gt=0, alias="poidsEnsemencement", description="Poids initial en grammes")
    taille_ensemencement: float = Field(..., gt=0, alias="tailleEnsemencement", description="Taille initiale en cm")

# Modèles détaillés avec relations
class ControleEauCreate(BaseModel):
    bassin_id: int = Field(..., alias="bassinId", description="ID du bassin concerné")
    temperature: float = Field(..., gt=0, description="Température en °C")
    ph: float = Field(..., gt=0, le=14, description="pH de l'eau")
    oxygene_dissous: float = Field(..., gt=0, alias="oxygeneDissous", description="Oxygène dissous en mg/L")
    ammoniac: float = Field(0.0, ge=0, description="Taux d'ammoniac en mg/L")
    nitrites: float = Field(0.0, ge=0, description="Taux de nitrites en mg/L")
    nitrates: float = Field(0.0, ge=0, description="Taux de nitrates en mg/L")
    notes: Optional[str] = Field(None, description="Observations complémentaires")

    @field_validator('ph')
    def validate_ph(cls, v):
        if v < 6.5 or v > 8.5:
            raise ValueError("Le pH doit être compris entre 6.5 et 8.5 pour la plupart des espèces")
        return v

class ControleEauResponse(ControleEauCreate):
    id: int
    date_controle: datetime = Field(..., alias="dateControle")
    qualite_eau: Optional[QualiteEauEnum] = Field(None, alias="qualiteEau")
    salinite: Optional[float] = Field(None, ge=0, description="Salinité en ppt")
    turbidite: Optional[float] = Field(None, ge=0, alias="turbidite", description="Turbidité en NTU")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class RecolteCreate(BaseModel):
    bassin_id: int = Field(..., alias="bassinId", description="ID du bassin récolté")
    date_recolte: date = Field(..., alias="dateRecolte", description="Date de la récolte")
    nombre_poissons: int = Field(..., gt=0, alias="nombrePoissons", description="Nombre de poissons récoltés")
    poids_total: float = Field(..., gt=0, alias="poidsTotal", description="Poids total en kg")
    destination: str = Field(..., max_length=100, description="Destination des poissons")

class RecolteResponse(RecolteCreate):
    id: int
    poids_moyen: float = Field(..., gt=0, alias="poidsMoyen", description="Poids moyen en grammes")
    taux_survie: float = Field(..., ge=0, le=100, alias="tauxSurvie", description="Taux de survie en pourcentage")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class BassinBase(BaseModel):
    nom: str = Field(..., max_length=100, description="Nom du bassin")
    type_milieu: TypeMilieuPiscicoleEnum = Field(..., alias="typeMilieu", description="Type de milieu aquatique")
    type_habitat: TypeHabitatPiscicoleEnum = Field(..., alias="typeHabitat", description="Type d'élevage piscicole")
    volume: float = Field(..., gt=0, description="Volume du bassin en m³")
    superficie: float = Field(..., gt=0, description="Superficie du bassin en m²")
    profondeur_moyenne: float = Field(..., gt=0, alias="profondeurMoyenne", description="Profondeur moyenne en mètres")

class BassinCreate(BassinBase):
    capacite_max: Optional[int] = Field(None, alias="capaciteMax", description="Capacité maximale en nombre de poissons")
    date_mise_en_service: Optional[date] = Field(None, alias="dateMiseEnService")
    systeme_filtration: Optional[str] = Field(None, alias="systemeFiltration")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class BassinResponse(BassinBase):
    id: int
    capacite_max: Optional[int] = Field(None, alias="capaciteMax", description="Capacité maximale en nombre de poissons")
    date_mise_en_service: Optional[date] = Field(None, alias="dateMiseEnService")
    systeme_filtration: Optional[str] = Field(None, alias="systemeFiltration")
    systeme_aeration: Optional[str] = Field(None, alias="systemeAeration")
    notes: Optional[str] = Field(None, description="Notes complémentaires")
    poissons: List["PoissonResponse"] = []
    controles_eau: List[ControleEauResponse] = []
    recoltes: List[RecolteResponse] = []

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class PoissonResponse(PoissonBase):
    id: int
    origine: Optional[str] = Field(None, max_length=100, description="Origine du poisson")
    alimentation_type: Optional[TypeAlimentPoissonEnum] = Field(None, alias="alimentationType", description="Type d'alimentation")
    bassin_id: Optional[int] = Field(None, alias="bassinId", description="ID du bassin")
    comportement: Optional[ComportementPoisson] = Field(None, description="Comportement observé")
    statut: Optional[str] = Field(None, description="Statut actuel du poisson")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

# Modèles pour analyses et alertes
class AnalyseQualiteEau(BaseModel):
    parametre: str = Field(..., description="Paramètre analysé")
    valeur: float = Field(..., description="Valeur mesurée")
    seuil_min: Optional[float] = Field(None, alias="seuilMin", description="Seuil minimum recommandé")
    seuil_max: Optional[float] = Field(None, alias="seuilMax", description="Seuil maximum recommandé")
    statut: str = Field(..., description="Statut (optimal, critique, etc.)")

    class Config:
        allow_population_by_field_name = True

class AlertePiscicole(BaseModel):
    type: str = Field(..., description="Type d'alerte")
    severite: str = Field(..., description="Niveau de sévérité")
    titre: str = Field(..., max_length=200, description="Titre de l'alerte")
    description: str = Field(..., description="Description détaillée")
    bassin_id: Optional[int] = Field(None, alias="bassinId", description="ID du bassin concerné")
    date_detection: datetime = Field(..., alias="dateDetection", description="Date de détection")
    recommandations: List[str] = Field([], description="Liste de recommandations")
    parametres_concernes: List[str] = Field([], alias="parametresConcernes", description="Paramètres concernés")

    class Config:
        allow_population_by_field_name = True

# Modèles pour prédictions
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
    phase_elevage: Optional[PhaseElevage] = Field(None, alias="phaseElevage", description="Phase d'élevage")

    class Config:
        allow_population_by_field_name = True

class PredictionCroissanceOutput(BaseModel):
    taux_croissance: float = Field(..., ge=-100, alias="tauxCroissance", description="Taux de croissance prédit en %")
    confiance: float = Field(..., ge=0, le=100, description="Niveau de confiance de la prédiction")
    facteurs_influence: Dict[str, float] = Field(..., alias="facteursInfluence", description="Impact des différents facteurs")

    class Config:
        allow_population_by_field_name = True

# Modèles pour rapports
class RapportProduction(BaseModel):
    periode_debut: date = Field(..., alias="periodeDebut", description="Date de début de période")
    periode_fin: date = Field(..., alias="periodeFin", description="Date de fin de période")
    bassin_id: Optional[int] = Field(None, alias="bassinId", description="ID du bassin")
    espece: Optional[EspecePoissonEnum] = Field(None, description="Espèce de poisson")
    total_poissons_produits: int = Field(..., alias="totalPoissonsProduits", description="Nombre total de poissons produits")
    poids_total: float = Field(..., alias="poidsTotal", description="Poids total en kg")
    taux_survie_moyen: float = Field(..., alias="tauxSurvieMoyen", description="Taux de survie moyen en %")
    consommation_aliment: Optional[float] = Field(None, alias="consommationAliment", description="Consommation d'aliment en kg")
    couts_production: Optional[float] = Field(None, alias="coutsProduction", description="Coûts de production")
    revenus: Optional[float] = Field(None, description="Revenus générés")

    class Config:
        allow_population_by_field_name = True

# Modèles pour les opérations batch
class OperationBatch(BaseModel):
    type_operation: str = Field(..., alias="typeOperation", description="Type d'opération (alimentation, traitement, etc.)")
    bassin_id: int = Field(..., alias="bassinId", description="ID du bassin")
    date_operation: date = Field(..., alias="dateOperation", description="Date de l'opération")
    details: Dict[str, Union[str, float, int]] = Field(..., description="Détails de l'opération")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

    class Config:
        allow_population_by_field_name = True

# Résolution des références circulaires
BassinResponse.model_rebuild()
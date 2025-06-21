from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Union
from datetime import date, datetime
from enums import QualiteEauEnum
from enums.elevage.piscicole import (
    TypeMilieuPiscicoleEnum,
    TypeElevagePiscicoleEnum,
    EspecePoissonEnum,
    TypeAlimentPoissonEnum,
    ComportementPoisson,
    PhaseElevage,
    CauseMortalite,
)

# Modèles de base
class BassinBase(BaseModel):
    nom: str = Field(..., max_length=100, description="Nom du bassin")
    type_milieu: TypeMilieuPiscicoleEnum = Field(..., description="Type de milieu aquatique")
    type_elevage: TypeElevagePiscicoleEnum = Field(..., description="Type d'élevage piscicole")
    volume: float = Field(..., gt=0, description="Volume du bassin en m³")
    superficie: float = Field(..., gt=0, description="Superficie du bassin en m²")
    profondeur_moyenne: float = Field(..., gt=0, description="Profondeur moyenne en mètres")

class PoissonBase(BaseModel):
    espece: EspecePoissonEnum = Field(..., description="Espèce de poisson")
    date_ensemencement: date = Field(..., description="Date d'introduction dans le bassin")
    poids_ensemencement: float = Field(..., gt=0, description="Poids initial en grammes")
    taille_ensemencement: float = Field(..., gt=0, description="Taille initiale en cm")

# Modèles détaillés avec relations
class ControleEauCreate(BaseModel):
    bassin_id: int = Field(..., description="ID du bassin concerné")
    temperature: float = Field(..., gt=0, description="Température en °C")
    ph: float = Field(..., gt=0, le=14, description="pH de l'eau")
    oxygene_dissous: float = Field(..., gt=0, description="Oxygène dissous en mg/L")
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
    date_controle: datetime
    qualite_eau: Optional[QualiteEauEnum]
    salinite: Optional[float] = Field(None, ge=0, description="Salinité en ppt")
    turbidite: Optional[float] = Field(None, ge=0, description="Turbidité en NTU")

    class Config:
        orm_mode = True

class RecolteCreate(BaseModel):
    bassin_id: int = Field(..., description="ID du bassin récolté")
    date_recolte: date = Field(..., description="Date de la récolte")
    nombre_poissons: int = Field(..., gt=0, description="Nombre de poissons récoltés")
    poids_total: float = Field(..., gt=0, description="Poids total en kg")
    destination: str = Field(..., max_length=100, description="Destination des poissons")

class RecolteResponse(RecolteCreate):
    id: int
    poids_moyen: float = Field(..., gt=0, description="Poids moyen en grammes")
    taux_survie: float = Field(..., ge=0, le=100, description="Taux de survie en pourcentage")
    notes: Optional[str]

    class Config:
        orm_mode = True

class BassinResponse(BassinBase):
    id: int
    capacite_max: Optional[int] = Field(None, description="Capacité maximale en nombre de poissons")
    date_mise_en_service: Optional[date]
    systeme_filtration: Optional[str]
    systeme_aeration: Optional[str]
    notes: Optional[str]
    poissons: List["PoissonResponse"] = []
    controles_eau: List[ControleEauResponse] = []
    recoltes: List[RecolteResponse] = []

    class Config:
        orm_mode = True

class PoissonResponse(PoissonBase):
    id: int
    origine: Optional[str] = Field(None, max_length=100)
    alimentation_type: Optional[TypeAlimentPoissonEnum]
    bassin_id: Optional[int]
    comportement: Optional[ComportementPoisson] = Field(None, description="Comportement observé")
    statut: Optional[str] = Field(None, description="Statut actuel du poisson")

    class Config:
        orm_mode = True

# Modèles pour analyses et alertes
class AnalyseQualiteEau(BaseModel):
    parametre: str = Field(..., description="Paramètre analysé")
    valeur: float = Field(..., description="Valeur mesurée")
    seuil_min: Optional[float] = Field(None, description="Seuil minimum recommandé")
    seuil_max: Optional[float] = Field(None, description="Seuil maximum recommandé")
    statut: str = Field(..., description="Statut (optimal, critique, etc.)")

class AlertePiscicole(BaseModel):
    type: str = Field(..., description="Type d'alerte")
    severite: str = Field(..., description="Niveau de sévérité")
    titre: str = Field(..., max_length=200)
    description: str
    bassin_id: Optional[int]
    date_detection: datetime
    recommandations: List[str] = []
    parametres_concernes: List[str] = []

# Modèles pour prédictions
class PredictionCroissanceInput(BaseModel):
    temperature: float = Field(..., gt=0)
    ph: float = Field(..., gt=0, le=14)
    oxygene_dissous: float = Field(..., gt=0)
    ammoniac: float = Field(..., ge=0)
    nitrites: float = Field(..., ge=0)
    nitrates: float = Field(..., ge=0)
    salinite: Optional[float] = Field(None, ge=0)
    turbidite: Optional[float] = Field(None, ge=0)
    densite_poissons: Optional[float] = Field(None, gt=0)
    phase_elevage: Optional[PhaseElevage] = None

class PredictionCroissanceOutput(BaseModel):
    taux_croissance: float = Field(..., ge=-100, description="Taux de croissance prédit en %")
    confiance: float = Field(..., ge=0, le=100, description="Niveau de confiance de la prédiction")
    facteurs_influence: Dict[str, float] = Field(..., description="Impact des différents facteurs")

# Modèles pour rapports
class RapportProduction(BaseModel):
    periode_debut: date
    periode_fin: date
    bassin_id: Optional[int]
    espece: Optional[EspecePoissonEnum]
    total_poissons_produits: int
    poids_total: float
    taux_survie_moyen: float
    consommation_aliment: Optional[float]
    couts_production: Optional[float]
    revenus: Optional[float]

# Modèles pour les opérations batch
class OperationBatch(BaseModel):
    type_operation: str = Field(..., description="Type d'opération (alimentation, traitement, etc.)")
    bassin_id: int
    date_operation: date
    details: Dict[str, Union[str, float, int]]
    notes: Optional[str]

# Résolution des références circulaires
BassinResponse.model_rebuild()
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Tuple
from datetime import date, datetime
from enums import AlertSeverity, SexeEnum
from enums.elevage import AlerteType, StatutAnimalEnum, TypeTraitementEnum

class AnimalNumberResponse(BaseModel):
    numero_identification: str

class RaceBase(BaseModel):
    nom: str = Field(..., max_length=100, description="Nom de la race")
    description: Optional[str] = Field(None, description="Description de la race")
    origine: Optional[str] = Field(None, max_length=100, description="Origine géographique")
    type_elevage: str = Field(..., description="Type d'élevage concerné")
    caracteristiques: Optional[Dict[str, Any]] = Field(None, description="Caractéristiques spécifiques au format JSON")

class AnimalBase(BaseModel):
    numero_identification: str = Field(..., max_length=100, description="Numéro unique de l'animal")
    nom: Optional[str] = Field(None, max_length=100, description="Nom donné à l'animal")
    sexe: SexeEnum = Field(..., description="Sexe de l'animal")
    date_naissance: Optional[date] = Field(None, description="Date de naissance")
    race_id: int = Field(..., description="ID de la race")
    lot_id: Optional[int] = Field(None, description="ID du lot")
    statut: StatutAnimalEnum = Field(StatutAnimalEnum.EN_CROISSANCE, description="Statut courant de l'animal")
    date_mise_en_production: Optional[date] = Field(None, description="Date de mise en production")
    date_reforme: Optional[date] = Field(None, description="Date de réforme")
    date_deces: Optional[date] = Field(None, description="Date de décès")
    cause_deces: Optional[str] = Field(None, max_length=200, description="Cause du décès")
    informations_specifiques: Optional[str] = Field(None, description="Informations spécifiques au format JSON")
    photo_url: Optional[str] = Field(None, max_length=255, description="URL de la photo de l'animal")

    class Config:
        orm_mode = True

class AnimalSearchCriteria(BaseModel):
    age_min: Optional[int] = Field(None, ge=0, description="Âge minimum en jours")
    age_max: Optional[int] = Field(None, ge=0, description="Âge maximum en jours")
    race_id: Optional[int] = Field(None, description="ID de la race")
    lot_id: Optional[int] = Field(None, description="ID du lot")
    date_naissance_min: Optional[date] = Field(None, description="Date de naissance minimale")
    date_naissance_max: Optional[date] = Field(None, description="Date de naissance maximale")
    statut: Optional[StatutAnimalEnum] = Field(None, description="Statut général de l'animal")
    sort_by: Optional[str] = Field(None, description="Champ de tri (ex: 'date_naissance', 'numero_identification')")
    sort_asc: Optional[bool] = Field(True, description="Tri ascendant (true) ou descendant (false)")

    class Config:
        orm_mode = True


class PerformanceTroupeauResponse(BaseModel):
    """Schéma de réponse pour les performances du troupeau"""
    date_debut: date
    date_fin: date
    production_moyenne: float
    taux_cellulaires_moyen: float
    distribution_production: Dict[str, float]
    alertes_actives: int
    
# ----------------------------
# Schémas Production Laitière
# ----------------------------

class ProductionLaitCreate(BaseModel):
    animal_id: int = Field(..., description="ID de l'animal")
    date_production: date = Field(..., description="Date de la production")
    quantite: float = Field(..., gt=0, description="Quantité en litres")
    duree_traite: Optional[int] = Field(None, description="Durée en secondes")
    debit_moyen: Optional[float] = Field(None, description="Débit moyen en litres/minute")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

class ProductionLaitResponse(ProductionLaitCreate):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class ControleLaitierCreate(BaseModel):
    animal_id: int
    date_controle: date
    production_jour: float = Field(..., gt=0, description="Production journalière en litres")
    taux_butyreux: float = Field(..., ge=0, le=100, description="Taux butyreux en %")
    taux_proteine: float = Field(..., ge=0, le=100, description="Taux protéique en %")
    cellules_somatiques: int = Field(..., ge=0, description="Cellules somatiques en cellules/ml")

class ControleLaitierResponse(ControleLaitierCreate):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# ----------------------------
# Schémas Santé et Alertes
# ----------------------------
class TraitementCreate(BaseModel):
    animal_id: int
    type_traitement: TypeTraitementEnum
    date_traitement: datetime
    produit: str = Field(..., max_length=100, description="Nom du produit utilisé")
    dosage: str = Field(..., max_length=50, description="Dosage administré")
    duree: Optional[int] = Field(None, description="Durée du traitement en jours")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

class TraitementResponse(TraitementCreate):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class AlerteBase(BaseModel):
    type: AlerteType
    severite: AlertSeverity
    message: str = Field(..., max_length=500)
    animal_id: Optional[int] = Field(None, description="ID de l'animal concerné")
    date_detection: datetime = Field(default_factory=datetime.now)
    suggestions: List[str] = Field(default_factory=list, description="Suggestions d'actions")

class AlerteResponse(AlerteBase):
    id: int
    
    class Config:
        orm_mode = True

# ----------------------------
# Schémas Statistiques
# ----------------------------

class StatsProductionLait(BaseModel):
    moyenne_journaliere: float
    evolution_7j: float
    meilleurs_animaux: List[Dict[str, Any]]
    parametres_qualite: Dict[str, float]

class StatsReproduction(BaseModel):
    taux_gestation: float
    intervalle_velage_moyen: float
    velages_30j: int
    difficultes_velage: Dict[str, int]

class SearchQuery(BaseModel):
    """Schéma pour les requêtes de recherche"""
    query: Optional[str] = Field(None, min_length=2, max_length=100)
    statut: Optional[StatutAnimalEnum]
    sexe: Optional[SexeEnum]
    date_debut: Optional[date]
    date_fin: Optional[date]

# ----------------------------
# Schémas Analyse et Prédiction
# ----------------------------

class AnalyseProductionRequest(BaseModel):
    """Schéma pour l'analyse de production"""
    date_debut: date = Field(..., description="Date de début d'analyse")
    date_fin: date = Field(..., description="Date de fin d'analyse")
    seuil_alerte_cellules: Optional[int] = Field(
        500000, description="Seuil pour les alertes de cellules somatiques"
    )
    analyse_individuelle: bool = Field(
        False, description="Inclure l'analyse individuelle des animaux"
    )

class PredictionProductionRequest(BaseModel):
    """Schéma pour la prédiction de production"""
    animal_id: int = Field(..., description="ID du animal à analyser")
    horizon_jours: int = Field(
        7, ge=1, le=30, description="Nombre de jours pour la prédiction"
    )
    include_confidence: bool = Field(
        True, description="Inclure les intervalles de confiance"
    )

class PerformanceModel(BaseModel):
    r2: float = Field(..., ge=0, le=1, description="Score R² du modèle")
    mae: float = Field(..., ge=0, description="Erreur absolue moyenne")
    mse: float = Field(..., ge=0, description="Erreur quadratique moyenne")
    cv_score: Optional[float] = Field(None, description="Score de validation croisée")

class PredictionRequest(BaseModel):
    animal_id: int
    parametres: Optional[Dict[str, Any]] = Field(None, description="Paramètres supplémentaires")

class PredictionResponse(BaseModel):
    prediction: float = Field(..., description="Valeur prédite")
    intervalle_confiance: Optional[Tuple[float, float]] = Field(None, description="Intervalle de confiance à 95%")
    date_prediction: datetime = Field(default_factory=datetime.now)

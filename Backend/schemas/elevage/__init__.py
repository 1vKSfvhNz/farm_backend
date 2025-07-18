from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Tuple
from datetime import date, datetime
from enums import AlertSeverity, SexeEnum
from enums.elevage import AlerteType, StatutAnimalEnum, TypeTraitementEnum, TypeElevage

class AnimalNumberResponse(BaseModel):
    numero_id: str = Field(..., alias="numeroId")

class RaceBase(BaseModel):
    nom: str = Field(..., max_length=100, description="Nom de la race")
    description: Optional[str] = Field(None, description="Description de la race")
    origine: Optional[str] = Field(None, max_length=100, description="Origine géographique")
    type_elevage: str = Field(..., alias="typeElevage", description="Type d'élevage concerné")
    caracteristiques: Optional[Dict[str, Any]] = Field(None, alias="caracteristiques", description="Caractéristiques spécifiques au format JSON")

    class Config:
        allow_population_by_field_name = True

class AnimalBase(BaseModel):
    numero_id: str = Field(..., max_length=100, alias="numeroId", description="Numéro unique de l'animal")
    nom: Optional[str] = Field(None, max_length=100, description="Nom donné à l'animal")
    sexe: SexeEnum = Field(..., description="Sexe de l'animal")
    date_naissance: Optional[date] = Field(None, alias="dateNaissance", description="Date de naissance")
    race_id: int = Field(..., alias="raceId", description="ID de la race")
    lot_id: Optional[int] = Field(None, alias="lotId", description="ID du lot")
    statut: StatutAnimalEnum = Field(StatutAnimalEnum.EN_CROISSANCE, description="Statut courant de l'animal")
    date_mise_en_production: Optional[date] = Field(None, alias="dateMiseEnProduction", description="Date de mise en production")
    date_reforme: Optional[date] = Field(None, alias="dateReforme", description="Date de réforme")
    date_deces: Optional[date] = Field(None, alias="dateDeces", description="Date de décès")
    cause_deces: Optional[str] = Field(None, max_length=200, alias="causeDeces", description="Cause du décès")
    informations_specifiques: Optional[str] = Field(None, alias="informationsSpecifiques", description="Informations spécifiques au format JSON")
    photo_url: Optional[str] = Field(None, max_length=255, alias="photoUrl", description="URL de la photo de l'animal")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class BatimentBase(BaseModel):
    nom: str = Field(..., max_length=100)
    type_elevage: TypeElevage = Field(None, alias="typeElevage")
    type_batiment: Optional[str] = Field(None, max_length=100, alias="typeBatiment")
    capacite: Optional[int] = Field(None, gt=0)
    superficie: Optional[float] = Field(None, gt=0, description="Superficie en m²")
    ventilation: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None)

    class Config:
        allow_population_by_field_name = True

class BatimentCreate(BatimentBase):
    pass

class BatimentResponse(BatimentBase):
    id: int
    created_at: datetime = Field(None, alias="createdAt")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v is not None else None
        }
        allow_population_by_field_name = True

class AnimalSearchCriteria(BaseModel):
    age_min: Optional[int] = Field(None, ge=0, alias="ageMin", description="Âge minimum en jours")
    age_max: Optional[int] = Field(None, ge=0, alias="ageMax", description="Âge maximum en jours")
    race_id: Optional[int] = Field(None, alias="raceId", description="ID de la race")
    lot_id: Optional[int] = Field(None, alias="lotId", description="ID du lot")
    date_naissance_min: Optional[date] = Field(None, alias="dateNaissanceMin", description="Date de naissance minimale")
    date_naissance_max: Optional[date] = Field(None, alias="dateNaissanceMax", description="Date de naissance maximale")
    statut: Optional[StatutAnimalEnum] = Field(None, description="Statut général de l'animal")
    sort_by: Optional[str] = Field(None, alias="sortBy", description="Champ de tri (ex: 'date_naissance', 'numero_id')")
    sort_asc: Optional[bool] = Field(True, alias="sortAsc", description="Tri ascendant (true) ou descendant (false)")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class PerformanceTroupeauResponse(BaseModel):
    date_debut: date = Field(..., alias="dateDebut")
    date_fin: date = Field(..., alias="dateFin")
    production_moyenne: float = Field(..., alias="productionMoyenne")
    taux_cellulaires_moyen: float = Field(..., alias="tauxCellulairesMoyen")
    distribution_production: Dict[str, float] = Field(..., alias="distributionProduction")
    alertes_actives: int = Field(..., alias="alertesActives")

    class Config:
        allow_population_by_field_name = True

class ProductionLaitCreate(BaseModel):
    animal_id: int = Field(..., alias="animalId", description="ID de l'animal")
    date_production: date = Field(..., alias="dateProduction", description="Date de la production")
    quantite: float = Field(..., gt=0, description="Quantité en litres")
    duree_traite: Optional[int] = Field(None, alias="dureeTraite", description="Durée en secondes")
    debit_moyen: Optional[float] = Field(None, alias="debitMoyen", description="Débit moyen en litres/minute")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

    class Config:
        allow_population_by_field_name = True

class ProductionLaitResponse(ProductionLaitCreate):
    id: int
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class ControleLaitierCreate(BaseModel):
    animal_id: int = Field(..., alias="animalId")
    date_controle: date = Field(..., alias="dateControle")
    production_jour: float = Field(..., gt=0, alias="productionJour", description="Production journalière en litres")
    taux_butyreux: float = Field(..., ge=0, le=100, alias="tauxButyreux", description="Taux butyreux en %")
    taux_proteine: float = Field(..., ge=0, le=100, alias="tauxProteine", description="Taux protéique en %")
    cellules_somatiques: int = Field(..., ge=0, alias="cellulesSomatiques", description="Cellules somatiques en cellules/ml")

    class Config:
        allow_population_by_field_name = True

class ControleLaitierResponse(ControleLaitierCreate):
    id: int
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class TraitementCreate(BaseModel):
    animal_id: int = Field(..., alias="animalId")
    type_traitement: TypeTraitementEnum = Field(..., alias="typeTraitement")
    date_traitement: datetime = Field(..., alias="dateTraitement")
    produit: str = Field(..., max_length=100, description="Nom du produit utilisé")
    dosage: str = Field(..., max_length=50, description="Dosage administré")
    duree: Optional[int] = Field(None, description="Durée du traitement en jours")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

    class Config:
        allow_population_by_field_name = True

class TraitementResponse(TraitementCreate):
    id: int
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class AlerteBase(BaseModel):
    type: AlerteType
    severite: AlertSeverity = Field(..., alias="severite")
    message: str = Field(..., max_length=500)
    animal_id: Optional[int] = Field(None, alias="animalId", description="ID de l'animal concerné")
    date_detection: datetime = Field(default_factory=datetime.now, alias="dateDetection")
    suggestions: List[str] = Field(default_factory=list, description="Suggestions d'actions")

    class Config:
        allow_population_by_field_name = True

class AlerteResponse(AlerteBase):
    id: int
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class StatsProductionLait(BaseModel):
    moyenne_journaliere: float = Field(..., alias="moyenneJournaliere")
    evolution_7j: float = Field(..., alias="evolution7j")
    meilleurs_animaux: List[Dict[str, Any]] = Field(..., alias="meilleursAnimaux")
    parametres_qualite: Dict[str, float] = Field(..., alias="parametresQualite")

    class Config:
        allow_population_by_field_name = True

class StatsReproduction(BaseModel):
    taux_gestation: float = Field(..., alias="tauxGestation")
    intervalle_velage_moyen: float = Field(..., alias="intervalleVelageMoyen")
    velages_30j: int = Field(..., alias="velages30j")
    difficultes_velage: Dict[str, int] = Field(..., alias="difficultesVelage")

    class Config:
        allow_population_by_field_name = True

class SearchQuery(BaseModel):
    query: Optional[str] = Field(None, min_length=2, max_length=100)
    statut: Optional[StatutAnimalEnum]
    sexe: Optional[SexeEnum]
    date_debut: Optional[date] = Field(None, alias="dateDebut")
    date_fin: Optional[date] = Field(None, alias="dateFin")

    class Config:
        allow_population_by_field_name = True

class AnalyseProductionRequest(BaseModel):
    date_debut: date = Field(..., alias="dateDebut", description="Date de début d'analyse")
    date_fin: date = Field(..., alias="dateFin", description="Date de fin d'analyse")
    seuil_alerte_cellules: Optional[int] = Field(
        500000, alias="seuilAlerteCellules", description="Seuil pour les alertes de cellules somatiques"
    )
    analyse_individuelle: bool = Field(
        False, alias="analyseIndividuelle", description="Inclure l'analyse individuelle des animaux"
    )

    class Config:
        allow_population_by_field_name = True

class PredictionProductionRequest(BaseModel):
    animal_id: int = Field(..., alias="animalId", description="ID du animal à analyser")
    horizon_jours: int = Field(
        7, ge=1, le=30, alias="horizonJours", description="Nombre de jours pour la prédiction"
    )
    include_confidence: bool = Field(
        True, alias="includeConfidence", description="Inclure les intervalles de confiance"
    )

    class Config:
        allow_population_by_field_name = True

class PerformanceModel(BaseModel):
    r2: float = Field(..., ge=0, le=1, description="Score R² du modèle")
    mae: float = Field(..., ge=0, description="Erreur absolue moyenne")
    mse: float = Field(..., ge=0, description="Erreur quadratique moyenne")
    cv_score: Optional[float] = Field(None, alias="cvScore", description="Score de validation croisée")

    class Config:
        allow_population_by_field_name = True

class PredictionRequest(BaseModel):
    animal_id: int = Field(..., alias="animalId")
    parametres: Optional[Dict[str, Any]] = Field(None, alias="parametres", description="Paramètres supplémentaires")

    class Config:
        allow_population_by_field_name = True

class PredictionResponse(BaseModel):
    prediction: float = Field(..., description="Valeur prédite")
    intervalle_confiance: Optional[Tuple[float, float]] = Field(None, alias="intervalleConfiance", description="Intervalle de confiance à 95%")
    date_prediction: datetime = Field(default_factory=datetime.now, alias="datePrediction")

    class Config:
        allow_population_by_field_name = True

class AnimalStats(BaseModel):
    variant: TypeElevage
    count: int
    health: int
    production: int
    last_update: datetime = Field(..., alias="lastUpdate")
    is_new: Optional[bool] = Field(None, alias="isNew")
    is_urgent: Optional[bool] = Field(None, alias="isUrgent")

    class Config:
        allow_population_by_field_name = True

class GlobalStats(BaseModel):
    total_animals: int = Field(..., alias="totalAnimals")
    average_health: float = Field(..., alias="averageHealth")
    average_production: float = Field(..., alias="averageProduction") 
    last_sync: datetime = Field(..., alias="lastSync")

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        
class FarmData(BaseModel):
    animals: List[AnimalStats]
    global_stats: GlobalStats = Field(..., alias="globalStats")

    class Config:
        allow_population_by_field_name = True

# Rebuild models for circular references
BatimentResponse.model_rebuild()
from datetime import date, datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from enums import SexeEnum, AlertSeverity
from enums.elevage import StatutAnimalEnum
from enums.elevage.avicole import (
    TypeProductionAvicoleEnum,
    TypeVolailleEnum,
    SystemeElevageAvicoleEnum,
    TypeLogementAvicoleEnum
)
from schemas import PaginatedResponse

class VolailleBase(BaseModel):
    type_volaille: TypeVolailleEnum = Field(..., alias="typeVolaille")
    type_production: TypeProductionAvicoleEnum = Field(..., alias="typeProduction")
    systeme_elevage: Optional[SystemeElevageAvicoleEnum] = Field(None, alias="systemeElevage")
    souche: Optional[str] = Field(None, max_length=100)
    date_mise_en_place: Optional[date] = Field(None, alias="dateMiseEnPlace")
    date_reforme: Optional[date] = Field(None, alias="dateReforme")

class VolailleCreate(VolailleBase):
    numero_identification: str = Field(..., max_length=100, alias="numeroIdentification")
    sexe: SexeEnum
    date_naissance: Optional[date] = Field(None, alias="dateNaissance")
    race_id: int = Field(..., alias="raceId")
    lot_id: Optional[int] = Field(None, alias="lotId")
    mere_id: Optional[int] = Field(None, alias="mereId")
    pere_id: Optional[int] = Field(None, alias="pereId")

class VolailleUpdate(BaseModel):
    type_production: Optional[TypeProductionAvicoleEnum] = Field(None, alias="typeProduction")
    systeme_elevage: Optional[SystemeElevageAvicoleEnum] = Field(None, alias="systemeElevage")
    souche: Optional[str] = Field(None, max_length=100)
    date_reforme: Optional[date] = Field(None, alias="dateReforme")
    statut: Optional[StatutAnimalEnum]
    lot_id: Optional[int] = Field(None, alias="lotId")

class VolailleResponse(VolailleBase):
    id: int
    numero_identification: str = Field(..., alias="numeroIdentification")
    sexe: SexeEnum
    date_naissance: Optional[date] = Field(None, alias="dateNaissance")
    statut: StatutAnimalEnum
    race_id: int = Field(..., alias="raceId")
    lot_id: Optional[int] = Field(None, alias="lotId")
    mere_id: Optional[int] = Field(None, alias="mereId")
    pere_id: Optional[int] = Field(None, alias="pereId")
    created_at: datetime = Field(..., alias="createdAt")
    nombre_oeufs_cumules: Optional[int] = Field(None, alias="nombreOeufsCumules")
    poids_vif: Optional[float] = Field(None, alias="poidsVif")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class ControlePonteBase(BaseModel):
    lot_id: int = Field(..., alias="lotId")
    date_controle: date = Field(..., alias="dateControle")
    nombre_oeufs: Optional[int] = Field(None, alias="nombreOeufs")
    poids_moyen_oeuf: Optional[float] = Field(None, gt=0, alias="poidsMoyenOeuf", description="Poids moyen en grammes")
    taux_ponte: Optional[float] = Field(None, ge=0, le=100, alias="tauxPonte", description="Taux de ponte en pourcentage")
    taux_casses: Optional[float] = Field(None, ge=0, le=100, alias="tauxCasses", description="Taux d'œufs cassés en pourcentage")
    taux_sales: Optional[float] = Field(None, ge=0, le=100, alias="tauxSales", description="Taux d'œufs sales en pourcentage")
    notes: Optional[str]

class ControlePonteCreate(ControlePonteBase):
    pass

class ControlePonteUpdate(BaseModel):
    date_controle: Optional[date] = Field(None, alias="dateControle")
    nombre_oeufs: Optional[int] = Field(None, alias="nombreOeufs")
    poids_moyen_oeuf: Optional[float] = Field(None, gt=0, alias="poidsMoyenOeuf", description="Poids moyen en grammes")
    taux_ponte: Optional[float] = Field(None, ge=0, le=100, alias="tauxPonte", description="Taux de ponte en pourcentage")
    taux_casses: Optional[float] = Field(None, ge=0, le=100, alias="tauxCasses", description="Taux d'œufs cassés en pourcentage")
    taux_sales: Optional[float] = Field(None, ge=0, le=100, alias="tauxSales", description="Taux d'œufs sales en pourcentage")
    notes: Optional[str]

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        
class ControlePonteResponse(ControlePonteBase):
    id: int
    created_at: datetime = Field(..., alias="createdAt")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class PerformanceCroissanceBase(BaseModel):
    lot_id: int = Field(..., alias="lotId")
    date_controle: date = Field(..., alias="dateControle")
    poids_moyen: Optional[float] = Field(None, gt=0, alias="poidsMoyen", description="Poids moyen en grammes")
    gain_moyen_journalier: Optional[float] = Field(None, alias="gainMoyenJournalier", description="Gain moyen journalier en grammes/jour")
    consommation_aliment: Optional[float] = Field(None, gt=0, alias="consommationAliment", description="Consommation d'aliment en kg")
    indice_consommation: Optional[float] = Field(None, gt=0, alias="indiceConsommation", description="kg aliment/kg poids vif")
    taux_mortalite: Optional[float] = Field(None, ge=0, le=100, alias="tauxMortalite", description="Taux de mortalité en pourcentage")
    uniformite: Optional[float] = Field(None, ge=0, le=100, description="Uniformité du lot en pourcentage")
    notes: Optional[str]

class PerformanceCroissanceCreate(PerformanceCroissanceBase):
    pass

class PerformanceCroissanceResponse(PerformanceCroissanceBase):
    id: int
    created_at: datetime = Field(..., alias="createdAt")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class LotAvicoleBase(BaseModel):
    nom: str = Field(..., max_length=100)
    description: Optional[str]
    type_lot: Optional[str] = Field(None, max_length=50, alias="typeLot")
    batiment_id: Optional[int] = Field(..., gt=0, alias="batimentId")
    capacite_max: Optional[int] = Field(None, gt=0, alias="capaciteMax")
    responsable: Optional[str] = Field(None, max_length=200)
    type_logement: Optional[TypeLogementAvicoleEnum] = Field(None, alias="typeLogement")
    date_mise_en_place: Optional[date] = Field(None, alias="dateMiseEnPlace")
    souche: Optional[str] = Field(None, max_length=100)

class LotAvicoleCreate(LotAvicoleBase):
    pass

class LotAvicoleUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    description: Optional[str]
    batiment_id: Optional[int] = Field(None, gt=0, alias="batimentId")
    capacite_max: Optional[int] = Field(None, gt=0, alias="capaciteMax")
    responsable: Optional[str] = Field(None, max_length=200)
    type_logement: Optional[TypeLogementAvicoleEnum] = Field(None, alias="typeLogement")

class LotAvicoleResponse(LotAvicoleBase):
    id: int
    created_at: datetime = Field(..., alias="createdAt")
    nombre_volailles: int = Field(..., alias="nombreVolailles")
    type_production: Optional[TypeProductionAvicoleEnum] = Field(None, alias="typeProduction")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class StatisticPonte(BaseModel):
    moyenne_taux_ponte: float = Field(..., alias="moyenneTauxPonte")
    moyenne_oeufs_jour: float = Field(..., alias="moyenneOeufsJour")
    taux_casses_moyen: float = Field(..., alias="tauxCassesMoyen")
    taux_sales_moyen: float = Field(..., alias="tauxSalesMoyen")
    evolution: List[Dict[str, float]]  # Ex: [{"date": "2023-01-01", "taux_ponte": 75.5}]

class StatisticCroissance(BaseModel):
    poids_moyen: float = Field(..., alias="poidsMoyen")
    gain_journalier_moyen: float = Field(..., alias="gainJournalierMoyen")
    indice_consommation_moyen: float = Field(..., alias="indiceConsommationMoyen")
    taux_mortalite: float = Field(..., alias="tauxMortalite")
    evolution_poids: List[Dict[str, float]] = Field(..., alias="evolutionPoids")

class DashboardStats(BaseModel):
    total_volailles: int = Field(..., alias="totalVolailles")
    total_lots: int = Field(..., alias="totalLots")
    taux_ponte_moyen: Optional[float] = Field(None, alias="tauxPonteMoyen")
    poids_moyen: Optional[float] = Field(None, alias="poidsMoyen")
    alerts: AlertSeverity
    recent_controles: List[ControlePonteResponse] = Field(..., alias="recentControles")
    recent_performances: List[PerformanceCroissanceResponse] = Field(..., alias="recentPerformances")

class PredictionInputPonte(BaseModel):
    lot_id: int = Field(..., alias="lotId")
    type_volaille: TypeVolailleEnum = Field(..., alias="typeVolaille")
    type_production: TypeProductionAvicoleEnum = Field(..., alias="typeProduction")
    systeme_elevage: SystemeElevageAvicoleEnum = Field(..., alias="systemeElevage")
    souche: Optional[str]
    age_jours: int = Field(..., gt=0, alias="ageJours")
    jours_en_production: Optional[int] = Field(None, ge=0, alias="joursEnProduction")
    temperature_moyenne: Optional[float] = Field(None, alias="temperatureMoyenne", description="Température moyenne en °C")
    duree_eclairage: Optional[float] = Field(None, ge=0, le=24, alias="dureeEclairage", description="Durée d'éclairage en heures")

class PredictionResultPonte(BaseModel):
    taux_ponte: float = Field(..., ge=0, le=100, alias="tauxPonte")
    nombre_oeufs: float = Field(..., ge=0, alias="nombreOeufs")
    confidence: float = Field(..., ge=0, le=1)

class PredictionInputCroissance(BaseModel):
    lot_id: int = Field(..., alias="lotId")
    type_volaille: TypeVolailleEnum = Field(..., alias="typeVolaille")
    type_production: TypeProductionAvicoleEnum = Field(..., alias="typeProduction")
    systeme_elevage: SystemeElevageAvicoleEnum = Field(..., alias="systemeElevage")
    souche: Optional[str]
    age_jours: int = Field(..., gt=0, alias="ageJours")
    jours_en_elevage: int = Field(..., ge=0, alias="joursEnElevage")
    poids_initial: Optional[float] = Field(None, gt=0, alias="poidsInitial")
    consommation_aliment: Optional[float] = Field(None, gt=0, alias="consommationAliment")
    temperature_moyenne: Optional[float] = Field(None, alias="temperatureMoyenne", description="Température moyenne en °C")

class PredictionResultCroissance(BaseModel):
    poids_moyen: float = Field(..., gt=0, alias="poidsMoyen")
    gain_journalier: float = Field(..., ge=0, alias="gainJournalier")
    confidence: float = Field(..., ge=0, le=1)

class BatchOperationResult(BaseModel):
    success: int
    failed: int
    errors: Optional[List[str]]

class ImportVolaillesTemplate(BaseModel):
    numero_identification: str = Field(..., alias="numeroIdentification")
    type_volaille: TypeVolailleEnum = Field(..., alias="typeVolaille")
    type_production: TypeProductionAvicoleEnum = Field(..., alias="typeProduction")
    sexe: SexeEnum
    date_naissance: Optional[date] = Field(None, alias="dateNaissance")
    race_id: int = Field(..., alias="raceId")
    lot_id: Optional[int] = Field(None, alias="lotId")
    souche: Optional[str]
    statut: Optional[StatutAnimalEnum]

# Mise à jour des modèles pour les relations
PaginatedResponse.model_rebuild()
VolailleResponse.model_rebuild()
LotAvicoleResponse.model_rebuild()
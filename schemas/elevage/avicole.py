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
    type_volaille: TypeVolailleEnum
    type_production: TypeProductionAvicoleEnum
    systeme_elevage: Optional[SystemeElevageAvicoleEnum]
    souche: Optional[str] = Field(None, max_length=100)
    date_mise_en_place: Optional[date]
    date_reforme: Optional[date]

class VolailleCreate(VolailleBase):
    numero_identification: str = Field(..., max_length=100)
    sexe: SexeEnum
    date_naissance: Optional[date]
    race_id: int
    lot_id: Optional[int]
    mere_id: Optional[int]
    pere_id: Optional[int]

class VolailleUpdate(BaseModel):
    type_production: Optional[TypeProductionAvicoleEnum]
    systeme_elevage: Optional[SystemeElevageAvicoleEnum]
    souche: Optional[str] = Field(None, max_length=100)
    date_reforme: Optional[date]
    statut: Optional[StatutAnimalEnum]
    lot_id: Optional[int]

class VolailleResponse(VolailleBase):
    id: int
    numero_identification: str
    sexe: SexeEnum
    date_naissance: Optional[date]
    statut: StatutAnimalEnum
    race_id: int
    lot_id: Optional[int]
    mere_id: Optional[int]
    pere_id: Optional[int]
    created_at: datetime
    nombre_oeufs_cumules: Optional[int]
    poids_vif: Optional[float]

    class Config:
        orm_mode = True

class ControlePonteBase(BaseModel):
    lot_id: int
    date_controle: date
    nombre_oeufs: Optional[int]
    poids_moyen_oeuf: Optional[float] = Field(None, gt=0, description="Poids moyen en grammes")
    taux_ponte: Optional[float] = Field(None, ge=0, le=100, description="Taux de ponte en pourcentage")
    taux_casses: Optional[float] = Field(None, ge=0, le=100, description="Taux d'œufs cassés en pourcentage")
    taux_sales: Optional[float] = Field(None, ge=0, le=100, description="Taux d'œufs sales en pourcentage")
    notes: Optional[str]

class ControlePonteCreate(ControlePonteBase):
    pass

class ControlePonteUpdate(BaseModel):
    date_controle: Optional[date]
    nombre_oeufs: Optional[int]
    poids_moyen_oeuf: Optional[float] = Field(None, gt=0, description="Poids moyen en grammes")
    taux_ponte: Optional[float] = Field(None, ge=0, le=100, description="Taux de ponte en pourcentage")
    taux_casses: Optional[float] = Field(None, ge=0, le=100, description="Taux d'œufs cassés en pourcentage")
    taux_sales: Optional[float] = Field(None, ge=0, le=100, description="Taux d'œufs sales en pourcentage")
    notes: Optional[str]

    class Config:
        orm_mode = True
        
class ControlePonteResponse(ControlePonteBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class PerformanceCroissanceBase(BaseModel):
    lot_id: int
    date_controle: date
    poids_moyen: Optional[float] = Field(None, gt=0, description="Poids moyen en grammes")
    gain_moyen_journalier: Optional[float] = Field(None, description="Gain moyen journalier en grammes/jour")
    consommation_aliment: Optional[float] = Field(None, gt=0, description="Consommation d'aliment en kg")
    indice_consommation: Optional[float] = Field(None, gt=0, description="kg aliment/kg poids vif")
    taux_mortalite: Optional[float] = Field(None, ge=0, le=100, description="Taux de mortalité en pourcentage")
    uniformite: Optional[float] = Field(None, ge=0, le=100, description="Uniformité du lot en pourcentage")
    notes: Optional[str]

class PerformanceCroissanceCreate(PerformanceCroissanceBase):
    pass

class PerformanceCroissanceResponse(PerformanceCroissanceBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class LotAvicoleBase(BaseModel):
    nom: str = Field(..., max_length=100)
    description: Optional[str]
    type_lot: Optional[str] = Field(None, max_length=50)
    batiment_id: Optional[int]
    capacite_max: Optional[int] = Field(None, gt=0)
    responsable: Optional[str] = Field(None, max_length=200)
    type_logement: Optional[TypeLogementAvicoleEnum]
    date_mise_en_place: Optional[date]
    souche: Optional[str] = Field(None, max_length=100)

class LotAvicoleCreate(LotAvicoleBase):
    pass

class LotAvicoleUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    description: Optional[str]
    batiment_id: Optional[int]
    capacite_max: Optional[int] = Field(None, gt=0)
    responsable: Optional[str] = Field(None, max_length=200)
    type_logement: Optional[TypeLogementAvicoleEnum]

class LotAvicoleResponse(LotAvicoleBase):
    id: int
    created_at: datetime
    nombre_volailles: int
    type_production: Optional[TypeProductionAvicoleEnum]

    class Config:
        orm_mode = True

class StatisticPonte(BaseModel):
    moyenne_taux_ponte: float
    moyenne_oeufs_jour: float
    taux_casses_moyen: float
    taux_sales_moyen: float
    evolution: List[Dict[str, float]]  # Ex: [{"date": "2023-01-01", "taux_ponte": 75.5}]

class StatisticCroissance(BaseModel):
    poids_moyen: float
    gain_journalier_moyen: float
    indice_consommation_moyen: float
    taux_mortalite: float
    evolution_poids: List[Dict[str, float]]

class DashboardStats(BaseModel):
    total_volailles: int
    total_lots: int
    taux_ponte_moyen: Optional[float]
    poids_moyen: Optional[float]
    alerts: AlertSeverity
    recent_controles: List[ControlePonteResponse]
    recent_performances: List[PerformanceCroissanceResponse]

class PredictionInputPonte(BaseModel):
    lot_id: int
    type_volaille: TypeVolailleEnum
    type_production: TypeProductionAvicoleEnum
    systeme_elevage: SystemeElevageAvicoleEnum
    souche: Optional[str]
    age_jours: int = Field(..., gt=0)
    jours_en_production: Optional[int] = Field(None, ge=0)
    temperature_moyenne: Optional[float] = Field(None, description="Température moyenne en °C")
    duree_eclairage: Optional[float] = Field(None, ge=0, le=24, description="Durée d'éclairage en heures")

class PredictionResultPonte(BaseModel):
    taux_ponte: float = Field(..., ge=0, le=100)
    nombre_oeufs: float = Field(..., ge=0)
    confidence: float = Field(..., ge=0, le=1)

class PredictionInputCroissance(BaseModel):
    lot_id: int
    type_volaille: TypeVolailleEnum
    type_production: TypeProductionAvicoleEnum
    systeme_elevage: SystemeElevageAvicoleEnum
    souche: Optional[str]
    age_jours: int = Field(..., gt=0)
    jours_en_elevage: int = Field(..., ge=0)
    poids_initial: Optional[float] = Field(None, gt=0)
    consommation_aliment: Optional[float] = Field(None, gt=0)
    temperature_moyenne: Optional[float] = Field(None, description="Température moyenne en °C")

class PredictionResultCroissance(BaseModel):
    poids_moyen: float = Field(..., gt=0)
    gain_journalier: float = Field(..., ge=0)
    confidence: float = Field(..., ge=0, le=1)

class BatchOperationResult(BaseModel):
    success: int
    failed: int
    errors: Optional[List[str]]

class ImportVolaillesTemplate(BaseModel):
    numero_identification: str
    type_volaille: TypeVolailleEnum
    type_production: TypeProductionAvicoleEnum
    sexe: SexeEnum
    date_naissance: Optional[date]
    race_id: int
    lot_id: Optional[int]
    souche: Optional[str]
    statut: Optional[StatutAnimalEnum]

# Mise à jour des modèles pour les relations
PaginatedResponse.model_rebuild()
VolailleResponse.model_rebuild()
LotAvicoleResponse.model_rebuild()
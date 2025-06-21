from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from enums.elevage.ovin import TypeToisonEnum, QualiteLaineEnum
from enums.elevage import TypeProductionCaprinOvinEnum, StatutAnimalEnum
from enums import SexeEnum
from schemas.elevage import AnimalBase

# ----------------------------
# Schémas Ovin Spécifiques
# ----------------------------

class OvinCreate(AnimalBase):
    type_production: TypeProductionCaprinOvinEnum = Field(
        default=TypeProductionCaprinOvinEnum.LAINE,
        description="Orientation productive principale"
    )
    type_toison: TypeToisonEnum = Field(..., description="Classification de la toison")
    race_id: int = Field(..., gt=0, description="ID de la race ovine")
    poids_vif: Optional[float] = Field(None, gt=0, description="Poids actuel en kg")

    @field_validator('numero_identification')
    def validate_numero_identification(cls, v):
        """Valide que le numéro d'identification suit le format Ovin"""
        if not v.startswith('O'):
            raise ValueError("Le numéro doit commencer par O")
        return v.upper()

class OvinUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    statut: Optional[StatutAnimalEnum] = Field(None)
    date_mise_en_production: Optional[date] = Field(None)
    date_reforme: Optional[date] = Field(None)
    date_deces: Optional[date] = Field(None)
    cause_deces: Optional[str] = Field(None, max_length=200)
    informations_specifiques: Optional[str] = Field(None)
    photo_url: Optional[str] = Field(None, max_length=255)
    type_production: Optional[TypeProductionCaprinOvinEnum] = Field(None)
    type_toison: Optional[TypeToisonEnum] = Field(None)
    race_id: Optional[int] = Field(None, gt=0)
    poids_vif: Optional[float] = Field(None, gt=0)

class OvinResponse(OvinCreate):
    id: int = Field(..., description="ID unique en base de données")
    age_jours: Optional[int] = Field(
        None,
        description="Âge en jours (calculé à partir de la date de naissance)"
    )
    created_at: datetime = Field(..., description="Date de création de l'enregistrement")
    updated_at: Optional[datetime] = Field(
        None,
        description="Date de dernière mise à jour de l'enregistrement"
    )
    mere_id: Optional[int] = Field(None, description="ID de la mère")
    pere_id: Optional[int] = Field(None, description="ID du père")

    @field_validator('age_jours', mode='before')
    @classmethod
    def calculate_age(cls, v, values) -> Optional[int]:
        """Calcule l'âge en jours à partir de la date de naissance"""
        date_naissance = values.get('date_naissance')
        if date_naissance:
            return (date.today() - date_naissance).days
        return None

    class Config:
        orm_mode = True

# ----------------------------
# Schémas Tonte
# ----------------------------

class TonteCreate(BaseModel):
    animal_id: int = Field(..., gt=0)
    date_tonte: date = Field(..., description="Date effective de la tonte")
    poids_laine: float = Field(..., gt=0, description="Poids en kg")
    qualite_laine: QualiteLaineEnum = Field(...)
    longueur_fibre: Optional[float] = Field(None, gt=0, description="En mm")
    finesse: Optional[float] = Field(None, gt=0, description="En microns")
    notes: Optional[str] = Field(None, max_length=500)

class TonteResponse(TonteCreate):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# ----------------------------
# Schémas Utilitaires
# ----------------------------

class OvinMinimal(BaseModel):
    """Schéma réduit pour les relations parentales"""
    id: int
    numero_identification: str
    nom: Optional[str]
    race: str

class Config:
    json_encoders = {
        date: lambda d: d.isoformat(),
        datetime: lambda d: d.isoformat()
    }
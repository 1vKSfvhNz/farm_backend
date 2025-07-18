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
        alias="typeProduction",
        description="Orientation productive principale"
    )
    type_toison: TypeToisonEnum = Field(..., alias="typeToison", description="Classification de la toison")
    race_id: int = Field(..., gt=0, alias="raceId", description="ID de la race ovine")
    poids_vif: Optional[float] = Field(None, gt=0, alias="poidsVif", description="Poids actuel en kg")

    @field_validator('numero_id')
    def validate_numero_id(cls, v):
        """Valide que le numéro d'id suit le format Ovin"""
        if not v.startswith('O'):
            raise ValueError("Le numéro doit commencer par O")
        return v.upper()

class OvinUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100, description="Nom donné à l'animal")
    statut: Optional[StatutAnimalEnum] = Field(None, description="Statut courant de l'animal")
    date_mise_en_production: Optional[date] = Field(None, alias="dateMiseEnProduction", description="Date de mise en production")
    date_reforme: Optional[date] = Field(None, alias="dateReforme", description="Date de réforme")
    date_deces: Optional[date] = Field(None, alias="dateDeces", description="Date de décès")
    cause_deces: Optional[str] = Field(None, max_length=200, alias="causeDeces", description="Cause du décès")
    informations_specifiques: Optional[str] = Field(None, alias="informationsSpecifiques", description="Informations spécifiques au format JSON")
    photo_url: Optional[str] = Field(None, max_length=255, alias="photoUrl", description="URL de la photo de l'animal")
    type_production: Optional[TypeProductionCaprinOvinEnum] = Field(None, alias="typeProduction", description="Type de production")
    type_toison: Optional[TypeToisonEnum] = Field(None, alias="typeToison", description="Classification de la toison")
    race_id: Optional[int] = Field(None, gt=0, alias="raceId", description="ID de la race ovine")
    poids_vif: Optional[float] = Field(None, gt=0, alias="poidsVif", description="Poids actuel en kg")

class OvinResponse(OvinCreate):
    id: int = Field(..., description="ID unique en base de données")
    age_jours: Optional[int] = Field(
        None,
        alias="ageJours",
        description="Âge en jours (calculé à partir de la date de naissance)"
    )
    created_at: datetime = Field(..., alias="createdAt", description="Date de création de l'enregistrement")
    updated_at: Optional[datetime] = Field(
        None,
        alias="updatedAt",
        description="Date de dernière mise à jour de l'enregistrement"
    )
    mere_id: Optional[int] = Field(None, alias="mereId", description="ID de la mère")
    pere_id: Optional[int] = Field(None, alias="pereId", description="ID du père")

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
        allow_population_by_field_name = True

# ----------------------------
# Schémas Tonte
# ----------------------------

class TonteCreate(BaseModel):
    animal_id: int = Field(..., gt=0, alias="animalId", description="ID de l'animal tondu")
    date_tonte: date = Field(..., alias="dateTonte", description="Date effective de la tonte")
    poids_laine: float = Field(..., gt=0, alias="poidsLaine", description="Poids en kg")
    qualite_laine: QualiteLaineEnum = Field(..., alias="qualiteLaine", description="Qualité de la laine")
    longueur_fibre: Optional[float] = Field(None, gt=0, alias="longueurFibre", description="En mm")
    finesse: Optional[float] = Field(None, gt=0, description="En microns")
    notes: Optional[str] = Field(None, max_length=500, description="Notes complémentaires")

class TonteResponse(TonteCreate):
    id: int
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True

# ----------------------------
# Schémas Utilitaires
# ----------------------------

class OvinMinimal(BaseModel):
    """Schéma réduit pour les relations parentales"""
    id: int
    numero_id: str = Field(..., alias="numeroId")
    nom: Optional[str]
    race: str

    class Config:
        allow_population_by_field_name = True

class Config:
    json_encoders = {
        date: lambda d: d.isoformat(),
        datetime: lambda d: d.isoformat()
    }
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from enums.elevage import StatutAnimalEnum
from enums.elevage.bovin import StatutReproductionBovinEnum, TypeProductionBovinEnum
from schemas.elevage import AnimalBase, AnimalSearchCriteria

# ----------------------------
# Schémas Bovins Spécifiques
# ----------------------------
class BovinCreate(AnimalBase):
    type_production: TypeProductionBovinEnum = Field(..., description="Type de production")
    statut_reproduction: Optional[StatutReproductionBovinEnum] = Field(None, description="Statut reproductif")
    robe: Optional[str] = Field(None, max_length=50, description="Couleur de la robe")
    date_mise_bas: Optional[date] = Field(None, description="Date de mise bas prévue ou effective")
    nombre_velages: int = Field(0, description="Nombre de vêlages effectués")
    production_lait_305j: Optional[float] = Field(None, description="Production laitière sur 305 jours")
    taux_cellulaires_moyen: Optional[float] = Field(None, description="Cellules somatiques moyennes")
    aptitudes_viande: Optional[str] = Field(None, max_length=50, description="Notes/conformation")
    numero_travail: Optional[str] = Field(None, max_length=50, description="Numéro interne")
    
    @field_validator('numero_identification')
    def validate_numero_identification(cls, v):
        """Valide que le numéro d'identification suit le format Bovin"""
        if not v.startswith(('B')):
            raise ValueError("Le numéro doit commencer par B")
        return v.upper()

class BovinUpdate(BaseModel):
    # Tous les champs optionnels pour la mise à jour
    nom: Optional[str] = Field(None, max_length=100, description="Nom donné à l'animal")
    statut: Optional[StatutAnimalEnum] = Field(None, description="Statut courant de l'animal")
    date_mise_en_production: Optional[date] = Field(None, description="Date de mise en production")
    date_reforme: Optional[date] = Field(None, description="Date de réforme")
    date_deces: Optional[date] = Field(None, description="Date de décès")
    cause_deces: Optional[str] = Field(None, max_length=200, description="Cause du décès")
    informations_specifiques: Optional[str] = Field(None, description="Informations spécifiques au format JSON")
    photo_url: Optional[str] = Field(None, max_length=255, description="URL de la photo de l'animal")
    type_production: Optional[TypeProductionBovinEnum] = Field(None, description="Type de production")
    statut_reproduction: Optional[StatutReproductionBovinEnum] = Field(None, description="Statut reproductif")
    robe: Optional[str] = Field(None, max_length=50, description="Couleur de la robe")
    date_mise_bas: Optional[date] = Field(None, description="Date de mise bas prévue ou effective")
    nombre_velages: Optional[int] = Field(None, description="Nombre de vêlages effectués")
    production_lait_305j: Optional[float] = Field(None, description="Production laitière sur 305 jours")
    taux_cellulaires_moyen: Optional[float] = Field(None, description="Cellules somatiques moyennes")
    aptitudes_viande: Optional[str] = Field(None, max_length=50, description="Notes/conformation")
    numero_travail: Optional[str] = Field(None, max_length=50, description="Numéro interne")

class BovinResponse(BovinCreate):
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
# Schémas Reproduction
# ----------------------------

class VelageCreate(BaseModel):
    mere_id: int = Field(..., description="ID de la mère")
    date_velage: date = Field(..., description="Date du vêlage")
    facilite_velage: int = Field(..., ge=1, le=5, description="Difficulté du vêlage (1-5)")
    assistance: bool = Field(False, description="Assistance requise")
    nombre_veaux: int = Field(1, ge=1, description="Nombre de veaux nés")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

class VelageResponse(VelageCreate):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class BovinCriteria(AnimalSearchCriteria):
    type_production: Optional[TypeProductionBovinEnum] = Field(None, description="Type de production (ex: lait, viande)")
    statut_reproduction: Optional[StatutReproductionBovinEnum] = Field(None, description="Statut de reproduction")

# ----------------------------
# Utilitaires
# ----------------------------

class Config:
    json_encoders = {
        date: lambda d: d.isoformat(),
        datetime: lambda d: d.isoformat()
    }
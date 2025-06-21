from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from enums.elevage import TypeProductionCaprinOvinEnum, StatutAnimalEnum
from schemas.elevage import AnimalBase, AnimalSearchCriteria

# ---------------------------
# Schémas Caprins Spécifiques
# ---------------------------

class CaprinCreate(AnimalBase):
    type_production: TypeProductionCaprinOvinEnum = Field(
        default=TypeProductionCaprinOvinEnum.LAIT,
        description="Type de production principale"
    )
    race: str = Field(..., max_length=50, description="Race caprine")
    code_race: Optional[str] = Field(None, max_length=10, description="Code race officiel")
    periode_lactation: Optional[int] = Field(None, ge=0, description="Jours depuis le début de la lactation")
    couleur: Optional[str] = Field(None, max_length=30, description="Couleur de la robe")
    cornage: Optional[bool] = Field(None, description="Présence de cornes")
    poids_naissance: Optional[float] = Field(None, gt=0, description="Poids à la naissance (kg)")
    vaccins: Optional[List[str]] = Field(None, description="Liste des vaccins déjà administrés")
    taux_matiere_grasse_moyen: Optional[float] = Field(None, ge=0, le=100, description="Taux moyen de matière grasse (%)")
    taux_proteine_moyen: Optional[float] = Field(None, ge=0, le=100, description="Taux moyen de protéine (%)")
    aptitudes_fromagere: Optional[str] = Field(None, max_length=100, description="Notes sur les aptitudes fromagères")
    production_lait_cumulee: Optional[float] = Field(None, ge=0, description="Production laitière cumulée (litres)")
    numero_travail: Optional[str] = Field(None, max_length=50, description="Numéro interne de travail")

    @field_validator('numero_identification')
    def validate_numero_identification(cls, v):
        """Valide que le numéro d'identification suit le format caprin"""
        if not v.startswith('C'):
            raise ValueError("Le numéro doit commencer par C")
        return v.upper()

class CaprinUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100, description="Nom donné à l'animal")
    statut: Optional[StatutAnimalEnum] = Field(None, description="Statut courant de l'animal")
    date_mise_en_production: Optional[date] = Field(None, description="Date de mise en production")
    date_reforme: Optional[date] = Field(None, description="Date de réforme")
    date_deces: Optional[date] = Field(None, description="Date de décès")
    cause_deces: Optional[str] = Field(None, max_length=200, description="Cause du décès")
    informations_specifiques: Optional[str] = Field(None, description="Informations spécifiques au format JSON")
    photo_url: Optional[str] = Field(None, max_length=255, description="URL de la photo de l'animal")
    type_production: Optional[TypeProductionCaprinOvinEnum] = Field(None, description="Type de production")
    race: Optional[str] = Field(None, max_length=50, description="Race caprine")
    code_race: Optional[str] = Field(None, max_length=10, description="Code race officiel")
    periode_lactation: Optional[int] = Field(None, ge=0, description="Jours depuis le début de la lactation")
    couleur: Optional[str] = Field(None, max_length=30, description="Couleur de la robe")
    cornage: Optional[bool] = Field(None, description="Présence de cornes")
    poids_naissance: Optional[float] = Field(None, gt=0, description="Poids à la naissance (kg)")
    vaccins: Optional[List[str]] = Field(None, description="Liste des vaccins déjà administrés")
    taux_matiere_grasse_moyen: Optional[float] = Field(None, ge=0, le=100, description="Taux moyen de matière grasse (%)")
    taux_proteine_moyen: Optional[float] = Field(None, ge=0, le=100, description="Taux moyen de protéine (%)")
    aptitudes_fromagere: Optional[str] = Field(None, max_length=100, description="Notes sur les aptitudes fromagères")
    production_lait_cumulee: Optional[float] = Field(None, ge=0, description="Production laitière cumulée (litres)")
    numero_travail: Optional[str] = Field(None, max_length=50, description="Numéro interne de travail")

class CaprinResponse(CaprinCreate):
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
    production_moyenne: Optional[float] = Field(None, description="Production laitière moyenne (L/jour)")
    taux_matiere_grasse: Optional[float] = Field(None, description="Taux moyen de matière grasse (%)")
    taux_proteine: Optional[float] = Field(None, description="Taux moyen de protéine (%)")
    dernier_controle_sante: Optional[date] = Field(None, description="Date du dernier contrôle sanitaire")

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

# ---------------------------
# Schémas Reproduction Caprine
# ---------------------------

class MiseBasCreate(BaseModel):
    mere_id: int = Field(..., description="ID de la mère")
    date_mise_bas: date = Field(..., description="Date de la mise bas")
    facilite_mise_bas: int = Field(..., ge=1, le=5, description="Difficulté de la mise bas (1-5)")
    assistance: bool = Field(False, description="Assistance requise")
    nombre_chevreaux: int = Field(1, ge=1, description="Nombre de chevreaux nés")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

class MiseBasResponse(MiseBasCreate):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# ---------------------------
# Schémas Contrôle Laitier
# ---------------------------

class ControleLaitierCreate(BaseModel):
    caprin_id: int = Field(..., description="ID du caprin concerné")
    date_controle: date = Field(..., description="Date du contrôle")
    production_journaliere: float = Field(..., ge=0, description="Production journalière (litres)")
    taux_matiere_grasse: float = Field(..., ge=0, le=100, description="Taux de matière grasse (%)")
    taux_proteine: float = Field(..., ge=0, le=100, description="Taux de protéine (%)")
    taux_lactose: Optional[float] = Field(None, ge=0, le=100, description="Taux de lactose (%)")
    cellules_somatiques: Optional[int] = Field(None, ge=0, description="Comptage de cellules somatiques")
    ph: Optional[float] = Field(None, ge=0, description="pH du lait")
    densite: Optional[float] = Field(None, ge=0, description="Densité du lait")
    notes: Optional[str] = Field(None, description="Observations complémentaires")

class ControleLaitierResponse(ControleLaitierCreate):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# ---------------------------
# Schémas de Recherche
# ---------------------------

class CaprinCriteria(AnimalSearchCriteria):
    type_production: Optional[TypeProductionCaprinOvinEnum] = Field(None, description="Type de production (lait, viande, mixte)")
    periode_lactation_min: Optional[int] = Field(None, ge=0, description="Période de lactation minimale (jours)")
    periode_lactation_max: Optional[int] = Field(None, ge=0, description="Période de lactation maximale (jours)")

# ---------------------------
# Utilitaires
# ---------------------------

class CaprinMinimal(BaseModel):
    """Schéma réduit pour les relations parentales"""
    id: int
    numero_identification: str
    nom: Optional[str]
    race: str
    type_production: TypeProductionCaprinOvinEnum

class Config:
    json_encoders = {
        date: lambda d: d.isoformat(),
        datetime: lambda d: d.isoformat()
    }
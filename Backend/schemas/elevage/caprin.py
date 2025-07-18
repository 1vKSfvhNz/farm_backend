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
        alias="typeProduction",
        description="Type de production principale"
    )
    race: str = Field(..., max_length=50, description="Race caprine")
    code_race: Optional[str] = Field(None, max_length=10, alias="codeRace", description="Code race officiel")
    periode_lactation: Optional[int] = Field(None, ge=0, alias="periodeLactation", description="Jours depuis le début de la lactation")
    couleur: Optional[str] = Field(None, max_length=30, description="Couleur de la robe")
    cornage: Optional[bool] = Field(None, description="Présence de cornes")
    poids_naissance: Optional[float] = Field(None, gt=0, alias="poidsNaissance", description="Poids à la naissance (kg)")
    vaccins: Optional[List[str]] = Field(None, description="Liste des vaccins déjà administrés")
    taux_matiere_grasse_moyen: Optional[float] = Field(None, ge=0, le=100, alias="tauxMatiereGrasseMoyen", description="Taux moyen de matière grasse (%)")
    taux_proteine_moyen: Optional[float] = Field(None, ge=0, le=100, alias="tauxProteineMoyen", description="Taux moyen de protéine (%)")
    aptitudes_fromagere: Optional[str] = Field(None, max_length=100, alias="aptitudesFromagere", description="Notes sur les aptitudes fromagères")
    production_lait_cumulee: Optional[float] = Field(None, ge=0, alias="productionLaitCumulee", description="Production laitière cumulée (litres)")
    numero_travail: Optional[str] = Field(None, max_length=50, alias="numeroTravail", description="Numéro interne de travail")

    @field_validator('numero_id')
    def validate_numero_id(cls, v):
        """Valide que le numéro d'identification suit le format caprin"""
        if not v.startswith('C'):
            raise ValueError("Le numéro doit commencer par C")
        return v.upper()

class CaprinUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100, description="Nom donné à l'animal")
    statut: Optional[StatutAnimalEnum] = Field(None, description="Statut courant de l'animal")
    date_mise_en_production: Optional[date] = Field(None, alias="dateMiseEnProduction", description="Date de mise en production")
    date_reforme: Optional[date] = Field(None, alias="dateReforme", description="Date de réforme")
    date_deces: Optional[date] = Field(None, alias="dateDeces", description="Date de décès")
    cause_deces: Optional[str] = Field(None, max_length=200, alias="causeDeces", description="Cause du décès")
    informations_specifiques: Optional[str] = Field(None, alias="informationsSpecifiques", description="Informations spécifiques au format JSON")
    photo_url: Optional[str] = Field(None, max_length=255, alias="photoUrl", description="URL de la photo de l'animal")
    type_production: Optional[TypeProductionCaprinOvinEnum] = Field(None, alias="typeProduction", description="Type de production")
    race: Optional[str] = Field(None, max_length=50, description="Race caprine")
    code_race: Optional[str] = Field(None, max_length=10, alias="codeRace", description="Code race officiel")
    periode_lactation: Optional[int] = Field(None, ge=0, alias="periodeLactation", description="Jours depuis le début de la lactation")
    couleur: Optional[str] = Field(None, max_length=30, description="Couleur de la robe")
    cornage: Optional[bool] = Field(None, description="Présence de cornes")
    poids_naissance: Optional[float] = Field(None, gt=0, alias="poidsNaissance", description="Poids à la naissance (kg)")
    vaccins: Optional[List[str]] = Field(None, description="Liste des vaccins déjà administrés")
    taux_matiere_grasse_moyen: Optional[float] = Field(None, ge=0, le=100, alias="tauxMatiereGrasseMoyen", description="Taux moyen de matière grasse (%)")
    taux_proteine_moyen: Optional[float] = Field(None, ge=0, le=100, alias="tauxProteineMoyen", description="Taux moyen de protéine (%)")
    aptitudes_fromagere: Optional[str] = Field(None, max_length=100, alias="aptitudesFromagere", description="Notes sur les aptitudes fromagères")
    production_lait_cumulee: Optional[float] = Field(None, ge=0, alias="productionLaitCumulee", description="Production laitière cumulée (litres)")
    numero_travail: Optional[str] = Field(None, max_length=50, alias="numeroTravail", description="Numéro interne de travail")

class CaprinResponse(CaprinCreate):
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
    production_moyenne: Optional[float] = Field(None, alias="productionMoyenne", description="Production laitière moyenne (L/jour)")
    taux_matiere_grasse: Optional[float] = Field(None, alias="tauxMatiereGrasse", description="Taux moyen de matière grasse (%)")
    taux_proteine: Optional[float] = Field(None, alias="tauxProteine", description="Taux moyen de protéine (%)")
    dernier_controle_sante: Optional[date] = Field(None, alias="dernierControleSante", description="Date du dernier contrôle sanitaire")

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

# ---------------------------
# Schémas Reproduction Caprine
# ---------------------------

class MiseBasCreate(BaseModel):
    mere_id: int = Field(..., alias="mereId", description="ID de la mère")
    date_mise_bas: date = Field(..., alias="dateMiseBas", description="Date de la mise bas")
    facilite_mise_bas: int = Field(..., ge=1, le=5, alias="faciliteMiseBas", description="Difficulté de la mise bas (1-5)")
    assistance: bool = Field(False, description="Assistance requise")
    nombre_chevreaux: int = Field(1, ge=1, alias="nombreChevreaux", description="Nombre de chevreaux nés")
    notes: Optional[str] = Field(None, description="Notes complémentaires")

class MiseBasResponse(MiseBasCreate):
    id: int
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True

# ---------------------------
# Schémas Contrôle Laitier
# ---------------------------

class ControleLaitierCreate(BaseModel):
    caprin_id: int = Field(..., alias="caprinId", description="ID du caprin concerné")
    date_controle: date = Field(..., alias="dateControle", description="Date du contrôle")
    production_journaliere: float = Field(..., ge=0, alias="productionJournaliere", description="Production journalière (litres)")
    taux_matiere_grasse: float = Field(..., ge=0, le=100, alias="tauxMatiereGrasse", description="Taux de matière grasse (%)")
    taux_proteine: float = Field(..., ge=0, le=100, alias="tauxProteine", description="Taux de protéine (%)")
    taux_lactose: Optional[float] = Field(None, ge=0, le=100, alias="tauxLactose", description="Taux de lactose (%)")
    cellules_somatiques: Optional[int] = Field(None, ge=0, alias="cellulesSomatiques", description="Comptage de cellules somatiques")
    ph: Optional[float] = Field(None, ge=0, description="pH du lait")
    densite: Optional[float] = Field(None, ge=0, description="Densité du lait")
    notes: Optional[str] = Field(None, description="Observations complémentaires")

class ControleLaitierResponse(ControleLaitierCreate):
    id: int
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True

# ---------------------------
# Schémas de Recherche
# ---------------------------

class CaprinCriteria(AnimalSearchCriteria):
    type_production: Optional[TypeProductionCaprinOvinEnum] = Field(None, alias="typeProduction", description="Type de production (lait, viande, mixte)")
    periode_lactation_min: Optional[int] = Field(None, ge=0, alias="periodeLactationMin", description="Période de lactation minimale (jours)")
    periode_lactation_max: Optional[int] = Field(None, ge=0, alias="periodeLactationMax", description="Période de lactation maximale (jours)")

# ---------------------------
# Utilitaires
# ---------------------------

class CaprinMinimal(BaseModel):
    """Schéma réduit pour les relations parentales"""
    id: int
    numero_identification: str = Field(..., alias="numeroIdentification")
    nom: Optional[str]
    race: str
    type_production: TypeProductionCaprinOvinEnum = Field(..., alias="typeProduction")

class Config:
    json_encoders = {
        date: lambda d: d.isoformat(),
        datetime: lambda d: d.isoformat()
    }
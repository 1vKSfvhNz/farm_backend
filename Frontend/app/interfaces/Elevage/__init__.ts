import { AlerteType, AlertSeverity, SexeEnum, StatutAnimalEnum, TypeBatimentAvicole, TypeBatimentBovin, TypeBatimentCaprin, TypeBatimentOvin, TypeBatimentPiscicole, TypeElevage, TypeTraitementEnum } from "../../enums/Elevage/__init__";

// models.ts
export interface AnimalNumberResponse {
  numeroId: string;
}

export interface RaceBase {
  nom: string;
  description?: string;
  origine?: string;
  typeElevage: string;
  caracteristiques?: Record<string, any>;
}

export interface AnimalBase {
  numeroId: string;
  nom?: string;
  sexe: SexeEnum;
  dateNaissance?: string; // date as ISO string
  raceId: number;
  lotId?: number;
  statut: StatutAnimalEnum;
  dateMiseEnProduction?: string;
  dateReforme?: string;
  dateDeces?: string;
  causeDeces?: string;
  informationsSpecifiques?: string;
  photoUrl?: string;
}

export interface BatimentBase {
  nom: string;
  typeElevage?: TypeElevage;
  typeBatiment?: 
    | TypeBatimentBovin 
    | TypeBatimentCaprin 
    | TypeBatimentOvin 
    | TypeBatimentPiscicole 
    | TypeBatimentAvicole;
  capacite?: number;
  superficie?: number;
  ventilation?: string;
  notes?: string;
}

export interface BatimentResponse extends BatimentBase {
  id: number;
  createdAt: string;
}

export interface AnimalSearchCriteria {
  ageMin?: number;
  ageMax?: number;
  raceId?: number;
  lotId?: number;
  dateNaissanceMin?: string;
  dateNaissanceMax?: string;
  statut?: StatutAnimalEnum;
  sortBy?: string;
  sortAsc?: boolean;
}

export interface PerformanceTroupeauResponse {
  dateDebut: string;
  dateFin: string;
  productionMoyenne: number;
  tauxCellulairesMoyen: number;
  distributionProduction: Record<string, number>;
  alertesActives: number;
}

export interface ProductionLaitCreate {
  animalId: number;
  dateProduction: string;
  quantite: number;
  dureeTraite?: number;
  debitMoyen?: number;
  notes?: string;
}

export interface ProductionLaitResponse extends ProductionLaitCreate {
  id: number;
  createdAt: string;
}

export interface ControleLaitierCreate {
  animalId: number;
  dateControle: string;
  productionJour: number;
  tauxButyreux: number;
  tauxProteine: number;
  cellulesSomatiques: number;
}

export interface ControleLaitierResponse extends ControleLaitierCreate {
  id: number;
  createdAt: string;
}

export interface TraitementCreate {
  animalId: number;
  typeTraitement: TypeTraitementEnum;
  dateTraitement: string;
  produit: string;
  dosage: string;
  duree?: number;
  notes?: string;
}

export interface TraitementResponse extends TraitementCreate {
  id: number;
  createdAt: string;
}

export interface AlerteBase {
  type: AlerteType;
  severite: AlertSeverity;
  message: string;
  animalId?: number;
  dateDetection: string;
  suggestions: string[];
}

export interface AlerteResponse extends AlerteBase {
  id: number;
}

export interface StatsProductionLait {
  moyenneJournaliere: number;
  evolution7j: number;
  meilleursAnimaux: Record<string, any>[];
  parametresQualite: Record<string, number>;
}

export interface StatsReproduction {
  tauxGestation: number;
  intervalleVelageMoyen: number;
  velages30j: number;
  difficultesVelage: Record<string, number>;
}

export interface SearchQuery {
  query?: string;
  statut?: StatutAnimalEnum;
  sexe?: SexeEnum;
  dateDebut?: string;
  dateFin?: string;
}

export interface AnalyseProductionRequest {
  dateDebut: string;
  dateFin: string;
  seuilAlerteCellules?: number;
  analyseIndividuelle?: boolean;
}

export interface PredictionProductionRequest {
  animalId: number;
  horizonJours: number;
  includeConfidence?: boolean;
}

export interface PerformanceModel {
  r2: number;
  mae: number;
  mse: number;
  cvScore?: number;
}

export interface PredictionRequest {
  animalId: number;
  parametres?: Record<string, any>;
}

export interface PredictionResponse {
  prediction: number;
  intervalleConfiance?: [number, number];
  datePrediction: string;
}

export interface AnimalStats {
  variant: TypeElevage;
  count: number;
  health: number;
  production: number;
  lastUpdate: string;
  isNew?: boolean;
  isUrgent?: boolean;
}

export interface GlobalStats {
  totalAnimals: number;
  averageHealth: number;
  averageProduction: number;
  lastSync: string;
}

export interface FarmData {
  animals: AnimalStats[];
  globalStats: GlobalStats;
}
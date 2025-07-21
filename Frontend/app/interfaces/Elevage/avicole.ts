import { AlertSeverity, SexeEnum, StatutAnimalEnum } from "../../enums/Elevage/__init__";
import { SystemeElevageAvicoleEnum, TypeLogementAvicoleEnum, TypeProductionAvicoleEnum, TypeVolailleEnum } from "../../enums/Elevage/avicole";

export interface VolailleBase {
  typeVolaille: TypeVolailleEnum;
  typeProduction: TypeProductionAvicoleEnum;
  systemeElevage?: SystemeElevageAvicoleEnum;
  souche?: string;
  dateMiseEnPlace?: string;
  dateReforme?: string;
}

export interface VolailleCreate extends VolailleBase {
  numeroId: string;
  sexe: SexeEnum;
  dateNaissance?: string;
  raceId: number;
  lotId?: number;
  mereId?: number;
  pereId?: number;
}

export interface VolailleUpdate {
  typeProduction?: TypeProductionAvicoleEnum;
  systemeElevage?: SystemeElevageAvicoleEnum;
  souche?: string;
  dateReforme?: string;
  statut?: StatutAnimalEnum;
  lotId?: number;
}

export interface VolailleResponse extends VolailleBase {
  id: number;
  numeroId: string;
  sexe: SexeEnum;
  dateNaissance?: string;
  statut: StatutAnimalEnum;
  raceId: number;
  lotId?: number;
  mereId?: number;
  pereId?: number;
  createdAt: string;
  nombreOeufsCumules?: number;
  poidsVif?: number;
}

export interface ControlePonteBase {
  lotId: number;
  dateControle: string;
  nombreOeufs?: number;
  poidsMoyenOeuf?: number;
  tauxPonte?: number;
  tauxCasses?: number;
  tauxSales?: number;
  notes?: string;
}

export interface ControlePonteCreate extends ControlePonteBase {}

export interface ControlePonteUpdate {
  dateControle?: string;
  nombreOeufs?: number;
  poidsMoyenOeuf?: number;
  tauxPonte?: number;
  tauxCasses?: number;
  tauxSales?: number;
  notes?: string;
}

export interface ControlePonteResponse extends ControlePonteBase {
  id: number;
  createdAt: string;
}

export interface PerformanceCroissanceBase {
  lotId: number;
  dateControle: string;
  poidsMoyen?: number;
  gainMoyenJournalier?: number;
  consommationAliment?: number;
  indiceConsommation?: number;
  tauxMortalite?: number;
  uniformite?: number;
  notes?: string;
}

export interface PerformanceCroissanceCreate extends PerformanceCroissanceBase {}

export interface PerformanceCroissanceResponse extends PerformanceCroissanceBase {
  id: number;
  createdAt: string;
}

export interface LotAvicoleBase {
  nom: string;
  description?: string;
  typeLot?: string;
  batimentId?: number;
  capaciteMax?: number;
  responsable?: string;
  typeLogement?: TypeLogementAvicoleEnum;
  dateMiseEnPlace?: string;
  souche?: string;
}

export interface LotAvicoleCreate extends LotAvicoleBase {}

export interface LotAvicoleUpdate {
  nom?: string;
  description?: string;
  batimentId?: number;
  capaciteMax?: number;
  responsable?: string;
  typeLogement?: TypeLogementAvicoleEnum;
}

export interface LotAvicoleResponse extends LotAvicoleBase {
  id: number;
  createdAt: string;
  nombreVolailles: number;
  typeProduction?: TypeProductionAvicoleEnum;
}

export interface StatisticPonte {
  moyenne_tauxPonte: number;
  moyenneOeufsJour: number;
  tauxCassesMoyen: number;
  tauxSalesMoyen: number;
  evolution: Array<{date: string; tauxPonte: number}>;
}

export interface StatisticCroissance {
  poidsMoyen: number;
  gainJournalierMoyen: number;
  indiceConsommationMoyen: number;
  tauxMortalite: number;
  evolutionPoids: Array<{date: string; poids: number}>;
}

export interface DashboardStats {
  totalVolailles: number;
  totalLots: number;
  tauxPonteMoyen?: number;
  poidsMoyen?: number;
  alerts: AlertSeverity;
  recentControles: ControlePonteResponse[];
  recentPerformances: PerformanceCroissanceResponse[];
}

export interface PredictionInputPonte {
  lotId: number;
  typeVolaille: TypeVolailleEnum;
  typeProduction: TypeProductionAvicoleEnum;
  systemeElevage: SystemeElevageAvicoleEnum;
  souche?: string;
  ageJours: number;
  joursEnProduction?: number;
  temperatureMoyenne?: number;
  dureeEclairage?: number;
}

export interface PredictionResultPonte {
  tauxPonte: number;
  nombreOeufs: number;
  confidence: number;
}

export interface PredictionInputCroissance {
  lotId: number;
  typeVolaille: TypeVolailleEnum;
  typeProduction: TypeProductionAvicoleEnum;
  systemeElevage: SystemeElevageAvicoleEnum;
  souche?: string;
  ageJours: number;
  joursEnElevage: number;
  poidsInitial?: number;
  consommationAliment?: number;
  temperatureMoyenne?: number;
}

export interface PredictionResultCroissance {
  poidsMoyen: number;
  gainJournalier: number;
  confidence: number;
}

export interface BatchOperationResult {
  success: number;
  failed: number;
  errors?: string[];
}

export interface ImportVolaillesTemplate {
  numeroId: string;
  typeVolaille: TypeVolailleEnum;
  typeProduction: TypeProductionAvicoleEnum;
  sexe: SexeEnum;
  dateNaissance?: string;
  raceId: number;
  lotId?: number;
  souche?: string;
  statut?: StatutAnimalEnum;
}
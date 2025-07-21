import { AnimalBase, AnimalSearchCriteria } from "./__init__";
import { StatutAnimalEnum } from "../../enums/Elevage/__init__";
import { StatutReproductionBovinEnum, TypeProductionBovinEnum } from "../../enums/Elevage/bovin";

export interface BovinCreate extends AnimalBase {
  type_production: TypeProductionBovinEnum;
  statut_reproduction?: StatutReproductionBovinEnum;
  robe?: string;
  date_mise_bas?: string;
  nombre_velages: number;
  production_lait_305j?: number;
  taux_cellulaires_moyen?: number;
  aptitudes_viande?: string;
  numero_travail?: string;
}

export interface BovinUpdate {
  nom?: string;
  statut?: StatutAnimalEnum;
  date_mise_en_production?: string;
  date_reforme?: string;
  date_deces?: string;
  cause_deces?: string;
  informations_specifiques?: string;
  photo_url?: string;
  type_production?: TypeProductionBovinEnum;
  statut_reproduction?: StatutReproductionBovinEnum;
  robe?: string;
  date_mise_bas?: string;
  nombre_velages?: number;
  production_lait_305j?: number;
  taux_cellulaires_moyen?: number;
  aptitudes_viande?: string;
  numero_travail?: string;
}

export interface BovinResponse extends BovinCreate {
  id: number;
  age_jours?: number;
  created_at: string;
  updated_at?: string;
  mere_id?: number;
  pere_id?: number;
}

export interface VelageCreate {
  mere_id: number;
  date_velage: string;
  facilite_velage: number;
  assistance: boolean;
  nombre_veaux: number;
  notes?: string;
}

export interface VelageResponse extends VelageCreate {
  id: number;
  created_at: string;
}

export interface BovinCriteria extends AnimalSearchCriteria {
  type_production?: TypeProductionBovinEnum;
  statut_reproduction?: StatutReproductionBovinEnum;
}
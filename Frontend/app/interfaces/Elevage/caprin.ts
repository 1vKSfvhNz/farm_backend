import { StatutAnimalEnum, TypeProductionCaprinOvinEnum } from "../../enums/Elevage/__init__";
import { AnimalBase, AnimalSearchCriteria } from "./__init__";

export interface CaprinCreate extends AnimalBase {
  type_production: TypeProductionCaprinOvinEnum;
  race: string;
  code_race?: string;
  periode_lactation?: number;
  couleur?: string;
  cornage?: boolean;
  poids_naissance?: number;
  vaccins?: string[];
  taux_matiere_grasse_moyen?: number;
  taux_proteine_moyen?: number;
  aptitudes_fromagere?: string;
  production_lait_cumulee?: number;
  numero_travail?: string;
}

export interface CaprinUpdate {
  nom?: string;
  statut?: StatutAnimalEnum;
  date_mise_en_production?: string;
  date_reforme?: string;
  date_deces?: string;
  cause_deces?: string;
  informations_specifiques?: string;
  photo_url?: string;
  type_production?: TypeProductionCaprinOvinEnum;
  race?: string;
  code_race?: string;
  periode_lactation?: number;
  couleur?: string;
  cornage?: boolean;
  poids_naissance?: number;
  vaccins?: string[];
  taux_matiere_grasse_moyen?: number;
  taux_proteine_moyen?: number;
  aptitudes_fromagere?: string;
  production_lait_cumulee?: number;
  numero_travail?: string;
}

export interface CaprinResponse extends CaprinCreate {
  id: number;
  age_jours?: number;
  created_at: string;
  updated_at?: string;
  mere_id?: number;
  pere_id?: number;
  production_moyenne?: number;
  taux_matiere_grasse?: number;
  taux_proteine?: number;
  dernier_controle_sante?: string;
}

export interface MiseBasCreate {
  mere_id: number;
  date_mise_bas: string;
  facilite_mise_bas: number;
  assistance: boolean;
  nombre_chevreaux: number;
  notes?: string;
}

export interface MiseBasResponse extends MiseBasCreate {
  id: number;
  created_at: string;
}

export interface ControleLaitierCreate {
  caprin_id: number;
  date_controle: string;
  production_journaliere: number;
  taux_matiere_grasse: number;
  taux_proteine: number;
  taux_lactose?: number;
  cellules_somatiques?: number;
  ph?: number;
  densite?: number;
  notes?: string;
}

export interface ControleLaitierResponse extends ControleLaitierCreate {
  id: number;
  created_at: string;
}

export interface CaprinCriteria extends AnimalSearchCriteria {
  type_production?: TypeProductionCaprinOvinEnum;
  periode_lactation_min?: number;
  periode_lactation_max?: number;
}

export interface CaprinMinimal {
  id: number;
  numero_identification: string;
  nom?: string;
  race: string;
  type_production: TypeProductionCaprinOvinEnum;
}
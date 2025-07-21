import { AnimalBase } from "./__init__";
import { StatutAnimalEnum, TypeProductionCaprinOvinEnum } from "../../enums/Elevage/__init__";
import { QualiteLaineEnum, TypeToisonEnum } from "../../enums/Elevage/ovin";

export interface OvinCreate extends AnimalBase {
  type_production: TypeProductionCaprinOvinEnum;
  type_toison: TypeToisonEnum;
  race_id: number;
  poids_vif?: number;
}

export interface OvinUpdate {
  nom?: string;
  statut?: StatutAnimalEnum;
  date_mise_en_production?: string;
  date_reforme?: string;
  date_deces?: string;
  cause_deces?: string;
  informations_specifiques?: string;
  photo_url?: string;
  type_production?: TypeProductionCaprinOvinEnum;
  type_toison?: TypeToisonEnum;
  race_id?: number;
  poids_vif?: number;
}

export interface OvinResponse extends OvinCreate {
  id: number;
  age_jours?: number;
  created_at: string;
  updated_at?: string;
  mere_id?: number;
  pere_id?: number;
}

export interface TonteCreate {
  animal_id: number;
  date_tonte: string;
  poids_laine: number;
  qualite_laine: QualiteLaineEnum;
  longueur_fibre?: number;
  finesse?: number;
  notes?: string;
}

export interface TonteResponse extends TonteCreate {
  id: number;
  created_at: string;
}

export interface OvinMinimal {
  id: number;
  numero_identification: string;
  nom?: string;
  race: string;
}
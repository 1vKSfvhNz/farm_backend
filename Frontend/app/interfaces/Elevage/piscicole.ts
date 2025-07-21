import { QualiteEauEnum } from "../../enums/Elevage/__init__";
import { 
  EspecePoissonEnum, 
  PhaseElevage, 
  StadePoisson,
  TypeAlimentPoissonEnum, 
  TypeHabitatPiscicoleEnum, 
  TypeMilieuPiscicoleEnum 
} from "../../enums/Elevage/piscicole";

/** Modèles de base pour les poissons */
export interface PoissonBase {
  /** Espèce de poisson */
  espece: EspecePoissonEnum;
  /** Date d'introduction dans le bassin */
  dateEnsemencement: string;
  /** Poids initial en grammes */
  poidsEnsemencement: number;
  /** Taille initiale en cm */
  tailleEnsemencement: number;
  /** Origine du poisson */
  origine: string;
  /** Type d'alimentation */
  alimentationType: TypeAlimentPoissonEnum;
  /** Sexe: 'M' pour Mâle, 'F' pour Femelle */
  sexe?: 'M' | 'F';
  /** Stade de développement */
  stadeDeveloppement: StadePoisson;
  /** Indique si c'est un reproducteur */
  reproducteur: boolean;
  /** Numéro d'identification individuel */
  numeroIdentification?: string;
}

export interface PoissonCreate extends PoissonBase {
  /** ID du bassin */
  bassinId: number;
}

export interface PoissonUpdate {
  espece?: EspecePoissonEnum;
  bassinId?: number;
  poidsEnsemencement?: number;
  tailleEnsemencement?: number;
  origine?: string;
  alimentationType?: TypeAlimentPoissonEnum;
  sexe?: 'M' | 'F';
  stadeDeveloppement?: StadePoisson;
  reproducteur?: boolean;
  numeroIdentification?: string;
}

export interface PoissonResponse extends PoissonBase {
  id: number;
  bassinId: number;
  /** Âge en jours depuis l'ensemencement */
  ageJours: number;
}

/** Modèles pour les populations de poissons */
export interface PopulationBassinBase {
  espece: EspecePoissonEnum;
  nombrePoissons: number;
  dateEnsemencement: string;
  origine: string;
  poidsMoyenEnsemencement: number;
  tailleMoyenneEnsemencement: number;
  alimentationType: TypeAlimentPoissonEnum;
  stadeDeveloppement: StadePoisson;
  notes?: string;
}

export interface PopulationBassinCreate extends PopulationBassinBase {
  bassinId: number;
}

export interface PopulationBassinUpdate {
  espece?: EspecePoissonEnum;
  nombrePoissons?: number;
  poidsMoyenEnsemencement?: number;
  tailleMoyenneEnsemencement?: number;
  alimentationType?: TypeAlimentPoissonEnum;
  stadeDeveloppement?: StadePoisson;
  notes?: string;
}

export interface PopulationBassinResponse extends PopulationBassinBase {
  id: number;
  bassinId: number;
  /** Biomasse totale en kilogrammes */
  biomasseTotaleKg: number;
}

/** Modèles pour les bassins */
export interface BassinBase {
  nom: string;
  typeMilieu: TypeMilieuPiscicoleEnum;
  typeHabitat: TypeHabitatPiscicoleEnum;
  superficie: number;
  profondeurMoyenne: number;
  capaciteMax: number;
  dateMiseEnService: string;
  systemeFiltration?: string;
  systemeAeration?: string;
  notes?: string;
  /** Indique si c'est un bassin de reproduction */
  bassinReproduction: boolean;
}

export interface BassinCreate extends BassinBase {}

export interface BassinUpdate {
  nom?: string;
  typeMilieu?: TypeMilieuPiscicoleEnum;
  typeHabitat?: TypeHabitatPiscicoleEnum;
  superficie?: number;
  profondeurMoyenne?: number;
  capaciteMax?: number;
  systemeFiltration?: string;
  systemeAeration?: string;
  notes?: string;
  bassinReproduction?: boolean;
}

export interface BassinResponse extends BassinBase {
  id: number;
  poissons: PoissonResponse[];
  populations: PopulationBassinResponse[];
  controlesEau: ControleEauResponse[];
  recoltes: RecolteResponse[];
  /** Volume du bassin en m³ */
  volumeM3: number;
  /** Nombre total de poissons (individuels + populations) */
  nombreTotalPoissons: number;
  /** Taux d'occupation du bassin en pourcentage */
  tauxOccupation: number;
  /** Biomasse totale en kilogrammes */
  biomasseTotaleKg: number;
}

/** Modèles pour les récoltes */
export interface RecolteBase {
  bassinId: number;
  dateRecolte: string;
  nombrePoissons: number;
  poidsTotal: number;
  poidsMoyen: number;
  tauxSurvie: number;
  destination: string;
  populationId?: number;
  notes?: string;
}

export interface RecolteCreate extends RecolteBase {}

export interface RecolteUpdate {
  nombrePoissons?: number;
  poidsTotal?: number;
  poidsMoyen?: number;
  tauxSurvie?: number;
  destination?: string;
  notes?: string;
}

export interface RecolteResponse extends RecolteBase {
  id: number;
  /** Rendement en kg/m² */
  rendementKgM2?: number;
}

/** Modèles pour le suivi journalier */
export interface SuiviPopulationJournalierBase {
  dateSuivi: string;
  bassinId: number;
  poissonId?: number;
  populationId?: number;
  nombrePoissons: number;
  nombreMorts: number;
  poidsMoyen?: number;
  tailleMoyenne?: number;
  quantiteNourriture?: number;
  comportement?: string;
  observations?: string;
}

export interface SuiviPopulationJournalierCreate extends SuiviPopulationJournalierBase {}

export interface SuiviPopulationJournalierResponse extends SuiviPopulationJournalierBase {
  id: number;
  /** Taux de mortalité si les données sont disponibles */
  tauxMortalite?: number;
}

/** Modèles pour les contrôles d'eau */
export interface ControleEauCreate {
  bassinId: number;
  temperature: number;
  ph: number;
  oxygeneDissous: number;
  ammoniac: number;
  nitrites: number;
  nitrates: number;
  salinite?: number;
  turbidite?: number;
  notes?: string;
}

export interface ControleEauResponse extends ControleEauCreate {
  id: number;
  dateControle: string;
  qualiteEau?: QualiteEauEnum;
  /** Paramètres en situation critique */
  parametresCritiques: string[];
}

/** Modèles pour analyses et statistiques */
export interface StatistiquesBassin {
  bassinId: number;
  periodeDebut: string;
  periodeFin: string;
  nombreTotalPoissons: number;
  biomasseTotaleKg: number;
  densiteKgM2: number;
  tauxOccupationMoyen: number;
  nombrePontes: number;
  tauxEclosionMoyen?: number;
  productionAlevins: number;
  nombreRecoltes: number;
  poidsTotalRecolte: number;
  tauxSurvieMoyen: number;
  temperatureMoyenne?: number;
  phMoyen?: number;
  oxygeneMoyen?: number;
  nombreControlesCritiques: number;
}

/** Modèles pour prédictions */
export interface PredictionCroissanceInput {
  temperature: number;
  ph: number;
  oxygeneDissous: number;
  ammoniac: number;
  nitrites: number;
  nitrates: number;
  salinite?: number;
  turbidite?: number;
  densitePoissons?: number;
  espece: EspecePoissonEnum;
  stadeDeveloppement: StadePoisson;
  phaseElevage?: PhaseElevage;
}

export interface PredictionCroissanceOutput {
  tauxCroissance: number;
  confiance: number;
  facteursInfluence: Record<string, number>;
  recommandations: string[];
  dureePrevueJours?: number;
}

/** Modèles pour alertes */
export type AlerteType = "qualite_eau" | "mortalite" | "reproduction" | "croissance" | "maladie" | "equipement";
export type AlerteSeverite = "info" | "warning" | "critical" | "emergency";

export interface AlertePiscicole {
  type: AlerteType;
  severite: AlerteSeverite;
  titre: string;
  description: string;
  bassinId?: number;
  dateDetection: string;
  dateResolution?: string;
  recommandations: string[];
  parametresConcernes: string[];
  actionsRequises: string[];
  urgenceHeures?: number;
}

/** Modèles pour rapports de production */
export interface RapportProduction {
  periodeDebut: string;
  periodeFin: string;
  bassinId?: number;
  espece?: EspecePoissonEnum;
  totalPoissonsProduits: number;
  poidsTotal: number;
  tauxSurvieMoyen: number;
  rendementKgM2: number;
  nombrePontesPeriode: number;
  productionAlevins: number;
  tauxEclosionMoyen?: number;
  consommationAliment?: number;
  coutsProduction?: number;
  revenus?: number;
  margeBeneficiaire?: number;
  indiceConversionAlimentaire?: number;
  tauxCroissanceMoyen?: number;
}
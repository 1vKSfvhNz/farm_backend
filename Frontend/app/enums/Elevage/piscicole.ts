// enum Piscicole
export enum TypeMilieuPiscicoleEnum {
    EAU_DOUCE = "Eau douce",
    EAU_SAUMATRE = "Eau saumâtre",
}

export enum TypeHabitatPiscicoleEnum {
    BASSIN = "Bassin",
    CAGE = "Cage",
    ETANG = "Étang",
    RECIRCULATION = "Système en recirculation"
}

export enum TypeAlimentPoissonEnum {
    GRANULES = "Granulés",
    FARINE = "Farine",
    VIVANT = "Vivant",
    VEGETAL = "Végétal"
}

export enum EspecePoissonEnum {
    /** Espèces de poissons d'élevage */
    TILAPIA = "tilapia",
    CARPE = "carpe",
    SILURE = "silure",
    CAPITAINE = "capitaine"
}

export enum ComportementPoisson {
    /** Comportement observé des poissons */
    ACTIF = "actif",
    LETHARGIQUE = "lethargique",
    STRESSE = "stresse",
    AGRESSIF = "agressif",
    NORMAL = "normal"
}

export enum AlimentType {
    /** Types d'aliments selon la phase d'élevage */
    STARTER = "starter",         // Pour les alevins (0-4 semaines)
    GROWER = "grower",           // Pour les juvéniles (4-12 semaines)
    FINISHER = "finisher"       // Pour la phase de grossissement/finition (>12 semaines)
}

export enum PhaseElevage {
    /** Phases d'élevage des poissons */
    ALEVIN = "alevin",           // 0-4 semaines
    JUVENILE = "juvenile",       // 4-12 semaines
    GROSSISSEMENT = "grossissement",  // 12-24 semaines
    FINITION = "finition"       // >24 semaines
}

export enum ConditionsMeteo {
    /** Conditions météorologiques */
    ENSOLEILLE = "ensoleille",
    NUAGEUX = "nuageux",
    PLUVIEUX = "pluvieux",
    ORAGEUX = "orageux"
}

export enum CauseMortalite {
    /** Causes principales de mortalité */
    MALADIE = "maladie",
    STRESS = "stress",
    QUALITE_EAU = "qualite_eau",
    PREDATION = "predation",
    MANIPULATION = "manipulation",
    INCONNUE = "inconnue"
}

// fichier : stade-poisson.enum.ts

export enum StadePoisson {
  // Stades embryonnaires et larves
  OEUF = "oeuf",
  ALEVIN = "alevin",
  LARVE = "larve",
  
  // Stades juvéniles
  JUVENILE = "juvenile",
  JUVENILE_PRECOCE = "juvenile_precoce",
  JUVENILE_TARDIF = "juvenile_tardif",
  
  // Stades adultes
  SUBADULTE = "subadulte",
  ADULTE = "adulte",
  REPRODUCTEUR = "reproducteur",
  
  // Stades spécialisés
  GENITEUR = "geniteur",
  REFORME = "reforme"
}

export const StadePoissonDescriptions: Record<StadePoisson, string> = {
  [StadePoisson.OEUF]: "Œuf fécondé, stade embryonnaire",
  [StadePoisson.ALEVIN]: "Jeune poisson avec sac vitellin (0-30 jours)",
  [StadePoisson.LARVE]: "Larve libre après résorption du sac vitellin",
  [StadePoisson.JUVENILE]: "Poisson juvénile en croissance",
  [StadePoisson.JUVENILE_PRECOCE]: "Juvénile précoce (1-3 mois)",
  [StadePoisson.JUVENILE_TARDIF]: "Juvénile tardif (3-6 mois)",
  [StadePoisson.SUBADULTE]: "Poisson approchant la maturité sexuelle",
  [StadePoisson.ADULTE]: "Poisson adulte mature",
  [StadePoisson.REPRODUCTEUR]: "Poisson adulte en période de reproduction",
  [StadePoisson.GENITEUR]: "Poisson sélectionné pour la reproduction",
  [StadePoisson.REFORME]: "Poisson en fin de vie productive"
};

type AgeRange = [number, number];
type EspecePoisson = 'tilapia' | 'carpe' | 'maquereau' | 'chinchard' | 'capitaine';

export const getAgeApproximatif = (stade: StadePoisson, espece?: EspecePoisson): AgeRange => {
  // Âges spécifiques aux espèces du Burkina Faso
  const agesParEspece: Record<EspecePoisson, Partial<Record<StadePoisson, AgeRange>>> = {
    // Tilapia (croissance rapide)
    tilapia: {
      [StadePoisson.OEUF]: [0, 3],
      [StadePoisson.ALEVIN]: [3, 30],
      [StadePoisson.LARVE]: [20, 45],
      [StadePoisson.JUVENILE]: [30, 120],
      [StadePoisson.JUVENILE_PRECOCE]: [30, 60],
      [StadePoisson.JUVENILE_TARDIF]: [60, 120],
      [StadePoisson.SUBADULTE]: [120, 180],
      [StadePoisson.ADULTE]: [180, 1095],  // 6 mois - 3 ans
      [StadePoisson.REPRODUCTEUR]: [180, 1095],
      [StadePoisson.GENITEUR]: [180, 1460],  // 6 mois - 4 ans
      [StadePoisson.REFORME]: [1095, 2190]  // 3-6 ans
    },
    // Carpe (croissance moyenne)
    carpe: {
      [StadePoisson.OEUF]: [0, 5],
      [StadePoisson.ALEVIN]: [5, 40],
      [StadePoisson.LARVE]: [30, 90],
      [StadePoisson.JUVENILE]: [90, 270],
      [StadePoisson.JUVENILE_PRECOCE]: [90, 180],
      [StadePoisson.JUVENILE_TARDIF]: [180, 270],
      [StadePoisson.SUBADULTE]: [270, 365],
      [StadePoisson.ADULTE]: [365, 2555],  // 1-7 ans
      [StadePoisson.REPRODUCTEUR]: [365, 2555],
      [StadePoisson.GENITEUR]: [730, 3650],  // 2-10 ans
      [StadePoisson.REFORME]: [2555, 5475]  // 7-15 ans
    },
    // Maquereau (espèce marine)
    maquereau: {
      [StadePoisson.OEUF]: [0, 5],
      [StadePoisson.ALEVIN]: [5, 60],
      [StadePoisson.LARVE]: [45, 120],
      [StadePoisson.JUVENILE]: [120, 365],
      [StadePoisson.SUBADULTE]: [365, 730],
      [StadePoisson.ADULTE]: [730, 3650],  // 2-10 ans
      [StadePoisson.REPRODUCTEUR]: [730, 3650],
      [StadePoisson.REFORME]: [3650, 5475]  // 10-15 ans
    },
    // Capitaine (croissance lente)
    capitaine: {
      [StadePoisson.OEUF]: [0, 7],
      [StadePoisson.ALEVIN]: [7, 90],
      [StadePoisson.LARVE]: [60, 180],
      [StadePoisson.JUVENILE]: [180, 540],
      [StadePoisson.SUBADULTE]: [540, 1095],
      [StadePoisson.ADULTE]: [1095, 5475],  // 3-15 ans
      [StadePoisson.REPRODUCTEUR]: [1095, 5475],
      [StadePoisson.REFORME]: [3650, 7300]  // 10-20 ans
    },
    // Chinchard (similaire au maquereau)
    chinchard: {
      [StadePoisson.OEUF]: [0, 5],
      [StadePoisson.ALEVIN]: [5, 60],
      [StadePoisson.LARVE]: [45, 120],
      [StadePoisson.JUVENILE]: [120, 365],
      [StadePoisson.SUBADULTE]: [365, 730],
      [StadePoisson.ADULTE]: [730, 3650],
      [StadePoisson.REPRODUCTEUR]: [730, 3650],
      [StadePoisson.REFORME]: [3650, 5475]
    }
  };

  if (espece && agesParEspece[espece] && agesParEspece[espece][stade]) {
    return agesParEspece[espece][stade]!;
  }

  // Valeurs par défaut pour espèces non spécifiées
  const defaultAges: Partial<Record<StadePoisson, AgeRange>> = {
    [StadePoisson.OEUF]: [0, 7],
    [StadePoisson.ALEVIN]: [1, 60],
    [StadePoisson.LARVE]: [30, 120],
    [StadePoisson.JUVENILE]: [60, 365],
    [StadePoisson.JUVENILE_PRECOCE]: [60, 180],
    [StadePoisson.JUVENILE_TARDIF]: [180, 365],
    [StadePoisson.SUBADULTE]: [180, 730],
    [StadePoisson.ADULTE]: [365, 3650],
    [StadePoisson.REPRODUCTEUR]: [365, 3650],
    [StadePoisson.GENITEUR]: [365, 5475],
    [StadePoisson.REFORME]: [1825, 7300]
  };

  return defaultAges[stade] || [0, 0];
};

export const getStadesChronologiques = (): StadePoisson[] => [
  StadePoisson.OEUF,
  StadePoisson.ALEVIN,
  StadePoisson.LARVE,
  StadePoisson.JUVENILE_PRECOCE,
  StadePoisson.JUVENILE,
  StadePoisson.JUVENILE_TARDIF,
  StadePoisson.SUBADULTE,
  StadePoisson.ADULTE,
  StadePoisson.REPRODUCTEUR,
  StadePoisson.GENITEUR,
  StadePoisson.REFORME
];

export const getStadesReproducteurs = (): StadePoisson[] => [
  StadePoisson.ADULTE,
  StadePoisson.REPRODUCTEUR,
  StadePoisson.GENITEUR
];

export const getStadesCommerciaux = (espece?: EspecePoisson): StadePoisson[] => {
  // Stades commerciaux spécifiques selon les espèces
  const commercialStages: Record<EspecePoisson, StadePoisson[]> = {
    tilapia: [StadePoisson.JUVENILE_TARDIF, StadePoisson.SUBADULTE, StadePoisson.ADULTE],
    carpe: [StadePoisson.SUBADULTE, StadePoisson.ADULTE],
    maquereau: [StadePoisson.SUBADULTE, StadePoisson.ADULTE],
    chinchard: [StadePoisson.SUBADULTE, StadePoisson.ADULTE],
    capitaine: [StadePoisson.ADULTE]
  };

  if (espece && commercialStages[espece]) {
    return commercialStages[espece];
  }

  return [
    StadePoisson.JUVENILE_TARDIF,
    StadePoisson.SUBADULTE,
    StadePoisson.ADULTE
  ];
};
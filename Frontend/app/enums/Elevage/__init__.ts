// enum ferme
export enum AlertSeverity {
    LOW = "Faible",
    MEDIUM = "Moyenne",
    HIGH = "Haute",
    CRITICAL = "Critique"
}

export enum QualiteEauEnum {
    EXCELLENT = "excellent",
    BON = "bon",
    MOYEN = "moyen",
    MAUVAIS = "mauvais"
}

// Énumérations Pydantic
export enum SexeEnum {
  MALE = "male",
  FEMELLE = "femelle"
}

export enum TypeElevage {
  BOVIN = "Bovin",
  CAPRIN = "Caprin",
  OVIN = "Ovin",
  PISCICOLE = "Piscicole",
  AVICOLE = "Avicole"
}

export enum TypeBatimentBovin {
  STABULATION_LIBRE = "Stabulation libre",
  STABULATION_ENTRAVEE = "Stabulation entravée",
  SALLE_DE_TRAITE = "Salle de traite",
  LAITIER = "Bâtiment laitier",
  ENGRAISSEMENT = "Bâtiment d'engraissement"
}

export enum TypeBatimentCaprin {
  CAPRIN_LIBRE = "Étable caprine libre",
  CAPRIN_TRAITE = "Salle de traite caprine",
  FROMAGERIE = "Fromagerie"
}

export enum TypeBatimentOvin {
  OVIN_LIBRE = "Bergerie libre",
  OVIN_ENGRAISSEMENT = "Bâtiment d'engraissement ovin",
  LAINAGE = "Atelier de lainage"
}

export enum TypeBatimentPiscicole {
  BASSIN_EXT = "Bassin extérieur",
  BASSIN_INT = "Bassin intérieur",
  ECLOSERIE = "Écloserie",
  AQUAPONIE = "Système aquaponique"
}

export enum TypeBatimentAvicole {
  VOLIERE = "Volière",
  CAGE = "Élevage en cage",
  PLEIN_AIR = "Élevage plein air",
  COUVEUSE = "Couveuse",
  BROYAGE = "Unité de broyage"
}

// Fonction pour obtenir les types de bâtiment en fonction du type d'élevage
export const getTypesBatiment = (typeElevage: TypeElevage | undefined) => {
  switch (typeElevage) {
    case TypeElevage.BOVIN:
      return Object.values(TypeBatimentBovin);
    case TypeElevage.CAPRIN:
      return Object.values(TypeBatimentCaprin);
    case TypeElevage.OVIN:
      return Object.values(TypeBatimentOvin);
    case TypeElevage.PISCICOLE:
      return Object.values(TypeBatimentPiscicole);
    case TypeElevage.AVICOLE:
      return Object.values(TypeBatimentAvicole);
    default:
      return [];
  }
};

export enum AlerteType {
    SANTE = "Santé",
    PRODUCTION = "Production laitière",
    ALIMENTATION = "Alimentation",
    REPRODUCTION = "Reproduction",
    ENVIRONNEMENT = "Environnement",
    SYSTEME = "global"
}

export enum TypeAliment {
    DEMARRAGE = "demarrage",
    CROISSANCE = "croissance",
    FINITION = "finition"
}

export enum EtatVentilationEnum {
    OPTIMALE = "Optimale",
    NORMALE = "Normale",
    INSUFFISANTE = "Insuffisante",
    DEFECTUEUSE = "Défectueuse"
}

export enum StatutAnimalEnum {
    EN_CROISSANCE = "En croissance",
    PRODUCTIF = "Productif",
    REFORME = "Réformé",
    VENDU = "vendu",
    MORT = "mort",
    ENGRAISSEMENT = "engraissement"
}

export enum TypeProductionCaprinOvinEnum {
    LAIT = "Lait",
    LAINE = "Laine",
    VIANDE = "Viande",
    PEAU = "Peau",
    MIXTE = "Mixte"
}

export enum TypeTraitementEnum {
    VACCINATION = "vaccination",
    VERMIFUGE = "vermifuge",
    ANTIBIOTIQUE = "antibiotique",
    ANTIPARASITAIRE = "antiparasitaire",
    ANTI_INFLAMMATOIRE = "anti_inflammatoire",
    PEDICURE = "pedicure",
    TRAITEMENT_MAMMITE = "traitement_mammite",
    SYNCHRONISATION = "synchronisation",
    AUTRE = "autre"
}

export enum TypeProductionEnum {
    LAIT = "lait",
    VIANDE = "viande",
    LAINE = "laine",
    MIXTE = "mixte"
}

export enum TypeEventEnum {
    NAISSANCE = "naissance",
    SEVRAGE = "sevrage",
    SAILLIE = "saillie",
    VELAGE = "velage",
    TARISSEMENT = "tarissement",
    MISE_REPRODUCTION = "mise_reproduction",
    VACCINATION = "vaccination",
    TRAITEMENT = "traitement",
    PESEE = "pesee",
    CONTROLE_LAITIER = "controle_laitier",
    VENTE = "vente",
    DECES = "deces",
    CHANGEMENT_LOT = "changement_lot"
}

export enum Saison {
    HIVER = "HIVER",
    PRINTEMPS = "PRINTEMPS",
    ETE = "ETE",
    AUTOMNE = "AUTOMNE"
}

export enum TypeAlimentation {
    PATURAGE = "PATURAGE",
    AFFOURAGEMENT = "AFFOURAGEMENT",
    MIXTE = "MIXTE"
}
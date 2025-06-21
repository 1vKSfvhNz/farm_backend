from enum import Enum as PyEnum

class TypeElevage(PyEnum):
    BOVIN = "Bovin"
    CAPRIN = "Caprin"
    OVIN = "Ovin"
    PISCICOLE = "Piscicole"
    AVICOLE = "Avicole"

class AlerteType(PyEnum):
    SANTE = "Santé"
    PRODUCTION = "Production laitière"
    ALIMENTATION = "Alimentation"
    REPRODUCTION = "Reproduction"
    ENVIRONNEMENT = "Environnement"
    SYSTEME = "global"

class PhaseElevage(PyEnum):
    DEMARRAGE = "demarrage"
    CROISSANCE = "croissance"
    FINITION = "finition"

class TypeAliment(PyEnum):
    STARTER = "starter"
    GROWER = "grower"
    FINISHER = "finisher"

class EtatVentilationEnum(PyEnum):
    OPTIMALE = "Optimale"
    NORMALE = "Normale"
    INSUFFISANTE = "Insuffisante"
    DEFECTUEUSE = "Défectueuse"

class StatutAnimalEnum(str, PyEnum):
    EN_CROISSANCE = "En croissance"
    PRODUCTIF = "Productif"
    REFORME = "Réformé"
    VENDU = "vendu"
    MORT = "mort"
    ENGRAISSEMENT = "engraissement"

class TypeProductionCaprinOvinEnum(PyEnum):
    LAIT = "Lait"
    LAINE = "Laine"
    VIANDE = "Viande"
    PEAU = "Peau"
    MIXTE = "Mixte"

class TypeTraitementEnum(str, PyEnum):
    VACCINATION = "vaccination"
    VERMIFUGE = "vermifuge"
    ANTIBIOTIQUE = "antibiotique"
    ANTIPARASITAIRE = "antiparasitaire"
    ANTI_INFLAMMATOIRE = "anti_inflammatoire"
    PEDICURE = "pedicure"
    TRAITEMENT_MAMMITE = "traitement_mammite"
    SYNCHRONISATION = "synchronisation"
    AUTRE = "autre"

class TypeProductionEnum(str, PyEnum):
    LAIT = "lait"
    VIANDE = "viande"
    LAINE = "laine"
    MIXTE = "mixte"

class TypeEventEnum(str, PyEnum):
    NAISSANCE = "naissance"
    SEVRAGE = "sevrage"
    SAILLIE = "saillie"
    VELAGE = "velage"
    TARISSEMENT = "tarissement"
    MISE_REPRODUCTION = "mise_reproduction"
    VACCINATION = "vaccination"
    TRAITEMENT = "traitement"
    PESEE = "pesee"
    CONTROLE_LAITIER = "controle_laitier"
    VENTE = "vente"
    DECES = "deces"
    CHANGEMENT_LOT = "changement_lot"

class Saison(str, PyEnum):
    HIVER = "HIVER"
    PRINTEMPS = "PRINTEMPS"
    ETE = "ETE"
    AUTOMNE = "AUTOMNE"

class TypeAlimentation(str, PyEnum):
    PATURAGE = "PATURAGE"
    AFFOURAGEMENT = "AFFOURAGEMENT"
    MIXTE = "MIXTE"
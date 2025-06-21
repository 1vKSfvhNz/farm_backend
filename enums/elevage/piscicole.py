# enum Piscicole
from enum import Enum as PyEnum

class TypeMilieuPiscicoleEnum(PyEnum):
    EAU_DOUCE = "Eau douce"
    EAU_SAUMATRE = "Eau saumâtre"
    EAU_MARINE = "Eau marine"

class TypeElevagePiscicoleEnum(PyEnum):
    BASSIN = "Bassin"
    CAGE = "Cage"
    ETANG = "Étang"
    RECIRCULATION = "Système en recirculation"

class TypeAlimentPoissonEnum(PyEnum):
    GRANULES = "Granulés"
    FARINE = "Farine"
    VIVANT = "Vivant"
    VEGETAL = "Végétal"

class EspecePoissonEnum(PyEnum):
    """Espèces de poissons d'élevage"""
    TILAPIA = "tilapia"
    CARPE = "carpe"
    SILURE = "silure"
    CAPITAINE = "capitaine"


class ComportementPoisson(PyEnum):
    """Comportement observé des poissons"""
    ACTIF = "actif"
    LETHARGIQUE = "lethargique"
    STRESSE = "stresse"
    AGRESSIF = "agressif"
    NORMAL = "normal"


class AlimentType(PyEnum):
    """Types d'aliments selon la phase d'élevage"""
    STARTER = "starter"         # Pour les alevins (0-4 semaines)
    GROWER = "grower"           # Pour les juvéniles (4-12 semaines)
    FINISHER = "finisher"       # Pour la phase de grossissement/finition (>12 semaines)


class PhaseElevage(PyEnum):
    """Phases d'élevage des poissons"""
    ALEVIN = "alevin"           # 0-4 semaines
    JUVENILE = "juvenile"       # 4-12 semaines
    GROSSISSEMENT = "grossissement"  # 12-24 semaines
    FINITION = "finition"       # >24 semaines


class ConditionsMeteo(PyEnum):
    """Conditions météorologiques"""
    ENSOLEILLE = "ensoleille"
    NUAGEUX = "nuageux"
    PLUVIEUX = "pluvieux"
    ORAGEUX = "orageux"


class CauseMortalite(PyEnum):
    """Causes principales de mortalité"""
    MALADIE = "maladie"
    STRESS = "stress"
    QUALITE_EAU = "qualite_eau"
    PREDATION = "predation"
    MANIPULATION = "manipulation"
    INCONNUE = "inconnue"



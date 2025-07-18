# enum Piscicole
from enum import Enum as PyEnum

class TypeMilieuPiscicoleEnum(PyEnum):
    EAU_DOUCE = "Eau douce"
    EAU_SAUMATRE = "Eau saumâtre"

class TypeHabitatPiscicoleEnum(PyEnum):
    BASSIN = "Bassin"
    CAGE = "Cage"
    ETANG = "Étang"
    RECIRCULATION = "Système en recirculation"

class TypeAlimentPoissonEnum(PyEnum):
    GRANULES = "Granulés"
    FARINE = "Farine"
    ASTICOT = "Asticot"
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

class StadePoisson(PyEnum):
    """Énumération des stades de développement des poissons."""
    
    # Stades embryonnaires et larves
    OEUF = "oeuf"
    ALEVIN = "alevin"
    LARVE = "larve"
    
    # Stades juvéniles
    JUVENILE = "juvenile"
    JUVENILE_PRECOCE = "juvenile_precoce"
    JUVENILE_TARDIF = "juvenile_tardif"
    
    # Stades adultes
    SUBADULTE = "subadulte"
    ADULTE = "adulte"
    REPRODUCTEUR = "reproducteur"
    
    # Stades spécialisés
    GENITEUR = "geniteur"  # Poisson utilisé spécifiquement pour la reproduction
    REFORME = "reforme"    # Poisson en fin de vie productive
    
    def __str__(self):
        return self.value
    
    @classmethod
    def get_description(cls, stade):
        """Retourne une description détaillée du stade."""
        descriptions = {
            cls.OEUF: "Œuf fécondé, stade embryonnaire",
            cls.ALEVIN: "Jeune poisson avec sac vitellin (0-30 jours)",
            cls.LARVE: "Larve libre après résorption du sac vitellin",
            cls.JUVENILE: "Poisson juvénile en croissance",
            cls.JUVENILE_PRECOCE: "Juvénile précoce (1-3 mois)",
            cls.JUVENILE_TARDIF: "Juvénile tardif (3-6 mois)",
            cls.SUBADULTE: "Poisson approchant la maturité sexuelle",
            cls.ADULTE: "Poisson adulte mature",
            cls.REPRODUCTEUR: "Poisson adulte en période de reproduction",
            cls.GENITEUR: "Poisson sélectionné pour la reproduction",
            cls.REFORME: "Poisson en fin de vie productive"
        }
        return descriptions.get(stade, "Stade non défini")
    
    @classmethod
    def get_age_approximatif(cls, stade, espece=None):
        """Retourne l'âge approximatif selon le stade (en jours)."""
        # Âges spécifiques aux espèces du Burkina Faso
        ages = {
            # Tilapia (croissance rapide)
            "tilapia": {
                cls.OEUF: (0, 3),
                cls.ALEVIN: (3, 30),
                cls.LARVE: (20, 45),
                cls.JUVENILE: (30, 120),
                cls.JUVENILE_PRECOCE: (30, 60),
                cls.JUVENILE_TARDIF: (60, 120),
                cls.SUBADULTE: (120, 180),
                cls.ADULTE: (180, 1095),  # 6 mois - 3 ans
                cls.REPRODUCTEUR: (180, 1095),
                cls.GENITEUR: (180, 1460),  # 6 mois - 4 ans
                cls.REFORME: (1095, 2190)  # 3-6 ans
            },
            # Carpe (croissance moyenne)
            "carpe": {
                cls.OEUF: (0, 5),
                cls.ALEVIN: (5, 40),
                cls.LARVE: (30, 90),
                cls.JUVENILE: (90, 270),
                cls.JUVENILE_PRECOCE: (90, 180),
                cls.JUVENILE_TARDIF: (180, 270),
                cls.SUBADULTE: (270, 365),
                cls.ADULTE: (365, 2555),  # 1-7 ans
                cls.REPRODUCTEUR: (365, 2555),
                cls.GENITEUR: (730, 3650),  # 2-10 ans
                cls.REFORME: (2555, 5475)  # 7-15 ans
            },
            # Espèces marines (maquereau, chinchard - croissance variable)
            "maquereau": {
                cls.OEUF: (0, 5),
                cls.ALEVIN: (5, 60),
                cls.LARVE: (45, 120),
                cls.JUVENILE: (120, 365),
                cls.SUBADULTE: (365, 730),
                cls.ADULTE: (730, 3650),  # 2-10 ans
                cls.REPRODUCTEUR: (730, 3650),
                cls.REFORME: (3650, 5475)  # 10-15 ans
            },
            # Capitaine (croissance lente)
            "capitaine": {
                cls.OEUF: (0, 7),
                cls.ALEVIN: (7, 90),
                cls.LARVE: (60, 180),
                cls.JUVENILE: (180, 540),
                cls.SUBADULTE: (540, 1095),
                cls.ADULTE: (1095, 5475),  # 3-15 ans
                cls.REPRODUCTEUR: (1095, 5475),
                cls.REFORME: (3650, 7300)  # 10-20 ans
            }
        }
        
        if espece and espece.lower() in ages:
            return ages[espece.lower()].get(stade, (0, 0))
        
        # Valeurs par défaut pour espèces non spécifiées
        default_ages = {
            cls.OEUF: (0, 7),
            cls.ALEVIN: (1, 60),
            cls.LARVE: (30, 120),
            cls.JUVENILE: (60, 365),
            cls.JUVENILE_PRECOCE: (60, 180),
            cls.JUVENILE_TARDIF: (180, 365),
            cls.SUBADULTE: (180, 730),
            cls.ADULTE: (365, 3650),
            cls.REPRODUCTEUR: (365, 3650),
            cls.GENITEUR: (365, 5475),
            cls.REFORME: (1825, 7300)
        }
        return default_ages.get(stade, (0, 0))
    
    @classmethod
    def get_stades_chronologiques(cls):
        """Retourne les stades dans l'ordre chronologique."""
        return [
            cls.OEUF,
            cls.ALEVIN,
            cls.LARVE,
            cls.JUVENILE_PRECOCE,
            cls.JUVENILE,
            cls.JUVENILE_TARDIF,
            cls.SUBADULTE,
            cls.ADULTE,
            cls.REPRODUCTEUR,
            cls.GENITEUR,
            cls.REFORME
        ]
    
    @classmethod
    def get_stades_reproducteurs(cls):
        """Retourne les stades aptes à la reproduction."""
        return [
            cls.ADULTE,
            cls.REPRODUCTEUR,
            cls.GENITEUR
        ]
    
    @classmethod
    def get_stades_commerciaux(cls, espece=None):
        """Retourne les stades commercialisables."""
        # Stades commerciaux spécifiques selon les espèces
        commercial_stages = {
            "tilapia": [cls.JUVENILE_TARDIF, cls.SUBADULTE, cls.ADULTE],
            "carpe": [cls.SUBADULTE, cls.ADULTE],
            "maquereau": [cls.SUBADULTE, cls.ADULTE],
            "capitaine": [cls.ADULTE]
        }
        
        if espece and espece.lower() in commercial_stages:
            return commercial_stages[espece.lower()]
        
        return [
            cls.JUVENILE_TARDIF,
            cls.SUBADULTE,
            cls.ADULTE
        ]
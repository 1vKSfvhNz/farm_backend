# Enums Avicole
from enum import Enum as PyEnum

class TypeProductionAvicoleEnum(PyEnum):
    PONTE = "Ponte"
    VIANDE = "Viande"
    MIXTE = "Mixte"

class TypeLogementAvicoleEnum(PyEnum):
    PLEIN_AIR = "Plein air"
    VOLIERE = "Volière"
    CAGE = "Cage"
    BATIMENT = "Bâtiment"

class TypeVolailleEnum(PyEnum):
    POULET = "Poulet"
    POULE = "Poule"
    CANARD = "Canard"
    DINDON = "Dindon"
    CAILLE = "Caille"
    AUTRE = "Autre"

class SystemeElevageAvicoleEnum(PyEnum):
    PLEIN_AIR = "Plein air"
    INTENSIF = "Intensif"
    BIO = "Bio"
    LABEL = "Label"

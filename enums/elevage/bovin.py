# enum Bovin
from enum import Enum as PyEnum

class TypeProductionBovinEnum(PyEnum):
    LAITIERE = "Laitière"
    VIANDE = "Viande"
    MIXTE = "Mixte"

class StatutReproductionBovinEnum(PyEnum):
    NULLIPARE = "Nullipare"
    PLEINE = "Pleine"
    LACTATION = "Lactation"
    TARIE = "Tarie"
    REPOS = "Repos"

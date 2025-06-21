# enum ovin
from enum import Enum as PyEnum

class QualiteLaineEnum(str, PyEnum):
    EXTRA_FINE = "extra_fine"
    FINE = "fine"
    MOYENNE = "moyenne"
    GROSSIERE = "grossiere"

class TypeToisonEnum(PyEnum):
    FINE = "Fine"
    MOYENNE = "Moyenne"
    GROSSIERE = "Grossière"
    SPECIALE = "Spéciale"

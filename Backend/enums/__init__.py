# enum ferme
from enum import Enum as PyEnum

class AlertSeverity(str, PyEnum):
    LOW = "Faible"
    MEDIUM = "Moyenne"
    HIGH = "Haute"
    CRITICAL = "Critique"

class QualiteEauEnum(PyEnum):
    EXCELLENT = "excellent"
    BON = "bon"
    MOYEN = "moyen"
    MAUVAIS = "mauvais"

# Énumérations Pydantic
class SexeEnum(str, PyEnum):
    MALE = "male"
    FEMELLE = "femelle"

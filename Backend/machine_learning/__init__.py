from .prediction.elevage.avicole import AvicolePredictor
from .prediction.elevage.bovin import BovinProductionPredictor
from .prediction.elevage.caprin import CaprinProductionPredictor
from .prediction.elevage.ovin import OvinProductionPredictor
from .prediction.elevage.piscicole import PisciculturePredictor

__all__ = [
    "AvicolePredictor",
    "BovinProductionPredictor",
    "CaprinProductionPredictor",
    "OvinProductionPredictor",
    "PisciculturePredictor"
]

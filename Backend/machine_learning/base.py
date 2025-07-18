from dataclasses import dataclass
from typing import Dict

@dataclass
class ModelPerformance:
    """Structure pour stocker les performances des modèles"""
    model_name: str
    mse: float = 0.0
    mae: float = 0.0
    r2: float = 0.0
    cv_score: float = 0.0
    accuracy: float = 0.0  # Pour les modèles de classification
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
    
    def to_dict(self) -> Dict:
        """Convertit en dictionnaire pour faciliter l'export"""
        return {
            'model_name': self.model_name,
            'mse': self.mse,
            'mae': self.mae,
            'r2': self.r2,
            'cv_score': self.cv_score,
            'accuracy': self.accuracy,
            'precision': self.precision,
            'recall': self.recall,
            'f1_score': self.f1_score
        }
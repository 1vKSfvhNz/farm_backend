import numpy as np
from datetime import datetime
from pandas import DataFrame, to_datetime, cut, notna
from sqlalchemy.orm import Session
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, classification_report
import joblib
import warnings
from dataclasses import dataclass
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings('ignore')

@dataclass
class ModelPerformance:
    """Classe pour stocker les performances des modèles"""
    model_name: str
    mse: float
    mae: float
    r2: float
    cv_score: float

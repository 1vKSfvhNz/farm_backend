from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from typing import Dict, Union, Optional
from enums.elevage.piscicole import PhaseElevage
from models import DatabaseLoader
from machine_learning.base import ModelPerformance
from pathlib import Path

# Configuration des chemins - définie au niveau module
PARENT_DIR = Path(__file__).parent.parent
MODELS_DIR = PARENT_DIR / "ml_files"
MODELS_DIR.mkdir(exist_ok=True, parents=True)

class PisciculturePredictor:
    """
    Modèle de machine learning pour les prédictions en élevage piscicole.
    """
    
    def __init__(self, db_session: Optional[Union[AsyncSession, Session]] = None, 
                 model_path: Optional[str] = None):
        """
        Initialise le prédicteur piscicole.
        
        Args:
            db_session: Session SQLAlchemy (synchrone ou asynchrone)
            model_path: Chemin vers un modèle pré-entraîné à charger
        """
        self.loader = DatabaseLoader(db_session)
        self.db_session = db_session
        self.is_async = isinstance(db_session, AsyncSession) if db_session else False
        self.regression_models = {
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42)
        }
        self.classification_models = {
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42)
        }
        self.scaler = StandardScaler()
        self.best_models = {}
        self.features = {
            'croissance': ['temperature', 'ph', 'oxygene_dissous', 'ammoniac', 'nitrites', 'nitrates', 'salinite', 'turbidite'],
            'mortalite': ['temperature', 'ph', 'oxygene_dissous', 'ammoniac', 'nitrites', 'phase_elevage', 'densite_poissons'],
            'qualite_eau': ['temperature', 'ph', 'oxygene_dissous', 'ammoniac', 'nitrites', 'nitrates', 'salinite', 'turbidite']
        }
        
        if model_path:
            self.load_model(model_path)
    
    # Modifier la méthode prepare_training_data_async
    async def prepare_training_data_async(self, target: str = 'croissance') -> tuple:
        """Version asynchrone de la préparation des données"""
        if not self.db_session or not self.is_async:
            raise ValueError("Async DB session must be set to prepare training data")
            
        try:
            query = """
            SELECT 
                c.id, c.date_controle, c.temperature, c.ph, c.oxygene_dissous,
                c.ammoniac, c.nitrites, c.nitrates, c.salinite, c.turbidite,
                c.qualite_eau, c.bassin_id,
                b.volume,
                COUNT(p.id) as nombre_poissons,
                AVG(r.poids_moyen) as poids_moyen_recolte,
                MIN(p.poids_ensemencement) as poids_ensemencement,
                MIN(p.date_ensemencement) as date_ensemencement
            FROM controles_eau c
            LEFT JOIN bassins_piscicole b ON c.bassin_id = b.id
            LEFT JOIN poissons p ON p.bassin_id = c.bassin_id
            LEFT JOIN recoltes_poisson r ON r.bassin_id = c.bassin_id
            GROUP BY c.id, b.id
            """
            
            result = await self.db_session.execute(text(query))
            rows = result.fetchall()
            
            # Conversion en DataFrame
            df = pd.DataFrame(rows, columns=result.keys())
            return self._process_data(df, target)
        except Exception as e:
            if self.db_session:
                await self.db_session.rollback()
            raise e
    
    def prepare_training_data_sync(self, target: str = 'croissance') -> tuple:
        """Version synchrone de la préparation des données"""
        query = """
        SELECT 
            c.id, c.date_controle, c.temperature, c.ph, c.oxygene_dissous,
            c.ammoniac, c.nitrites, c.nitrates, c.salinite, c.turbidite,
            c.qualite_eau, c.bassin_id,
            b.volume,
            COUNT(p.id) as nombre_poissons,
            AVG(r.poids_moyen) as poids_moyen_recolte,
            MIN(p.poids_ensemencement) as poids_ensemencement,
            MIN(p.date_ensemencement) as date_ensemencement
        FROM controles_eau c
        LEFT JOIN bassins_piscicole b ON c.bassin_id = b.id
        LEFT JOIN poissons p ON p.bassin_id = c.bassin_id
        LEFT JOIN recoltes_poisson r ON r.bassin_id = c.bassin_id
        GROUP BY c.id, b.id
        """
        
        df = self.loader.execute_query(text(query))
        return self._process_data(df, target)
        
    def _process_data(self, df: pd.DataFrame, target: str):
        """Traite les données communes aux deux modes"""
        # Calcul de la densité
        df['densite_poissons'] = df['nombre_poissons'] / df['volume']
        
        # Calcul du taux de croissance
        df['taux_croissance'] = (df['poids_moyen_recolte'] - df['poids_ensemencement']) / df['poids_ensemencement']
        
        # Détermination de la phase d'élevage
        df['phase_elevage'] = df.apply(
            lambda row: self._determiner_phase_elevage(
                row['date_controle'], 
                row['date_ensemencement']
            ).value if row['date_ensemencement'] else None,
            axis=1
        )
        
        # Nettoyage des données
        df = df.dropna(subset=self.features[target])
        df = df.fillna(df.mean())
        
        # Séparation features/target selon le problème
        if target == 'croissance':
            X = df[self.features['croissance']]
            y = df['taux_croissance']
        elif target == 'mortalite':
            X = df[self.features['mortalite']]
            y = np.random.randint(0, 2, size=len(df))  # Exemple - à remplacer
        elif target == 'qualite_eau':
            X = df[self.features['qualite_eau']]
            y = df['qualite_eau']
        
        return X, y
    
    def prepare_data(self, target: str = 'croissance') -> tuple:
        """Charge les données en fonction du mode"""
        if self.is_async:
            return self.prepare_training_data_async(target)
        return self.prepare_training_data_sync(target)
    
    def _determiner_phase_elevage(self, date_controle: datetime, date_ensemencement: datetime) -> Optional[PhaseElevage]:
        """Détermine la phase d'élevage basée sur la durée depuis l'ensemencement."""
        if not date_ensemencement or not date_controle:
            return None
            
        delta = (date_controle - date_ensemencement).days
        semaines = delta / 7
        
        if semaines < 4:
            return PhaseElevage.ALEVIN
        elif 4 <= semaines < 12:
            return PhaseElevage.JUVENILE
        elif 12 <= semaines < 24:
            return PhaseElevage.GROSSISSEMENT
        else:
            return PhaseElevage.FINITION
    
    def train_models(self, target: str = 'croissance') -> Dict[str, ModelPerformance]:
        """
        Entraîne les modèles pour un problème spécifique.
        
        Args:
            target: Type de prédiction ('croissance', 'mortalite', 'qualite_eau')
            
        Returns:
            Dictionnaire des performances des modèles
        """
        X, y = self.prepare_data(target)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        performances = {}
        
        if target in ['croissance']:  # Problème de régression
            for name, model in self.regression_models.items():
                pipeline = Pipeline([
                    ('scaler', self.scaler),
                    ('model', model)
                ])
                
                pipeline.fit(X_train, y_train)
                y_pred = pipeline.predict(X_test)
                
                # Évaluation
                perf = ModelPerformance(model_name=name)
                perf.mse = mean_squared_error(y_test, y_pred)
                perf.mae = mean_absolute_error(y_test, y_pred)
                perf.r2 = r2_score(y_test, y_pred)
                perf.cv_score = np.mean(cross_val_score(pipeline, X, y, cv=5))
                
                performances[name] = perf
                self.best_models[target] = pipeline  # On stocke le meilleur modèle
                
        else:  # Problème de classification
            for name, model in self.classification_models.items():
                pipeline = Pipeline([
                    ('scaler', self.scaler),
                    ('model', model)
                ])
                
                pipeline.fit(X_train, y_train)
                y_pred = pipeline.predict(X_test)
                
                # Évaluation
                perf = ModelPerformance(model_name=name)
                perf.accuracy = accuracy_score(y_test, y_pred)
                perf.precision = precision_score(y_test, y_pred, average='weighted')
                perf.recall = recall_score(y_test, y_pred, average='weighted')
                perf.f1_score = f1_score(y_test, y_pred, average='weighted')
                perf.cv_score = np.mean(cross_val_score(pipeline, X, y, cv=5))
                
                performances[name] = perf
                self.best_models[target] = pipeline  # On stocke le meilleur modèle
        
        return performances
    
    def predict(self, target: str, features: Dict) -> Union[float, str]:
        """
        Effectue une prédiction avec le modèle entraîné.
        
        Args:
            target: Type de prédiction ('croissance', 'mortalite', 'qualite_eau')
            features: Dictionnaire des caractéristiques d'entrée
            
        Returns:
            La prédiction (valeur numérique ou catégorielle)
        """
        if target not in self.best_models:
            raise ValueError(f"Aucun modèle entraîné pour la cible '{target}'. Veuillez d'abord entraîner un modèle.")
            
        # Conversion des features en DataFrame
        input_df = pd.DataFrame([features])
        
        # Vérification des colonnes nécessaires
        required_cols = self.features[target]
        missing_cols = set(required_cols) - set(input_df.columns)
        if missing_cols:
            raise ValueError(f"Colonnes manquantes pour la prédiction: {missing_cols}")
            
        # Réorganisation des colonnes
        input_df = input_df[required_cols]
        
        # Prédiction
        prediction = self.best_models[target].predict(input_df)
        
        return prediction[0]
        
    def save_model(self, filename: str = "piscicole_model.joblib") -> str:
        """
        Sauvegarde tous les modèles et métadonnées dans un fichier.
        
        Args:
            filename: Nom du fichier de sauvegarde
            
        Returns:
            str: Chemin complet du fichier sauvegardé
            
        Raises:
            ValueError: Si aucun modèle n'est entraîné
        """
        if not self.best_models:
            raise ValueError("Aucun modèle entraîné à sauvegarder")
        
        filepath = MODELS_DIR / filename
        
        # Préparation des données à sauvegarder
        data = {
            'best_models': self.best_models,
            'features': self.features,
            'regression_models': {k: type(v).__name__ for k, v in self.regression_models.items()},
            'classification_models': {k: type(v).__name__ for k, v in self.classification_models.items()},
            'metadata': {
                'saved_at': datetime.now().isoformat(),
                'version': '1.0'
            }
        }
        
        joblib.dump(data, filepath)
        return str(filepath)

    def load_model(self, filename: str = "piscicole_model.joblib"):
        """
        Charge les modèles depuis un fichier.
        
        Args:
            filename: Nom du fichier à charger
            
        Returns:
            self: Pour permettre le chaînage
            
        Raises:
            FileNotFoundError: Si le fichier n'existe pas
            KeyError: Si le fichier est corrompu
        """
        filepath = MODELS_DIR / filename
        
        if not filepath.exists():
            raise FileNotFoundError(f"Le fichier de modèle {filepath} n'existe pas")
        
        data = joblib.load(filepath)
        
        # Vérification des clés essentielles
        required_keys = {'best_models', 'features'}
        if not required_keys.issubset(data.keys()):
            raise KeyError("Fichier de modèle corrompu ou incompatible")
        
        # Chargement des données
        self.best_models = data['best_models']
        self.features = data.get('features', self.features)  # Garde les valeurs par défaut si non présentes
        
        return self


# Exemple d'utilisation
if __name__ == "__main__":
    predictor = PisciculturePredictor()
    
    # Entraînement pour la prédiction de croissance
    print("Entraînement du modèle de croissance...")
    perf_croissance = predictor.train_models('croissance')
    for name, perf in perf_croissance.items():
        print(f"Modèle {name}: R2 = {perf.r2:.2f}, MSE = {perf.mse:.2f}")
    
    # Exemple de prédiction
    example_features = {
        'temperature': 28.5,
        'ph': 7.2,
        'oxygene_dissous': 6.8,
        'ammoniac': 0.05,
        'nitrites': 0.1,
        'nitrates': 5.0,
        'salinite': 0.5,
        'turbidite': 10.0
    }
    
    prediction = predictor.predict('croissance', example_features)
    print(f"Prédiction de taux de croissance: {prediction:.2%}")
    
    # Sauvegarde du modèle
    predictor.save_model('croissance', 'modele_croissance_piscicole.joblib')
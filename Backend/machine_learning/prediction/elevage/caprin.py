import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from xgboost import XGBRegressor
from datetime import datetime
from machine_learning.base import ModelPerformance
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Union, Dict
from joblib import dump, load
from models import DatabaseLoader, get_async_db_session
from models.elevage.caprin import Caprin
from models.elevage import Animal
from pathlib import Path

# Configuration des chemins - définie au niveau module
PARENT_DIR = Path(__file__).parent.parent
MODELS_DIR = PARENT_DIR / "ml_files"
MODELS_DIR.mkdir(exist_ok=True, parents=True)

class CaprinProductionPredictor:
    """
    Modèle de prédiction pour la production laitière caprine
    """
    
    def __init__(self, db_session: Optional[Union[AsyncSession, Session]] = None, 
                 model_path: Optional[str] = None):
        """
        Initialise le prédicteur de production caprine.
        
        Args:
            db_session: Session SQLAlchemy (synchrone ou asynchrone)
            model_path: Chemin vers un modèle pré-entraîné à charger
        """
        self.loader = DatabaseLoader(db_session)
        self.db_session = db_session
        self.is_async = isinstance(db_session, AsyncSession) if db_session else False
        self.model = None
        self.preprocessor = None
        self.features = [
            'age_jours',
            'periode_lactation',
            'taux_matiere_grasse_moyen',
            'taux_proteine_moyen',
            'production_lait_cumulee',
            'nombre_mises_bas',
            'saison',
            'temperature_moyenne',
            'alimentation_score'
        ]
        self.target = 'production_journaliere'
        self.model_performance = ModelPerformance(model_name="CaprinProductionPredictor")
        
        if model_path:
            self.load_model(model_path)
    
    # Modifier la méthode prepare_training_data_async
    async def prepare_training_data_async(self) -> pd.DataFrame:
        """
        Charge les données depuis la base de données en mode asynchrone
        """
        try:
            query = """
            SELECT 
                c.id,
                c.periode_lactation,
                c.production_lait_cumulee,
                c.taux_matiere_grasse_moyen,
                c.taux_proteine_moyen,
                cl.date_controle,
                cl.production_journaliere,
                cl.taux_matiere_grasse,
                cl.taux_proteine,
                a.date_naissance
            FROM 
                caprins c
            JOIN 
                animaux a ON c.id = a.id
            JOIN 
                controles_laitiers_caprin cl ON c.id = cl.caprin_id
            """
            
            df = await self.loader.execute_query(text(query))
            return self._process_data(df)
        except Exception as e:
            if self.db_session:
                await self.db_session.rollback()
            raise e
        
    def prepare_training_data_sync(self) -> pd.DataFrame:
        """
        Charge les données depuis la base de données en mode synchrone
        """
        query = """
            SELECT 
                c.id,
                c.periode_lactation,
                c.production_lait_cumulee,
                c.taux_matiere_grasse_moyen,
                c.taux_proteine_moyen,
                cl.date_controle,
                cl.production_journaliere,
                cl.taux_matiere_grasse,
                cl.taux_proteine,
                a.date_naissance,
                COUNT(DISTINCT i.id) as nombre_mises_bas
            FROM 
                caprins c
            JOIN 
                animaux a ON c.id = a.id
            JOIN 
                controles_laitiers_caprin cl ON c.id = cl.caprin_id
            LEFT JOIN 
                inseminations i ON a.id = i.animal_id AND i.resultat = 'POSITIF'
            GROUP BY 
                c.id, cl.id, a.id
        """
        
        df = self.loader.execute_query(text(query))
        return self._process_data(df)
    
    def _process_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Traite les données communes aux deux modes"""
        # Calcul de l'âge en jours
        df['age_jours'] = (df['date_controle'] - df['date_naissance']).dt.days
        
        # Extraction de la saison
        df['saison'] = df['date_controle'].dt.month.apply(self._get_season)
        
        # Ajout de données météo simulées
        df['temperature_moyenne'] = np.random.normal(15, 5, len(df))
        
        # Score d'alimentation simplifié
        df['alimentation_score'] = np.random.uniform(0.7, 1.3, len(df))
        
        return df
            
    def _get_season(self, month: int) -> str:
        """Convertit le mois en saison"""
        if month in [12, 1, 2]:
            return 'HIVER'
        elif month in [3, 4, 5]:
            return 'PRINTEMPS'
        elif month in [6, 7, 8]:
            return 'ETE'
        else:
            return 'AUTOMNE'
    
    def preprocess_data(self, data: pd.DataFrame) -> tuple:
        """
        Prétraitement des données pour le modèle
        """
        # Séparation features/target
        X = data[self.features]
        y = data[self.target]
        
        # Définition des colonnes numériques et catégorielles
        numeric_features = [f for f in self.features if f != 'saison']
        categorical_features = ['saison']
        
        # Création du préprocesseur
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())])
        
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))])
        
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)])
        
        # Application du préprocessing
        X_processed = self.preprocessor.fit_transform(X)
        
        return X_processed, y
    
    def train_model(self, X, y, test_size: float = 0.2) -> None:
        """
        Entraîne le modèle et évalue ses performances
        """
        # Séparation train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42)
        
        # Essai de plusieurs modèles
        models = {
            'RandomForest': RandomForestRegressor(n_estimators=100, random_state=42),
            'XGBoost': XGBRegressor(n_estimators=100, random_state=42),
            'GradientBoosting': GradientBoostingRegressor(n_estimators=100, random_state=42)
        }
        
        best_score = -np.inf
        best_model = None
        
        for name, model in models.items():
            # Entraînement
            model.fit(X_train, y_train)
            
            # Prédiction
            y_pred = model.predict(X_test)
            
            # Évaluation
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            cv_score = cross_val_score(model, X, y, cv=5).mean()
            
            # Sauvegarde si meilleur modèle
            if r2 > best_score:
                best_score = r2
                best_model = model
                self.model_performance = ModelPerformance(
                    model_name=name,
                    mse=mse,
                    mae=mae,
                    r2=r2,
                    cv_score=cv_score
                )
        
        self.model = best_model
    
    async def predict_production(self, caprin_id: int, days_ahead: int = 7) -> Dict:
        """
        Prédit la production laitière pour un caprin donné sur les jours à venir
        """
        async with get_async_db_session() as session:
            # Récupération des données du caprin
            caprin = await session.get(Caprin, caprin_id)
            animal = await session.get(Animal, caprin_id)
            
            if not caprin or not animal:
                raise ValueError(f"Caprin avec ID {caprin_id} non trouvé")
            
            # Création des données pour la prédiction
            predictions = []
            current_date = datetime.now().date()
            
            for day in range(1, days_ahead + 1):
                prediction_date = current_date + pd.Timedelta(days=day)
                
                # Création des features pour la prédiction
                input_data = {
                    'age_jours': (prediction_date - animal.date_naissance).days,
                    'periode_lactation': caprin.periode_lactation + day if caprin.periode_lactation else 0,
                    'taux_matiere_grasse_moyen': caprin.taux_matiere_grasse_moyen or 3.5,
                    'taux_proteine_moyen': caprin.taux_proteine_moyen or 3.0,
                    'production_lait_cumulee': caprin.production_lait_cumulee or 0,
                    'nombre_mises_bas': 1,  # À remplacer par la vraie valeur
                    'saison': self._get_season(prediction_date.month),
                    'temperature_moyenne': 15,  # À remplacer par des données réelles
                    'alimentation_score': 1.0  # À remplacer par des données réelles
                }
                
                # Conversion en DataFrame
                input_df = pd.DataFrame([input_data])
                
                # Prétraitement
                X = self.preprocessor.transform(input_df)
                
                # Prédiction
                predicted_production = self.model.predict(X)[0]
                
                predictions.append({
                    'date': prediction_date.strftime('%Y-%m-%d'),
                    'predicted_production': round(predicted_production, 2),
                    'confidence_interval': round(predicted_production * 0.1, 2)  # Intervalle de confiance à 10%
                })
            
            return {
                'caprin_id': caprin_id,
                'caprin_name': animal.nom or f"Caprin {caprin_id}",
                'predictions': predictions,
                'model_performance': self.model_performance.to_dict()
            }
        
    def save_model(self, filename: str = "caprin_production_model.joblib") -> str:
        """
        Sauvegarde le modèle, le préprocesseur et les métadonnées.
        
        Args:
            filename: Nom du fichier de sauvegarde
            
        Returns:
            str: Chemin complet du fichier sauvegardé
        """
        if not self.model or not self.preprocessor:
            raise ValueError("Le modèle et le préprocesseur doivent être initialisés")
        
        filepath = MODELS_DIR / filename
        
        model_data = {
            'model': self.model,
            'preprocessor': self.preprocessor,
            'features': self.features,
            'target': self.target,
            'performance': self.model_performance.to_dict(),
            'metadata': {
                'saved_at': datetime.now().isoformat(),
                'version': '1.0'
            }
        }
        
        dump(model_data, filepath)
        return str(filepath)

    def load_model(self, filename: str = "caprin_production_model.joblib"):
        """
        Charge un modèle depuis un fichier.
        
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
        
        model_data = load(filepath)
        
        # Vérification des clés essentielles
        required_keys = {'model', 'preprocessor', 'features', 'target'}
        if not required_keys.issubset(model_data.keys()):
            raise KeyError("Fichier de modèle corrompu ou incompatible")
        
        # Chargement des données
        self.model = model_data['model']
        self.preprocessor = model_data['preprocessor']
        self.features = model_data['features']
        self.target = model_data['target']
        self.model_performance = ModelPerformance(**model_data['performance'])
        
        return self

class CaprinHealthPredictor:
    """
    Modèle pour prédire les problèmes de santé des caprins
    """
    
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.features = [
            'age_jours',
            'periode_lactation',
            'production_lait_cumulee',
            'taux_matiere_grasse_recent',
            'taux_proteine_recent',
            'cellules_somatiques_recent',
            'temperature_moyenne',
            'humidite_moyenne',
            'jours_depuis_dernier_traitement'
        ]
        self.target = 'risque_maladie'
        self.model_performance = ModelPerformance(model_name="CaprinHealthPredictor")
    
    async def train(self):
        """
        Entraîne le modèle de prédiction de santé
        """
        # Implémentation similaire à CaprinProductionPredictor
        # avec un focus sur la classification des risques de maladie
        pass

class CaprinBreedingOptimizer:
    """
    Modèle pour optimiser les accouplements et la génétique
    """
    
    def __init__(self):
        self.model = None
        self.features = [
            'production_lait_mere',
            'production_lait_pere',
            'taux_matiere_grasse_mere',
            'taux_matiere_grasse_pere',
            'sante_mere',
            'sante_pere',
            'lignee_maternelle',
            'lignee_paternelle'
        ]
        self.target = 'production_lait_progeniture'
        self.model_performance = ModelPerformance(model_name="CaprinBreedingOptimizer")
    
    async def predict_offspring_performance(self, mere_id: int, pere_id: int) -> Dict:
        """
        Prédit la performance des progénitures potentielles
        """
        # Implémentation pour prédire les caractéristiques des chevreaux
        # en fonction des parents
        pass
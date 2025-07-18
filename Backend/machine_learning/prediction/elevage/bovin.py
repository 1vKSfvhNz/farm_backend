import pandas as pd
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Union, Any, Dict, Optional
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (mean_absolute_error, r2_score, 
                             mean_squared_error)
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from datetime import datetime
from joblib import dump, load
import json
from machine_learning.base import ModelPerformance
from models import engine, DatabaseLoader
from pathlib import Path

# Configuration des chemins - définie au niveau module
PARENT_DIR = Path(__file__).parent.parent
MODELS_DIR = PARENT_DIR / "ml_files"
MODELS_DIR.mkdir(exist_ok=True, parents=True)

class BovinProductionPredictor:
    """
    Modèle de machine learning pour prédire la production laitière des bovins
    et optimiser les opérations d'élevage.
    """
        
    def __init__(self, db_session: Optional[Union[AsyncSession, Session]] = None, 
                 model_path: Optional[str] = None):
        """
        Initialise le prédicteur de production bovine.
        
        Args:
            db_session: Session SQLAlchemy (synchrone ou asynchrone)
            model_path: Chemin vers un modèle pré-entraîné à charger
        """
        self.loader = DatabaseLoader(db_session)
        self.db_session = db_session
        self.is_async = isinstance(db_session, AsyncSession) if db_session else False
        self.engine = engine if not db_session else None
        self.model = None
        self.preprocessor = None
        self.features = [
            'race', 'age', 'nombre_velages', 'statut_reproduction',
            'production_lait_305j', 'taux_cellulaires_moyen', 'poids_moyen' 
        ]
        self.target = 'production_jour'
        self.performance = ModelPerformance(model_name="BovinProductionPredictor")
        
        if model_path:
            self.load_model(model_path)
    
    # Modifier la méthode prepare_training_data_async
    async def prepare_training_data_async(self) -> pd.DataFrame:
        """Charge les données depuis la base de données en mode asynchrone"""
        if not self.db_session or not self.is_async:
            raise ValueError("Async DB session must be set to prepare training data")
            
        try:
            query = """
            SELECT 
                b.id, b.type_production, b.statut_reproduction, b.nombre_velages,
                b.production_lait_305j, b.taux_cellulaires_moyen,
                a.numero_identification, a.sexe, a.date_naissance,
                r.nom as race, r.caracteristiques,
                cl.date_controle, cl.production_jour, cl.taux_butyreux, 
                cl.taux_proteine, cl.cellules_somatiques
            FROM bovins b
            JOIN animaux a ON b.id = a.id
            JOIN races r ON a.race_id = r.id
            LEFT JOIN controles_laitiers cl ON cl.animal_id = a.id
            WHERE b.type_production IN ('LAITIERE', 'MIXTE')
            """
            
            # Utilisation correcte de la session asynchrone
            result = await self.db_session.execute(text(query))
            rows = result.fetchall()
            
            # Conversion en DataFrame
            df = pd.DataFrame(rows, columns=result.keys())
            return self._process_data(df)
        except Exception as e:
            if self.db_session:
                await self.db_session.rollback()
            raise e
        
    def prepare_training_data_sync(self) -> pd.DataFrame:
        """Charge les données depuis la base de données en mode synchrone"""
        query = """
        SELECT 
            b.id, b.type_production, b.statut_reproduction, b.nombre_velages,
            b.production_lait_305j, b.taux_cellulaires_moyen,
            a.numero_identification, a.sexe, a.date_naissance,
            r.nom as race, r.caracteristiques,
            cl.date_controle, cl.production_jour, cl.taux_butyreux, 
            cl.taux_proteine, cl.cellules_somatiques, pl.date_production
        FROM bovins b
        JOIN animaux a ON b.id = a.id
        JOIN races r ON a.race_id = r.id
        LEFT JOIN controles_laitiers cl ON cl.animal_id = a.id
        LEFT JOIN production_lait pl ON pl.animal_id = a.id
        WHERE b.type_production = 'LAITIERE' OR b.type_production = 'MIXTE'
        """
        
        df = self.loader.execute_query(text(query))
        return self._process_data(df)
        
    def _process_data(self, df: pd.DataFrame):
        """Traite les données communes aux deux modes"""
        # Calcul de l'âge en jours
        df['date_naissance'] = pd.to_datetime(df['date_naissance'])
        df['age'] = (datetime.now() - df['date_naissance']).dt.days
        
        # Extraction des caractéristiques de race
        df['caracteristiques'] = df['caracteristiques'].apply(
            lambda x: json.loads(x) if x else {}
        )
        df['poids_moyen'] = df['caracteristiques'].apply(
            lambda x: x.get('poids_moyen_kg', None)
        )
        
        # Agrégation des données de production
        production_data = df.groupby('id').agg({
            'quantite': 'mean',
            'debit_moyen': 'mean',
            'production_jour': 'mean',
            'taux_butyreux': 'mean',
            'taux_proteine': 'mean',
            'cellules_somatiques': 'mean'
        }).reset_index()
        
        # Fusion avec les données principales
        df = df.drop_duplicates('id').merge(production_data, on='id', how='left')
        
        return df
    
    async def load_data(self):
        """Charge les données en fonction du mode"""
        if self.is_async:
            return await self.prepare_training_data_async()
        return self.prepare_training_data_sync()
    
    def preprocess_data(self, df: pd.DataFrame):
        """Prétraitement des données pour le modèle"""
        # Sélection des caractéristiques
        X = df[self.features]
        y = df[self.target]
        
        # Définition des transformations
        numeric_features = [
            'age', 'nombre_velages', 'production_lait_305j',
            'taux_cellulaires_moyen', 'poids_moyen'
        ]
        categorical_features = ['race', 'statut_reproduction']
        
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])
        
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ])
        
        # Division des données
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        return X_train, X_test, y_train, y_test

    async def predict_production_async(self, animal_data: Dict[str, Any]) -> float:
        """Prédit la production laitière pour un animal donné (mode asynchrone)."""
        return await self._predict_wrapper(self._predict_production, animal_data)
    
    def predict_production_sync(self, animal_data: Dict[str, Any]) -> float:
        """Prédit la production laitière pour un animal donné (mode synchrone)."""
        return self._predict_production(animal_data)
    
    async def _predict_wrapper(self, predict_func, *args, **kwargs):
        """Wrapper pour exécuter des prédictions en mode asynchrone."""
        # Cette méthode permet de gérer les opérations asynchrones si nécessaire
        return predict_func(*args, **kwargs)
    
    def _predict_production(self, animal_data: Dict[str, Any]) -> float:
        """Implémentation synchrone de la prédiction de production."""
        if not self.model:
            raise ValueError("Le modèle n'a pas été entraîné. Appelez train_model() d'abord.")
            
        # Conversion des données en DataFrame
        input_df = pd.DataFrame([animal_data])
        
        # Prédiction
        prediction = self.model.predict(input_df)
        
        return prediction[0]
    
    async def train_model(self):
        """Entraîne le modèle de prédiction"""
        df = await self.load_data()
        X_train, X_test, y_train, y_test = self.preprocess_data(df)
        
        # Création du pipeline complet
        self.model = Pipeline(steps=[
            ('preprocessor', self.preprocessor),
            ('regressor', GradientBoostingRegressor(
                n_estimators=200,
                learning_rate=0.05,
                max_depth=5,
                random_state=42
            ))
        ])
        
        # Entraînement
        self.model.fit(X_train, y_train)
        
        # Évaluation
        y_pred = self.model.predict(X_test)
        
        # Calcul des métriques de performance
        self.performance.mse = mean_squared_error(y_test, y_pred)
        self.performance.mae = mean_absolute_error(y_test, y_pred)
        self.performance.r2 = r2_score(y_test, y_pred)
        
        # Validation croisée
        cv_scores = cross_val_score(
            self.model, 
            pd.concat([X_train, X_test]), 
            pd.concat([y_train, y_test]),
            cv=5,
            scoring='r2'
        )
        self.performance.cv_score = np.mean(cv_scores)
        
        print(f"Performance du modèle: {self.performance}")
        
        return self.model
    
    def get_performance_metrics(self) -> ModelPerformance:
        """Retourne les métriques de performance du modèle"""
        return self.performance
    
    def predict_production(self, animal_data):
        """Prédit la production laitière pour un animal donné"""
        if not self.model:
            raise ValueError("Le modèle n'a pas été entraîné. Appelez train_model() d'abord.")
            
        # Conversion des données en DataFrame
        input_df = pd.DataFrame([animal_data])
        
        # Prédiction
        prediction = self.model.predict(input_df)
        
        return prediction[0]
        
    def save_model(self, filename: str = "bovin_production_model.joblib"):
        """
        Sauvegarde le modèle et les préprocesseurs dans le dossier 'ml_files' du répertoire parent.
        
        Args:
            filename: Nom du fichier de sauvegarde (par défaut: 'bovin_production_model.joblib')
        
        Returns:
            str: Chemin complet du fichier sauvegardé
        """
        if not self.model:
            raise ValueError("Aucun modèle à sauvegarder")
        
        # Chemin complet du fichier
        filepath = MODELS_DIR / filename
        
        # Sauvegarde des données
        dump({
            'model': self.model,
            'performance': self.performance,
            'features': self.features,
            'target': self.target,
            'preprocessor': self.preprocessor
        }, filepath)
        
        return str(filepath)

    def load_model(self, filename: str = "bovin_production_model.joblib"):
        """
        Charge un modèle pré-entraîné depuis le dossier 'ml_files'.
        
        Args:
            filename: Nom du fichier à charger (par défaut: 'bovin_production_model.joblib')
        
        Returns:
            self: Pour permettre le chaînage
        
        Raises:
            FileNotFoundError: Si le fichier n'existe pas
        """
        filepath = MODELS_DIR / filename
        
        # Vérification que le fichier existe
        if not filepath.exists():
            raise FileNotFoundError(f"Le fichier de modèle {filepath} n'existe pas")
        
        # Chargement des données
        data = load(filepath)
        
        # Attribution des données
        self.model = data['model']
        self.performance = data['performance']
        self.features = data.get('features', [
            'race', 'age', 'nombre_velages', 'statut_reproduction',
            'production_lait_305j', 'taux_cellulaires_moyen',
            'poids_moyen', 'temperature_moyenne', 'alimentation_score'
        ])
        self.target = data.get('target', 'production_jour')
        self.preprocessor = data.get('preprocessor')
        
        return self

class BovinHealthMonitor:
    """
    Modèle pour détecter les problèmes de santé potentiels chez les bovins
    basé sur les données de production et les paramètres physiologiques.
    """
    
    def __init__(self):
        self.model = None
        self.features = [
            'production_jour', 'taux_butyreux', 'taux_proteine',
            'cellules_somatiques', 'temperature', 'comportement_score'
        ]
        self.thresholds = {
            'mastite': 0.7,
            'metabolic_disorder': 0.6,
            'general_health_issue': 0.5
        }
    
    def train_model(self, health_data):
        """Entraîne un modèle de détection d'anomalies"""
        # Implémentation simplifiée - en pratique on utiliserait IsolationForest ou SVM
        pass
    
    def detect_health_issues(self, animal_data):
        """Détecte les problèmes de santé potentiels"""
        # Implémentation simplifiée
        warnings = []
        
        if animal_data['cellules_somatiques'] > 200000:
            warnings.append(('mastite', 0.8))
        
        if animal_data['taux_butyreux'] < 3.5 and animal_data['taux_proteine'] < 3.0:
            warnings.append(('metabolic_disorder', 0.65))
            
        if animal_data['production_jour'] < animal_data['production_moyenne'] * 0.7:
            warnings.append(('general_health_issue', 0.6))
            
        return warnings

class BovinNutritionOptimizer:
    """
    Modèle pour optimiser la nutrition des bovins en fonction de leur
    production, état de santé et objectifs de croissance.
    """
    
    def __init__(self):
        self.nutrition_rules = {
            'LAITIERE_HAUTE_PRODUCTION': {
                'energy': 0.45,
                'protein': 0.18,
                'minerals': 0.05
            },
            'LAITIERE_BASSE_PRODUCTION': {
                'energy': 0.35,
                'protein': 0.15,
                'minerals': 0.04
            },
            'VIANDE_CROISSANCE': {
                'energy': 0.40,
                'protein': 0.16,
                'minerals': 0.045
            }
        }
    
    def recommend_ration(self, animal_type, production_level, weight):
        """Recommande une ration alimentaire optimale"""
        if production_level > 30:  # kg/jour
            key = 'LAITIERE_HAUTE_PRODUCTION'
        else:
            key = 'LAITIERE_BASSE_PRODUCTION'
            
        if animal_type == 'VIANDE':
            key = 'VIANDE_CROISSANCE'
            
        recommendation = self.nutrition_rules[key]
        recommendation['quantity'] = weight * 0.025  # 2.5% du poids corporel
        
        return recommendation
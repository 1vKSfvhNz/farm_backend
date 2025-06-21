from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Dict, Union
from enum import Enum
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import cross_val_score
from joblib import dump, load
from machine_learning.base import ModelPerformance
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import DatabaseLoader
from pathlib import Path


# Configuration des chemins - définie au niveau module
PARENT_DIR = Path(__file__).parent.parent
MODELS_DIR = PARENT_DIR / "ml_files"
MODELS_DIR.mkdir(exist_ok=True, parents=True)

class PredictionType(Enum):
    """Types de prédictions disponibles pour l'élevage ovin"""
    PRODUCTION_LAINE = "production_laine"
    PRODUCTION_AGNEAUX = "production_agneaux"
    SANTE_ANIMAL = "sante_animal"
    PERFORMANCE_CROISSANCE = "performance_croissance"

@dataclass
class OvinPredictionInput:
    """Données d'entrée pour les prédictions"""
    animal_id: int
    historique_tontes: List[Dict]  # Liste des tontes précédentes
    historique_mises_bas: List[Dict]  # Pour les femelles
    race_info: Dict
    age: float  # en années
    sexe: str
    type_toison: Optional[str] = None
    poids_actuel: Optional[float] = None
    statut_sante: Optional[str] = None

class OvinProductionPredictor:
    """Classe principale pour les modèles ML de l'élevage ovin"""
    
    def __init__(self, db_session: Optional[Union[AsyncSession, Session]] = None, 
                 model_path: Optional[str] = None):
        """
        Initialise les modèles ovins.
        
        Args:
            db_session: Session SQLAlchemy (synchrone ou asynchrone)
            model_path: Chemin vers un modèle pré-entraîné à charger
        """
        self.loader = DatabaseLoader(db_session)
        self.db_session = db_session
        self.is_async = isinstance(db_session, AsyncSession) if db_session else False
        self.models = {
            PredictionType.PRODUCTION_LAINE: None,
            PredictionType.PRODUCTION_AGNEAUX: None,
            PredictionType.SANTE_ANIMAL: None,
            PredictionType.PERFORMANCE_CROISSANCE: None
        }
        self.model_performance = {}
        
        if model_path:
            self.load_models(model_path)
    
    # Modifier la méthode prepare_training_data_async
    async def prepare_training_data_async(self) -> List[OvinPredictionInput]:
        """Charge les données historiques en mode asynchrone"""
        if not self.db_session or not self.is_async:
            raise ValueError("Async DB session must be set to prepare training data")
            
        try:
            query = """
            SELECT 
                a.id as animal_id,
                a.date_naissance,
                a.sexe,
                r.nom as race,
                r.caracteristiques,
                t.date_tonte,
                t.poids_laine,
                t.qualite_laine,
                m.date_mise_bas,
                m.nombre_agneaux
            FROM 
                animaux a
            JOIN 
                races r ON a.race_id = r.id
            LEFT JOIN 
                tontes t ON a.id = t.animal_id
            LEFT JOIN 
                mises_bas m ON a.id = m.animal_id
            WHERE 
                a.type = 'OVIN'
            """
            
            result = await self.db_session.execute(text(query))
            rows = result.fetchall()
            
            # Conversion en DataFrame
            df = pd.DataFrame(rows, columns=result.keys())
            return self._convert_to_prediction_inputs(df)
        except Exception as e:
            if self.db_session:
                await self.db_session.rollback()
            raise e
    
    def prepare_training_data_sync(self) -> List[OvinPredictionInput]:
        """Charge les données historiques en mode synchrone"""
        query = """
        SELECT 
            a.id as animal_id,
            a.date_naissance,
            a.sexe,
            r.nom as race,
            r.caracteristiques,
            t.date_tonte,
            t.poids_laine,
            t.qualite_laine,
            m.date_mise_bas,
            m.nombre_agneaux
        FROM 
            animaux a
        JOIN 
            races r ON a.race_id = r.id
        LEFT JOIN 
            tontes_ovin t ON a.id = t.animal_id
        LEFT JOIN 
            mises_bas m ON a.id = m.animal_id
        WHERE 
            a.type = 'OVIN'
        """
        
        df = self.loader.execute_query(text(query))
        return self._convert_to_prediction_inputs(df)
    
    def _convert_to_prediction_inputs(self, df: pd.DataFrame) -> List[OvinPredictionInput]:
        """Convertit les données brutes en liste d'objets OvinPredictionInput"""
        results = []
        
        # Grouper par animal (chaque animal peut avoir plusieurs lignes dans le DataFrame)
        grouped = df.groupby('animal_id')
        
        for animal_id, group in grouped:
            # Récupérer les données de base (première ligne du groupe)
            first_row = group.iloc[0]
            
            # Calculer l'âge en années
            age = (datetime.now() - first_row['date_naissance']).days / 365.25
            
            # Préparer l'historique des tontes
            tontes = group[~group['date_tonte'].isna()].to_dict('records')
            historique_tontes = [{
                'date': t['date_tonte'],
                'poids_laine': t['poids_laine'],
                'qualite_laine': t['qualite_laine']
            } for t in tontes if pd.notna(t['poids_laine'])]
            
            # Préparer l'historique des mises bas (pour les femelles)
            mises_bas = group[~group['date_mise_bas'].isna()].to_dict('records')
            historique_mises_bas = [{
                'date': m['date_mise_bas'],
                'nombre_agneaux': m['nombre_agneaux']
            } for m in mises_bas if pd.notna(m['nombre_agneaux'])]
            
            # Préparer les informations sur la race
            race_info = {
                'id': first_row.get('race_id', 0),  # Supposant que race_id existe dans les données
                'nom': first_row['race'],
                'caracteristiques': first_row.get('caracteristiques', {})
            }
            
            # Créer l'objet OvinPredictionInput
            ovin_data = OvinPredictionInput(
                animal_id=animal_id,
                historique_tontes=historique_tontes,
                historique_mises_bas=historique_mises_bas,
                race_info=race_info,
                age=age,
                sexe=first_row['sexe'],
                type_toison=first_row.get('type_toison'),  # Optionnel
                poids_actuel=first_row.get('poids_actuel'),  # Optionnel
                statut_sante=first_row.get('statut_sante')  # Optionnel
            )
            
            results.append(ovin_data)
        
        return results
            
    def prepare_data(self, data: List[OvinPredictionInput], prediction_type: PredictionType) -> pd.DataFrame:
        """Prépare les données pour l'entraînement"""
        df = pd.DataFrame([self._extract_features(x, prediction_type) for x in data])
        
        # Nettoyage des données
        df = df.dropna()
        
        return df
    
    def _extract_features(self, input_data: OvinPredictionInput, prediction_type: PredictionType) -> Dict:
        """Extrait les caractéristiques pertinentes selon le type de prédiction"""
        features = {
            'age': input_data.age,
            'sexe': 1 if input_data.sexe == "Femelle" else 0,
            'race': input_data.race_info.get('id', 0),
            'poids_actuel': input_data.poids_actuel or 0,
            'type_toison': input_data.type_toison or "Moyenne"
        }
        
        if prediction_type == PredictionType.PRODUCTION_LAINE:
            # Caractéristiques pour la prédiction de production de laine
            if input_data.historique_tontes:
                last_tonte = input_data.historique_tontes[-1]
                features.update({
                    'moyenne_poids_laine': sum(t['poids_laine'] for t in input_data.historique_tontes) / len(input_data.historique_tontes),
                    'dernier_poids_laine': last_tonte['poids_laine'],
                    'derniere_qualite': last_tonte['qualite_laine'],
                    'nb_tontes': len(input_data.historique_tontes)
                })
        
        elif prediction_type == PredictionType.PRODUCTION_AGNEAUX:
            # Caractéristiques pour la prédiction de production d'agneaux
            if input_data.historique_mises_bas:
                last_mise_bas = input_data.historique_mises_bas[-1]
                features.update({
                    'nb_mises_bas': len(input_data.historique_mises_bas),
                    'moyenne_agneaux': sum(m['nombre_agneaux'] for m in input_data.historique_mises_bas) / len(input_data.historique_mises_bas),
                    'dernier_nb_agneaux': last_mise_bas['nombre_agneaux']
                })
        
        return features
    
    def train_production_laine_model(self, data: List[OvinPredictionInput]):
        """Entraîne un modèle pour prédire la production de laine"""
        df = self.prepare_data(data, PredictionType.PRODUCTION_LAINE)
        
        if len(df) < 10:
            raise ValueError("Pas assez de données pour l'entraînement (minimum 10 échantillons)")
        
        X = df.drop(['dernier_poids_laine'], axis=1)
        y = df['dernier_poids_laine']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Évaluation
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Validation croisée
        cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')
        cv_score = cv_scores.mean()
        
        # Sauvegarde des performances
        perf = ModelPerformance(
            model_name="ProductionLaineOvin",
            mse=mse,
            mae=mae,
            r2=r2,
            cv_score=cv_score
        )
        
        self.models[PredictionType.PRODUCTION_LAINE] = model
        self.model_performance[PredictionType.PRODUCTION_LAINE] = perf
        
        return perf
    
    def train_production_agneaux_model(self, data: List[OvinPredictionInput]):
        """Entraîne un modèle pour prédire le nombre d'agneaux"""
        df = self.prepare_data(data, PredictionType.PRODUCTION_AGNEAUX)
        
        if len(df) < 10:
            raise ValueError("Pas assez de données pour l'entraînement (minimum 10 échantillons)")
        
        X = df.drop(['dernier_nb_agneaux'], axis=1)
        y = df['dernier_nb_agneaux']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Évaluation
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted')
        recall = recall_score(y_test, y_pred, average='weighted')
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        # Validation croisée
        cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
        cv_score = cv_scores.mean()
        
        # Sauvegarde des performances
        perf = ModelPerformance(
            model_name="ProductionAgneauxOvin",
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            cv_score=cv_score
        )
        
        self.models[PredictionType.PRODUCTION_AGNEAUX] = model
        self.model_performance[PredictionType.PRODUCTION_AGNEAUX] = perf
        
        return perf
    
    def predict_laine_production(self, input_data: OvinPredictionInput) -> Dict:
        """Prédit la production de laine pour un ovain donné"""
        if not self.models.get(PredictionType.PRODUCTION_LAINE):
            raise ValueError("Modèle non entraîné. Veuillez d'abord entraîner le modèle.")
        
        features = self._extract_features(input_data, PredictionType.PRODUCTION_LAINE)
        features_df = pd.DataFrame([features])
        
        prediction = self.models[PredictionType.PRODUCTION_LAINE].predict(features_df)
        
        return {
            'predicted_wool_weight': float(prediction[0]),
            'confidence': 0.8  # À remplacer par une vraie mesure de confiance
        }
    
    def predict_agneaux_production(self, input_data: OvinPredictionInput) -> Dict:
        """Prédit le nombre d'agneaux pour une brebis donnée"""
        if not self.models.get(PredictionType.PRODUCTION_AGNEAUX):
            raise ValueError("Modèle non entraîné. Veuillez d'abord entraîner le modèle.")
        
        features = self._extract_features(input_data, PredictionType.PRODUCTION_AGNEAUX)
        features_df = pd.DataFrame([features])
        
        prediction = self.models[PredictionType.PRODUCTION_AGNEAUX].predict(features_df)
        proba = self.models[PredictionType.PRODUCTION_AGNEAUX].predict_proba(features_df)
        
        return {
            'predicted_lamb_count': int(prediction[0]),
            'probability': float(max(proba[0])),
            'confidence': 0.8  # À remplacer par une vraie mesure de confiance
        }
    
    def save_models(self, filename: str = "ovin_models.joblib") -> str:
        """
        Sauvegarde tous les modèles et leurs performances.
        
        Args:
            filename: Nom du fichier de sauvegarde
            
        Returns:
            str: Chemin complet du fichier sauvegardé
        """
        if not any(self.models.values()):
            raise ValueError("Aucun modèle entraîné à sauvegarder")
        
        filepath = MODELS_DIR / filename
        
        model_data = {
            'models': {k.value: v for k, v in self.models.items() if v is not None},
            'model_performance': {k.value: v.to_dict() for k, v in self.model_performance.items()},
            'metadata': {
                'saved_at': datetime.now().isoformat(),
                'version': '1.0'
            }
        }
        
        dump(model_data, filepath)
        return str(filepath)

    def load_models(self, filename: str = "ovin_models.joblib"):
        """
        Charge tous les modèles depuis un fichier.
        
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
        if 'models' not in model_data or 'model_performance' not in model_data:
            raise KeyError("Fichier de modèle corrompu ou incompatible")
        
        # Chargement des modèles
        for k, v in model_data['models'].items():
            model_type = PredictionType(k)
            self.models[model_type] = v
        
        # Chargement des performances
        for k, v in model_data['model_performance'].items():
            model_type = PredictionType(k)
            self.model_performance[model_type] = ModelPerformance(**v)
        
        return self
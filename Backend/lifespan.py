from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import text
import logging
from typing import Dict, Optional
import asyncio

# Import des prédicteurs

from machine_learning.prediction.elevage.avicole import AvicolePredictor
from machine_learning.prediction.elevage.bovin import BovinProductionPredictor
from machine_learning.prediction.elevage.caprin import CaprinProductionPredictor
from machine_learning.prediction.elevage.ovin import OvinProductionPredictor
from machine_learning.prediction.elevage.piscicole import PisciculturePredictor

# Import de la session de base de données
from models import get_db_session, get_async_db_session

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialisation globale
scheduler: Optional[BackgroundScheduler] = None
predictors: Dict[str, object] = {}

async def check_db_connection_async():
    """Vérifie la connexion à la base de données (version asynchrone)"""
    try:
        async with get_async_db_session() as session:
            await session.execute(text("SELECT 1"))
        logger.info("✅ Connexion à la base de données asynchrone réussie")
        return True
    except Exception as e:
        logger.error(f"❌ Échec de la connexion à la base de données asynchrone: {str(e)}")
        return False

def check_db_connection_sync():
    """Vérifie la connexion à la base de données (version synchrone)"""
    try:
        with get_db_session() as session:
            session.execute(text("SELECT 1"))
        logger.info("✅ Connexion à la base de données synchrone réussie")
        return True
    except Exception as e:
        logger.error(f"❌ Échec de la connexion à la base de données synchrone: {str(e)}")
        return False

async def train_model_safely_async(model_name: str, trainer_func):
    """Entraîne un modèle avec gestion des erreurs (version asynchrone)"""
    try:
        logger.info(f"Début de l'entraînement asynchrone pour {model_name}...")
        success = await trainer_func()
        if success:
            logger.info(f"✅ Modèle {model_name} entraîné avec succès (async)")
        else:
            logger.warning(f"⚠️ Modèle {model_name} entraîné avec des problèmes (async)")
        return success
    except Exception as e:
        logger.error(f"❌ Échec de l'entraînement asynchrone pour {model_name}: {str(e)}", exc_info=True)
        return False

def train_model_safely_sync(model_name: str, trainer_func):
    """Entraîne un modèle avec gestion des erreurs (version synchrone)"""
    try:
        logger.info(f"Début de l'entraînement synchrone pour {model_name}...")
        success = trainer_func()
        if success:
            logger.info(f"✅ Modèle {model_name} entraîné avec succès (sync)")
        else:
            logger.warning(f"⚠️ Modèle {model_name} entraîné avec des problèmes (sync)")
        return success
    except Exception as e:
        logger.error(f"❌ Échec de l'entraînement synchrone pour {model_name}: {str(e)}", exc_info=True)
        return False

async def train_avicole_model_async():
    """Entraîne le modèle avicole (version asynchrone)"""
    async with get_async_db_session() as session:
        predictor = AvicolePredictor(db_session=session)
        await predictor.prepare_training_data()
        await predictor.train_models()
        predictors['avicole'] = predictor
    return True

async def train_bovin_model_async():
    """Entraîne le modèle bovin (version asynchrone)"""
    async with get_async_db_session() as session:
        predictor = BovinProductionPredictor(db_session=session)
        await predictor.train_model()
        predictors['bovin'] = predictor
    return True

async def train_caprin_model_async():
    """Entraîne le modèle caprin (version asynchrone)"""
    async with get_async_db_session() as session:
        predictor = CaprinProductionPredictor(db_session=session)
        data = await predictor.prepare_training_data_async()
        X, y = predictor.preprocess_data(data)
        predictor.train_model(X, y)
        predictors['caprin'] = predictor
    return True

async def train_ovin_model_async():
    """Entraîne le modèle ovin (version asynchrone)"""
    async with get_async_db_session() as session:
        predictor = OvinProductionPredictor(db_session=session)
        data = await predictor.prepare_training_data_async()
        predictor.train_production_laine_model(data)
        predictor.train_production_agneaux_model(data)
        predictors['ovin'] = predictor
    return True

async def train_piscicole_model_async():
    """Entraîne le modèle piscicole (version asynchrone)"""
    async with get_async_db_session() as session:
        predictor = PisciculturePredictor(db_session=session)
        await predictor.prepare_data('croissance')
        predictor.train_models('croissance')
        predictors['piscicole'] = predictor
    return True

def train_avicole_model_sync():
    """Entraîne le modèle avicole (version synchrone)"""
    with get_db_session() as session:
        predictor = AvicolePredictor(db_session=session)
        predictor.prepare_training_data_sync()
        # Note: Vous devrez peut-être adapter train_models pour une version synchrone
        # ou utiliser asyncio.run() si nécessaire
        asyncio.run(predictor.train_models())
        predictors['avicole'] = predictor
    return True

def train_bovin_model_sync():
    """Entraîne le modèle bovin (version synchrone)"""
    with get_db_session() as session:
        predictor = BovinProductionPredictor(db_session=session)
        # Note: Vous devrez peut-être adapter train_model pour une version synchrone
        # ou utiliser asyncio.run() si nécessaire
        asyncio.run(predictor.train_model())
        predictors['bovin'] = predictor
    return True

def train_caprin_model_sync():
    """Entraîne le modèle caprin (version synchrone)"""
    with get_db_session() as session:
        predictor = CaprinProductionPredictor(db_session=session)
        data = predictor.prepare_training_data_sync()
        X, y = predictor.preprocess_data(data)
        predictor.train_model(X, y)
        predictors['caprin'] = predictor
    return True

def train_ovin_model_sync():
    """Entraîne le modèle ovin (version synchrone)"""
    with get_db_session() as session:
        predictor = OvinProductionPredictor(db_session=session)
        data = predictor.prepare_training_data_sync()  # Vous devrez implémenter cette méthode
        predictor.train_production_laine_model(data)
        predictor.train_production_agneaux_model(data)
        predictors['ovin'] = predictor
    return True

def train_piscicole_model_sync():
    """Entraîne le modèle piscicole (version synchrone)"""
    with get_db_session() as session:
        predictor = PisciculturePredictor(db_session=session)
        predictor.prepare_training_data_sync('croissance')  # Vous devrez implémenter cette méthode
        predictor.train_models('croissance')
        predictors['piscicole'] = predictor
    return True

async def train_all_models_async():
    """Entraîne tous les modèles avec gestion robuste des erreurs (version asynchrone)"""
    if not await check_db_connection_async():
        logger.error("Impossible de se connecter à la base de données asynchrone")
        return False

    results = {
        'avicole': await train_model_safely_async('avicole', train_avicole_model_async),
        'bovin': await train_model_safely_async('bovin', train_bovin_model_async),
        'caprin': await train_model_safely_async('caprin', train_caprin_model_async),
        'ovin': await train_model_safely_async('ovin', train_ovin_model_async),
        'piscicole': await train_model_safely_async('piscicole', train_piscicole_model_async)
    }

    success_count = sum(results.values())
    if success_count == 0:
        logger.error("❌ Aucun modèle n'a pu être entraîné (async)")
        return False
    elif success_count < len(results):
        logger.warning(f"⚠️ {success_count}/{len(results)} modèles entraînés avec succès (async)")
    else:
        logger.info(f"✅ Tous les modèles ({success_count}/{len(results)}) entraînés avec succès (async)")

    return success_count > 0

def train_all_models_sync():
    """Entraîne tous les modèles avec gestion robuste des erreurs (version synchrone)"""
    if not check_db_connection_sync():
        logger.error("Impossible de se connecter à la base de données synchrone")
        return False

    results = {
        'avicole': train_model_safely_sync('avicole', train_avicole_model_sync),
        'bovin': train_model_safely_sync('bovin', train_bovin_model_sync),
        'caprin': train_model_safely_sync('caprin', train_caprin_model_sync),
        'ovin': train_model_safely_sync('ovin', train_ovin_model_sync),
        'piscicole': train_model_safely_sync('piscicole', train_piscicole_model_sync)
    }

    success_count = sum(results.values())
    if success_count == 0:
        logger.error("❌ Aucun modèle n'a pu être entraîné (sync)")
        return False
    elif success_count < len(results):
        logger.warning(f"⚠️ {success_count}/{len(results)} modèles entraînés avec succès (sync)")
    else:
        logger.info(f"✅ Tous les modèles ({success_count}/{len(results)}) entraînés avec succès (sync)")

    return success_count > 0

def schedule_monthly_training():
    """Planifie l'entraînement mensuel des modèles"""
    global scheduler
    
    if scheduler is None:
        logger.error("Le scheduler n'est pas initialisé")
        return False
    
    try:
        trigger = CronTrigger(day=1, hour=0, minute=0)  # Le 1er de chaque mois à minuit
        scheduler.add_job(
            lambda: asyncio.run(train_all_models_async()),  # Utilise la version async par défaut
            trigger=trigger,
            name="monthly_model_training",
            max_instances=1,
            misfire_grace_time=3600  # Tolérance d'une heure pour les déclenchements manqués
        )
        logger.info("✅ Entraînement mensuel planifié pour le 1er de chaque mois à minuit")
        return True
    except Exception as e:
        logger.error(f"❌ Erreur lors de la planification: {str(e)}")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application avec tolérance aux pannes"""
    global scheduler
    
    try:
        # Initialisation du scheduler
        scheduler = BackgroundScheduler()
        scheduler.start()
        logger.info("✅ Scheduler démarré avec succès")
        
        # Planification de l'entraînement mensuel
#        if not schedule_monthly_training():
#            logger.warning("⚠️ La planification mensuelle a échoué")
        
        # Tentative d'entraînement initial en mode asynchrone
#        await train_all_models_async()
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Erreur critique au démarrage: {str(e)}", exc_info=True)
        # L'application continue de démarrer malgré les erreurs
        yield
    finally:
        # Nettoyage à l'arrêt
        if scheduler and scheduler.running:
            try:
                scheduler.shutdown(wait=False)
                logger.info("✅ Scheduler arrêté avec succès")
            except Exception as e:
                logger.error(f"❌ Erreur lors de l'arrêt du scheduler: {str(e)}")
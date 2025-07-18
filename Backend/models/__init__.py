import logging
import pandas as pd
from typing import Generator, AsyncGenerator, Optional, Union, Awaitable
from contextlib import contextmanager, asynccontextmanager
from os import getenv
from dotenv import load_dotenv
from sqlalchemy import create_engine, Engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import QueuePool
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

# Charger les variables d'environnement
load_dotenv()

# Configurer le logger structuré
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Configuration de la base de données
DATABASE_URL: Optional[str] = getenv("DATABASE_URL")
ASYNC_DATABASE_URL: Optional[str] = getenv("ASYNC_DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")
if not ASYNC_DATABASE_URL:
    logger.warning("ASYNC_DATABASE_URL not set - async features will be disabled")

# Configuration optimisée du pool de connexions synchrone
def create_db_engine(database_url: str) -> Engine:
    return create_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=300,
        pool_pre_ping=True,
        echo=True,
        connect_args={"connect_timeout": 10}
    )

engine: Engine = create_db_engine(DATABASE_URL)

# Configuration pour async (si nécessaire)
async_engine = None
if ASYNC_DATABASE_URL:
    async_engine = create_async_engine(
        ASYNC_DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=300,
        pool_pre_ping=True,
        echo=True,
    )

# Test de connexion initial
def test_db_connection(db_engine: Engine) -> None:
    try:
        with db_engine.connect() as conn:
            logger.info("✅ Database connection successful")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise

test_db_connection(engine)

# Configuration des sessions
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=Session
)

AsyncSessionLocal = None
if async_engine:
    AsyncSessionLocal = sessionmaker(
        bind=async_engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
        class_=AsyncSession
    )

Base = declarative_base()

# Context managers
@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Database error occurred: {e}")
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Unexpected error occurred: {e}")
        raise
    finally:
        session.close()

@asynccontextmanager
async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager for async database sessions."""
    if not AsyncSessionLocal:
        raise RuntimeError("Async database engine not configured")
    
    session = AsyncSessionLocal()
    try:
        yield session
        await session.commit()
    except SQLAlchemyError as e:
        await session.rollback()
        logger.error(f"Async database error occurred: {e}")
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Unexpected async error occurred: {e}")
        raise
    finally:
        await session.close()

# Dependency injections
def get_db() -> Generator[Session, None, None]:
    """Dependency for synchronous database sessions."""
    with get_db_session() as session:
        yield session

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for asynchronous database sessions."""
    async with get_async_db_session() as session:
        yield session

# Utility functions
def add_object(session: Session, obj) -> None:
    """Add an object to the database synchronously."""
    try:
        session.add(obj)
        session.commit()
        session.refresh(obj)
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Error adding object: {e}")
        raise

def update_object(session: Session, obj, update_data: dict) -> None:
    """Update an object with given dictionary values."""
    try:
        for key, value in update_data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
            else:
                logger.warning(f"Ignoring invalid attribute: {key}")
        session.commit()
        session.refresh(obj)
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Error updating object: {e}")
        raise

async def add_object_async(session: AsyncSession, obj) -> None:
    """Add an object to the database asynchronously."""
    try:
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
    except SQLAlchemyError as e:
        await session.rollback()
        logger.error(f"Async error adding object: {e}")
        raise

async def update_object_async(session: AsyncSession, obj, update_data: dict) -> None:
    """Update an object asynchronously with given values."""
    try:
        for key, value in update_data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
            else:
                logger.warning(f"Ignoring invalid async attribute: {key}")
        await session.commit()
        await session.refresh(obj)
    except SQLAlchemyError as e:
        await session.rollback()
        logger.error(f"Async error updating object: {e}")
        raise

class DatabaseLoader:
    """Classe helper pour gérer les chargements de données sync/async"""
    
    def __init__(self, db_session: Optional[Union[AsyncSession, Session]] = None):
        self.db_session = db_session
        self.is_async = isinstance(db_session, AsyncSession) if db_session else False
    
    async def execute_query_async(self, query: str) -> pd.DataFrame:
        """Exécute une requête SQL asynchrone et retourne un DataFrame"""
        if not self.db_session:
            raise ValueError("Session database non fournie")
            
        # Pas besoin de créer une nouvelle session, utilisez celle fournie
        result = await self.db_session.execute(text(query))
        rows = result.fetchall()
        columns = result.keys()
        return pd.DataFrame(rows, columns=columns)
    
    def execute_query_sync(self, query: str) -> pd.DataFrame:
        """Exécute une requête SQL synchrone et retourne un DataFrame"""
        # Pas besoin de créer une nouvelle session, utilisez celle fournie
        result = self.db_session.execute(text(query))
        rows = result.fetchall()
        columns = result.keys()
        return pd.DataFrame(rows, columns=columns)
    
    def execute_query(self, query: str) -> Union[pd.DataFrame, Awaitable[pd.DataFrame]]:
        """Exécute une requête SQL selon le mode"""
        if self.is_async:
            return self.execute_query_async(query)
        return self.execute_query_sync(query)
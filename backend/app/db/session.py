import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from app.db.async_wrapper import WrappedAsyncSession
import asyncio

logger = logging.getLogger(__name__)

Base = declarative_base()

def create_db_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        return create_async_engine(db_url, connect_args=connect_args)

    try:
        engine = create_async_engine(
            db_url,
            pool_pre_ping=True,
            connect_args={"command_timeout": 5}
        )
        return engine
    except Exception as e:
        logger.error(f"🚨 CRITICAL ERROR: PostgreSQL on {db_url} is not accessible! ({e}).")
        raise e

engine = create_db_engine()
AsyncSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine, 
    class_=AsyncSession
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield WrappedAsyncSession(session)

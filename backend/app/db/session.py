import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from app.db.async_wrapper import WrappedAsyncSession
import asyncio

logger = logging.getLogger(__name__)

Base = declarative_base()

from sqlalchemy.pool import NullPool

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
            poolclass=NullPool,
            connect_args={"command_timeout": 5}
        )
        return engine
    except Exception as e:
        logger.error(f"🚨 CRITICAL ERROR: PostgreSQL on {db_url} is not accessible! ({e}).")
        raise e

from sqlalchemy import create_engine

def create_sync_engine():
    sync_url = settings.DATABASE_URL
    if "postgresql+asyncpg://" in sync_url:
        sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql://")
    elif "sqlite+aiosqlite://" in sync_url:
        sync_url = sync_url.replace("sqlite+aiosqlite://", "sqlite://")

    connect_args = {}
    if sync_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    try:
        return create_engine(
            sync_url,
            pool_pre_ping=True,
            connect_args=connect_args
        )
    except Exception as e:
        logger.warning(f"Sync engine warning: {e}")
        return None

engine = create_db_engine()
sync_engine = create_sync_engine()

AsyncSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    expire_on_commit=False,
    bind=engine, 
    class_=AsyncSession
)
SyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine
) if sync_engine else AsyncSessionLocal

SessionLocal = SyncSessionLocal

async def get_db():
    session = AsyncSessionLocal()
    try:
        yield WrappedAsyncSession(session)
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()

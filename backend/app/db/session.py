import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def create_db_engine():
    db_url = settings.DATABASE_URL
    connect_args = {}

    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        return create_engine(db_url, connect_args=connect_args)

    try:
        # Try PostgreSQL connection
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 2}
        )
        with engine.connect() as conn:
            pass
        return engine
    except Exception as e:
        logger.warning(f"⚠️ PostgreSQL on {db_url} is not running ({e}). Falling back to local SQLite 'sqlite:///./atoms_bus.db' for development.")
        return create_engine("sqlite:///./atoms_bus.db", connect_args={"check_same_thread": False})


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

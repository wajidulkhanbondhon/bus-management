from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.models.portal import LandingConfig

router = APIRouter()

@router.get("/config")
async def get_landing_config(db: WrappedAsyncSession = Depends(get_db)):
    config = await db.query(LandingConfig).first()
    if not config:
        config = LandingConfig()
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config

@router.put("/config")
async def update_landing_config(
    primary_color: str = "#3b82f6",
    language_default: str = "bn",
    db: WrappedAsyncSession = Depends(get_db)
):
    config = await db.query(LandingConfig).first()
    if not config:
        config = LandingConfig()
        db.add(config)
    
    config.primary_color = primary_color
    config.language_default = language_default
    await db.commit()
    await db.refresh(config)
    return config

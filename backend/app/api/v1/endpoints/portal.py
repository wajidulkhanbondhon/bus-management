from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.portal import LandingConfig

router = APIRouter()

@router.get("/config")
def get_landing_config(db: Session = Depends(get_db)):
    config = db.query(LandingConfig).first()
    if not config:
        config = LandingConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/config")
def update_landing_config(
    primary_color: str = "#3b82f6",
    language_default: str = "bn",
    db: Session = Depends(get_db)
):
    config = db.query(LandingConfig).first()
    if not config:
        config = LandingConfig()
        db.add(config)
    
    config.primary_color = primary_color
    config.language_default = language_default
    db.commit()
    db.refresh(config)
    return config

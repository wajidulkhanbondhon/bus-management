import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import require_role
from app.models.audit import SystemSetting
from app.models.user import User
from app.schemas.settings import LandingControlSettings, SystemSettingUpdate

router = APIRouter()


@router.get("/")
def get_all_settings(db: Session = Depends(get_db)) -> Dict[str, str]:
    settings = db.query(SystemSetting).all()
    return {s.key: s.value for s in settings}


@router.get("/landing-control", response_model=LandingControlSettings)
def get_landing_settings(db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.key == "landing_control_config").first()
    if not setting or not setting.value:
        return LandingControlSettings()

    try:
        data = json.loads(setting.value)
        return LandingControlSettings(**data)
    except Exception:
        return LandingControlSettings()


@router.post("/landing-control", response_model=LandingControlSettings)
def save_landing_settings(
    req: LandingControlSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == "landing_control_config").first()
    json_val = json.dumps(req.model_dump())
    if setting:
        setting.value = json_val
    else:
        setting = SystemSetting(
            key="landing_control_config",
            value=json_val,
            description="Landing page public branding and announcement configurations"
        )
        db.add(setting)

    db.commit()
    return req


@router.post("/update-key")
def update_setting_key(
    req: SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == req.key).first()
    if setting:
        setting.value = req.value
        if req.description:
            setting.description = req.description
    else:
        setting = SystemSetting(
            key=req.key,
            value=req.value,
            description=req.description
        )
        db.add(setting)

    db.commit()
    return {"success": True, "key": req.key, "value": req.value}

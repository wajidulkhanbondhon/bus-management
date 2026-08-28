from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.audit import AuditLog
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[Dict[str, Any]])
def list_audit_logs(
    action: Optional[str] = None,
    entity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    logs = query.order_by(AuditLog.created_at.desc()).limit(100).all()

    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "entity": l.entity,
            "entity_id": l.entity_id,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat()
        }
        for l in logs
    ]

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.deps import require_role, get_current_tenant_id
from app.models.audit import AuditLog
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[Dict[str, Any]])
async def list_audit_logs(
    action: Optional[str] = None,
    entity: Optional[str] = None,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    query = db.query(AuditLog)
    if current_user.role and current_user.role.name != "SUPER_ADMIN":
        query = query.join(User, AuditLog.user_id == User.id).filter(User.tenant_id == current_user.tenant_id)
    elif tenant_id:
        query = query.join(User, AuditLog.user_id == User.id).filter(User.tenant_id == tenant_id)

    if action:
        query = query.filter(AuditLog.action == action)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    logs = await query.order_by(AuditLog.created_at.desc()).limit(100).all()

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

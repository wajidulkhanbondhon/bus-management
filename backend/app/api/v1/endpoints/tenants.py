from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import require_role
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantCreate, TenantOut

router = APIRouter()


@router.get("", response_model=List[TenantOut], include_in_schema=False)
@router.get("/", response_model=List[TenantOut])
def list_tenants(db: Session = Depends(get_db)):
    return db.query(Tenant).filter(Tenant.is_active == True).all()


@router.post("", response_model=TenantOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
def create_tenant(
    req: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    existing = db.query(Tenant).filter(Tenant.slug == req.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tenant with this slug already exists")

    tenant = Tenant(**req.model_dump())
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant

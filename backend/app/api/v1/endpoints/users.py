from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.core.deps import get_current_user, require_role, apply_tenant_filter, get_current_tenant_id
from app.core.security import get_password_hash
from app.models.user import User, Role, Permission, role_permissions
from app.models.booking import Booking
from app.models.payment import Payment
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserDetailOut,
    RoleCreate,
    RoleUpdate,
    RoleOut,
    PermissionOut,
    StaffCounts
)

router = APIRouter()


@router.get("/permissions", response_model=List[PermissionOut])
def list_permissions(db: Session = Depends(get_db)):
    return db.query(Permission).order_by(Permission.category.asc(), Permission.name.asc()).all()


@router.get("/roles", response_model=List[RoleOut])
def list_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()


@router.post("/roles", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
def create_role(
    req: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    existing = db.query(Role).filter(Role.name == req.name.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Role with name '{req.name}' already exists")

    role = Role(name=req.name.strip().upper(), description=req.description)
    db.add(role)
    db.flush()

    if req.permission_ids:
        perms = db.query(Permission).filter(Permission.id.in_(req.permission_ids)).all()
        role.permissions = perms

    db.commit()
    db.refresh(role)
    return role


@router.put("/roles/{role_id}", response_model=RoleOut)
def update_role(
    role_id: str,
    req: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if req.name:
        role.name = req.name.strip().upper()
    if req.description is not None:
        role.description = req.description

    if req.permission_ids is not None:
        perms = db.query(Permission).filter(Permission.id.in_(req.permission_ids)).all()
        role.permissions = perms

    db.commit()
    db.refresh(role)
    return role


@router.delete("/roles/{role_id}")
def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.name in ["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT"]:
        raise HTTPException(status_code=400, detail="Cannot delete default system role")

    # Check if any user is assigned
    users_count = db.query(User).filter(User.role_id == role.id).count()
    if users_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete role: {users_count} users are assigned to this role")

    db.delete(role)
    db.commit()
    return {"success": True, "message": "Role deleted"}


@router.get("", response_model=List[UserDetailOut], include_in_schema=False)
@router.get("/", response_model=List[UserDetailOut])
def list_staff(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"])),
    tenant_id: Optional[str] = Depends(get_current_tenant_id)
):
    query = db.query(User)
    query = apply_tenant_filter(query, User, current_user, tenant_id)
    users = query.order_by(User.created_at.desc()).all()

    results = []
    for u in users:
        b_count = db.query(Booking).filter(Booking.created_by_id == u.id).count()
        p_count = db.query(Payment).filter(Payment.received_by_id == u.id).count()
        detail = UserDetailOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            phone=u.phone,
            is_active=u.is_active,
            discount_limit=u.discount_limit or 0.0,
            created_at=u.created_at,
            role=RoleOut.from_orm(u.role) if u.role else None,
            tenant_id=u.tenant_id,
            _count=StaffCounts(createdBookings=b_count, receivedPayments=p_count)
        )
        results.append(detail)
    return results


@router.post("", response_model=UserDetailOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=UserDetailOut, status_code=status.HTTP_201_CREATED)
def create_staff(
    req: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    clean_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"User with email '{clean_email}' already exists")

    # Find role
    role = None
    if req.role_id:
        role = db.query(Role).filter(Role.id == req.role_id).first()
    elif req.role:
        role = db.query(Role).filter(Role.name == req.role.strip().upper()).first()

    if not role:
        role = db.query(Role).filter(Role.name == "BOOKING_STAFF").first()

    effective_tenant = req.tenant_id or current_user.tenant_id
    user = User(
        email=clean_email,
        full_name=req.full_name.strip(),
        phone=req.phone.strip() if req.phone else None,
        password_hash=get_password_hash(req.password or "staff1234"),
        role_id=role.id if role else None,
        tenant_id=effective_tenant,
        discount_limit=req.discount_limit or 0.0,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserDetailOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        is_active=user.is_active,
        discount_limit=user.discount_limit or 0.0,
        created_at=user.created_at,
        role=RoleOut.from_orm(user.role) if user.role else None,
        tenant_id=user.tenant_id,
        _count=StaffCounts()
    )


@router.put("/{user_id}", response_model=UserDetailOut)
def update_staff(
    user_id: str,
    req: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")

    if req.full_name is not None:
        user.full_name = req.full_name.strip()
    if req.phone is not None:
        user.phone = req.phone.strip() if req.phone else None
    if req.discount_limit is not None:
        user.discount_limit = req.discount_limit
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.password:
        user.password_hash = get_password_hash(req.password)

    if req.role_id:
        role = db.query(Role).filter(Role.id == req.role_id).first()
        if role:
            user.role_id = role.id
    elif req.role:
        role = db.query(Role).filter(Role.name == req.role.strip().upper()).first()
        if role:
            user.role_id = role.id

    db.commit()
    db.refresh(user)

    b_count = db.query(Booking).filter(Booking.created_by_id == user.id).count()
    p_count = db.query(Payment).filter(Payment.received_by_id == user.id).count()

    return UserDetailOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        is_active=user.is_active,
        discount_limit=user.discount_limit or 0.0,
        created_at=user.created_at,
        role=RoleOut.from_orm(user.role) if user.role else None,
        tenant_id=user.tenant_id,
        _count=StaffCounts(createdBookings=b_count, receivedPayments=p_count)
    )


@router.patch("/{user_id}/toggle")
def toggle_staff_active(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user.is_active = not user.is_active
    db.commit()
    return {"success": True, "id": user.id, "is_active": user.is_active}


@router.delete("/{user_id}")
def delete_staff(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    db.delete(user)
    db.commit()
    return {"success": True, "message": "Staff account deleted"}

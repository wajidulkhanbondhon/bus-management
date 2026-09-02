from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.deps import get_optional_user, require_role, apply_tenant_filter, get_current_tenant_id
from app.models.university import University
from app.models.user import User
from app.schemas.university import UniversityCreate, UniversityUpdate, UniversityOut

router = APIRouter()

SAMPLE_UNIVERSITIES = [
    {
        "name": "রাজশাহী বিশ্ববিদ্যালয়",
        "name_en": "University of Rajshahi",
        "apply_status": "OPEN",
        "deadline": "2026-09-15",
        "exam_date": "2026-10-05",
        "units": ["A ইউনিট", "B ইউনিট", "C ইউনিট", "D ইউনিট"],
        "fees": "৳৫০০ - ৳৮০০",
        "requirements": [
            "এসএসসি ও এইচএসসি সনদ ও মার্কশিট (মূল ও ফটোকপি)",
            "পাসপোর্ট সাইজের ছবি (৩ কপি)",
            "জাতীয় পরিচয়পত্র / জন্ম সনদ ফটোকপি",
            "অনলাইন আবেদন ফি পরিশোধের রসিদ"
        ],
        "how_to_apply": "admission.ru.ac.bd ওয়েবসাইটে গিয়ে অনলাইন আবেদন ফরম পূরণ করুন। বিকাশ/নগদ/রকেটে আবেদন ফি দিন।",
        "location": "রাজশাহী",
        "circular_url": None,
    },
    {
        "name": "চট্টগ্রাম বিশ্ববিদ্যালয়",
        "name_en": "University of Chittagong",
        "apply_status": "OPEN",
        "deadline": "2026-09-20",
        "exam_date": "2026-10-12",
        "units": ["A ইউনিট", "B ইউনিট", "C ইউনিট"],
        "fees": "৳৬০০",
        "requirements": [
            "এসএসসি ও এইচএসসি সনদ ও মার্কশিট",
            "পাসপোর্ট সাইজের ছবি (৪ কপি)",
            "প্রবেশপত্র প্রিন্ট"
        ],
        "how_to_apply": "চট্টগ্রাম বিশ্ববিদ্যালয়ের অফিসিয়াল ওয়েবসাইটে অনলাইন আবেদন করুন।",
        "location": "চট্টগ্রাম",
        "circular_url": None,
    },
    {
        "name": "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",
        "name_en": "Jahangirnagar University",
        "apply_status": "UPCOMING",
        "deadline": "2026-10-01",
        "exam_date": "2026-10-20",
        "units": ["বিজ্ঞান", "কলা ও মানবিকী", "সমাজবিজ্ঞান", "ব্যবসায় শিক্ষা"],
        "fees": "৳৫০০",
        "requirements": [
            "এসএসসি ও এইচএসসি রেজাল্ট",
            "ফটো আইডি",
            "পাসপোর্ট সাইজের ছবি"
        ],
        "how_to_apply": "শীঘ্রই ঘোষণা করা হবে।",
        "location": "সাভার, ঢাকা",
        "circular_url": None,
    },
    {
        "name": "ঢাকা বিশ্ববিদ্যালয়",
        "name_en": "University of Dhaka",
        "apply_status": "CLOSED",
        "deadline": "2026-08-20",
        "exam_date": "2026-09-10",
        "units": ["ক ইউনিট", "খ ইউনিট", "গ ইউনিট", "ঘ ইউনিট", "চারুকলা"],
        "fees": "৳১,০০০",
        "requirements": [
            "এসএসসি ও এইচএসসি সনদ",
            "ফটো ও আইডি"
        ],
        "how_to_apply": "আবেদন সময়সীমা শেষ হয়ে গেছে।",
        "location": "ঢাকা",
        "circular_url": None,
    }
]


async def seed_universities_if_empty(db: Session, tenant_id: Optional[str] = None):
    count = await db.query(University).count()
    if count == 0:
        for item in SAMPLE_UNIVERSITIES:
            uni = University(**item, tenant_id=tenant_id)
            db.add(uni)
        await db.commit()


@router.get("", response_model=List[UniversityOut], include_in_schema=False)
@router.get("/", response_model=List[UniversityOut])
async def list_universities(
    db: WrappedAsyncSession = Depends(get_db),
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    current_user: Optional[User] = Depends(get_optional_user)
):
    seed_universities_if_empty(db, tenant_id)
    query = db.query(University)

    # Authenticated non-super-admin users are always scoped to their own tenant;
    # anonymous callers (public admission info) are scoped to the header tenant.
    if current_user and current_user.role and current_user.role.name != "SUPER_ADMIN":
        query = query.filter(
            (University.tenant_id == current_user.tenant_id) | (University.tenant_id == None)
        )
    elif tenant_id:
        query = query.filter((University.tenant_id == tenant_id) | (University.tenant_id == None))
    return await query.order_by(University.created_at.asc()).all()


@router.get("/{university_id}", response_model=UniversityOut)
async def get_university(
    university_id: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    uni = await db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University circular not found")
    if current_user and current_user.role and current_user.role.name != "SUPER_ADMIN":
        if uni.tenant_id != current_user.tenant_id and uni.tenant_id is not None:
            raise HTTPException(status_code=403, detail="Access denied for this tenant's university circular")
    return uni


@router.post("", response_model=UniversityOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=UniversityOut, status_code=status.HTTP_201_CREATED)
async def create_university(
    req: UniversityCreate,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    # Only SUPER_ADMIN may assign a different tenant; everyone else is scoped to their own.
    if current_user.role and current_user.role.name != "SUPER_ADMIN":
        if req.tenant_id and req.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied: cannot create circular for another tenant")
    effective_tenant = req.tenant_id or current_user.tenant_id
    uni = University(**req.model_dump(exclude={"tenant_id"}), tenant_id=effective_tenant)
    db.add(uni)
    await db.commit()
    await db.refresh(uni)
    return uni


@router.put("/{university_id}", response_model=UniversityOut)
async def update_university(
    university_id: str,
    req: UniversityUpdate,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    uni = await db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University circular not found")

    if current_user.role and current_user.role.name != "SUPER_ADMIN":
        if uni.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied for this tenant's university circular")

    update_data = req.model_dump(exclude_unset=True, exclude={"tenant_id"})
    for field, value in update_data.items():
        setattr(uni, field, value)

    await db.commit()
    await db.refresh(uni)
    return uni


@router.delete("/{university_id}")
async def delete_university(
    university_id: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    uni = await db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University circular not found")

    if current_user.role and current_user.role.name != "SUPER_ADMIN":
        if uni.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied for this tenant's university circular")

    await db.delete(uni)
    await db.commit()
    return {"success": True, "message": "University circular deleted"}

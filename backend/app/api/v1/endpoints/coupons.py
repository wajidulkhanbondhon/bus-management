from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_optional_user, require_role, get_current_tenant_id
from app.models.coupon import MarketingCoupon
from app.models.user import User
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponOut

router = APIRouter()

DEFAULT_COUPONS = [
    {
        "code": "ADMISSION100",
        "title": "ভর্তি পরীক্ষা স্পেশাল ফেসবুক ক্যাম্পেইন",
        "campaign_channel": "FACEBOOK",
        "discount_type": "FIXED",
        "discount_value": 100.0,
        "target_university": "ALL",
        "max_usage_limit": 500,
        "usage_count": 28,
        "is_active": True,
        "notes": "ফেসবুক পেজ ক্যাম্পেইন থেকে প্রাপ্ত শিক্ষার্থীদের জন্য"
    },
    {
        "code": "CAMPUS50",
        "title": "ক্যাম্পাস বুথ প্রমোশন ডিসকাউন্ট",
        "campaign_channel": "CAMPUS_BOOTH",
        "discount_type": "FIXED",
        "discount_value": 50.0,
        "target_university": "ALL",
        "max_usage_limit": 1000,
        "usage_count": 64,
        "is_active": True,
        "notes": "বিভিন্ন কলেজ ও কোচিং ক্যাম্পাসে লিফলেট ও বুথ অফার"
    },
    {
        "code": "PROMO10",
        "title": "১০% মেগা অ্যাডমিশন ছাড়",
        "campaign_channel": "SPECIAL_EVENT",
        "discount_type": "PERCENTAGE",
        "discount_value": 10.0,
        "min_purchase_amount": 1000.0,
        "max_discount_limit": 200.0,
        "target_university": "ALL",
        "max_usage_limit": 250,
        "usage_count": 12,
        "is_active": True,
        "notes": "১০০০ টাকার বেশি টিকিট বুকিংয়ে সর্বোচ্চ ২০০ টাকা পর্যন্ত ১০% ছাড়"
    },
    {
        "code": "RUEXPRESS",
        "title": "রাজশাহী বিশ্ববিদ্যালয় স্পেশাল বাস প্রমোশন",
        "campaign_channel": "LEAFLET",
        "discount_type": "FIXED",
        "discount_value": 80.0,
        "target_university": "Rajshahi University",
        "max_usage_limit": 300,
        "usage_count": 45,
        "is_active": True,
        "notes": "শুধুমাত্র রাজশাহী বিশ্ববিদ্যালয়গামী ভর্তি স্পেশাল বাসে প্রযোজ্য"
    }
]


def seed_coupons_if_empty(db: Session, tenant_id: Optional[str] = None):
    count = db.query(MarketingCoupon).count()
    if count == 0:
        for item in DEFAULT_COUPONS:
            c = MarketingCoupon(**item, tenant_id=tenant_id)
            db.add(c)
        db.commit()


@router.get("", response_model=List[CouponOut], include_in_schema=False)
@router.get("/", response_model=List[CouponOut])
def list_coupons(
    db: Session = Depends(get_db),
    tenant_id: Optional[str] = Depends(get_current_tenant_id)
):
    seed_coupons_if_empty(db, tenant_id)
    query = db.query(MarketingCoupon)
    if tenant_id:
        query = query.filter((MarketingCoupon.tenant_id == tenant_id) | (MarketingCoupon.tenant_id == None))
    return query.order_by(MarketingCoupon.created_at.desc()).all()


@router.get("/validate/{code}")
def validate_coupon(
    code: str,
    purchase_amount: Optional[float] = Query(0.0),
    university: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    clean_code = code.strip().upper()
    coupon = db.query(MarketingCoupon).filter(MarketingCoupon.code == clean_code, MarketingCoupon.is_active == True).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid or expired coupon code")

    if coupon.max_usage_limit and coupon.usage_count >= coupon.max_usage_limit:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")

    if coupon.min_purchase_amount and purchase_amount < coupon.min_purchase_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum ticket purchase amount of ৳{coupon.min_purchase_amount} required for this coupon"
        )

    # Calculate discount amount
    calc_discount = 0.0
    if coupon.discount_type == "PERCENTAGE":
        calc_discount = (purchase_amount * coupon.discount_value) / 100.0
        if coupon.max_discount_limit and calc_discount > coupon.max_discount_limit:
            calc_discount = coupon.max_discount_limit
    else:
        calc_discount = min(coupon.discount_value, purchase_amount if purchase_amount > 0 else coupon.discount_value)

    return {
        "valid": True,
        "coupon_id": coupon.id,
        "code": coupon.code,
        "title": coupon.title,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "calculated_discount": calc_discount,
        "message": f"Coupon {coupon.code} applied successfully!"
    }


@router.post("", response_model=CouponOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=CouponOut, status_code=status.HTTP_201_CREATED)
def create_coupon(
    req: CouponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    clean_code = req.code.strip().upper()
    existing = db.query(MarketingCoupon).filter(MarketingCoupon.code == clean_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Coupon code '{clean_code}' already exists")

    effective_tenant = req.tenant_id or current_user.tenant_id
    coupon_data = req.model_dump(exclude={"tenant_id", "code"})
    coupon = MarketingCoupon(code=clean_code, **coupon_data, tenant_id=effective_tenant)
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.post("/{coupon_id}/toggle")
def toggle_coupon(
    coupon_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
):
    coupon = db.query(MarketingCoupon).filter(MarketingCoupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    coupon.is_active = not coupon.is_active
    db.commit()
    db.refresh(coupon)
    return {"success": True, "id": coupon.id, "is_active": coupon.is_active}


@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
):
    coupon = db.query(MarketingCoupon).filter(MarketingCoupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    db.delete(coupon)
    db.commit()
    return {"success": True, "message": "Coupon deleted"}

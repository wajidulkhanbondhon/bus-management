from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.deps import get_current_tenant_id, require_role
from app.models.bus import Bus, SeatLayout, Seat
from app.models.trip import Trip, BusRoute, SeatLock
from app.models.booking import BookingSeat
from app.models.coupon import MarketingCoupon
from app.models.user import User

router = APIRouter()


class RestorePurgeRequest(BaseModel):
    category: str  # "buses", "trips", "layouts", "universities", "coupons"
    id: str
    newName: Optional[str] = None
    force: Optional[bool] = False


class EmptyTrashRequest(BaseModel):
    category: Optional[str] = "all"  # "all", "buses", "trips", etc.


class BulkItemIdentifier(BaseModel):
    category: str
    id: str


class BulkActionRequest(BaseModel):
    items: List[BulkItemIdentifier]


# Definition of Folders across the entire software
FOLDERS_CONFIG = [
    {
        "id": "buses",
        "name": "বাস ও ফ্লিট ফোল্ডার",
        "nameEn": "Buses & Fleet Folder",
        "icon": "BusFront",
        "description": "সফটওয়্যার থেকে মুছে ফেলা বাস ও ফ্লিট যানবাহন",
        "color": "from-blue-600 to-indigo-700",
        "badgeColor": "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900"
    },
    {
        "id": "trips",
        "name": "ট্রিপ ও শিডিউল ফোল্ডার",
        "nameEn": "Trips & Schedules Folder",
        "icon": "CalendarRange",
        "description": "বাতিল বা মুছে ফেলা রুট ও ট্রিপ শিডিউল",
        "color": "from-cyan-600 to-teal-700",
        "badgeColor": "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900"
    },
    {
        "id": "layouts",
        "name": "সিট লেআউট ও প্ল্যান ফোল্ডার",
        "nameEn": "Seat Layouts & Plans",
        "icon": "Armchair",
        "description": "ডিলিট করা বাস সিট কনফিগারেশন ও লেআউট",
        "color": "from-purple-600 to-violet-700",
        "badgeColor": "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-900"
    },
    {
        "id": "coupons",
        "name": "কুপন ও প্রমো ফোল্ডার",
        "nameEn": "Coupons & Promos",
        "icon": "TicketPercent",
        "description": "বাতিলকৃত প্রোমো কোড ও ডিসকাউন্ট অফার",
        "color": "from-rose-600 to-pink-700",
        "badgeColor": "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900"
    }
]


@router.get("/summary")
async def get_recycle_bin_summary(
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT", "VIEWER"]))
) -> Dict[str, Any]:
    """Returns the count of deleted items across all system folders."""
    # 1. Deleted Buses
    buses_count = await db.query(Bus).filter(Bus.status == "DELETED").count()

    # 2. Deleted Trips
    trips_count = await db.query(Trip).filter(Trip.status == "DELETED").count()

    # 3. Deleted Seat Layouts
    all_layouts = await db.query(SeatLayout).all()
    layouts_count = sum(1 for l in all_layouts if l.description and l.description.startswith("[DELETED"))

    # 4. Deleted Coupons
    coupons_count = await db.query(MarketingCoupon).filter(MarketingCoupon.notes.ilike("%DELETED%")).count()

    counts = {
        "buses": buses_count,
        "trips": trips_count,
        "layouts": layouts_count,
        "coupons": coupons_count
    }

    folders_with_counts = []
    for f in FOLDERS_CONFIG:
        cnt = counts.get(f["id"], 0)
        folders_with_counts.append({
            **f,
            "count": cnt
        })

    total = sum(counts.values())

    return {
        "success": True,
        "total": total,
        "counts": counts,
        "folders": folders_with_counts
    }


@router.get("/items")
async def get_recycle_bin_items(
    category: str = Query("all"),
    search: Optional[str] = Query(None),
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER", "BOOKING_STAFF", "ACCOUNTANT", "VIEWER"]))
) -> Dict[str, Any]:
    """Returns items in the recycle bin filtered by folder and optional search string."""
    items = []
    now_iso = datetime.now(timezone.utc).isoformat()
    cat_lower = category.lower().strip()

    # 1. Deleted Buses
    if cat_lower in ("all", "buses", "bus"):
        buses = await db.query(Bus).filter(Bus.status == "DELETED").all()
        for b in buses:
            del_time = b.updated_at.isoformat() if b.updated_at else now_iso
            items.append({
                "id": b.id,
                "folderId": "buses",
                "category": "buses",
                "categoryLabel": "বাস ও ফ্লিট",
                "categoryIcon": "BusFront",
                "title": f"{b.bus_name} ({b.bus_number})",
                "subtitle": f"অপারেটর: {b.operator or 'N/A'} • ধারণক্ষমতা: {b.capacity} সিট • ধরন: {b.bus_type}",
                "regNumber": b.reg_number or "",
                "notes": b.notes or "",
                "status": "DELETED",
                "deletedAt": del_time,
                "canRestore": True,
                "canPurge": True
            })

    # 2. Deleted Trips
    if cat_lower in ("all", "trips", "trip"):
        trips = await db.query(Trip).filter(Trip.status == "DELETED").all()
        for t in trips:
            del_time = t.updated_at.isoformat() if t.updated_at else now_iso
            items.append({
                "id": t.id,
                "folderId": "trips",
                "category": "trips",
                "categoryLabel": "ট্রিপ শিডিউল",
                "categoryIcon": "CalendarRange",
                "title": f"ট্রিপ #{t.trip_code or t.id[:8]}",
                "subtitle": f"ছাড়ার তারিখ: {t.departure_date} • সময়: {t.departure_time or 'N/A'}",
                "notes": t.notes or "",
                "status": "DELETED",
                "deletedAt": del_time,
                "canRestore": True,
                "canPurge": True
            })

    # 3. Deleted Seat Layouts
    if cat_lower in ("all", "layouts", "layout"):
        all_layouts = await db.query(SeatLayout).all()
        for l in all_layouts:
            if l.description and l.description.startswith("[DELETED"):
                del_time = now_iso
                clean_desc = l.description
                if ":" in l.description and "]" in l.description:
                    try:
                        timestamp_part = l.description.split("[DELETED:", 1)[1].split("]", 1)[0]
                        del_time = timestamp_part
                        clean_desc = l.description.split("]", 1)[1].strip()
                    except Exception:
                        clean_desc = l.description.replace("[DELETED]", "").strip()

                items.append({
                    "id": l.id,
                    "folderId": "layouts",
                    "category": "layouts",
                    "categoryLabel": "সিট লেআউট",
                    "categoryIcon": "Armchair",
                    "title": l.name,
                    "subtitle": f"{l.total_seats} টি সিট • {l.total_rows}x{l.total_cols} গ্রিড • {clean_desc or 'কোনো বিবরণ নেই'}",
                    "notes": clean_desc,
                    "status": "DELETED",
                    "deletedAt": del_time,
                    "canRestore": True,
                    "canPurge": True
                })

    # 4. Deleted Coupons
    if cat_lower in ("all", "coupons", "coupon"):
        coupons = await db.query(MarketingCoupon).filter(MarketingCoupon.notes.ilike("%DELETED%")).all()
        for c in coupons:
            del_time = c.updated_at.isoformat() if hasattr(c, "updated_at") and c.updated_at else now_iso
            items.append({
                "id": c.id,
                "folderId": "coupons",
                "category": "coupons",
                "categoryLabel": "কুপন ও অফার",
                "categoryIcon": "TicketPercent",
                "title": f"কুপন কোড: {c.code}",
                "subtitle": f"ডিসকাউন্ট: {c.discount_amount} {c.discount_type} • বিবরণ: {c.description or ''}",
                "notes": c.notes or "",
                "status": "DELETED",
                "deletedAt": del_time,
                "canRestore": True,
                "canPurge": True
            })

    # Optional search filtering
    if search:
        s_lower = search.lower().strip()
        items = [
            it for it in items
            if s_lower in it["title"].lower()
            or s_lower in it["subtitle"].lower()
            or s_lower in (it.get("regNumber") or "").lower()
            or s_lower in (it.get("notes") or "").lower()
        ]

    # Sort descending by deletedAt
    items.sort(key=lambda x: x["deletedAt"], reverse=True)

    return {
        "success": True,
        "category": category,
        "total": len(items),
        "items": items
    }


@router.post("/restore")
async def restore_recycle_item(
    req: RestorePurgeRequest,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
) -> Dict[str, Any]:
    """Restores a soft-deleted item back to active status."""
    cat = req.category.lower().strip()

    if cat in ("buses", "bus"):
        bus = await db.query(Bus).filter(Bus.id == req.id).first()
        if not bus:
            raise HTTPException(status_code=404, detail="Bus not found")
        bus.status = "ACTIVE"
        bus_name = bus.bus_name
        bus_number = bus.bus_number
        await db.commit()
        return {
            "success": True,
            "category": "buses",
            "id": req.id,
            "message": f"বাস '{bus_name}' ({bus_number}) সফলভাবে সক্রিয় তালিকায় ফিরিয়ে আনা হয়েছে।"
        }

    elif cat in ("trips", "trip"):
        trip = await db.query(Trip).filter(Trip.id == req.id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        trip.status = "SCHEDULED"
        await db.commit()
        return {
            "success": True,
            "category": "trips",
            "id": req.id,
            "message": f"ট্রিপ #{trip.trip_code or trip.id[:8]} সফলভাবে রিস্টোর করা হয়েছে।"
        }

    elif cat in ("layouts", "layout"):
        layout = await db.query(SeatLayout).filter(SeatLayout.id == req.id).first()
        if not layout:
            raise HTTPException(status_code=404, detail="Layout not found")

        # Conflict check: Check if an active layout already exists with exact same name
        all_active = await db.query(SeatLayout).all()
        target_name = (req.newName or layout.name).strip()
        active_names = [
            l.name.strip().lower() for l in all_active
            if l.id != layout.id and not (l.description and l.description.startswith("[DELETED"))
        ]

        if not req.force and target_name.lower() in active_names:
            return {
                "success": False,
                "error": f"'{target_name}' নামের একটি লেআউট ইতিমধ্যে সিস্টেমে সক্রিয় রয়েছে। নাম পরিবর্তন করে রিস্টোর করুন অথবা ফোর্স রিস্টোর করুন।",
                "isConflict": True,
                "currentName": layout.name
            }

        # Restore description
        clean_desc = layout.description or ""
        if clean_desc.startswith("[DELETED"):
            try:
                clean_desc = clean_desc.split("] ", 1)[1] if "] " in clean_desc else clean_desc.split("]", 1)[1]
            except Exception:
                clean_desc = clean_desc.replace("[DELETED]", "").strip()

        layout.description = clean_desc
        if req.newName:
            layout.name = req.newName.strip()

        await db.commit()
        return {
            "success": True,
            "category": "layouts",
            "id": req.id,
            "message": f"সিট লেআউট '{layout.name}' সফলভাবে সংরক্ষিত লেআউট গ্যালারিতে রিস্টোর করা হয়েছে।"
        }

    elif cat in ("coupons", "coupon"):
        coupon = await db.query(MarketingCoupon).filter(MarketingCoupon.id == req.id).first()
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")
        coupon.is_active = True
        coupon.notes = (coupon.notes or "").replace("DELETED", "").strip()
        await db.commit()
        return {
            "success": True,
            "category": "coupons",
            "id": req.id,
            "message": f"কুপন '{coupon.code}' সফলভাবে সক্রিয় করা হয়েছে।"
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported category '{req.category}'")


@router.post("/purge")
async def purge_recycle_item(
    req: RestorePurgeRequest,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
) -> Dict[str, Any]:
    """Permanently purges an item from the database."""
    cat = req.category.lower().strip()

    if cat in ("buses", "bus"):
        bus = await db.query(Bus).filter(Bus.id == req.id).first()
        if not bus:
            raise HTTPException(status_code=404, detail="Bus not found")

        bus_name = bus.bus_name
        bus_number = bus.bus_number

        # Unlink any attached trips to avoid FK constraint violation
        attached_trips = await db.query(Trip).filter(Trip.bus_id == bus.id).all()
        for at in attached_trips:
            at.bus_id = None

        await db.delete(bus)
        await db.commit()
        return {
            "success": True,
            "category": "buses",
            "id": req.id,
            "message": f"বাস '{bus_name}' ({bus_number}) ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।"
        }

    elif cat in ("trips", "trip"):
        trip = await db.query(Trip).filter(Trip.id == req.id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        await db.delete(trip)
        await db.commit()
        return {
            "success": True,
            "category": "trips",
            "id": req.id,
            "message": f"ট্রিপ #{trip.trip_code or trip.id[:8]} স্থায়ীভাবে মুছে ফেলা হয়েছে।"
        }

    elif cat in ("layouts", "layout"):
        layout = await db.query(SeatLayout).filter(SeatLayout.id == req.id).first()
        if not layout:
            raise HTTPException(status_code=404, detail="Layout not found")
        name = layout.name

        # Unlink buses
        buses = await db.query(Bus).filter(Bus.seat_layout_id == layout.id).all()
        for b in buses:
            b.seat_layout_id = None

        # Clean up seats & dependencies
        seats = await db.query(Seat).filter(Seat.seat_layout_id == layout.id).all()
        seat_ids = [s.id for s in seats]
        if seat_ids:
            try:
                await db.query(SeatLock).filter(SeatLock.seat_id.in_(seat_ids)).delete()
                await db.query(BookingSeat).filter(BookingSeat.seat_id.in_(seat_ids)).delete()
            except Exception:
                pass
            for s in seats:
                await db.delete(s)

        await db.delete(layout)
        await db.commit()
        return {
            "success": True,
            "category": "layouts",
            "id": req.id,
            "message": f"সিট লেআউট '{name}' স্থায়ীভাবে চিরতরে মুছে ফেলা হয়েছে।"
        }

    elif cat in ("coupons", "coupon"):
        coupon = await db.query(MarketingCoupon).filter(MarketingCoupon.id == req.id).first()
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")
        await db.delete(coupon)
        await db.commit()
        return {
            "success": True,
            "category": "coupons",
            "id": req.id,
            "message": f"কুপন '{coupon.code}' স্থায়ীভাবে মুছে ফেলা হয়েছে।"
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported category '{req.category}'")


@router.post("/empty")
async def empty_recycle_bin(
    req: EmptyTrashRequest,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
) -> Dict[str, Any]:
    """Empties the recycle bin either completely or for a specific category."""
    purged_count = 0
    cat = (req.category or "all").lower().strip()

    if cat in ("all", "buses", "bus"):
        deleted_buses = await db.query(Bus).filter(Bus.status == "DELETED").all()
        for b in deleted_buses:
            attached_trips = await db.query(Trip).filter(Trip.bus_id == b.id).all()
            for at in attached_trips:
                at.bus_id = None
            await db.delete(b)
            purged_count += 1

    if cat in ("all", "trips", "trip"):
        deleted_trips = await db.query(Trip).filter(Trip.status == "DELETED").all()
        for t in deleted_trips:
            await db.delete(t)
            purged_count += 1

    if cat in ("all", "coupons", "coupon"):
        deleted_coupons = await db.query(MarketingCoupon).filter(MarketingCoupon.notes.ilike("%DELETED%")).all()
        for c in deleted_coupons:
            await db.delete(c)
            purged_count += 1

    if cat in ("all", "layouts", "layout"):
        all_layouts = await db.query(SeatLayout).all()
        deleted_layouts = [l for l in all_layouts if l.description and l.description.startswith("[DELETED")]
        for dl in deleted_layouts:
            buses = await db.query(Bus).filter(Bus.seat_layout_id == dl.id).all()
            for b in buses:
                b.seat_layout_id = None
            seats = await db.query(Seat).filter(Seat.seat_layout_id == dl.id).all()
            seat_ids = [s.id for s in seats]
            if seat_ids:
                try:
                    await db.query(SeatLock).filter(SeatLock.seat_id.in_(seat_ids)).delete()
                    await db.query(BookingSeat).filter(BookingSeat.seat_id.in_(seat_ids)).delete()
                except Exception:
                    pass
                for s in seats:
                    await db.delete(s)
            await db.delete(dl)
            purged_count += 1

    await db.commit()
    return {
        "success": True,
        "purgedCount": purged_count,
        "message": f"রিসাইকেল বিনের মোট {purged_count} টি আইটেম স্থায়ীভাবে মুছে ফেলা হয়েছে।"
    }


@router.post("/folders/{folder_id}/restore-all")
async def restore_all_in_folder(
    folder_id: str,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
) -> Dict[str, Any]:
    """Restores all items inside a specific folder."""
    restored_count = 0
    f = folder_id.lower().strip()

    if f == "buses":
        buses = await db.query(Bus).filter(Bus.status == "DELETED").all()
        for b in buses:
            b.status = "ACTIVE"
            restored_count += 1

    elif f == "trips":
        trips = await db.query(Trip).filter(Trip.status == "DELETED").all()
        for t in trips:
            t.status = "SCHEDULED"
            restored_count += 1

    elif f == "coupons":
        coupons = await db.query(MarketingCoupon).filter(MarketingCoupon.notes.ilike("%DELETED%")).all()
        for c in coupons:
            c.is_active = True
            c.notes = (c.notes or "").replace("DELETED", "").strip()
            restored_count += 1

    elif f == "layouts":
        all_layouts = await db.query(SeatLayout).all()
        deleted_layouts = [l for l in all_layouts if l.description and l.description.startswith("[DELETED")]
        for l in deleted_layouts:
            clean_desc = l.description or ""
            if clean_desc.startswith("[DELETED"):
                try:
                    clean_desc = clean_desc.split("] ", 1)[1] if "] " in clean_desc else clean_desc.split("]", 1)[1]
                except Exception:
                    clean_desc = clean_desc.replace("[DELETED]", "").strip()
            l.description = clean_desc
            restored_count += 1

    await db.commit()
    return {
        "success": True,
        "folder": folder_id,
        "restoredCount": restored_count,
        "message": f"ফোল্ডারের মোট {restored_count} টি আইটেম সফলভাবে রিস্টোর করা হয়েছে।"
    }


@router.post("/bulk-restore")
async def bulk_restore_items(
    req: BulkActionRequest,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN", "MANAGER"]))
) -> Dict[str, Any]:
    """Restores multiple marked/selected items in one operation."""
    restored_count = 0
    for itm in req.items:
        cat = itm.category.lower().strip()
        if cat in ("buses", "bus"):
            bus = await db.query(Bus).filter(Bus.id == itm.id).first()
            if bus and bus.status == "DELETED":
                bus.status = "ACTIVE"
                restored_count += 1
        elif cat in ("trips", "trip"):
            trip = await db.query(Trip).filter(Trip.id == itm.id).first()
            if trip and trip.status == "DELETED":
                trip.status = "SCHEDULED"
                restored_count += 1
        elif cat in ("coupons", "coupon"):
            coupon = await db.query(MarketingCoupon).filter(MarketingCoupon.id == itm.id).first()
            if coupon:
                coupon.is_active = True
                coupon.notes = (coupon.notes or "").replace("DELETED", "").strip()
                restored_count += 1
        elif cat in ("layouts", "layout"):
            layout = await db.query(SeatLayout).filter(SeatLayout.id == itm.id).first()
            if layout:
                clean_desc = layout.description or ""
                if clean_desc.startswith("[DELETED"):
                    try:
                        clean_desc = clean_desc.split("] ", 1)[1] if "] " in clean_desc else clean_desc.split("]", 1)[1]
                    except Exception:
                        clean_desc = clean_desc.replace("[DELETED]", "").strip()
                layout.description = clean_desc
                restored_count += 1

    await db.commit()
    return {
        "success": True,
        "restoredCount": restored_count,
        "message": f"চিহ্নিত মোট {restored_count} টি আইটেম সফলভাবে রিস্টোর করা হয়েছে।"
    }


@router.post("/bulk-purge")
async def bulk_purge_items(
    req: BulkActionRequest,
    tenant_id: Optional[str] = Depends(get_current_tenant_id),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "ADMIN"]))
) -> Dict[str, Any]:
    """Permanently purges multiple marked/selected items in one operation."""
    purged_count = 0
    for itm in req.items:
        cat = itm.category.lower().strip()
        if cat in ("buses", "bus"):
            bus = await db.query(Bus).filter(Bus.id == itm.id).first()
            if bus:
                attached_trips = await db.query(Trip).filter(Trip.bus_id == bus.id).all()
                for at in attached_trips:
                    at.bus_id = None
                await db.delete(bus)
                purged_count += 1
        elif cat in ("trips", "trip"):
            trip = await db.query(Trip).filter(Trip.id == itm.id).first()
            if trip:
                await db.delete(trip)
                purged_count += 1
        elif cat in ("coupons", "coupon"):
            coupon = await db.query(MarketingCoupon).filter(MarketingCoupon.id == itm.id).first()
            if coupon:
                await db.delete(coupon)
                purged_count += 1
        elif cat in ("layouts", "layout"):
            layout = await db.query(SeatLayout).filter(SeatLayout.id == itm.id).first()
            if layout:
                buses = await db.query(Bus).filter(Bus.seat_layout_id == layout.id).all()
                for b in buses:
                    b.seat_layout_id = None
                seats = await db.query(Seat).filter(Seat.seat_layout_id == layout.id).all()
                seat_ids = [s.id for s in seats]
                if seat_ids:
                    try:
                        await db.query(SeatLock).filter(SeatLock.seat_id.in_(seat_ids)).delete()
                        await db.query(BookingSeat).filter(BookingSeat.seat_id.in_(seat_ids)).delete()
                    except Exception:
                        pass
                    for s in seats:
                        await db.delete(s)
                await db.delete(layout)
                purged_count += 1

    await db.commit()
    return {
        "success": True,
        "purgedCount": purged_count,
        "message": f"চিহ্নিত মোট {purged_count} টি আইটেম স্থায়ীভাবে মুছে ফেলা হয়েছে।"
    }

import os
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.async_wrapper import WrappedAsyncSession
from sqlalchemy import inspect
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import uuid

from app.db.session import get_db, engine, Base
from app.core.deps import get_current_user, require_role
from app.services.backup_service import (
    create_encrypted_backup_service,
    restore_encrypted_backup_service,
    list_encrypted_backups,
    BACKUPS_DIR
)
from app.models.tenant import Tenant
from app.models.user import User, Role, Permission
from app.models.bus import Bus, SeatLayout, Seat, FareZone
from app.models.trip import BusRoute, TripStop, Trip, FareRule, SeatHold, SeatLock
from app.models.student import Student, Guardian
from app.models.booking import Booking, BookingSeat, BookingPassenger, Discount
from app.models.payment import Payment, PaymentTransaction, Refund
from app.models.finance import FinancialLedger, DayClosing
from app.models.audit import AuditLog, SystemSetting

router = APIRouter()

TABLE_MODELS = [
    ("tenants", Tenant),
    ("roles", Role),
    ("permissions", Permission),
    ("users", User),
    ("seat_layouts", SeatLayout),
    ("fare_zones", FareZone),
    ("buses", Bus),
    ("seats", Seat),
    ("routes", BusRoute),
    ("trip_stops", TripStop),
    ("trips", Trip),
    ("fare_rules", FareRule),
    ("students", Student),
    ("guardians", Guardian),
    ("discounts", Discount),
    ("bookings", Booking),
    ("booking_seats", BookingSeat),
    ("booking_passengers", BookingPassenger),
    ("payments", Payment),
    ("payment_transactions", PaymentTransaction),
    ("refunds", Refund),
    ("financial_ledgers", FinancialLedger),
    ("day_closings", DayClosing),
    ("system_settings", SystemSetting),
    ("audit_logs", AuditLog),
]

def serialize_value(val: Any) -> Any:
    if isinstance(val, (datetime,)):
        return val.isoformat()
    if isinstance(val, (uuid.UUID,)):
        return str(val)
    return val

def model_to_dict(obj: Any) -> Dict[str, Any]:
    data = {}
    for column in obj.__table__.columns:
        val = getattr(obj, column.name)
        data[column.name] = serialize_value(val)
    return data

@router.get("/stats")
async def get_database_stats(
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    """Returns total record counts for all core tables (SUPER_ADMIN only)."""
    stats = {}
    for table_name, model in TABLE_MODELS:
        try:
            stats[table_name] = await db.query(model).count()
        except Exception:
            stats[table_name] = 0
    return {
        "success": True,
        "database_type": engine.name,
        "timestamp": datetime.now().isoformat(),
        "tables": stats,
        "total_records": sum(stats.values())
    }

@router.get("/export")
async def export_database_backup(
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    """Exports full database as a structured JSON backup archive (SUPER_ADMIN only)."""
    backup_data: Dict[str, Any] = {
        "meta": {
            "version": "1.0.0",
            "app": "Atoms Bus & Fleet Transit ERP",
            "exported_at": datetime.now().isoformat(),
            "database_dialect": engine.name,
        },
        "data": {}
    }

    total_exported_count = 0
    for table_name, model in TABLE_MODELS:
        try:
            records = await db.query(model).all()
            backup_data["data"][table_name] = [model_to_dict(r) for r in records]
            total_exported_count += len(backup_data["data"][table_name])
        except Exception as e:
            backup_data["data"][table_name] = []

    backup_data["meta"]["total_records"] = total_exported_count
    return backup_data

@router.post("/import")
async def import_database_backup(
    file: UploadFile = File(...),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    """Imports and restores database from a JSON backup archive (SUPER_ADMIN only)."""
    try:
        content = await file.read()
        backup_json = json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON file format: {str(e)}")

    if "data" not in backup_json:
        raise HTTPException(status_code=400, detail="Missing 'data' block in backup archive")

    data = backup_json["data"]
    restored_summary = {}

    try:
        # Import in dependency order
        for table_name, model in TABLE_MODELS:
            rows = data.get(table_name, [])
            if not rows:
                restored_summary[table_name] = 0
                continue

            restored_count = 0
            for row in rows:
                # Convert datetime strings back to datetime objects if needed
                row_dict = {}
                for col in model.__table__.columns:
                    if col.name in row:
                        val = row[col.name]
                        if val is not None and "datetime" in str(col.type).lower() and isinstance(val, str):
                            try:
                                val = datetime.fromisoformat(val)
                            except Exception:
                                pass
                        row_dict[col.name] = val

                # Check if existing record with primary key exists
                pk_col = model.__table__.primary_key.columns.keys()[0]
                pk_val = row_dict.get(pk_col)

                existing = await db.query(model).filter(getattr(model, pk_col) == pk_val).first() if pk_val else None

                if existing:
                    # Update fields
                    for k, v in row_dict.items():
                        if k != pk_col:
                            setattr(existing, k, v)
                else:
                    new_obj = model(**row_dict)
                    db.add(new_obj)

                restored_count += 1

            await db.commit()
            restored_summary[table_name] = restored_count

        return {
            "success": True,
            "message": "Database backup restored successfully!",
            "restored_at": datetime.now().isoformat(),
            "restored_summary": restored_summary,
            "total_restored": sum(restored_summary.values())
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to restore database backup: {str(e)}")


class CreateEncryptedBackupRequest(BaseModel):
    pin: str = Field(..., min_length=4, description="Argon2id Master PIN for backup encryption")
    notes: Optional[str] = Field(None, description="Optional notes for this backup snapshot")


@router.post("/encrypted/create")
async def create_encrypted_backup(
    req: CreateEncryptedBackupRequest,
    request: Request,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    """Generates an Argon2id KDF + AES-256-GCM encrypted database backup envelope."""
    client_ip = request.client.host if request.client else "unknown"
    return await create_encrypted_backup_service(
        db=db,
        user=current_user,
        pin=req.pin,
        ip_address=client_ip,
        notes=req.notes
    )


@router.get("/encrypted/list")
async def list_backups(
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    """Lists all stored encrypted database backups with metadata and SHA-256 checksums."""
    return {
        "success": True,
        "backups": list_encrypted_backups()
    }


@router.get("/encrypted/download/{filename}")
async def download_encrypted_backup(
    filename: str,
    request: Request,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    """Downloads an encrypted backup file (.enc) after recording an audit entry."""
    clean_name = os.path.basename(filename)
    file_path = os.path.join(BACKUPS_DIR, clean_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Backup file not found")

    client_ip = request.client.host if request.client else "unknown"
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="DATABASE_BACKUP_DOWNLOADED",
        entity="Database",
        entity_id=clean_name,
        ip_address=client_ip,
        new_value=json.dumps({"filename": clean_name})
    )
    db.add(audit_entry)
    await db.commit()

    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=clean_name
    )


@router.post("/encrypted/restore")
async def restore_encrypted_backup(
    request: Request,
    pin: str = Form(...),
    file: UploadFile = File(...),
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    """
    Uploads and restores an encrypted database backup envelope.
    Verifies Argon2id PIN and cryptographic integrity before restoring records.
    """
    try:
        encrypted_bytes = await file.read()
        client_ip = request.client.host if request.client else "unknown"
        return await restore_encrypted_backup_service(
            db=db,
            user=current_user,
            pin=pin,
            encrypted_bytes=encrypted_bytes,
            ip_address=client_ip
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restoration error: {str(e)}")


@router.get("/audit-logs")
async def get_database_audit_logs(
    limit: int = 50,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    """Fetches immutable audit logs of all database backup and restore operations."""
    logs = await db.query(AuditLog).filter(
        AuditLog.entity == "Database"
    ).order_by(AuditLog.created_at.desc()).limit(limit).all()

    return [
        {
            "id": log.id,
            "action": log.action,
            "user_id": log.user_id,
            "ip_address": log.ip_address,
            "details": json.loads(log.new_value) if log.new_value else {},
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]

import os
import gzip
import json
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from decimal import Decimal

from app.core.config import settings
from app.core.backup_crypto import encrypt_backup_payload, decrypt_backup_payload
from app.db.async_wrapper import WrappedAsyncSession
from app.models.audit import AuditLog
from app.models.user import User, Role, Permission
from app.models.tenant import Tenant
from app.models.bus import Bus, SeatLayout, Seat, FareZone
from app.models.trip import BusRoute, TripStop, Trip, FareRule, SeatHold, SeatLock
from app.models.student import Student, Guardian
from app.models.booking import Booking, BookingSeat, BookingPassenger, Discount
from app.models.payment import Payment, PaymentTransaction, Refund
from app.models.finance import FinancialLedger, DayClosing
from app.models.audit import SystemSetting

BACKUPS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backups")
os.makedirs(BACKUPS_DIR, exist_ok=True)

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

def serialize_val(val: Any) -> Any:
    if isinstance(val, (datetime,)):
        return val.isoformat()
    if isinstance(val, (uuid.UUID,)):
        return str(val)
    if isinstance(val, Decimal):
        return float(val)
    return val

def model_to_dict(obj: Any) -> Dict[str, Any]:
    data = {}
    for col in obj.__table__.columns:
        data[col.name] = serialize_val(getattr(obj, col.name))
    return data

async def create_encrypted_backup_service(
    db: WrappedAsyncSession,
    user: Optional[User],
    pin: str,
    ip_address: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Exports all core PostgreSQL tables, compresses via Gzip,
    encrypts via Argon2id KDF + AES-256-GCM, saves to disk,
    and creates a permanent AuditLog entry.
    """
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    timestamp_str = now_utc.strftime("%Y%m%d_%H%M%S")
    backup_id = uuid.uuid4().hex[:8]
    filename = f"atoms_backup_{timestamp_str}_{backup_id}.enc"
    file_path = os.path.join(BACKUPS_DIR, filename)

    # 1. Export tables
    backup_data: Dict[str, Any] = {
        "meta": {
            "version": "2.0.0",
            "app": "Atoms Bus & Fleet Transit ERP",
            "created_at": now_utc.isoformat(),
            "notes": notes or "Automated Encrypted Backup",
            "kdf": "Argon2id",
            "cipher": "AES-256-GCM",
        },
        "data": {}
    }

    total_records = 0
    for table_name, model in TABLE_MODELS:
        try:
            records = await db.query(model).all()
            backup_data["data"][table_name] = [model_to_dict(r) for r in records]
            total_records += len(backup_data["data"][table_name])
        except Exception:
            backup_data["data"][table_name] = []

    backup_data["meta"]["total_records"] = total_records

    # 2. Compress via Gzip
    json_bytes = json.dumps(backup_data, ensure_ascii=False).encode("utf-8")
    compressed_bytes = gzip.compress(json_bytes, compresslevel=9)

    # 3. Encrypt via Argon2id KDF + AES-256-GCM
    encrypted_payload = encrypt_backup_payload(compressed_bytes, pin)

    # 4. Save to disk
    with open(file_path, "wb") as f:
        f.write(encrypted_payload)

    file_size = len(encrypted_payload)
    sha256_hash = hashlib.sha256(encrypted_payload).hexdigest()

    # 5. Record Audit Log
    user_id = user.id if user else "SYSTEM_AUTOMATION"
    audit_entry = AuditLog(
        user_id=user_id if user else None,
        action="DATABASE_BACKUP_ENCRYPTED",
        entity="Database",
        entity_id=backup_id,
        ip_address=ip_address,
        new_value=json.dumps({
            "filename": filename,
            "size_bytes": file_size,
            "sha256": sha256_hash,
            "total_records": total_records,
            "kdf": "Argon2id",
            "cipher": "AES-256-GCM"
        })
    )
    db.add(audit_entry)
    await db.commit()

    return {
        "success": True,
        "backup_id": backup_id,
        "filename": filename,
        "file_size": file_size,
        "sha256": sha256_hash,
        "total_records": total_records,
        "created_at": now_utc.isoformat(),
        "kdf": "Argon2id",
        "cipher": "AES-256-GCM"
    }

async def restore_encrypted_backup_service(
    db: WrappedAsyncSession,
    user: User,
    pin: str,
    encrypted_bytes: bytes,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    """
    Decrypts an encrypted backup using Argon2id PIN, verifies integrity,
    decompresses Gzip, transactionally restores records, and writes an AuditLog.
    """
    # 1. Decrypt (raises ValueError if PIN wrong or payload tampered)
    compressed_bytes = decrypt_backup_payload(encrypted_bytes, pin)

    # 2. Decompress
    try:
        json_bytes = gzip.decompress(compressed_bytes)
        backup_json = json.loads(json_bytes.decode("utf-8"))
    except Exception as e:
        raise ValueError(f"Decompression error or invalid JSON structure: {str(e)}")

    if "data" not in backup_json:
        raise ValueError("Corrupted backup: Missing 'data' root block")

    data = backup_json["data"]
    restored_summary = {}

    # 3. Transactional restoration in dependency order
    for table_name, model in TABLE_MODELS:
        rows = data.get(table_name, [])
        if not rows:
            restored_summary[table_name] = 0
            continue

        restored_count = 0
        pk_col = model.__table__.primary_key.columns.keys()[0]

        for row in rows:
            row_dict = {}
            for col in model.__table__.columns:
                if col.name in row:
                    val = row[col.name]
                    if val is not None and "datetime" in str(col.type).lower() and isinstance(val, str):
                        try:
                            val = datetime.fromisoformat(val).replace(tzinfo=None)
                        except Exception:
                            pass
                    row_dict[col.name] = val

            pk_val = row_dict.get(pk_col)
            existing = await db.query(model).filter(getattr(model, pk_col) == pk_val).first() if pk_val else None

            if existing:
                for k, v in row_dict.items():
                    if k != pk_col:
                        setattr(existing, k, v)
            else:
                new_obj = model(**row_dict)
                db.add(new_obj)

            restored_count += 1

        restored_summary[table_name] = restored_count

    # 4. Audit Log for restoration
    audit_entry = AuditLog(
        user_id=user.id,
        action="DATABASE_RESTORE_ENCRYPTED",
        entity="Database",
        entity_id="RESTORE_" + uuid.uuid4().hex[:8],
        ip_address=ip_address,
        new_value=json.dumps({
            "restored_summary": restored_summary,
            "total_restored": sum(restored_summary.values()),
            "kdf": "Argon2id",
            "cipher": "AES-256-GCM"
        })
    )
    db.add(audit_entry)
    await db.commit()

    return {
        "success": True,
        "message": "Encrypted database backup restored successfully",
        "restored_summary": restored_summary,
        "total_restored": sum(restored_summary.values())
    }

def list_encrypted_backups() -> List[Dict[str, Any]]:
    """Lists all encrypted backup archives in backend/backups/."""
    backups = []
    if not os.path.exists(BACKUPS_DIR):
        return []

    for fname in sorted(os.listdir(BACKUPS_DIR), reverse=True):
        if fname.endswith(".enc"):
            fpath = os.path.join(BACKUPS_DIR, fname)
            stat = os.stat(fpath)
            # Read first 100KB for sha256 or whole file
            hasher = hashlib.sha256()
            with open(fpath, "rb") as f:
                while chunk := f.read(65536):
                    hasher.update(chunk)

            backups.append({
                "filename": fname,
                "size_bytes": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
                "sha256": hasher.hexdigest(),
                "kdf": "Argon2id",
                "cipher": "AES-256-GCM"
            })
    return backups

import os
import sys
import json
import asyncio
from httpx import AsyncClient, ASGITransport
from main import app

async def run_encrypted_backup_test():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n=======================================================")
        print("[TEST SUITE] ENCRYPTED BACKUP & AUDIT LOG (ARGON2ID KDF)")
        print("=======================================================")

        # Step 0: Authenticate as SUPER_ADMIN
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@transport.office", "password": "admin1234"}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        auth_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {auth_token}"}
        print("--> [PASS] Logged in as SUPER_ADMIN")

        # -------------------------------------------------------------
        # 1. CREATE ENCRYPTED BACKUP WITH ARGON2ID PIN
        # -------------------------------------------------------------
        master_pin = "7788"
        print(f"\n--> [TEST 1] Generating Encrypted Backup with Master PIN '{master_pin}'...")
        create_res = await client.post(
            "/api/v1/backup/encrypted/create",
            headers=headers,
            json={"pin": master_pin, "notes": "Automated Security Test Backup"}
        )
        assert create_res.status_code == 200, f"Backup creation failed: {create_res.text}"
        backup_meta = create_res.json()
        assert backup_meta["success"] is True
        assert backup_meta["kdf"] == "Argon2id"
        assert backup_meta["cipher"] == "AES-256-GCM"
        filename = backup_meta["filename"]
        sha256_hash = backup_meta["sha256"]
        file_size = backup_meta["file_size"]
        print(f"  [PASS] Backup created: {filename}")
        print(f"  [PASS] Envelope Size: {file_size} bytes | SHA256: {sha256_hash[:16]}...")

        # Verify file exists on disk
        backup_path = os.path.join(os.path.dirname(__file__), "backups", filename)
        assert os.path.exists(backup_path), f"Backup file not found on disk: {backup_path}"
        with open(backup_path, "rb") as f:
            file_bytes = f.read()
        assert file_bytes.startswith(b"ATOMS_ENC_V1"), "Envelope must start with ATOMS_ENC_V1 magic header"
        print("  [PASS] Validated binary envelope on disk with ATOMS_ENC_V1 magic header")

        # -------------------------------------------------------------
        # 2. LIST ENCRYPTED BACKUPS
        # -------------------------------------------------------------
        print("\n--> [TEST 2] Listing Stored Encrypted Backups...")
        list_res = await client.get("/api/v1/backup/encrypted/list", headers=headers)
        assert list_res.status_code == 200
        backups_list = list_res.json()["backups"]
        matching = [b for b in backups_list if b["filename"] == filename]
        assert len(matching) > 0, "Created backup missing from list"
        print(f"  [PASS] Verified backup listed in server catalog (Total backups: {len(backups_list)})")

        # -------------------------------------------------------------
        # 3. ATTACK RESISTANCE: DECRYPTION WITH WRONG PIN
        # -------------------------------------------------------------
        print("\n--> [TEST 3] Testing Attack Resistance: Decrypting with WRONG PIN '0000'...")
        wrong_pin_res = await client.post(
            "/api/v1/backup/encrypted/restore",
            headers=headers,
            data={"pin": "0000"},
            files={"file": (filename, file_bytes, "application/octet-stream")}
        )
        assert wrong_pin_res.status_code == 400, f"Expected 400 on wrong PIN, got: {wrong_pin_res.status_code}"
        assert "Decryption failed" in wrong_pin_res.text
        print("  [SHIELD] Attack Blocked: System rejected restoration with incorrect PIN!")

        # -------------------------------------------------------------
        # 4. TAMPER RESISTANCE: ALTERED CIPHERTEXT
        # -------------------------------------------------------------
        print("\n--> [TEST 4] Testing Tamper Resistance: Mutating ciphertext...")
        tampered_bytes = bytearray(file_bytes)
        tampered_bytes[-5] ^= 0xFF  # Flip bits in encrypted payload
        tampered_res = await client.post(
            "/api/v1/backup/encrypted/restore",
            headers=headers,
            data={"pin": master_pin},
            files={"file": (filename, bytes(tampered_bytes), "application/octet-stream")}
        )
        assert tampered_res.status_code == 400
        assert "Decryption failed" in tampered_res.text
        print("  [SHIELD] Tamper Blocked: AES-GCM detected bit alteration and rejected corrupted payload!")

        # -------------------------------------------------------------
        # 5. RESTORATION WITH CORRECT PIN
        # -------------------------------------------------------------
        print(f"\n--> [TEST 5] Restoring Encrypted Backup with VALID PIN '{master_pin}'...")
        restore_res = await client.post(
            "/api/v1/backup/encrypted/restore",
            headers=headers,
            data={"pin": master_pin},
            files={"file": (filename, file_bytes, "application/octet-stream")}
        )
        assert restore_res.status_code == 200, f"Valid restore failed: {restore_res.text}"
        restore_data = restore_res.json()
        assert restore_data["success"] is True
        print(f"  [PASS] Restoration Succeeded! Total records restored: {restore_data['total_restored']}")

        # -------------------------------------------------------------
        # 6. AUDIT LOG INTEGRITY VERIFICATION
        # -------------------------------------------------------------
        print("\n--> [TEST 6] Verifying Database Audit Logs for Backup & Restore...")
        audit_res = await client.get("/api/v1/backup/audit-logs", headers=headers)
        assert audit_res.status_code == 200
        audit_logs = audit_res.json()
        actions = [log["action"] for log in audit_logs]
        assert "DATABASE_BACKUP_ENCRYPTED" in actions, "Missing DATABASE_BACKUP_ENCRYPTED in audit log"
        assert "DATABASE_RESTORE_ENCRYPTED" in actions, "Missing DATABASE_RESTORE_ENCRYPTED in audit log"

        backup_audit = next(log for log in audit_logs if log["action"] == "DATABASE_BACKUP_ENCRYPTED")
        assert backup_audit["details"]["sha256"] == sha256_hash
        assert backup_audit["details"]["kdf"] == "Argon2id"
        print(f"  [PASS] Audit Log verified: action={backup_audit['action']} | SHA256={backup_audit['details']['sha256'][:16]}... | KDF={backup_audit['details']['kdf']}")

        print("\n=======================================================")
        print("[SUCCESS] ALL ENCRYPTED BACKUP & AUDIT TESTS PASSED!")
        print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(run_encrypted_backup_test())

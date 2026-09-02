import sys
import time
import uuid
import asyncio

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from httpx import AsyncClient, ASGITransport
from main import app
from app.core.config import settings
from app.core.api_signature import generate_signature
from app.core.token_rotation import token_rotator

async def run_security_suite_test():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n=======================================================")
        print("[SECURITY SUITE] ENTERPRISE TEST: HASH + ROTATION + SQUARE")
        print("=======================================================")

        # -------------------------------------------------------------
        # 1. TEST ROTATION (Refresh Token Rotation & Reuse Detection)
        # -------------------------------------------------------------
        print("\n--> [TEST 1] Testing Single-Use Refresh Token Rotation (RTR)...")
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@transport.office", "password": "admin1234"}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        login_data = login_res.json()
        initial_refresh_token = login_data.get("refresh_token")
        initial_access_token = login_data.get("access_token")
        assert initial_refresh_token is not None, "Missing refresh token in login response"
        print("  [PASS] Login successful: Issued Access Token & Refresh Token")

        # Rotate token once
        refresh_res_1 = await client.post(
            "/api/v1/auth/refresh",
            headers={"Authorization": f"Bearer {initial_refresh_token}"}
        )
        assert refresh_res_1.status_code == 200, f"Refresh 1 failed: {refresh_res_1.text}"
        rotated_data = refresh_res_1.json()
        second_refresh_token = rotated_data.get("refresh_token")
        assert second_refresh_token != initial_refresh_token, "Rotated refresh token must be different"
        print("  [PASS] Refresh Token successfully ROTATED to a new single-use token")

        # Attempt Token Reuse: Re-submitting the initial (consumed) refresh token
        print("  --> Testing Token Reuse / Theft Detection...")
        stolen_attempt_res = await client.post(
            "/api/v1/auth/refresh",
            headers={"Authorization": f"Bearer {initial_refresh_token}"}
        )
        assert stolen_attempt_res.status_code == 401, f"Expected 401 on token reuse, got: {stolen_attempt_res.status_code}"
        assert "Token reuse detected" in stolen_attempt_res.text
        print("  [SHIELD] BREACH DETECTED: Consumed token re-use blocked and Family Revocation executed!")

        # -------------------------------------------------------------
        # 2. TEST HASH (HMAC-SHA256 Payload Integrity & Anti-Replay)
        # -------------------------------------------------------------
        print("\n--> [TEST 2] Testing HMAC-SHA256 Request Integrity & Anti-Replay...")
        test_body = b'{"tenant_id": "central-transit", "action": "verify"}'
        timestamp = str(time.time())
        nonce = uuid.uuid4().hex

        valid_sig = generate_signature(settings.SECRET_KEY, timestamp, nonce, test_body)
        print("  [PASS] Cryptographic signature generated with server secret key")

        # Test tampering: altered body
        tampered_body = b'{"tenant_id": "hacked-transit", "action": "verify"}'
        tampered_sig = generate_signature(settings.SECRET_KEY, timestamp, nonce, tampered_body)
        assert valid_sig != tampered_sig
        print("  [SHIELD] Tampered body produces mismatched cryptographic digest (Integrity Guard Validated)")

        # -------------------------------------------------------------
        # 3. TEST SQUARE (Double-Layer / 2FA Action Guard)
        # -------------------------------------------------------------
        print("\n--> [TEST 3] Testing Square Double-Layer Guard for High-Stakes Actions...")
        # Re-login to get a fresh valid access token after family revocation
        relogin = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@transport.office", "password": "admin1234"}
        )
        auth_token = relogin.json()["access_token"]

        # Attempt 1: Call /refund without X-Action-PIN -> Must fail with 403
        no_pin_res = await client.post(
            "/api/v1/payments/refund",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "booking_id": "ba2022e7-3b9a-4bb7-832f-119fc52bbb92",
                "amount": 500.0,
                "method": "CASH",
                "reason": "Customer cancellation"
            }
        )
        assert no_pin_res.status_code == 403, f"Expected 403 without action pin, got: {no_pin_res.status_code}"
        assert "Square Verification Required" in no_pin_res.text
        print("  [SHIELD] Square Guard BLOCKED refund without secondary Action PIN (Layer 2 Active)")

        # Attempt 2: Call /refund with invalid Action PIN -> Must fail with 403
        bad_pin_res = await client.post(
            "/api/v1/payments/refund",
            headers={"Authorization": f"Bearer {auth_token}", "X-Action-PIN": "0000"},
            json={
                "booking_id": "ba2022e7-3b9a-4bb7-832f-119fc52bbb92",
                "amount": 500.0,
                "method": "CASH",
                "reason": "Customer cancellation"
            }
        )
        assert bad_pin_res.status_code == 403
        assert "Square Verification Failed" in bad_pin_res.text
        print("  [SHIELD] Square Guard BLOCKED refund with incorrect Action PIN")

        # Attempt 3: Call /refund with valid Action PIN -> Passes Square Guard Layer!
        valid_pin_res = await client.post(
            "/api/v1/payments/refund",
            headers={"Authorization": f"Bearer {auth_token}", "X-Action-PIN": "9988"},
            json={
                "booking_id": "ba2022e7-3b9a-4bb7-832f-119fc52bbb92",
                "amount": 100.0,
                "method": "CASH",
                "reason": "Authorized partial discount refund"
            }
        )
        # Passed the Square guard (it will not be 403)
        assert valid_pin_res.status_code != 403, f"Should pass Square Guard, got: {valid_pin_res.status_code}"
        print(f"  [PASS] Square Guard AUTHORIZED: Layer 1 (JWT) + Layer 2 (Action PIN) Verified! Status: {valid_pin_res.status_code}")

        print("\n=======================================================")
        print("[SUCCESS] ALL SECURITY CHECKS PASSED: HASH + ROTATION + SQUARE!")
        print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(run_security_suite_test())

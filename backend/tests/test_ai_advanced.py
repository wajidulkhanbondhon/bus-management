"""
Automated test suite for AI advanced features:
- Crash fix verification on Supervisor, Student, and Office AI
- Rate limiting verification (RateLimiter)
- Extended audit log telemetry
- SSE streaming response generator
"""

import json
from app.db.session import SessionLocal
from app.ai.context import AIContext, DataConfidence
from app.ai.orchestrator import AIOrchestrator
from app.core.rate_limiter import RateLimiter
from app.models.audit import AuditLog


def test_supervisor_fallback_no_crash():
    db = SessionLocal()
    try:
        res = AIOrchestrator.process_query(
            db=db,
            prompt="কেমন আছেন ভাই? বাসের যাত্রা কেমন চলছে?",
            context=AIContext.SUPERVISOR_AI,
            role="SUPERVISOR"
        )
        assert res.context == AIContext.SUPERVISOR_AI
        assert len(res.text) > 5
        print("[PASS] Supervisor AI Fallback without crash: PASSED")
    finally:
        db.close()


def test_student_phone_validation():
    db = SessionLocal()
    try:
        # Without student phone
        res = AIOrchestrator.process_query(
            db=db,
            prompt="আমার সিট নম্বর কত?",
            context=AIContext.STUDENT_AI
        )
        assert "মোবাইল নম্বর" in res.text or "ফোন নম্বর" in res.text
        print("[PASS] Student AI Phone Number Validation: PASSED")
    finally:
        db.close()


def test_rate_limiter():
    limiter = RateLimiter(max_requests=5, window_seconds=10)
    key = "test_user_123"
    
    # 5 requests should pass
    for i in range(5):
        assert limiter.allow(key) is True, f"Request {i+1} should be allowed"

    # 6th request should fail
    assert limiter.allow(key) is False, "6th request should be rate-limited"
    
    # Reset
    limiter.reset(key)
    assert limiter.allow(key) is True, "Request after reset should be allowed"
    print("[PASS] RateLimiter In-Memory Sliding Window: PASSED")


def test_extended_audit_logging():
    db = SessionLocal()
    try:
        AIOrchestrator.process_query(
            db=db,
            prompt="আজকের সেলস কত?",
            context=AIContext.OFFICE_AI,
            role="SUPER_ADMIN"
        )
        # Verify latest audit log contains JSON with detected_intent and model_used
        log = db.query(AuditLog).filter(AuditLog.action.like("AI_%")).order_by(AuditLog.created_at.desc()).first()
        assert log is not None
        payload = json.loads(log.new_value)
        assert "detected_intent" in payload
        assert "confidence_score" in payload
        assert "model_used" in payload
        assert "latency_ms" in payload
        print(f"[PASS] Extended Audit Logging ({payload['detected_intent']}, {payload['model_used']}): PASSED")
    finally:
        db.close()


def test_stream_query_generator():
    db = SessionLocal()
    try:
        events = list(AIOrchestrator.stream_query(
            db=db,
            prompt="আজকের সেলস কত?",
            context=AIContext.OFFICE_AI,
            role="SUPER_ADMIN"
        ))
        assert len(events) > 0
        assert any("data:" in e for e in events)
        # Last event must have done: true
        last_event = events[-1]
        assert "done" in last_event
        print("[PASS] SSE Streaming Generator: PASSED")
    finally:
        db.close()


if __name__ == "__main__":
    print("\nRunning Advanced AI Test Suite...")
    test_rate_limiter()
    test_student_phone_validation()
    test_extended_audit_logging()
    test_stream_query_generator()
    test_supervisor_fallback_no_crash()
    print("\n[PASS] ALL ADVANCED AI TESTS PASSED 100%!\n")

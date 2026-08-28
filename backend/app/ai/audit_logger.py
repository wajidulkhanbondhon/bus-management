"""
AI Observability & Audit Logger for Bus Management System.
Tracks user questions, context, tools used, latency, action execution, and 👍/👎 user feedback.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


class AIAuditLogger:
    @staticmethod
    def log_interaction(
        db: Session,
        user_id: Optional[str],
        tenant_id: Optional[str],
        ai_context: str,
        question: str,
        tools_used: List[str],
        action_performed: Optional[str] = None,
        latency_ms: float = 0.0,
        success: bool = True
    ) -> None:
        """Stores AI request & action audit record in the database."""
        try:
            summary = {
                "ai_context": ai_context,
                "tenant_id": tenant_id,
                "question": question[:250],
                "tools_used": tools_used,
                "action_performed": action_performed,
                "latency_ms": round(latency_ms, 2),
                "success": success,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

            audit = AuditLog(
                user_id=user_id,
                action=f"AI_{ai_context}_{action_performed or 'QUERY'}",
                entity="AIAssistant",
                entity_id=user_id or "ANONYMOUS",
                new_value=str(summary)
            )
            db.add(audit)
            db.commit()
        except Exception as e:
            db.rollback()
            # Do not fail request if logging errors
            print(f"[AIAuditLogger] Warning: failed to write audit log: {e}")

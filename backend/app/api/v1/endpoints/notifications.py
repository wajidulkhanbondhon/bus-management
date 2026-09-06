from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.db.async_wrapper import WrappedAsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.booking import Booking
from app.models.communication import MessageLog
from app.services.notification_service import dispatch_booking_notifications

router = APIRouter()


class SendTicketNotificationRequest(BaseModel):
    booking_id: str
    channel: Optional[str] = "ALL"  # "ALL", "WHATSAPP", "SMS", "EMAIL"


@router.post("/send-ticket")
async def send_ticket_notification(
    req: SendTicketNotificationRequest,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    booking = await db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    user_id = current_user.id if current_user else None
    result = await dispatch_booking_notifications(db, booking, triggered_by_user_id=user_id)
    return result


@router.get("/logs/{booking_id}")
async def get_booking_notification_logs(
    booking_id: str,
    db: WrappedAsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = await db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    phone = booking.contact_phone
    if not phone:
        return []

    logs = await db.query(MessageLog).filter(MessageLog.recipient_phone == phone).order_by(MessageLog.created_at.desc()).limit(20).all()
    return [
        {
            "id": l.id,
            "channel": l.channel,
            "status": l.status,
            "recipient_name": l.recipient_name,
            "recipient_phone": l.recipient_phone,
            "recipient_email": l.recipient_email,
            "sent_at": l.sent_at,
            "created_at": l.created_at
        }
        for l in logs
    ]

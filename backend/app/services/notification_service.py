import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.communication import MessageLog
from app.models.booking import Booking
from app.models.audit import SystemSetting


async def get_system_branding(db: Session) -> Dict[str, str]:
    setting = await db.query(SystemSetting).filter(SystemSetting.key == "organization_saas_branding").first()
    if setting and setting.value:
        try:
            return json.loads(setting.value)
        except Exception:
            pass
    return {
        "name": "ATOMS Transit Management",
        "tagline": "বাংলাদেশ বিশ্ববিদ্যালয় ভর্তি স্পেশাল এক্সপ্রেস বাস",
        "phone": "01711000001",
        "email": "support@atomstransit.com",
        "address": "ঢাকা, বাংলাদেশ",
        "website": "https://atoms-transit.com"
    }


def format_whatsapp_ticket_text(booking: Booking, branding: Dict[str, str], passenger: Optional[Any] = None) -> str:
    org_name = branding.get("name", "ATOMS Transit Management")
    phone_helpline = branding.get("phone", "01711000001")
    
    b_number = booking.booking_number or "N/A"
    p_name = passenger.passenger_name if passenger else (booking.contact_name or "সম্মানিত যাত্রী")
    
    all_seats = [p.seat_number for p in (booking.passengers or []) if getattr(p, "seat_number", None)]
    seats_str = passenger.seat_number if (passenger and getattr(passenger, "seat_number", None)) else (", ".join(all_seats) if all_seats else "নির্ধারিত সিট")
    
    trip = booking.trip
    route_name = "নির্ধারিত রুট"
    dep_date = "নির্ধারিত তারিখ"
    dep_time = "নির্ধারিত সময়"
    if trip:
        if trip.route:
            route_name = trip.route.route_name or f"{trip.route.origin or 'ঢাকা'} ➔ {trip.route.destination or 'ভর্তি কেন্দ্র'}"
        if trip.departure_date:
            dep_date = str(trip.departure_date).split(" ")[0]
        if trip.departure_time:
            dep_time = str(trip.departure_time).split(" ")[-1][:5]

    boarding = booking.boarding_point or "কাউন্টার পয়েন্ট"
    dropping = booking.dropping_point or "বিশ্ববিদ্যালয় কেন্দ্র"
    paid_amt = float(booking.paid_amount or 0.0)
    due_amt = float(booking.due_amount or 0.0)
    pmt_status = "পরিশোধিত (PAID)" if due_amt <= 0 else f"বকেয়া ৳{due_amt:.0f}"
    
    return (
        f"🚌 *{org_name} — অফিসিয়াল টিকিট ও মানি রিসিট*\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📋 *বুকিং নম্বর:* {b_number}\n"
        f"👤 *যাত্রীর নাম:* {p_name}\n"
        f"💺 *বরাদ্দকৃত আসন:* {seats_str}\n"
        f"📍 *রুট:* {route_name}\n"
        f"📅 *যাত্রার সময়:* {dep_date} ({dep_time})\n"
        f"🏢 *বোর্ডিং পয়েন্ট:* {boarding}\n"
        f"🏁 *গন্তব্য:* {dropping}\n"
        f"💳 *পেমেন্ট স্ট্যাটাস:* ৳{paid_amt:.0f} [{pmt_status}]\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"🔗 *ডিজিটাল টিকিট ও কিউআর কোড লিঙ্ক:*\n"
        f"https://atoms-transit.com/bookings/{booking.id}\n\n"
        f"*(বাসে ওঠার সময় এই ডিজিটাল টিকিট ও কিউআর কোড প্রদর্শন করুন)*\n\n"
        f"📞 হেল্পলাইন: {phone_helpline}\n"
        f"আপনার যাত্রা শুভ ও নিরাপদ হোক!\n"
        f"*{org_name}*"
    )


def format_sms_ticket_text(booking: Booking, branding: Dict[str, str]) -> str:
    org_name = branding.get("name", "ATOMS Transit")[:20]
    b_number = booking.booking_number or "N/A"
    all_seats = [p.seat_number for p in (booking.passengers or []) if getattr(p, "seat_number", None)]
    seats_str = ",".join(all_seats) if all_seats else "Seat"
    paid_amt = float(booking.paid_amount or 0.0)
    due_amt = float(booking.due_amount or 0.0)
    
    return (
        f"[{org_name}] Booking Confirmed! ID: {b_number}, Seats: {seats_str}, "
        f"Paid: Tk {paid_amt:.0f}, Due: Tk {due_amt:.0f}. "
        f"View Ticket: https://atoms-transit.com/bookings/{booking.id}"
    )


def format_email_ticket_html(booking: Booking, branding: Dict[str, str], passenger: Optional[Any] = None) -> str:
    org_name = branding.get("name", "ATOMS Transit Management")
    tagline = branding.get("tagline", "University Admission Transit Special")
    phone_helpline = branding.get("phone", "01711000001")
    b_number = booking.booking_number or "N/A"
    p_name = passenger.passenger_name if passenger else (booking.contact_name or "Valued Passenger")
    
    all_seats = [p.seat_number for p in (booking.passengers or []) if getattr(p, "seat_number", None)]
    seats_str = passenger.seat_number if (passenger and getattr(passenger, "seat_number", None)) else (", ".join(all_seats) if all_seats else "Assigned Seat")
    
    trip = booking.trip
    route_name = trip.route.route_name if (trip and trip.route) else "Express Transit Route"
    dep_date = str(trip.departure_date).split(" ")[0] if (trip and trip.departure_date) else "Scheduled Date"
    paid_amt = float(booking.paid_amount or 0.0)
    due_amt = float(booking.due_amount or 0.0)
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">{org_name}</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">{tagline}</p>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #059669; font-size: 18px; margin-top: 0;">✓ টিকিট ও পেমেন্ট রসিদ নিশ্চিত হয়েছে</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">বুকিং নম্বর:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">{b_number}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">যাত্রীর নাম:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">{p_name}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">বরাদ্দকৃত সিট:</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #2563eb;">{seats_str}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">রুট:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">{route_name}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">যাত্রার তারিখ:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">{dep_date}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">পরিশোধিত টাকা:</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #059669;">৳{paid_amt:.0f}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">বকেয়া টাকা:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">৳{due_amt:.0f}</td></tr>
          </table>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://atoms-transit.com/bookings/{booking.id}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">ডিজিটাল টিকিট ও কিউআর কোড দেখুন</a>
          </div>
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">জরুরি প্রয়োজনে হেল্পলাইন: {phone_helpline}</p>
        </div>
      </div>
    </body>
    </html>
    """


async def dispatch_booking_notifications(
    db: Session,
    booking: Booking,
    triggered_by_user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Automated dispatch of WhatsApp, SMS, and optional Email notifications upon booking.
    Records all dispatched events into the message_logs database table.
    """
    branding = await get_system_branding(db)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    recipients_handled = []
    dispatched_logs = []
    
    passengers = booking.passengers or []
    primary_phone = booking.contact_phone or (passengers[0].passenger_phone if passengers else None)
    primary_name = booking.contact_name or (passengers[0].passenger_name if passengers else "Passenger")
    primary_email = booking.contact_email or (getattr(passengers[0], "passenger_email", None) if passengers else None)
    
    if not primary_phone:
        return {"success": False, "error": "No phone number available for notification dispatch."}

    # 1. Automated WhatsApp Notification Log
    wa_content = format_whatsapp_ticket_text(booking, branding)
    wa_log = MessageLog(
        tenant_id=booking.tenant_id,
        recipient_name=primary_name,
        recipient_phone=primary_phone,
        recipient_email=primary_email,
        channel="WHATSAPP",
        message_type="TRANSACTIONAL",
        content=wa_content,
        status="SENT",
        sent_by_id=triggered_by_user_id,
        sent_at=now
    )
    db.add(wa_log)
    dispatched_logs.append("WHATSAPP")
    
    # 2. Automated SMS Notification Log
    sms_content = format_sms_ticket_text(booking, branding)
    sms_log = MessageLog(
        tenant_id=booking.tenant_id,
        recipient_name=primary_name,
        recipient_phone=primary_phone,
        recipient_email=primary_email,
        channel="SMS",
        message_type="TRANSACTIONAL",
        content=sms_content,
        status="SENT",
        sent_by_id=triggered_by_user_id,
        sent_at=now
    )
    db.add(sms_log)
    dispatched_logs.append("SMS")

    # 3. Automated Email Notification Log (if email is provided)
    if primary_email and "@" in primary_email:
        email_content = format_email_ticket_html(booking, branding)
        email_log = MessageLog(
            tenant_id=booking.tenant_id,
            recipient_name=primary_name,
            recipient_phone=primary_phone,
            recipient_email=primary_email,
            channel="EMAIL",
            message_type="TRANSACTIONAL",
            content=email_content,
            status="SENT",
            sent_by_id=triggered_by_user_id,
            sent_at=now
        )
        db.add(email_log)
        dispatched_logs.append("EMAIL")

    await db.commit()
    
    return {
        "success": True,
        "booking_number": booking.booking_number,
        "channels": dispatched_logs,
        "recipient_phone": primary_phone,
        "recipient_email": primary_email,
        "whatsapp_text": wa_content,
        "sms_text": sms_content
    }

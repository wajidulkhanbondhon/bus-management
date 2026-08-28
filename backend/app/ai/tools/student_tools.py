"""
Student AI Tools: Personal Transport Assistant, My Trip, My Seat, My Due/Payment,
Available Trips Discovery, Policy & Guardian Eligibility Q&A.
Strict Isolation: Never accesses other students' private data or internal office financials.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.ai.context import AIContext
from app.ai.tools.registry import AIToolRegistry
from app.ai.knowledge_base import query_knowledge_base
from app.models.booking import Booking, BookingSeat, BookingPassenger
from app.models.trip import Trip, TripStop
from app.models.student import Student
from app.models.payment import Payment


# --- 1. PERSONAL STUDENT TRANSPORT INFO TOOLS ---

@AIToolRegistry.register(
    name="get_my_active_booking",
    description="Retrieves the authenticated student's active confirmed bus booking, trip date, bus number, and seats.",
    allowed_contexts=[AIContext.STUDENT_AI]
)
def get_my_active_booking(db: Session, student_phone: str) -> Dict[str, Any]:
    """Strictly searches bookings matching the authenticated student's phone number."""
    if not student_phone:
        return {"error": "Authentication phone number required", "success": False}

    booking = db.query(Booking).filter(
        Booking.contact_phone == student_phone,
        Booking.booking_status.in_(["CONFIRMED", "PRE_BOOKED", "COMPLETED"])
    ).order_by(Booking.created_at.desc()).first()

    if not booking:
        return {
            "has_booking": False,
            "message": "আপনার মোবাইল নম্বরে বর্তমানে কোনো সক্রিয় বাস বুকিং পাওয়া যায়নি।",
            "confidence": "FACT"
        }

    trip = booking.trip
    bus = trip.bus if trip else None
    seats_list = [s.seat.seat_number for s in booking.seats if s.seat]

    return {
        "has_booking": True,
        "booking_number": booking.booking_number,
        "trip_code": trip.trip_code if trip else "N/A",
        "route_name": trip.route.route_name if trip and trip.route else "ঢাকা ➔ রাজশাহী বিশ্ববিদ্যালয়",
        "departure_date": trip.departure_date.strftime("%Y-%m-%d") if trip else "N/A",
        "departure_time": trip.departure_time.strftime("%I:%M %p") if trip else "N/A",
        "bus_name": bus.bus_name if bus else "ATOMS এক্সপ্রেস",
        "bus_number": bus.bus_number if bus else "N/A",
        "bus_type": bus.bus_type if bus else "MIXED",
        "seats": seats_list,
        "boarding_point": booking.boarding_point or "গাবতলী প্রধান কাউন্টার",
        "dropping_point": booking.dropping_point or "রাজশাহী বিশ্ববিদ্যালয় মেইন গেট",
        "total_amount_bdt": booking.net_amount,
        "paid_amount_bdt": booking.paid_amount,
        "due_amount_bdt": booking.due_amount,
        "booking_status": booking.booking_status,
        "payment_status": booking.payment_status,
        "confidence": "FACT"
    }


@AIToolRegistry.register(
    name="get_my_payment_and_due",
    description="Retrieves the payment status, paid amount, and remaining due for the student.",
    allowed_contexts=[AIContext.STUDENT_AI]
)
def get_my_payment_and_due(db: Session, student_phone: str) -> Dict[str, Any]:
    booking = db.query(Booking).filter(
        Booking.contact_phone == student_phone,
        Booking.booking_status.in_(["CONFIRMED", "PRE_BOOKED"])
    ).order_by(Booking.created_at.desc()).first()

    if not booking:
        return {
            "has_due": False,
            "due_amount_bdt": 0.0,
            "message": "আপনার কোনো বকেয়া নেই।"
        }

    return {
        "booking_number": booking.booking_number,
        "total_fare_bdt": booking.net_amount,
        "paid_amount_bdt": booking.paid_amount,
        "due_amount_bdt": booking.due_amount,
        "payment_status": booking.payment_status,
        "is_cleared": booking.due_amount <= 0.0,
        "confidence": "FACT"
    }


# --- 2. TRIP & SEAT DISCOVERY TOOLS ---

@AIToolRegistry.register(
    name="search_available_trips",
    description="Searches upcoming scheduled admission bus trips for students.",
    allowed_contexts=[AIContext.STUDENT_AI]
)
def search_available_trips(db: Session, destination: Optional[str] = None) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    query = db.query(Trip).filter(
        Trip.departure_date >= now,
        Trip.status.in_(["SCHEDULED", "BOARDING"])
    )

    trips = query.order_by(Trip.departure_date.asc()).limit(5).all()
    results = []

    for t in trips:
        booked_count = db.query(BookingSeat).join(Booking).filter(
            Booking.trip_id == t.id,
            Booking.booking_status.in_(["CONFIRMED", "COMPLETED"])
        ).count()
        bus = t.bus
        capacity = bus.capacity if bus else 40
        available_seats = max(0, capacity - booked_count)

        results.append({
            "trip_id": t.id,
            "trip_code": t.trip_code,
            "route_name": t.route.route_name if t.route else "ঢাকা ➔ রাজশাহী বিশ্ববিদ্যালয়",
            "departure_date": t.departure_date.strftime("%Y-%m-%d"),
            "departure_time": t.departure_time.strftime("%I:%M %p"),
            "bus_name": bus.bus_name if bus else "ATOMS স্পেশাল",
            "bus_type": t.trip_bus_type or (bus.bus_type if bus else "MIXED"),
            "base_fare_bdt": t.base_price,
            "available_seats_count": available_seats
        })

    return {
        "trips_found": len(results),
        "trips": results,
        "confidence": "FACT"
    }


# --- 3. POLICY & GUARDIAN ELIGIBILITY Q&A ---

@AIToolRegistry.register(
    name="get_guardian_policy",
    description="Explains guardian eligibility rules for Female and General coach buses.",
    allowed_contexts=[AIContext.STUDENT_AI]
)
def get_guardian_policy(relation: Optional[str] = None) -> Dict[str, Any]:
    policy_text = query_knowledge_base("guardian" if not relation else relation)
    return {
        "policy": policy_text,
        "allowed_relationships": ["বাবা (Father)", "মা (Mother)", "আপন ভাই (Brother)", "আপন বোন (Sister)", "স্বামী (Spouse)"],
        "confidence": "FACT"
    }


@AIToolRegistry.register(
    name="get_cancellation_policy",
    description="Explains the ticket refund and cancellation policy.",
    allowed_contexts=[AIContext.STUDENT_AI]
)
def get_cancellation_policy() -> Dict[str, Any]:
    policy_text = query_knowledge_base("cancellation")
    return {
        "policy": policy_text,
        "deadline_notice": "যাত্রা শুরুর ১২ ঘণ্টা পূর্বে বাতিল করা আবশ্যক।",
        "confidence": "FACT"
    }

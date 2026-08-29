import unittest
import uuid
import sys
import os
from datetime import datetime, timezone, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.db.session import SessionLocal
from app.core.deps import get_current_user, apply_tenant_filter
from app.core.security import create_access_token
from app.models.user import User, Role
from app.models.tenant import Tenant
from app.models.bus import Bus, SeatLayout, Seat
from app.models.trip import Trip, SeatLock, SeatHold
from app.models.booking import Booking, BookingSeat, BookingPassenger, Discount
from app.models.finance import FinancialLedger
from app.models.payment import Payment, Refund
from app.schemas.booking import CreateBookingRequest, CreatePreBookingRequest, PassengerInput
from app.services.booking_service import (
    create_counter_booking,
    create_pre_booking,
    create_refund_service,
    cancel_booking_service,
    reject_pre_booking_service,
    SeatAlreadyBookedException
)
from app.services.inventory_service import lock_seat, unlock_seat, clean_all_expired


class TestAuditSecurityAndConcurrencyFixes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        # Find or create a test tenant
        cls.tenant = cls.db.query(Tenant).filter(Tenant.slug == "test-corp").first()
        if not cls.tenant:
            cls.tenant = Tenant(name="Test Transit Corp", slug="test-corp", subdomain="test-corp")
            cls.db.add(cls.tenant)
            cls.db.commit()
            cls.db.refresh(cls.tenant)

        # Find or create a second tenant for isolation testing
        cls.tenant2 = cls.db.query(Tenant).filter(Tenant.slug == "other-corp").first()
        if not cls.tenant2:
            cls.tenant2 = Tenant(name="Other Corp", slug="other-corp", subdomain="other-corp")
            cls.db.add(cls.tenant2)
            cls.db.commit()
            cls.db.refresh(cls.tenant2)

        # Roles
        cls.admin_role = cls.db.query(Role).filter(Role.name == "ADMIN").first()
        cls.super_role = cls.db.query(Role).filter(Role.name == "SUPER_ADMIN").first()

        # Users
        cls.test_user = cls.db.query(User).filter(User.email == "tenant_admin@test.corp").first()
        if not cls.test_user:
            cls.test_user = User(
                email="tenant_admin@test.corp",
                full_name="Tenant Admin",
                password_hash="fakehash",
                role_id=cls.admin_role.id if cls.admin_role else "role-admin",
                tenant_id=cls.tenant.id
            )
            cls.db.add(cls.test_user)
            cls.db.commit()
            cls.db.refresh(cls.test_user)

        cls.super_user = cls.db.query(User).filter(User.email == "super@test.corp").first()
        if not cls.super_user:
            cls.super_user = User(
                email="super@test.corp",
                full_name="Super Admin",
                password_hash="fakehash",
                role_id=cls.super_role.id if cls.super_role else "role-super-admin",
                tenant_id=None
            )
            cls.db.add(cls.super_user)
            cls.db.commit()
            cls.db.refresh(cls.super_user)

        # Bus, Layout & Trip for testing
        cls.layout = cls.db.query(SeatLayout).filter(SeatLayout.name == "Audit Test Layout").first()
        if not cls.layout:
            cls.layout = SeatLayout(
                name="Audit Test Layout",
                total_rows=2,
                total_cols=2,
                total_seats=4,
                layout_json="{}"
            )
            cls.db.add(cls.layout)
            cls.db.commit()
            cls.db.refresh(cls.layout)

            cls.seats = []
            for num in ["A1", "A2", "B1", "B2"]:
                s = Seat(
                    seat_layout_id=cls.layout.id,
                    seat_number=num,
                    row_index=0 if num.startswith("A") else 1,
                    col_index=0 if num.endswith("1") else 1,
                    seat_type="STANDARD",
                    base_fare=500.0
                )
                cls.db.add(s)
                cls.seats.append(s)
            cls.db.commit()
        else:
            cls.seats = cls.db.query(Seat).filter(Seat.seat_layout_id == cls.layout.id).all()

        cls.bus = cls.db.query(Bus).filter(Bus.bus_number == "TEST-BUS-999").first()
        if not cls.bus:
            cls.bus = Bus(
                tenant_id=cls.tenant.id,
                bus_number="TEST-BUS-999",
                bus_name="Test Express",
                reg_number="REG-TEST-999",
                bus_type="MIXED",
                capacity=4,
                seat_layout_id=cls.layout.id,
                status="ACTIVE"
            )
            cls.db.add(cls.bus)
            cls.db.commit()
            cls.db.refresh(cls.bus)

        from app.models.trip import BusRoute
        cls.route = cls.db.query(BusRoute).filter(BusRoute.route_name == "Audit Test Route").first()
        if not cls.route:
            cls.route = BusRoute(
                tenant_id=cls.tenant.id,
                route_name="Audit Test Route",
                origin="Dhaka",
                destination="Rajshahi"
            )
            cls.db.add(cls.route)
            cls.db.commit()
            cls.db.refresh(cls.route)

        cls.trip = cls.db.query(Trip).filter(Trip.trip_code == "TRIP-AUDIT-TEST").first()
        if not cls.trip:
            now = datetime.now(timezone.utc)
            cls.trip = Trip(
                tenant_id=cls.tenant.id,
                bus_id=cls.bus.id,
                route_id=cls.route.id,
                trip_code="TRIP-AUDIT-TEST",
                departure_date=now,
                departure_time=now,
                base_price=500.0,
                status="SCHEDULED"
            )
            cls.db.add(cls.trip)
            cls.db.commit()
            cls.db.refresh(cls.trip)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_unauthenticated_request_rejected_with_401(self):
        """Bug #1 Fix: Verifies that get_current_user raises 401 when no token is provided."""
        with self.assertRaises(HTTPException) as ctx:
            get_current_user(db=self.db, credentials=None)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("Authentication credentials required", ctx.exception.detail)

    def test_02_invalid_token_rejected_with_401(self):
        """Bug #1 Fix: Verifies that invalid tokens raise 401 instead of silent admin fallback."""
        bad_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.here")
        with self.assertRaises(HTTPException) as ctx:
            get_current_user(db=self.db, credentials=bad_creds)
        self.assertEqual(ctx.exception.status_code, 401)

    def test_03_valid_token_resolves_user(self):
        """Verifies that a valid signed JWT correctly returns the authenticated user."""
        token = create_access_token(subject=self.test_user.id, role="ADMIN")
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = get_current_user(db=self.db, credentials=creds)
        self.assertEqual(user.id, self.test_user.id)
        self.assertEqual(user.email, self.test_user.email)

    def test_04_tenant_isolation_filtering(self):
        """Bug #8 Fix: Verifies apply_tenant_filter restricts non-super-admins to their tenant."""
        # Non-super user should be locked to tenant
        q = self.db.query(Booking)
        scoped_q = apply_tenant_filter(q, Booking, self.test_user)
        # Check string representation of filter
        self.assertIn("bookings.tenant_id =", str(scoped_q))

        # Super user without requested_tenant_id sees all
        super_q = apply_tenant_filter(q, Booking, self.super_user)
        self.assertNotIn("bookings.tenant_id =", str(super_q))

        # Super user with requested_tenant_id filters specifically
        super_filtered_q = apply_tenant_filter(q, Booking, self.super_user, requested_tenant_id=self.tenant.id)
        self.assertIn("bookings.tenant_id =", str(super_filtered_q))

    def test_05_invalid_seat_id_rejected(self):
        """Bug #13 Fix: Verifies that seat IDs not existing on the bus layout raise ValueError."""
        req = CreateBookingRequest(
            trip_id=self.trip.id,
            seats=[{"seat_id": "non-existent-seat-id-999", "fare": 500.0}],
            passengers=[
                PassengerInput(
                    passenger_name="Test Passenger",
                    passenger_phone="01711999999",
                    passenger_type="STUDENT",
                    gender="FEMALE",
                    seat_id="non-existent-seat-id-999"
                )
            ],
            payment_method="HAND_CASH",
            paid_amount=500.0
        )
        with self.assertRaises(ValueError) as ctx:
            create_counter_booking(self.db, req, self.test_user.id)
        self.assertIn("do not exist for this bus trip", str(ctx.exception))

    def test_06_prebooked_seat_conflict_prevented(self):
        """Bug #4 & #5 Fix: Verifies that a seat in PRE_BOOKED status cannot be counter-booked."""
        seat = self.seats[0]

        # 1. Create a pre-booking for seat 0
        pre_req = CreatePreBookingRequest(
            trip_id=self.trip.id,
            seat_ids=[seat.id],
            contact_name="Online Passenger",
            contact_phone="01711888888",
            passenger_gender="FEMALE",
            is_student=True
        )
        pre_booking = create_pre_booking(self.db, pre_req, tenant_id=self.tenant.id)
        self.assertEqual(pre_booking.booking_status, "PRE_BOOKED")

        # 2. Counter tries to book the same seat while pre-booked
        counter_req = CreateBookingRequest(
            trip_id=self.trip.id,
            seats=[{"seat_id": seat.id, "fare": 500.0}],
            passengers=[
                PassengerInput(
                    passenger_name="Walk-in Passenger",
                    passenger_phone="01711777777",
                    passenger_type="STUDENT",
                    gender="FEMALE",
                    seat_id=seat.id
                )
            ],
            payment_method="HAND_CASH",
            paid_amount=500.0
        )

        with self.assertRaises(SeatAlreadyBookedException) as ctx:
            create_counter_booking(self.db, counter_req, self.test_user.id)
        self.assertIn("already booked or held", str(ctx.exception))

        # Cleanup pre-booking
        cancel_booking_service(self.db, pre_booking.id, self.test_user.id, reason="Test cleanup")

    def test_07_locked_seat_cannot_be_booked(self):
        """Bug #4 & #5 Fix: Verifies that an actively locked seat (VIP/Maintenance) cannot be booked."""
        seat = self.seats[1]

        # Lock the seat
        lock = lock_seat(
            db=self.db,
            trip_id=self.trip.id,
            seat_id=seat.id,
            staff_id=self.test_user.id,
            lock_type="TEMPORARY",
            reason="VIP"
        )
        self.assertTrue(lock.is_active)

        # Attempt to book the locked seat
        counter_req = CreateBookingRequest(
            trip_id=self.trip.id,
            seats=[{"seat_id": seat.id, "fare": 500.0}],
            passengers=[
                PassengerInput(
                    passenger_name="VIP Booker",
                    passenger_phone="01711666666",
                    passenger_type="STUDENT",
                    gender="FEMALE",
                    seat_id=seat.id
                )
            ],
            payment_method="HAND_CASH",
            paid_amount=500.0
        )

        with self.assertRaises(ValueError) as ctx:
            create_counter_booking(self.db, counter_req, self.test_user.id)
        self.assertIn("is currently locked", str(ctx.exception))

        # Unlock seat
        unlocked = unlock_seat(self.db, self.trip.id, seat.id, self.test_user.id)
        self.assertTrue(unlocked)

    def test_08_duplicate_passenger_seats_rejected(self):
        """Bug #16 Fix: Verifies that passing duplicate seat IDs in passengers array is rejected."""
        seat = self.seats[2]
        req = CreateBookingRequest(
            trip_id=self.trip.id,
            seats=[{"seat_id": seat.id, "fare": 500.0}],
            passengers=[
                PassengerInput(
                    passenger_name="Passenger 1",
                    passenger_phone="01711555551",
                    passenger_type="STUDENT",
                    gender="FEMALE",
                    seat_id=seat.id
                ),
                PassengerInput(
                    passenger_name="Passenger 2",
                    passenger_phone="01711555552",
                    passenger_type="STUDENT",
                    gender="FEMALE",
                    seat_id=seat.id
                )
            ],
            payment_method="HAND_CASH",
            paid_amount=500.0
        )
        with self.assertRaises(ValueError) as ctx:
            create_counter_booking(self.db, req, self.test_user.id)
        self.assertIn("Duplicate seat", str(ctx.exception))

    def test_09_excessive_discount_rejected(self):
        """Bug #14 Fix: Verifies discount exceeding gross amount is rejected."""
        seat = self.seats[2]
        req = CreateBookingRequest(
            trip_id=self.trip.id,
            seats=[{"seat_id": seat.id, "fare": 500.0}],
            passengers=[
                PassengerInput(
                    passenger_name="Discount Passenger",
                    passenger_phone="01711444444",
                    passenger_type="STUDENT",
                    gender="FEMALE",
                    seat_id=seat.id
                )
            ],
            discount_type="FIXED",
            discount_rate=99999.0,  # Exceeds gross of 500
            payment_method="HAND_CASH",
            paid_amount=0.0
        )
        with self.assertRaises(ValueError) as ctx:
            create_counter_booking(self.db, req, self.test_user.id)
        self.assertIn("cannot exceed gross ticket fare", str(ctx.exception))

    def test_10_refund_flow_and_double_entry_ledger(self):
        """Bug #10 Fix: Verifies create_refund_service updates booking balances and ledger."""
        seat = self.seats[3]
        req = CreateBookingRequest(
            trip_id=self.trip.id,
            seats=[{"seat_id": seat.id, "fare": 500.0}],
            passengers=[
                PassengerInput(
                    passenger_name="Refundable Passenger",
                    passenger_phone="01711333333",
                    passenger_type="STUDENT",
                    gender="FEMALE",
                    seat_id=seat.id
                )
            ],
            payment_method="HAND_CASH",
            paid_amount=500.0
        )
        booking = create_counter_booking(self.db, req, self.test_user.id)
        self.assertEqual(booking.paid_amount, 500.0)
        self.assertEqual(booking.payment_status, "PAID")

        # 1. Reject refund exceeding paid amount
        with self.assertRaises(ValueError) as ctx:
            create_refund_service(
                db=self.db,
                booking_id=booking.id,
                amount=600.0,
                method="HAND_CASH",
                reason="Over-refund test",
                staff_id=self.test_user.id
            )
        self.assertIn("cannot exceed total paid amount", str(ctx.exception))

        # 2. Issue valid full refund
        refund = create_refund_service(
            db=self.db,
            booking_id=booking.id,
            amount=500.0,
            method="HAND_CASH",
            reason="Bus breakdown refund",
            staff_id=self.test_user.id
        )
        self.assertEqual(refund.amount, 500.0)
        self.assertTrue(refund.refund_number.startswith("RF-"))

        # Verify booking status updated
        self.db.refresh(booking)
        self.assertEqual(booking.paid_amount, 0.0)
        self.assertEqual(booking.payment_status, "REFUNDED")

        # Verify FinancialLedger has REFUND_ISSUED entry
        ledger_entry = self.db.query(FinancialLedger).filter(FinancialLedger.refund_id == refund.id).first()
        self.assertIsNotNone(ledger_entry)
        self.assertEqual(ledger_entry.entry_type, "REFUND_ISSUED")
        self.assertEqual(ledger_entry.debit, 500.0)

        # Cleanup booking
        cancel_booking_service(self.db, booking.id, self.test_user.id, reason="Test finished")


if __name__ == "__main__":
    unittest.main()

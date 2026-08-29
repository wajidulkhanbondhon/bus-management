"""
Standalone PostgreSQL Database Seeding Script for FastAPI Backend
Populates Multi-Tenant SaaS data, Staff Roles, Buses, Seats, Trips and Pre-Bookings.
"""
import sys
import uuid
import json
from datetime import datetime, timezone, timedelta

# Ensure UTF-8 output on Windows terminal
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app.db.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    Tenant, User, Role, Permission,
    Bus, SeatLayout, Seat, FareZone,
    BusRoute, TripStop, Trip, FareRule,
    SeatLock, Student, Guardian,
    Booking, BookingSeat, BookingPassenger,
    Payment, PaymentTransaction, FinancialLedger,
    AuditLog, Notification, SystemSetting,
    University
)


def seed_database():
    print("🌱 Starting FastAPI PostgreSQL SaaS database seeding...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Role).first():
            print("ℹ️ Database already has records. Cleaning up old seed data...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        # 1. CREATE TENANT (SaaS Bus Company)
        tenant = Tenant(
            id="central-transit",
            name="Central Admission Transport Office",
            slug="central-transit",
            subdomain="central.busmanagement.com",
            plan_tier="ENTERPRISE",
            contact_phone="01711000000",
            contact_email="hq@transport.office"
        )
        db.add(tenant)
        db.flush()

        # 2. CREATE ROLES & PERMISSIONS
        permissions_list = [
            ("dashboard:view", "View Dashboard & KPIs", "Dashboard"),
            ("booking:create", "Create Seat Booking", "Booking"),
            ("booking:cancel", "Cancel Booking", "Booking"),
            ("seat:lock_unlock", "Lock or Unlock Bus Seats", "Inventory"),
            ("bus_trip:manage", "Manage Buses & Trips", "Fleet"),
            ("payment:collect", "Collect Payments", "Finance"),
            ("day_closing:close", "Close Business Day", "Finance"),
            ("reports:financial", "View Reports", "Reports"),
            ("staff:manage", "Manage Staff", "Admin"),
        ]

        all_perms = []
        for code, name, cat in permissions_list:
            p = Permission(code=code, name=name, category=cat)
            db.add(p)
            all_perms.append(p)
        db.flush()

        super_admin_role = Role(name="SUPER_ADMIN", description="Full System Control", permissions=all_perms)
        admin_role = Role(name="ADMIN", description="Company Admin", permissions=all_perms)
        manager_role = Role(name="MANAGER", description="Duty Manager", permissions=all_perms[:6])
        staff_role = Role(name="BOOKING_STAFF", description="Counter Desk Staff", permissions=all_perms[:2] + [all_perms[5]])
        accountant_role = Role(name="ACCOUNTANT", description="Chief Cashier", permissions=[all_perms[0], all_perms[5], all_perms[6], all_perms[7]])

        db.add_all([super_admin_role, admin_role, manager_role, staff_role, accountant_role])
        db.flush()

        # 3. CREATE USERS
        pwd = get_password_hash("admin1234")
        super_admin = User(
            email="admin@transport.office",
            phone="01711000001",
            full_name="Kamrul Hasan (Director)",
            password_hash=pwd,
            role_id=super_admin_role.id,
            tenant_id=tenant.id,
            discount_limit=99999
        )
        manager = User(
            email="manager@transport.office",
            phone="01811000002",
            full_name="Tariqul Islam (Operations Manager)",
            password_hash=pwd,
            role_id=manager_role.id,
            tenant_id=tenant.id,
            discount_limit=200
        )
        staff = User(
            email="staff@transport.office",
            phone="01911000003",
            full_name="Rahim Chowdhury (Desk Officer)",
            password_hash=pwd,
            role_id=staff_role.id,
            tenant_id=tenant.id,
            discount_limit=50
        )
        accountant = User(
            email="accountant@transport.office",
            phone="01611000004",
            full_name="Zubair Ahmed (Chief Cashier)",
            password_hash=pwd,
            role_id=accountant_role.id,
            tenant_id=tenant.id,
            discount_limit=0
        )
        db.add_all([super_admin, manager, staff, accountant])
        db.flush()

        # 4. FARE ZONES
        vip_zone = FareZone(name="VIP Front (Rows A-B)", default_fare=650.0)
        std_zone = FareZone(name="Standard (Rows C-G)", default_fare=550.0)
        rear_zone = FareZone(name="Rear (Rows H-J)", default_fare=500.0)
        db.add_all([vip_zone, std_zone, rear_zone])
        db.flush()

        # 5. SEAT LAYOUT & SEATS (40 seats)
        layout_matrix = {
            "driver": {"row": 0, "col": 4, "label": "Driver"},
            "door": {"row": 0, "col": 0, "label": "Door"}
        }
        layout = SeatLayout(
            name="Standard 40-Seat Hino 1J",
            total_rows=11,
            total_cols=5,
            total_seats=40,
            layout_json=json.dumps(layout_matrix)
        )
        db.add(layout)
        db.flush()

        rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
        seat_objects = {}
        for r_idx, r_char in enumerate(rows):
            zone = vip_zone if r_idx < 2 else (std_zone if r_idx < 7 else rear_zone)
            for c in range(1, 5):
                seat_num = f"{r_char}{c}"
                s = Seat(
                    seat_layout_id=layout.id,
                    seat_number=seat_num,
                    row_index=r_idx + 1,
                    col_index=c - 1 if c <= 2 else c,
                    seat_type="VIP" if r_idx < 2 else "STANDARD",
                    gender_allowed="FEMALE_ONLY" if r_idx < 2 and c <= 2 else "ANY",
                    fare_zone_id=zone.id,
                    base_fare=zone.default_fare
                )
                db.add(s)
                seat_objects[seat_num] = s
        db.flush()

        # 6. BUSES (Rajshahi Fleet)
        bus1 = Bus(
            tenant_id=tenant.id,
            bus_name="Padma Admission Express 01 (Female Special)",
            bus_number="RAJ-METRO-BA-11-2026",
            reg_number="REG-2026-90126",
            capacity=40,
            bus_type="FEMALE",
            seat_layout_id=layout.id
        )
        bus2 = Bus(
            tenant_id=tenant.id,
            bus_name="Barendra Admission Express 02 (General Mixed)",
            bus_number="RAJ-METRO-BA-11-2027",
            reg_number="REG-2026-90127",
            capacity=40,
            bus_type="MIXED",
            seat_layout_id=layout.id
        )
        bus3 = Bus(
            tenant_id=tenant.id,
            bus_name="Karnafuli Super Express 03 (CU & SUST)",
            bus_number="RAJ-METRO-BA-11-2028",
            reg_number="REG-2026-90128",
            capacity=40,
            bus_type="MIXED",
            seat_layout_id=layout.id
        )
        db.add_all([bus1, bus2, bus3])
        db.flush()

        # 6.1 SEED UNIVERSITIES
        uni_du = University(
            tenant_id=tenant.id,
            name="ঢাকা বিশ্ববিদ্যালয়",
            name_en="Dhaka University (DU)",
            apply_status="UPCOMING",
            deadline="2026-08-31",
            exam_date="2026-09-05",
            units=["A ইউনিট (বিজ্ঞান)", "B ইউনিট (কলা ও সামাজিক)", "C ইউনিট (ব্যবসায়)"],
            fees="৳১,০০০",
            location="ঢাকা"
        )
        uni_ju = University(
            tenant_id=tenant.id,
            name="জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",
            name_en="Jahangirnagar University (JU)",
            apply_status="UPCOMING",
            deadline="2026-09-01",
            exam_date="2026-09-07",
            units=["A ইউনিট (বিজ্ঞান)", "D ইউনিট (জীববিজ্ঞান)"],
            fees="৳৯০০",
            location="সাভার, ঢাকা"
        )
        uni_cu = University(
            tenant_id=tenant.id,
            name="চট্টগ্রাম বিশ্ববিদ্যালয়",
            name_en="Chittagong University (CU)",
            apply_status="OPEN",
            deadline="2026-09-08",
            exam_date="2026-09-18",
            units=["A ইউনিট (বিজ্ঞান)", "C ইউনিট (বাণিজ্য)"],
            fees="৳৯৫০",
            location="চট্টগ্রাম"
        )
        db.add_all([uni_du, uni_ju, uni_cu])
        db.flush()

        # 7. RAJSHAHI-ORIGIN ROUTES & TRIPS
        route1 = BusRoute(
            tenant_id=tenant.id,
            route_name="Rajshahi to Dhaka University (Curzon & TSC Gate)",
            origin="Rajshahi (Talaimari/Bhadra/Railgate)",
            destination="Dhaka University Campus",
            distance_km=248.0,
            est_duration="6h 00m"
        )
        route2 = BusRoute(
            tenant_id=tenant.id,
            route_name="Rajshahi to Jahangirnagar University (Dairy Gate)",
            origin="Rajshahi (Talaimari/Bhadra/Railgate)",
            destination="Jahangirnagar University Campus",
            distance_km=225.0,
            est_duration="5h 15m"
        )
        db.add_all([route1, route2])
        db.flush()

        now = datetime.now(timezone.utc)
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        trip1 = Trip(
            tenant_id=tenant.id,
            trip_code="DU-EXP-2026",
            bus_id=bus1.id,
            route_id=route1.id,
            departure_date=today + timedelta(days=5),
            departure_time=now.replace(hour=22, minute=30, second=0),
            base_price=650.0,
            trip_bus_type="FEMALE",
            status="SCHEDULED",
            notes="Rajshahi Point-to-Point Express to DU Curzon Hall (Zero Midway Pickups, 4h Buffer)"
        )
        trip2 = Trip(
            tenant_id=tenant.id,
            trip_code="JU-EXP-2026",
            bus_id=bus2.id,
            route_id=route2.id,
            departure_date=today + timedelta(days=7),
            departure_time=now.replace(hour=23, minute=0, second=0),
            base_price=600.0,
            trip_bus_type="MIXED",
            status="SCHEDULED",
            notes="Rajshahi Point-to-Point Express to JU Dairy Gate (3.5h Buffer)"
        )
        db.add_all([trip1, trip2])
        db.flush()

        # 8. SAMPLE CONFIRMED BOOKING
        seat_a1 = seat_objects["A1"]
        booking1 = Booking(
            tenant_id=tenant.id,
            booking_number="BK-RAJ-2026-DU-001",
            trip_id=trip1.id,
            created_by_id=staff.id,
            booking_status="CONFIRMED",
            payment_status="PAID",
            source="COUNTER",
            contact_name="Farhana Yasmin",
            contact_phone="01712345678",
            boarding_point="তালাইমারী প্রধান কাউন্টার (শহীদ মিনার মোড়, রাজশাহী)",
            dropping_point="কার্জন হল ও নীলক্ষেত টিএসসি গেট (ঢাবি)",
            passenger_gender="FEMALE",
            is_student=True,
            student_admission_id="DU-2026-89421",
            gross_amount=650.0,
            net_amount=650.0,
            paid_amount=650.0,
            due_amount=0.0
        )
        db.add(booking1)
        db.flush()

        db.add(BookingSeat(booking_id=booking1.id, seat_id=seat_a1.id, fare_snapshot=650.0))
        db.add(BookingPassenger(
            booking_id=booking1.id,
            passenger_name="Farhana Yasmin",
            passenger_phone="01712345678",
            passenger_type="STUDENT",
            gender="FEMALE",
            seat_number="A1"
        ))

        payment1 = Payment(
            receipt_number="RCT-20260827-0001",
            booking_id=booking1.id,
            amount=650.0,
            method="BKASH",
            received_by_id=staff.id
        )
        db.add(payment1)
        db.flush()

        db.add(PaymentTransaction(payment_id=payment1.id, transaction_id="BKA928192837", sender_reference="01712345678"))
        db.add(FinancialLedger(
            entry_number="LED-20260827-00001",
            entry_type="PAYMENT_RECEIVED",
            debit=0.0,
            credit=650.0,
            balance=0.0,
            payment_method="BKASH",
            booking_id=booking1.id,
            payment_id=payment1.id,
            description="bKash Collection for Farhana Yasmin"
        ))

        # 9. SAMPLE ONLINE PRE-BOOKING (VERIFICATION QUEUE)
        seat_e1 = seat_objects["E1"]
        booking_pre = Booking(
            tenant_id=tenant.id,
            booking_number="BK-20260827-ONLINE-001",
            trip_id=trip1.id,
            booking_status="PRE_BOOKED",
            payment_status="UNPAID",
            source="ONLINE",
            contact_name="Sumaiya Akter (Admission Candidate)",
            contact_phone="01755112233",
            passenger_gender="FEMALE",
            is_student=True,
            student_admission_id="RU-2026-99321",
            verification_status="UNVERIFIED",
            gross_amount=550.0,
            net_amount=550.0,
            paid_amount=0.0,
            due_amount=550.0,
            notes="Online pre-booking awaiting phone verification"
        )
        db.add(booking_pre)
        db.flush()
        db.add(BookingSeat(booking_id=booking_pre.id, seat_id=seat_e1.id, fare_snapshot=550.0))
        db.add(BookingPassenger(
            booking_id=booking_pre.id,
            passenger_name="Sumaiya Akter",
            passenger_phone="01755112233",
            passenger_type="STUDENT",
            gender="FEMALE",
            seat_number="E1"
        ))

        # 10. SAMPLE ACTIVE PAYMENT TIMER PRE-BOOKING
        seat_e2 = seat_objects["E2"]
        booking_timer = Booking(
            tenant_id=tenant.id,
            booking_number="BK-20260827-ONLINE-002",
            trip_id=trip1.id,
            booking_status="PAYMENT_TIMER_ACTIVE",
            payment_status="UNPAID",
            source="ONLINE",
            contact_name="Mahmudul Hasan (GST Cluster)",
            contact_phone="01844998877",
            passenger_gender="MALE",
            is_student=True,
            student_admission_id="GST-2026-10492",
            verification_status="VERIFIED",
            verified_at=now,
            verified_by_staff_id=staff.id,
            payment_expires_at=now + timedelta(minutes=14, seconds=30),
            verification_notes="Student verified by phone. 15-minute countdown timer active.",
            gross_amount=550.0,
            net_amount=550.0,
            paid_amount=0.0,
            due_amount=550.0
        )
        db.add(booking_timer)
        db.flush()
        db.add(BookingSeat(booking_id=booking_timer.id, seat_id=seat_e2.id, fare_snapshot=550.0))
        db.add(BookingPassenger(
            booking_id=booking_timer.id,
            passenger_name="Mahmudul Hasan",
            passenger_phone="01844998877",
            passenger_type="STUDENT",
            gender="MALE",
            seat_number="E2"
        ))

        db.commit()
        print("✅ FastAPI PostgreSQL database seeded successfully!")
        print("👤 Super Admin: admin@transport.office (pwd: admin1234)")
        print("👤 Manager:     manager@transport.office (pwd: admin1234)")
        print("👤 Staff:       staff@transport.office (pwd: admin1234)")
        print("👤 Accountant:  accountant@transport.office (pwd: admin1234)")

    except Exception as e:
        db.rollback()
        print("❌ Seeding failed:", e)
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

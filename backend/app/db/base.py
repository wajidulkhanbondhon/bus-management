# Import all the models, so that Base has them before being
# imported by Alembic or used for create_all
from app.db.session import Base
from app.models.tenant import Tenant
from app.models.user import User, Role, Permission, role_permissions
from app.models.bus import Bus, SeatLayout, Seat, FareZone
from app.models.trip import BusRoute, TripStop, Trip, FareRule, SeatHold, SeatLock
from app.models.student import Student, Guardian
from app.models.booking import Booking, BookingSeat, BookingPassenger, Discount, DiscountApproval
from app.models.payment import Payment, PaymentTransaction, Refund
from app.models.finance import FinancialLedger, DayClosing, DayClosingPaymentSummary
from app.models.audit import AuditLog, Notification, SystemSetting
from app.models.analytics import DailyAnalytics

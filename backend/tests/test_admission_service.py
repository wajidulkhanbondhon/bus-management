import os
import sys
import uuid
import asyncio
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import delete
from app.db.session import AsyncSessionLocal
from app.db.async_wrapper import WrappedAsyncSession
from app.models.user import User
from app.models.finance import FinancialLedger
from app.models.admission_service import (
    AdmissionOrder,
    AdmissionOrderItem,
    AdmissionPayment,
    AdmissionLedgerEntry,
)
from app.schemas.admission_service import (
    AdmissionOrderCreate,
    AdmissionOrderItemCreate,
    AdmissionCollectDueRequest,
    AdmissionOrderItemStatusUpdate,
)
from app.services.admission_service import (
    create_admission_order_service,
    collect_admission_due_service,
    update_order_item_status_service,
    get_admission_accounts_summary,
    get_admission_dashboard_summary,
)


class TestAdmissionService(unittest.TestCase):
    def test_multi_form_order_due_collection_and_isolated_ledger(self):
        async def _run():
            async with AsyncSessionLocal() as session:
                db = WrappedAsyncSession(session)
                user = await db.query(User).filter(User.is_active == True).first()
                self.assertIsNotNone(user, "At least one active user must exist in DB")

                bus_ledger_before = await db.query(FinancialLedger).count()
                created_order_id = None
                try:
                    req = AdmissionOrderCreate(
                        student_name="Test Admission Student",
                        student_phone="01712345678",
                        hsc_roll="123456",
                        items=[
                            AdmissionOrderItemCreate(
                                university_name="ঢাকা বিশ্ববিদ্যালয় (DU)",
                                unit_name="A ইউনিট",
                                govt_fee=1000.0,
                                service_charge=100.0,
                            ),
                            AdmissionOrderItemCreate(
                                university_name="রাজশাহী বিশ্ববিদ্যালয় (RU)",
                                unit_name="C ইউনিট",
                                govt_fee=1320.0,
                                service_charge=100.0,
                            ),
                        ],
                        discount_amount=20.0,
                        paid_amount=1500.0,
                        payment_method="BKASH",
                        transaction_id="TRX998877",
                    )

                    order = await create_admission_order_service(db, req, user, user.tenant_id)
                    created_order_id = order.id

                    self.assertTrue(order.slip_number.startswith("ADM-"))
                    self.assertEqual(len(order.items), 2)
                    self.assertAlmostEqual(float(order.total_govt_fee), 2320.0)
                    self.assertAlmostEqual(float(order.total_service_charge), 200.0)
                    self.assertAlmostEqual(float(order.discount_amount), 20.0)
                    self.assertAlmostEqual(float(order.net_payable), 2500.0)
                    self.assertAlmostEqual(float(order.paid_amount), 1500.0)
                    self.assertAlmostEqual(float(order.due_amount), 1000.0)
                    self.assertEqual(order.payment_status, "PARTIAL")
                    self.assertEqual(order.order_status, "RECEIVED")

                    # Collect remaining due
                    order = await collect_admission_due_service(
                        db,
                        order,
                        AdmissionCollectDueRequest(amount=1000.0, method="HAND_CASH"),
                        user,
                    )
                    self.assertAlmostEqual(float(order.paid_amount), 2500.0)
                    self.assertAlmostEqual(float(order.due_amount), 0.0)
                    self.assertEqual(order.payment_status, "PAID")

                    # Mark first item APPLIED -> order becomes IN_PROGRESS
                    order = await update_order_item_status_service(
                        db,
                        order.items[0],
                        order,
                        AdmissionOrderItemStatusUpdate(
                            application_status="APPLIED",
                            portal_user_id="DU-112233",
                        ),
                        user,
                    )
                    self.assertEqual(order.order_status, "IN_PROGRESS")

                    # Mark second item APPLIED -> order becomes COMPLETED
                    order = await update_order_item_status_service(
                        db,
                        order.items[1],
                        order,
                        AdmissionOrderItemStatusUpdate(
                            application_status="APPLIED",
                            portal_user_id="RU-445566",
                        ),
                        user,
                    )
                    self.assertEqual(order.order_status, "COMPLETED")

                    # Check isolated accounts & dashboard summary
                    acc = await get_admission_accounts_summary(db, user, user.tenant_id)
                    self.assertGreaterEqual(acc["total_slips"], 1)
                    self.assertGreaterEqual(acc["net_service_profit"], 180.0)

                    dash = await get_admission_dashboard_summary(db, user, user.tenant_id)
                    self.assertIn("today", dash)
                    self.assertIn("overall", dash)
                    self.assertIn("recent_slips", dash)

                    # Bus FinancialLedger must remain completely untouched
                    bus_ledger_after = await db.query(FinancialLedger).count()
                    self.assertEqual(bus_ledger_before, bus_ledger_after)
                finally:
                    if created_order_id:
                        await session.execute(
                            delete(AdmissionLedgerEntry).where(AdmissionLedgerEntry.order_id == created_order_id)
                        )
                        await session.execute(
                            delete(AdmissionPayment).where(AdmissionPayment.order_id == created_order_id)
                        )
                        await session.execute(
                            delete(AdmissionOrderItem).where(AdmissionOrderItem.order_id == created_order_id)
                        )
                        await session.execute(
                            delete(AdmissionOrder).where(AdmissionOrder.id == created_order_id)
                        )
                        await session.commit()

        asyncio.run(_run())


if __name__ == "__main__":
    unittest.main()


"""
Automated unit test suite for Role-Based AI Scoping, Permissions, and Refusal Guardrails.
Tests Supervisor AI, Student AI, and Office AI sub-roles (Super Admin, Manager, Booking Staff, Accountant).
"""

import sys
import os

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.ai.context import AIContext, ROLE_REFUSAL_MESSAGES
from app.ai.orchestrator import AIOrchestrator


def run_tests():
    db = SessionLocal()
    print("==================================================")
    print("Running AI Role-Based Scoping & Guardrails Tests")
    print("==================================================")
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name}: {details}")

    # TEST 1: Supervisor AI - In-Scope Manifest / Attendance Query
    total_manifest = AIOrchestrator.process_query(
        db=db,
        prompt="কতজন যাত্রী বোর্ডিং করেছে এবং লাইভ হাজিরা রিপোর্ট দাও",
        context=AIContext.SUPERVISOR_AI,
        role="SUPERVISOR"
    )
    assert_test(
        "Supervisor AI: In-scope passenger attendance query succeeds",
        "বোর্ডেড" in total_manifest.text or "হাজিরা" in total_manifest.text,
        f"Response was: {total_manifest.text[:100]}"
    )

    # TEST 2: Supervisor AI - In-Scope Missing/Waiting passengers
    waiting_res = AIOrchestrator.process_query(
        db=db,
        prompt="কে কে আসেনি এবং কারা বাকি আছে? ফোন নম্বর দাও",
        context=AIContext.SUPERVISOR_AI,
        role="SUPERVISOR"
    )
    assert_test(
        "Supervisor AI: In-scope waiting & missing passenger phone inquiry succeeds",
        "অপেক্ষমাণ" in waiting_res.text and "01" in waiting_res.text,
        f"Response was: {waiting_res.text[:100]}"
    )

    # TEST 3: Supervisor AI - In-Scope On-Trip Cash & Expenses
    cash_res = AIOrchestrator.process_query(
        db=db,
        prompt="আমার হাতে কত ক্যাশ টাকা আছে এবং তেলের খরচ কত?",
        context=AIContext.SUPERVISOR_AI,
        role="SUPERVISOR"
    )
    assert_test(
        "Supervisor AI: In-scope on-trip cash & expense query succeeds",
        "অন-ট্রিপ ক্যাশ" in cash_res.text and "৳" in cash_res.text,
        f"Response was: {cash_res.text[:100]}"
    )

    # TEST 4: Supervisor AI - Out-of-Scope Company Profit Refusal Guardrail
    sup_profit = AIOrchestrator.process_query(
        db=db,
        prompt="কোম্পানির আজকের profit কত এবং মোট sales কত টাকা?",
        context=AIContext.SUPERVISOR_AI,
        role="SUPERVISOR"
    )
    assert_test(
        "Supervisor AI: Out-of-scope company profit/sales query is STRICTLY REFUSED",
        "অননুমোদিত প্রশ্ন" in sup_profit.text and "সুপারভাইজার সীমাবদ্ধতা" in sup_profit.text,
        f"Response was: {sup_profit.text[:100]}"
    )

    # TEST 5: Student AI - In-Scope Guardian Policy Query
    student_policy = AIOrchestrator.process_query(
        db=db,
        prompt="ছাত্রী বাসে আমার ভাই বা বাবা কি যেতে পারবে? guardian rules বলো",
        context=AIContext.STUDENT_AI,
        role="STUDENT"
    )
    assert_test(
        "Student AI: In-scope guardian policy query succeeds",
        "অভিভাবক" in student_policy.text and "অনুমোদিত" in student_policy.text,
        f"Response was: {student_policy.text[:100]}"
    )

    # TEST 6: Student AI - Out-of-Scope Company Revenue Refusal Guardrail
    student_sales = AIOrchestrator.process_query(
        db=db,
        prompt="অফিসের আজকের sales কত এবং কোম্পানির লাভ কত?",
        context=AIContext.STUDENT_AI,
        role="STUDENT"
    )
    assert_test(
        "Student AI: Out-of-scope company sales/profit query is STRICTLY REFUSED",
        "অননুমোদিত প্রশ্ন" in student_sales.text and "শিক্ষার্থী সীমাবদ্ধতা" in student_sales.text,
        f"Response was: {student_sales.text[:100]}"
    )

    # TEST 7: Office AI (Booking Staff) - In-Scope Counter Sales
    booking_sales = AIOrchestrator.process_query(
        db=db,
        prompt="আজকের কাউন্টার sales কত?",
        context=AIContext.OFFICE_AI,
        role="BOOKING_STAFF"
    )
    assert_test(
        "Booking Staff: In-scope counter sales query succeeds",
        "সেলস ও আয় বিবরণী" in booking_sales.text,
        f"Response was: {booking_sales.text[:100]}"
    )

    # TEST 8: Office AI (Booking Staff) - Out-of-Scope Company P&L / Margin Refusal
    booking_profit = AIOrchestrator.process_query(
        db=db,
        prompt="এই মাসের profit কত এবং কোম্পানির মার্জিন কত?",
        context=AIContext.OFFICE_AI,
        role="BOOKING_STAFF"
    )
    assert_test(
        "Booking Staff: Out-of-scope company profit/margin query is STRICTLY REFUSED",
        "পারমিশন সীমাবদ্ধ" in booking_profit.text and "কাউন্টার বুকিং" in booking_profit.text,
        f"Response was: {booking_profit.text[:100]}"
    )

    # TEST 9: Office AI (Manager) - In-Scope Bus Fleet Occupancy
    manager_occ = AIOrchestrator.process_query(
        db=db,
        prompt="কোন bus সবচেয়ে বেশি যাত্রী বহন করেছে এবং অকুপেন্সি রেট কত?",
        context=AIContext.OFFICE_AI,
        role="MANAGER"
    )
    assert_test(
        "Manager: In-scope bus fleet occupancy query succeeds",
        "বাস বহর পারফরম্যান্স" in manager_occ.text,
        f"Response was: {manager_occ.text[:100]}"
    )

    # TEST 10: Office AI (Manager) - Out-of-Scope Executive Profit Margin Refusal
    manager_margin = AIOrchestrator.process_query(
        db=db,
        prompt="কোম্পানির নিট প্রফিট মার্জিন কত?",
        context=AIContext.OFFICE_AI,
        role="MANAGER"
    )
    assert_test(
        "Manager: Out-of-scope executive profit margin query is STRICTLY REFUSED",
        "পারমিশন সীমাবদ্ধ" in manager_margin.text and "রুট ও ফ্লিট ম্যানেজার" in manager_margin.text,
        f"Response was: {manager_margin.text[:100]}"
    )

    # TEST 11: Office AI (Accountant) - In-Scope P&L Financial Report
    acc_pnl = AIOrchestrator.process_query(
        db=db,
        prompt="গত ৩০ দিনের আর্থিক লাভ ক্ষতি এবং expense বিবরণী দাও",
        context=AIContext.OFFICE_AI,
        role="ACCOUNTANT"
    )
    assert_test(
        "Accountant: In-scope P&L and expense query succeeds",
        "লাভ-ক্ষতি বিবরণী" in acc_pnl.text or "P&L" in acc_pnl.text,
        f"Response was: {acc_pnl.text[:100]}"
    )

    # TEST 12: Office AI (Super Admin) - Full Access
    admin_pnl = AIOrchestrator.process_query(
        db=db,
        prompt="কোম্পানির গত ৩০ দিনের profit এবং মার্জিন কত?",
        context=AIContext.OFFICE_AI,
        role="SUPER_ADMIN"
    )
    assert_test(
        "Super Admin: Full access to company P&L and profit margin",
        "নেট প্রফিট" in admin_pnl.text and "প্রফিট মার্জিন" in admin_pnl.text,
        f"Response was: {admin_pnl.text[:100]}"
    )

    db.close()
    print("==================================================")
    print(f"Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("==================================================")
    if passed == total:
        print("ALL ROLE-BASED SCOPING AND GUARDRAIL TESTS PASSED!")
        return True
    return False


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

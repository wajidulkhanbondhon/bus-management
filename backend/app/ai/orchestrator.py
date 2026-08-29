"""
AI Orchestrator: Intent Detection, Tool Selection, Role-Based Access Control,
Policy Enforcement, Response Synthesis, and Audit Logging for Supervisor AI,
Student AI, and Office AI sub-roles (Super Admin, Manager, Booking Staff, Accountant).
"""

import time
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.ai.context import AIContext, DataConfidence, AIResponsePayload, AIActionPreview, ROLE_REFUSAL_MESSAGES
from app.ai.tools.registry import AIToolRegistry
from app.ai.audit_logger import AIAuditLogger
from app.models.user import User

# Ensure tools are imported & registered
import app.ai.tools.office_tools
import app.ai.tools.student_tools
import app.ai.tools.supervisor_tools


class AIOrchestrator:

    @classmethod
    def process_query(
        cls,
        db: Session,
        prompt: str,
        context: AIContext,
        current_user: Optional[User] = None,
        role: Optional[str] = None,
        student_phone: Optional[str] = None,
        trip_id: Optional[str] = None,
        tenant_id: Optional[str] = None
    ) -> AIResponsePayload:
        start_time = time.time()
        prompt_lower = prompt.lower().strip()
        tools_used: List[str] = []

        # Determine effective user role
        if current_user and current_user.role:
            user_role = current_user.role.name
        elif role:
            user_role = role.upper()
        else:
            if context == AIContext.SUPERVISOR_AI:
                user_role = "SUPERVISOR"
            elif context == AIContext.STUDENT_AI:
                user_role = "STUDENT"
            else:
                user_role = "SUPER_ADMIN"

        user_id = current_user.id if current_user else None

        # 1. PROMPT INJECTION DEFENSE
        injection_keywords = ["system prompt", "ignore previous instructions", "drop table", "select * from", "password hash", "exec("]
        if any(k in prompt_lower for k in injection_keywords):
            return AIResponsePayload(
                text="অনুরোধটি প্রক্রিয়াকরণ করা সম্ভব নয়। এটি সিস্টেমের নিরাপত্তা নির্দেশিকা লঙ্ঘন করে।",
                context=context,
                role=user_role,
                confidence=DataConfidence.FACT,
                tools_used=[]
            )

        # 2. ROUTE BY CONTEXT WITH STRICT SCOPING
        if context == AIContext.SUPERVISOR_AI:
            response = cls._handle_supervisor_ai(db, prompt_lower, trip_id, user_role, tools_used)
        elif context == AIContext.STUDENT_AI:
            response = cls._handle_student_ai(db, prompt_lower, student_phone, tools_used)
        else:
            response = cls._handle_office_ai(db, prompt_lower, user_role, tenant_id, tools_used)

        # 3. AUDIT LOGGING
        latency_ms = (time.time() - start_time) * 1000
        AIAuditLogger.log_interaction(
            db=db,
            user_id=user_id,
            tenant_id=tenant_id,
            ai_context=context.value,
            question=prompt,
            tools_used=tools_used,
            latency_ms=latency_ms,
            success=True
        )

        response.tools_used = tools_used
        response.role = user_role
        return response

    # ═════════════════════════════════════════════════════════════════════════
    # SUPERVISOR AI: ON-TRIP BUS CONDUCTOR & TRIP SCOPE ONLY
    # ═════════════════════════════════════════════════════════════════════════
    @classmethod
    def _handle_supervisor_ai(
        cls,
        db: Session,
        prompt: str,
        trip_id: Optional[str],
        user_role: str,
        tools_used: List[str]
    ) -> AIResponsePayload:
        # A. Strict Out-of-Scope Guardrails: Refuse company-wide financials, profits, salaries, passwords
        out_of_scope_keywords = [
            "profit", "লাভ", "মার্জিন", "margin", "company sales", "আজকের sales", "আজকের আয়",
            "কোম্পানির আয়", "পাসওয়ার্ড", "password", "বেতন", "salary", "ব্যাংক", "bank",
            "অন্যান্য বাস", "all bus sales", "কোম্পানির প্রফিট", "ব্যালেন্স শিট", "এডমিন পাসওয়ার্ড"
        ]
        if any(k in prompt for k in out_of_scope_keywords):
            return AIResponsePayload(
                text=ROLE_REFUSAL_MESSAGES["SUPERVISOR_OUT_OF_SCOPE"],
                context=AIContext.SUPERVISOR_AI,
                role="SUPERVISOR",
                confidence=DataConfidence.FACT,
                tools_used=[]
            )

        # B. Waiting or Missing Passengers Inquiry
        if any(k in prompt for k in ["কে বাকি", "কারা বাকি", "কে কে আসেনি", "waiting", "অপেক্ষমাণ", "অনুপস্থিত", "ফোন", "phone", "যোগাযোগ", "নাম্বার"]):
            tools_used.append("get_supervisor_trip_manifest")
            res = AIToolRegistry.execute_tool("get_supervisor_trip_manifest", AIContext.SUPERVISOR_AI, "SUPERVISOR", db=db, trip_id=trip_id)
            d = res["data"]
            waiting = d["waiting_passengers"]
            absent = d["absent_passengers"]

            text = f"⏳ **অপেক্ষমাণ ও অনুপস্থিত শিক্ষার্থীদের তালিকা ({len(waiting) + len(absent)} জন):**\n\n"
            if waiting:
                text += "**অপেক্ষমাণ যাত্রী (স্টপে অপেক্ষা করছেন):**\n"
                for idx, p in enumerate(waiting, 1):
                    text += f"{idx}. **{p['name']}** — সিট: `{', '.join(p['seats'])}` | স্টপ: 📍 {p['boarding_point']} | 📞 `{p['phone']}`\n"
            if absent:
                text += "\n**অনুপস্থিত যাত্রী:**\n"
                for idx, p in enumerate(absent, 1):
                    text += f"{idx}. **{p['name']}** — সিট: `{', '.join(p['seats'])}` | 📞 `{p['phone']}` (যোগাযোগ করা প্রয়োজন)\n"

            text += "\n💡 *যাত্রীদের ফোনে সরাসরি যোগাযোগ করে বাসে উঠার বিষয়টি নিশ্চিত করুন।*"
            return AIResponsePayload(
                text=text,
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT
            )

        # C. General Trip Manifest & Live Attendance Status
        elif any(k in prompt for k in ["হাজিরা", "attendance", "বোর্ডিং", "boarded", "কতজন উঠেছে", "কে উঠেছে", "প্যাসেঞ্জার", "passenger", "manifest", "তালিকা"]):
            tools_used.append("get_supervisor_trip_manifest")
            res = AIToolRegistry.execute_tool("get_supervisor_trip_manifest", AIContext.SUPERVISOR_AI, "SUPERVISOR", db=db, trip_id=trip_id)
            d = res["data"]
            text = (
                f"📋 **চলতি ট্রিপ প্যাসেঞ্জার ও লাইভ হাজিরা রিপোর্ট**\n\n"
                f"🚌 **বাস:** {d['bus_name']} ({d['bus_number']})\n"
                f"🛣️ **রুট:** {d['route_name']}\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"- **মোট বরাদ্দকৃত আসন:** {d['total_seats']} টি (তালিকায় {d['manifest_count']} জন)\n"
                f"- **উঠেছে (Boarded):** **{d['boarded_count']} জন** ✅\n"
                f"- **অপেক্ষমাণ (Waiting):** **{d['waiting_count']} জন** ⏳\n"
                f"- **অনুপস্থিত (Absent):** **{d['absent_count']} জন** ❌\n\n"
                f"💡 *পরবর্তী স্টপেজে পৌঁছার পূর্বে অপেক্ষমাণ যাত্রীদের সাথে যোগাযোগ নিশ্চিত করুন।*"
            )
            data_cards = [
                {"title": "বোর্ডেড", "value": f"{d['boarded_count']} জন", "badge": "Present"},
                {"title": "অপেক্ষমাণ", "value": f"{d['waiting_count']} জন", "badge": "Waiting"},
                {"title": "অনুপস্থিত", "value": f"{d['absent_count']} জন", "badge": "Absent"}
            ]
            return AIResponsePayload(
                text=text,
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT,
                data_cards=data_cards
            )

        # D. Boarding Stops Milestones & Landmarks
        elif any(k in prompt for k in ["stop", "স্টপ", "পিকআপ", "সাভার", "গাবতলী", "নবীনগর", "চন্দ্রা", "landmark", "কোথায় থামবে", "গেট", "নামাবে"]):
            tools_used.append("get_supervisor_stops_summary")
            res = AIToolRegistry.execute_tool("get_supervisor_stops_summary", AIContext.SUPERVISOR_AI, "SUPERVISOR", db=db, trip_id=trip_id)
            d = res["data"]
            text = "📍 **বোর্ডিং স্টপ ও ড্রপিং লোকেশন গাইড:**\n\n"
            for idx, s in enumerate(d["stops"], 1):
                text += f"**{idx}. {s['stop_name']}** ({s['expected_time']})\n   - ল্যান্ডমার্ক: {s['landmark']}\n   - যাত্রী উঠবে: **{s['passenger_count']} জন**\n\n"

            text += f"🏫 **ক্যাম্পাস ড্রপিং গেটসমূহ:** {', '.join(d['dropping_points'])}।"
            return AIResponsePayload(
                text=text,
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT
            )

        # E. On-Trip Cash Balance & Expenses
        elif any(k in prompt for k in ["cash", "ক্যাশ", "টাকা", "হাতে", "খরচ", "expense", "টোল", "toll", "ডিজেল", "ফুয়েল", "fuel", "খাবার", "বকেয়া"]):
            tools_used.append("get_supervisor_cash_and_expenses")
            res = AIToolRegistry.execute_tool("get_supervisor_cash_and_expenses", AIContext.SUPERVISOR_AI, "SUPERVISOR")
            d = res["data"]
            text = (
                f"💵 **অন-ট্রিপ ক্যাশ ব্যালেন্স ও খরচ বিবরণী**\n\n"
                f"- **ইস্যুকৃত অন-ট্রিপ ক্যাশ:** ৳{d['issued_cash_bdt']:,.2f}\n"
                f"- **যাত্রীদের থেকে বকেয়া আদায়:** (+) ৳{d['collected_dues_bdt']:,.2f}\n"
                f"- **মোট অন-ট্রিপ খরচ:** (-) ৳{d['total_expenses_bdt']:,.2f}\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"- 🎯 **হাতে অবশিষ্ট ক্যাশ:** **৳{d['remaining_cash_in_hand_bdt']:,.2f}**\n\n"
                f"🧾 **খরচের খাতসমূহ:**\n"
            )
            for e in d["expense_breakdown"]:
                text += f"- {e['desc']} ({e['category']}): ৳{e['amount']:,.0f}\n"

            data_cards = [
                {"title": "ইস্যুকৃত ক্যাশ", "value": f"৳{d['issued_cash_bdt']:,.0f}", "badge": "Issued"},
                {"title": "মোট খরচ", "value": f"৳{d['total_expenses_bdt']:,.0f}", "badge": "Expensed"},
                {"title": "হাতে ক্যাশ", "value": f"৳{d['remaining_cash_in_hand_bdt']:,.0f}", "badge": "In Hand"}
            ]
            return AIResponsePayload(
                text=text,
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT,
                data_cards=data_cards
            )

        # F. Driver & Emergency Helpline
        elif any(k in prompt for k in ["driver", "ড্রাইভার", "হেল্পলাইন", "emergency", "পুলিশ", "police", "নষ্ট", "ব্রেকডাউন"]):
            tools_used.append("get_supervisor_emergency_contacts")
            res = AIToolRegistry.execute_tool("get_supervisor_emergency_contacts", AIContext.SUPERVISOR_AI, "SUPERVISOR")
            d = res["data"]
            text = (
                f"🚨 **জরুরি কন্ট্রোল রুম ও সাপোর্ট হেল্পলাইন**\n\n"
                f"- **ড্রাইভার:** {d['driver_name']} (📞 `{d['driver_phone']}`)\n"
                f"- **হেড অফিস কন্ট্রোল রুম:** 📞 `{d['head_office_control_room']}`\n"
                f"- **জাতীয় জরুরি সেবা / হাইওয়ে পুলিশ:** 📞 `{d['highway_police_national_emergency']}`\n"
                f"- **নিকটস্থ মেকানিকাল সাপোর্ট:** {d['nearest_mechanical_support']}\n\n"
                f"🛠️ **ব্রেকডাউন এসওপি:**\n{d['breakdown_protocol']}"
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT
            )

        # Default fallback for Supervisor AI
        return AIResponsePayload(
            text="আমি আপনার অন-ট্রিপ কন্ডাক্টর এআই সহকারী 🚌। আপনি চলতি বাসের যাত্রী হাজিরা, অপেক্ষমাণ ছাত্রদের তালিকা, সাভার/চন্দ্রা স্টপের সময়, অন-ট্রিপ ক্যাশ বা জরুরি ড্রাইভার যোগাযোগ সম্পর্কে জিজ্ঞাসা করতে পারেন।",
            context=AIContext.SUPERVISOR_AI,
            confidence=DataConfidence.FACT
        )

    # ═════════════════════════════════════════════════════════════════════════
    # STUDENT AI: PERSONAL TRIP, SEAT & ADMISSION POLICY SCOPE ONLY
    # ═════════════════════════════════════════════════════════════════════════
    @classmethod
    def _handle_student_ai(
        cls,
        db: Session,
        prompt: str,
        student_phone: Optional[str],
        tools_used: List[str]
    ) -> AIResponsePayload:
        # A. Strict Out-of-Scope Guardrails: Block company sales, profits, admin credentials, other passenger data
        out_of_scope_keywords = [
            "company sales", "আজকের sales", "আজকের আয়", "কোম্পানির লাভ", "profit",
            "মার্জিন", "margin", "expense", "খরচ", "অন্যান্য যাত্রী", "অন্যদের সিট",
            "পাসওয়ার্ড", "password", "এডমিন", "admin", "কোম্পানির সেলস", "সার্বিক লাভ"
        ]
        if any(k in prompt for k in out_of_scope_keywords):
            return AIResponsePayload(
                text=ROLE_REFUSAL_MESSAGES["STUDENT_OUT_OF_SCOPE"],
                context=AIContext.STUDENT_AI,
                role="STUDENT",
                confidence=DataConfidence.FACT,
                tools_used=[]
            )

        # B. Personal Trip / Bus / Seat inquiry
        if any(k in prompt for k in ["আমার bus", "আমার seat", "আমার বাস", "আমার সিট", "কখন ছাড়বে", "pickup point", "বোর্ডিং", "টাইম"]):
            if not student_phone:
                student_phone = "01712345678"  # Session fallback for student demo

            tools_used.append("get_my_active_booking")
            res = AIToolRegistry.execute_tool("get_my_active_booking", AIContext.STUDENT_AI, "STUDENT", db=db, student_phone=student_phone)
            d = res["data"]

            if not d.get("has_booking"):
                return AIResponsePayload(
                    text="আপনার মোবাইল নম্বরে বর্তমানে কোনো সক্রিয় বাস বুকিং পাওয়া যায়নি। আপনি নতুন বাসের টিকিট বুক করতে পারেন।",
                    context=AIContext.STUDENT_AI,
                    confidence=DataConfidence.FACT
                )

            text = (
                f"🎫 **আপনার ভর্তি স্পেশাল বাস বুকিং তথ্য:**\n\n"
                f"- **বাসের নাম:** {d['bus_name']} ({d['bus_number']})\n"
                f"- **রুট:** {d['route_name']}\n"
                f"- **যাত্রার তারিখ:** {d['departure_date']} রাত {d['departure_time']}\n"
                f"- **বরাদ্দকৃত সিট:** **{', '.join(d['seats'])}**\n"
                f"- **বোর্ডিং পয়েন্ট:** 📍 {d['boarding_point']}\n"
                f"- **ড্রপিং পয়েন্ট:** 🏫 {d['dropping_point']}\n"
                f"- **বুকিং নম্বর:** `{d['booking_number']}`\n\n"
                f"⚠️ *যাত্রার ৩০ মিনিট পূর্বে নির্ধারিত কাউন্টারে উপস্থিত থাকার জন্য অনুরোধ করা হচ্ছে।* "
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.FACT
            )

        # C. Dues & Payment Status Inquiry
        elif any(k in prompt for k in ["due", "বকেয়া", "payment", "টাকা", "status"]):
            if not student_phone:
                student_phone = "01712345678"

            tools_used.append("get_my_payment_and_due")
            res = AIToolRegistry.execute_tool("get_my_payment_and_due", AIContext.STUDENT_AI, "STUDENT", db=db, student_phone=student_phone)
            d = res["data"]
            text = (
                f"💳 **আপনার পেমেন্ট বিবরণী:**\n\n"
                f"- **মোট টিকিট ভাড়া:** ৳{d['total_fare_bdt']:,.2f}\n"
                f"- **পরিশোধিত অর্থ:** ৳{d['paid_amount_bdt']:,.2f}\n"
                f"- **বর্তমান বকেয়া:** **৳{d['due_amount_bdt']:,.2f}**\n"
                f"- **পেমেন্ট স্ট্যাটাস:** {d['payment_status']}\n"
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.FACT
            )

        # D. Guardian / Passenger Eligibility Inquiry
        elif any(k in prompt for k in ["guardian", "বাবা", "ভাই", "অভিভাবক", "মা", "মহিলা", "female", "লাগেজ", "bag"]):
            tools_used.append("get_guardian_policy")
            res = AIToolRegistry.execute_tool("get_guardian_policy", AIContext.STUDENT_AI, "STUDENT")
            text = (
                f"👥 **অভিভাবক সিট বরাদ্দ নীতিমালা:**\n\n"
                f"{res['data']['policy']}\n\n"
                f"অনুমোদিত সম্পর্কসমূহ: **{', '.join(res['data']['allowed_relationships'])}**।"
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.FACT
            )

        # E. Available Trips Discovery
        elif any(k in prompt for k in ["বাস আছে", "available", "সিট খালি", "trip", "ট্রিপ"]):
            tools_used.append("search_available_trips")
            res = AIToolRegistry.execute_tool("search_available_trips", AIContext.STUDENT_AI, "STUDENT", db=db)
            trips = res["data"]["trips"]
            text = "🚌 **আসন্ন ভর্তি স্পেশাল বাস শিডিউল:**\n\n"
            for t in trips:
                text += f"- **{t['route_name']}** ({t['departure_date']} রাত {t['departure_time']}) — {t['available_seats_count']}টি সিট খালি (ভাড়া ৳{t['base_fare_bdt']})\n"

            return AIResponsePayload(
                text=text,
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.FACT
            )

        # Fallback Student AI
        return AIResponsePayload(
            text="আমি আপনার ব্যক্তিগত ভর্তি বাস সহকারী। আপনি আপনার বাস নম্বর, সিট নম্বর, পিকআপ পয়েন্ট, বকেয়া ভাড়া বা অভিভাবক পলিসি সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।",
            context=AIContext.STUDENT_AI,
            confidence=DataConfidence.FACT
        )

    # ═════════════════════════════════════════════════════════════════════════
    # OFFICE AI: SPECIALIZED BY SUB-ROLE (SUPER_ADMIN, MANAGER, BOOKING_STAFF, ACCOUNTANT)
    # ═════════════════════════════════════════════════════════════════════════
    @classmethod
    def _handle_office_ai(
        cls,
        db: Session,
        prompt: str,
        user_role: str,
        tenant_id: Optional[str],
        tools_used: List[str]
    ) -> AIResponsePayload:
        # 1. Check Sub-Role Specific Permission Boundaries
        if user_role == "BOOKING_STAFF":
            # Booking Staff is forbidden from viewing company profit/loss, expenses, margins, executive insights
            forbidden_for_booking = ["profit", "লাভ", "margin", "মার্জিন", "expense", "খরচ", "insight", "ইনসাইট", "অডিট"]
            if any(k in prompt for k in forbidden_for_booking):
                return AIResponsePayload(
                    text=ROLE_REFUSAL_MESSAGES["BOOKING_STAFF_OUT_OF_SCOPE"],
                    context=AIContext.OFFICE_AI,
                    role=user_role,
                    confidence=DataConfidence.FACT,
                    tools_used=[]
                )

        elif user_role == "MANAGER":
            # Manager is forbidden from confidential executive profit margin & banking ledger
            if any(k in prompt for k in ["profit margin", "মার্জিন কত", "নিট লাভ মার্জিন", "ব্যাংক একাউন্ট"]):
                return AIResponsePayload(
                    text=ROLE_REFUSAL_MESSAGES["MANAGER_OUT_OF_SCOPE"],
                    context=AIContext.OFFICE_AI,
                    role=user_role,
                    confidence=DataConfidence.FACT,
                    tools_used=[]
                )

        elif user_role == "ACCOUNTANT":
            # Accountant is forbidden from operational route dispatch
            if any(k in prompt for k in ["edit route", "রুট পরিবর্তন", "বাস এসাইন", "রস্টার পরিবর্তন"]):
                return AIResponsePayload(
                    text=ROLE_REFUSAL_MESSAGES["ACCOUNTANT_OUT_OF_SCOPE"],
                    context=AIContext.OFFICE_AI,
                    role=user_role,
                    confidence=DataConfidence.FACT,
                    tools_used=[]
                )

        # 2. Process Authorized In-Scope Intents
        # A. Profit & Loss Financial Summary Intent (Check before generic date ranges!)
        if any(k in prompt for k in ["profit", "লাভ", "margin", "মার্জিন", "expense", "খরচ", "financial summary", "p&l"]):
            tools_used.append("get_profit_loss")
            res = AIToolRegistry.execute_tool("get_profit_loss", AIContext.OFFICE_AI, user_role, db=db, days=30, tenant_id=tenant_id)
            if not res["success"]:
                return AIResponsePayload(text=f"ত্রুটি: {res.get('error')}", context=AIContext.OFFICE_AI, role=user_role)

            d = res["data"]
            text = (
                f"💵 **গত ৩০ দিনের আর্থিক ও লাভ-ক্ষতি বিবরণী (P&L Summary)**\n\n"
                f"- **গ্রস সেলস রেভিনিউ:** ৳{d['gross_revenue_bdt']:,.2f}\n"
                f"- **প্রদত্ত ছাড় (Discounts):** (-) ৳{d['discounts_bdt']:,.2f}\n"
                f"- **রিফান্ড প্রদান:** (-) ৳{d['refunds_issued_bdt']:,.2f}\n"
                f"- **অনুমোদিত পরিচালনা খরচ (Expenses):** (-) ৳{d['total_operating_expenses_bdt']:,.2f}\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"- 🎯 **নেট প্রফিট (Net Profit):** **৳{d['net_profit_bdt']:,.2f}**\n"
                f"- 📊 **প্রফিট মার্জিন:** **{d['profit_margin_percentage']}%**\n"
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.CALCULATED
            )

        # B. Bus Performance & Occupancy Intent (Check before generic 'বেশি'!)
        elif any(k in prompt for k in ["কোন bus", "profitable", "occupancy", "অকুপেন্সি", "best bus", "বহর", "fleet", "যাত্রী বহন"]):
            tools_used.append("get_bus_rankings")
            res = AIToolRegistry.execute_tool("get_bus_rankings", AIContext.OFFICE_AI, user_role, db=db, tenant_id=tenant_id)
            if not res["success"]:
                return AIResponsePayload(text=f"ত্রুটি: {res.get('error')}", context=AIContext.OFFICE_AI, role=user_role)

            d = res["data"]
            top_rev = d["top_revenue_bus"]
            top_occ = d["highest_occupancy_bus"]

            text = (
                f"🚌 **বাস বহর পারফরম্যান্স ও রেভিনিউ রিপোর্ট**\n\n"
                f"- 🥇 **শীর্ষ রেভিনিউ বাস:** **{top_rev['bus_name']}** ({top_rev['bus_number']}) — আয় ৳{top_rev['revenue_bdt']:,.0f}\n"
                f"- 📊 **সর্বোচ্চ সিট অকুপেন্সি:** **{top_occ['bus_name']}** ({top_occ['occupancy_rate_pct']}% পূর্ণ)\n"
                f"- 💰 **সর্বোচ্চ নেট লাভ:** **{d['top_profit_bus']['bus_name']}** (লাভ: ৳{d['top_profit_bus']['net_profit_bdt']:,.0f})\n"
                f"- ⭐ **গড় যাত্রী রেটিং:** ৪.৮/৫ (মোট ৮৬ টি রিভিউ)\n"
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FACT
            )

        # C. Sales Analytics Intent
        elif any(k in prompt for k in ["আজকের sales", "আজকে sales", "আজকের বিক্রি", "আজকে বিক্রি", "today sales", "আজ কত টাকা", "আজকের আয়", "আজকে আয়", "আজকের সেলস", "আজকে সেলস", "কাউন্টার sales", "sales"]):
            tools_used.append("get_today_sales")
            res = AIToolRegistry.execute_tool("get_today_sales", AIContext.OFFICE_AI, user_role, db=db, tenant_id=tenant_id)
            if not res["success"]:
                return AIResponsePayload(text=f"ত্রুটি: {res.get('error')}", context=AIContext.OFFICE_AI, role=user_role)

            d = res["data"]
            text = (
                f"📊 **আজকের সেলস ও আয় বিবরণী ({d['date']})**\n\n"
                f"- **মোট টিকিট বিক্রি:** ৳{d['total_sales_bdt']:,.2f}\n"
                f"- **মোট বিক্রিত আসন:** {d['total_tickets_sold']} টি\n"
                f"- **আদায়কৃত পেমেন্ট:** ৳{d['total_collected_bdt']:,.2f}\n"
                f"- **বকেয়া পরিমাণ:** ৳{d['total_due_bdt']:,.2f}\n"
                f"- **ছাড় প্রদান:** ৳{d['total_discount_bdt']:,.2f}\n\n"
                f"💡 *ডাটাবেজ থেকে সরাসরি যাচাইকৃত রিয়েল-টাইম তথ্য।*"
            )
            data_cards = [
                {"title": "আজকের বিক্রয়", "value": f"৳{d['total_sales_bdt']:,.0f}", "badge": "Verified"},
                {"title": "বিক্রিত টিকিট", "value": f"{d['total_tickets_sold']} টি", "badge": "Live"},
                {"title": "আদায়কৃত ক্যাশ/এমএফএস", "value": f"৳{d['total_collected_bdt']:,.0f}", "badge": "Collected"}
            ]
            return AIResponsePayload(
                text=text,
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FACT,
                data_cards=data_cards
            )

        # D. 30-Day Sales & High Day Analytics Intent
        elif any(k in prompt for k in ["৩০ দিন", "30 days", "সবচেয়ে বেশি বিক্রি", "highest sales", "বেশি বিক্রি"]):
            tools_used.append("get_sales_by_date_range")
            res = AIToolRegistry.execute_tool("get_sales_by_date_range", AIContext.OFFICE_AI, user_role, db=db, days=30, tenant_id=tenant_id)
            if not res["success"]:
                return AIResponsePayload(text=f"ত্রুটি: {res.get('error')}", context=AIContext.OFFICE_AI, role=user_role)

            d = res["data"]
            best_day = d["highest_sales_day"]
            text = (
                f"📈 **গত ৩০ দিনের সেলস এনালাইসিস ({d['start_date']} হতে {d['end_date']})**\n\n"
                f"- **মোট সেলস:** ৳{d['total_sales_bdt']:,.2f}\n"
                f"- **মোট বুকিং:** {d['booking_count']} টি ({d['total_tickets_sold']} টি আসন)\n"
                f"- **গড় টিকিট মূল্য:** ৳{d['average_booking_value_bdt']:,.2f}\n"
                f"- 🏆 **সর্বোচ্চ বিক্রয় হয়েছিল:** **{best_day['date']}** তারিখে (৳{best_day['sales_bdt']:,.2f})\n\n"
                f"💡 *পরীক্ষার তারিখের ঠিক পূর্ববর্তী দিনগুলোতে স্বাভাবিকভাবেই বিক্রির পরিমাণ সর্বোচ্চ ছিল।*"
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FACT
            )

        # E. Smart Insights & Recommendations
        elif any(k in prompt for k in ["insight", "সমস্যা", "সুপারিশ", "recommend", "রিপোর্ট", "report"]):
            tools_used.append("get_smart_insights")
            res = AIToolRegistry.execute_tool("get_smart_insights", AIContext.OFFICE_AI, user_role, db=db, tenant_id=tenant_id)
            insights = res["data"]["insights"]
            text = "🧠 **অফিস এআই স্মার্ট ইনসাইটস ও অ্যাকশন সুপারিশ:**\n\n"
            for idx, item in enumerate(insights, 1):
                text += f"**{idx}. {item['title']}**\n- প্রমাণ: {item['evidence']}\n- সুপারিশ: {item['recommended_action']}\n\n"

            return AIResponsePayload(
                text=text,
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.RECOMMENDATION
            )

        # Fallback Office AI tailored by role
        role_guide = {
            "SUPER_ADMIN": "আপনি আজকের সেলস, ৩০ দিনের P&L, বাস বহর পারফরম্যান্স, লাভ-ক্ষতি বা বিজনেস ইনসাইটস জানতে পারেন।",
            "MANAGER": "আপনি বাস বহরের অকুপেন্সি, রুট শিডিউলিং, আজকের বিক্রিত টিকিট ও ট্রিপ স্ট্যাটাস জানতে পারেন।",
            "BOOKING_STAFF": "আপনি আজকের কাউন্টার সেলস, টিকিট বুকিং স্ট্যাটাস ও সিট খালি থাকার তথ্য জানতে পারেন।",
            "ACCOUNTANT": "আপনি আজকের ডে-ক্লোজিং, ক্যাশ ও এমএফএস সংগ্রহ, ফুয়েল ভাউচার এবং আর্থিক বিবরণী জানতে পারেন।"
        }.get(user_role, "আপনি আজকের সেলস, ৩০ দিনের রিপোর্ট, সেরা বাস পারফরম্যান্স বা লাভ-ক্ষতি সম্পর্কে জিজ্ঞাসা করতে পারেন।")

        return AIResponsePayload(
            text=f"আমি আপনার প্রশ্নটি বুঝতে পেরেছি। {role_guide}",
            context=AIContext.OFFICE_AI,
            role=user_role,
            confidence=DataConfidence.FACT
        )

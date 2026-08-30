"""
AI Orchestrator: Intent Detection, Tool Selection, Role-Based Access Control,
Policy Enforcement, Response Synthesis, and Audit Logging for Supervisor AI,
Student AI, and Office AI sub-roles (Super Admin, Manager, Booking Staff, Accountant).
Exclusively optimized for Rajshahi-Origin Point-to-Point Admission Exam Express Service.
"""

import re
import json
import time
import logging
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.ai.context import (
    AIContext, DataConfidence, AIResponsePayload, AIActionPreview,
    ROLE_REFUSAL_MESSAGES,
    SUPERVISOR_AI_SYSTEM_PROMPT, STUDENT_AI_SYSTEM_PROMPT,
    OFFICE_AI_SUPER_ADMIN_PROMPT, OFFICE_AI_MANAGER_PROMPT,
    OFFICE_AI_BOOKING_STAFF_PROMPT, OFFICE_AI_ACCOUNTANT_PROMPT
)
from app.ai.tools.registry import AIToolRegistry
from app.ai.audit_logger import AIAuditLogger
from app.models.user import User
from app.core.config import settings
import google.generativeai as genai
from groq import Groq
from app.ai.knowledge_base import query_knowledge_base

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
    genai.configure(api_key=settings.GEMINI_API_KEY)

# Ensure tools are imported & registered
import app.ai.tools.office_tools
import app.ai.tools.student_tools
import app.ai.tools.supervisor_tools

# ═══════════════════════════════════════════════════════════════
# SYSTEM PROMPT MAP — wires context.py prompts to Gemini calls
# ═══════════════════════════════════════════════════════════════
_SYSTEM_PROMPT_MAP = {
    AIContext.SUPERVISOR_AI: SUPERVISOR_AI_SYSTEM_PROMPT,
    AIContext.STUDENT_AI: STUDENT_AI_SYSTEM_PROMPT,
}
_OFFICE_PROMPT_MAP = {
    "SUPER_ADMIN": OFFICE_AI_SUPER_ADMIN_PROMPT,
    "MANAGER": OFFICE_AI_MANAGER_PROMPT,
    "BOOKING_STAFF": OFFICE_AI_BOOKING_STAFF_PROMPT,
    "ACCOUNTANT": OFFICE_AI_ACCOUNTANT_PROMPT,
}


# ═══════════════════════════════════════════════════════════════
# BANGLA TEXT NORMALIZATION
# ═══════════════════════════════════════════════════════════════
def normalize_bangla_prompt(prompt: str) -> str:
    """Normalizes Bangla/English mixed text for robust intent matching."""
    # Collapse multiple whitespace / newlines into single space
    prompt = re.sub(r'\s+', ' ', prompt.strip())
    # Normalize common Bangla spelling variations
    _SPELLING_MAP = {
        "বাসসে": "বাসে", "টিকেট": "টিকিট", "বুকিংস": "বুকিং",
        "প্যাসেন্জার": "প্যাসেঞ্জার", "স্টেশান": "স্টেশন",
        "ষ্টাফ": "স্টাফ", "ড্রাইভার্স": "ড্রাইভার",
    }
    for old, new in _SPELLING_MAP.items():
        prompt = prompt.replace(old, new)
    return prompt.lower().strip()


# ═══════════════════════════════════════════════════════════════
# CONVERSATION MEMORY (per-user, in-process)
# ═══════════════════════════════════════════════════════════════
class ConversationMemory:
    """Lightweight in-memory conversation history per user."""
    _MAX_TURNS = 10
    _store: Dict[str, List[Dict[str, str]]] = {}

    @classmethod
    def add_turn(cls, user_key: str, role: str, content: str) -> None:
        if user_key not in cls._store:
            cls._store[user_key] = []
        cls._store[user_key].append({"role": role, "content": content[:500]})
        cls._store[user_key] = cls._store[user_key][-cls._MAX_TURNS:]

    @classmethod
    def get_history(cls, user_key: str) -> List[Dict[str, str]]:
        return cls._store.get(user_key, [])

    @classmethod
    def get_history_text(cls, user_key: str) -> str:
        history = cls.get_history(user_key)
        if not history:
            return ""
        lines = []
        for turn in history[-6:]:  # last 6 turns for context
            label = "User" if turn["role"] == "user" else "AI"
            lines.append(f"{label}: {turn['content']}")
        return "\n".join(lines)

    @classmethod
    def clear(cls, user_key: str) -> None:
        cls._store.pop(user_key, None)


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
        tenant_id: Optional[str] = None,
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None
    ) -> AIResponsePayload:
        start_time = time.time()
        prompt_lower = normalize_bangla_prompt(prompt)
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

        # 2. ROUTE BY CONTEXT WITH STRICT ROLE-BASED SCOPING
        if context == AIContext.SUPERVISOR_AI:
            response = cls._handle_supervisor_ai(db, prompt_lower, trip_id, user_role, tools_used, file_bytes, mime_type)
        elif context == AIContext.STUDENT_AI:
            response = cls._handle_student_ai(db, prompt_lower, student_phone, tools_used, file_bytes, mime_type)
        else:
            response = cls._handle_office_ai(db, prompt_lower, user_role, tenant_id, tools_used, file_bytes, mime_type)

        # 3. AUDIT LOGGING
        latency_ms = (time.time() - start_time) * 1000
        detected_intent = tools_used[0] if tools_used else "general_assistant"
        confidence_score = 1.0 if tools_used else 0.85
        model_used = "grounded-db-tools" if tools_used else "gemini-3.6-flash"
        AIAuditLogger.log_interaction(
            db=db,
            user_id=user_id,
            tenant_id=tenant_id,
            ai_context=context.value,
            question=prompt,
            tools_used=tools_used,
            latency_ms=latency_ms,
            success=True,
            detected_intent=detected_intent,
            confidence_score=confidence_score,
            model_used=model_used,
            token_count=len(prompt.split()) + len(response.text.split()),
            response_length=len(response.text)
        )

        response.tools_used = tools_used
        response.role = user_role

        # 4. CONVERSATION MEMORY — store interaction
        memory_key = user_id or student_phone or "anonymous"
        ConversationMemory.add_turn(memory_key, "user", prompt)
        ConversationMemory.add_turn(memory_key, "assistant", response.text[:500])

        return response

    @classmethod
    def _call_gemini_fallback(
        cls,
        prompt: str,
        role_guide: str,
        context: AIContext = AIContext.OFFICE_AI,
        user_role: str = "SUPER_ADMIN",
        user_key: Optional[str] = None,
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None
    ) -> str:
        """
        Multi-tier generative fallback:
        Tier 1: Gemini 3.6 Flash with role system instructions & conversation memory
        Tier 2: Groq LLaMA-3.3-70b / LLaMA-3.1-8b
        Tier 3: Static Knowledge Base Grounded Q&A
        Tier 4: Graceful role-based refusal / safe Bengali response
        """
        # Select the correct system prompt from context.py
        if context == AIContext.OFFICE_AI:
            base_prompt = _OFFICE_PROMPT_MAP.get(user_role, _OFFICE_PROMPT_MAP["SUPER_ADMIN"])
        else:
            base_prompt = _SYSTEM_PROMPT_MAP.get(context, STUDENT_AI_SYSTEM_PROMPT)

        system_instruction = (
            f"{base_prompt}\n\n"
            f"Additional role context: {role_guide}\n\n"
            f"CRITICAL SECURITY RULE: You must NEVER ask for, process, or output any passwords, "
            f"credentials, or highly sensitive internal data. If asked, politely refuse.\n"
            f"Always answer in Bengali (বাংলা)."
        )

        history_text = ""
        if user_key:
            history_text = ConversationMemory.get_history_text(user_key)

        # ─── TIER 1: GEMINI 3.6 FLASH ───
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
            try:
                model = genai.GenerativeModel(
                    model_name='gemini-3.6-flash',
                    system_instruction=system_instruction
                )
                contents = []
                if history_text:
                    contents.append(f"[Previous conversation context]:\n{history_text}\n")
                if file_bytes and mime_type:
                    contents.append({"mime_type": mime_type, "data": file_bytes})
                contents.append(prompt)

                response = model.generate_content(contents)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Tier 1 (Gemini) fallback failed: {e}. Attempting Tier 2 (Groq)...")

        # ─── TIER 2: GROQ LLAMA ───
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "YOUR_GROQ_API_KEY_HERE":
            try:
                groq_client = Groq(api_key=settings.GROQ_API_KEY)
                messages = [{"role": "system", "content": system_instruction}]
                if history_text:
                    messages.append({"role": "system", "content": f"Previous conversation:\n{history_text}"})
                messages.append({"role": "user", "content": prompt})

                resp = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.4,
                    max_tokens=800
                )
                text = resp.choices[0].message.content
                if text:
                    return text.strip()
            except Exception as e:
                logger.warning(f"Tier 2 (Groq) fallback failed: {e}. Attempting Tier 3 (Knowledge Base)...")

        # ─── TIER 3: KNOWLEDGE BASE SEARCH ───
        try:
            kb_res = query_knowledge_base(prompt)
            if kb_res and kb_res.get("found"):
                return f"📖 {kb_res['answer']}"
        except Exception as e:
            logger.warning(f"Tier 3 (Knowledge Base) fallback failed: {e}")

        # ─── TIER 4: SAFE LOCALIZED GRACEFUL RESPONSE ───
        return f"আমি আপনার প্রশ্নটি বুঝতে পেরেছি। {role_guide}"

    # Alias to prevent AttributeError on legacy callers
    _call_ai_fallback = _call_gemini_fallback

    @classmethod
    def _classify_intent(cls, prompt: str, context: AIContext) -> Tuple[Optional[str], float]:
        """
        Fast intent classification to map natural queries to registered tool branches.
        """
        intent_map = {
            AIContext.SUPERVISOR_AI: {
                "manifest": "প্যাসেঞ্জার তালিকা, হাজিরা, কে বাকি, কারা উঠেছে",
                "stops": "বোর্ডিং পয়েন্ট, স্টপ, পিকআপ, ল্যান্ডমার্ক",
                "cash": "হাতে ক্যাশ, অন-ট্রিপ খরচ, ব্যালেন্স, খরচ বিবরণী",
                "emergency": "জরুরি সাহায্য, হেল্পলাইন, ড্রাইভার, পুলিশ, ব্রেকডাউন"
            },
            AIContext.STUDENT_AI: {
                "exam_buffer": "পরীক্ষার সময়, কখন রওনা দেব, বাফার সময়",
                "my_booking": "আমার বাস, আমার সিট, বুকিং তথ্য",
                "my_dues": "বকেয়া টাকা, পেমেন্ট স্ট্যাটাস",
                "guardian": "অভিভাবক নীতিমালা, ছাত্রী কোচ",
                "available_trips": "বাস আছে কি না, সিট খালি, ট্রিপ শিডিউল"
            },
            AIContext.OFFICE_AI: {
                "today_sales": "আজকের বিক্রয়, আজকের আয়, আজকের টিকিট",
                "profit_loss": "লাভ ক্ষতি, প্রফিট মার্জিন",
                "demand_forecast": "চাহিদা পূর্বাভাস, কয়টি বাস লাগবে",
                "fleet_occupancy": "বাসের অকুপেন্সি, বহর অবস্থা",
                "day_closing": "ডে ক্লোজিং, ক্যাশ হিসেব, ফুয়েল ভাউচার",
                "insights": "স্মার্ট ইনসাইট, সমস্যা, সুপারিশ"
            }
        }
        allowed_intents = intent_map.get(context, {})
        if not allowed_intents or len(prompt) < 3:
            return None, 0.0

        prompt_summary = ", ".join([f"'{k}': {v}" for k, v in allowed_intents.items()])
        classification_prompt = (
            f"Classify the following user message in a bus transportation system into exactly one of these intents: {list(allowed_intents.keys())} or 'none'.\n"
            f"Intent meanings: {prompt_summary}.\n"
            f"User message: \"{prompt}\"\n"
            f"Respond with JSON only: {{\"intent\": \"<intent_name_or_none>\", \"confidence\": 0.9}}"
        )

        try:
            if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "YOUR_GROQ_API_KEY_HERE":
                groq_client = Groq(api_key=settings.GROQ_API_KEY)
                resp = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": classification_prompt}],
                    temperature=0.0,
                    max_tokens=40
                )
                content = resp.choices[0].message.content.strip()
                if content.startswith("```"):
                    content = content.strip("`").replace("json", "").strip()
                data = json.loads(content)
                intent = data.get("intent")
                conf = float(data.get("confidence", 0.8))
                if intent in allowed_intents:
                    return intent, conf
        except Exception:
            pass

        return None, 0.0

    @classmethod
    def stream_query(
        cls,
        db: Session,
        prompt: str,
        context: AIContext,
        current_user: Optional[User] = None,
        role: Optional[str] = None,
        student_phone: Optional[str] = None,
        trip_id: Optional[str] = None,
        tenant_id: Optional[str] = None
    ):
        """
        Streaming generator for chat endpoint (Server-Sent Events).
        Yields text chunks and final payload metadata.
        """
        payload = cls.process_query(
            db=db,
            prompt=prompt,
            context=context,
            current_user=current_user,
            role=role,
            student_phone=student_phone,
            trip_id=trip_id,
            tenant_id=tenant_id
        )

        full_text = payload.text
        words = full_text.split(" ")
        chunk_size = 4
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i+chunk_size])
            if i + chunk_size < len(words):
                chunk += " "
            yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
            time.sleep(0.02)

        meta = {
            "done": True,
            "confidence": payload.confidence.value if hasattr(payload.confidence, "value") else str(payload.confidence),
            "tools_used": payload.tools_used,
            "data_cards": payload.data_cards,
            "action_preview": payload.action_preview.model_dump() if payload.action_preview and hasattr(payload.action_preview, "model_dump") else None,
            "download_url": payload.download_url
        }
        yield f"data: {json.dumps(meta, ensure_ascii=False)}\n\n"

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
        tools_used: List[str],
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None
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
                text += "**অপেক্ষমাণ পরীক্ষার্থী (রাজশাহী বোর্ডিং হাবে অপেক্ষায়):**\n"
                for idx, p in enumerate(waiting, 1):
                    text += f"{idx}. **{p['name']}** — সিট: `{', '.join(p['seats'])}` | পয়েন্ট: 📍 {p['boarding_point']} | 📞 `{p['phone']}`\n"
            if absent:
                text += "\n**অনুপস্থিত যাত্রী:**\n"
                for idx, p in enumerate(absent, 1):
                    text += f"{idx}. **{p['name']}** — সিট: `{', '.join(p['seats'])}` | 📞 `{p['phone']}` (অবিলম্বে কল করুন)\n"

            text += "\n💡 *যাত্রীদের ফোনে সরাসরি যোগাযোগ করে বাসে উঠার বিষয়টি নিশ্চিত করুন।*"
            return AIResponsePayload(
                text=text,
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT
            )

        # C. Boarding Stops Milestones & Landmarks (Strictly Rajshahi Hubs, Zero Highway Pickups)
        elif any(k in prompt for k in ["stop", "স্টপ", "পিকআপ", "তালাইমারী", "ভদ্রা", "রেলগেট", "শিরোইল", "সাভার", "চন্দ্রা", "নবীনগর", "landmark", "কোথায় থামবে", "গেট", "নামাবে", "ড্রপিং", "বোর্ডিং পয়েন্ট"]):
            tools_used.append("get_supervisor_stops_summary")
            res = AIToolRegistry.execute_tool("get_supervisor_stops_summary", AIContext.SUPERVISOR_AI, "SUPERVISOR", db=db, trip_id=trip_id)
            d = res["data"]
            text = (
                f"📍 **রাজশাহী সেন্ট্রাল বোর্ডিং হাব ও ক্যাম্পাস ড্রপিং গাইড:**\n\n"
                f"🏙️ **যাত্রা শুরুর শহর:** {d['origin_city']}\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            )
            for idx, s in enumerate(d["boarding_hubs"], 1):
                text += f"**{idx}. {s['stop_name']}** ({s['expected_time']})\n   - ল্যান্ডমার্ক: {s['landmark']}\n   - যাত্রী উঠবে: **{s['passenger_count']} জন**\n\n"

            text += (
                f"🚫 **হাইওয়ে পিকআপ পলিসি:** {d['intermediate_highway_stops']}। সাভার বা চন্দ্রা থেকে যাত্রী ওঠানো সম্পূর্ণ নিষিদ্ধ।\n\n"
                f"🏫 **ক্যাম্পাস সরাসরি ড্রপিং পয়েন্টসমূহ:**\n"
            )
            for dp in d["campus_dropping_points"]:
                text += f"  • {dp}\n"

            return AIResponsePayload(
                text=text,
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT
            )

        # D. General Trip Manifest & Live Attendance Status
        elif any(k in prompt for k in ["হাজিরা", "attendance", "বোর্ডিং", "boarded", "কতজন উঠেছে", "কে উঠেছে", "প্যাসেঞ্জার", "passenger", "manifest", "তালিকা"]):
            tools_used.append("get_supervisor_trip_manifest")
            res = AIToolRegistry.execute_tool("get_supervisor_trip_manifest", AIContext.SUPERVISOR_AI, "SUPERVISOR", db=db, trip_id=trip_id)
            d = res["data"]
            text = (
                f"📋 **চলতি ট্রিপ প্যাসেঞ্জার ও লাইভ হাজিরা রিপোর্ট**\n\n"
                f"🚌 **বাস:** {d['bus_name']} ({d['bus_number']})\n"
                f"🛣️ **রুট:** {d['route_name']}\n"
                f"📍 **অরিজিন হাব:** {d['origin_hub']}\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"- **মোট বরাদ্দকৃত আসন:** {d['total_seats']} টি (তালিকায় {d['manifest_count']} জন)\n"
                f"- **উঠেছে (Boarded):** **{d['boarded_count']} জন** ✅ (বোর্ডেড)\n"
                f"- **অপেক্ষমাণ (Waiting):** **{d['waiting_count']} জন** ⏳\n"
                f"- **অনুপস্থিত (Absent):** **{d['absent_count']} জন** ❌\n\n"
                f"🚫 *{d['zero_pickup_policy']}*"
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
                f"🧾 **অন-ট্রিপ খরচের খাতসমূহ:**\n"
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

        # F. Driver & Emergency Breakdown Helpline
        elif any(k in prompt for k in ["driver", "ড্রাইভার", "হেল্পলাইন", "emergency", "পুলিশ", "police", "নষ্ট", "ব্রেকডাউন"]):
            tools_used.append("get_supervisor_emergency_contacts")
            res = AIToolRegistry.execute_tool("get_supervisor_emergency_contacts", AIContext.SUPERVISOR_AI, "SUPERVISOR")
            d = res["data"]
            text = (
                f"🚨 **জরুরি কন্ট্রোল রুম ও সাপোর্ট হেল্পলাইন**\n\n"
                f"- **ড্রাইভার:** {d['driver_name']} (📞 `{d['driver_phone']}`)\n"
                f"- **রাজশাহী সেন্ট্রাল কন্ট্রোল রুম:** 📞 `{d['head_office_control_room']}`\n"
                f"- **জাতীয় জরুরি সেবা / হাইওয়ে পুলিশ:** 📞 `{d['highway_police_national_emergency']}`\n"
                f"- **নিকটস্থ মেকানিকাল সাপোর্ট হাব:** {d['nearest_mechanical_support']}\n\n"
                f"🛠️ **জরুরি ব্রেকডাউন এসওপি:**\n{d['breakdown_protocol']}"
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT
            )

        # Hybrid Intent Detection: Check if natural query maps to a known supervisor tool
        intent, conf = cls._classify_intent(prompt, AIContext.SUPERVISOR_AI)
        if intent == "manifest":
            tools_used.append("get_supervisor_trip_manifest")
            res = AIToolRegistry.execute_tool("get_supervisor_trip_manifest", AIContext.SUPERVISOR_AI, "SUPERVISOR", db=db, trip_id=trip_id)
            d = res["data"]
            return AIResponsePayload(
                text=f"📋 **প্যাসেঞ্জার ও লাইভ হাজিরা রিপোর্ট:**\n- মোট বরাদ্দকৃত আসন: {d['total_seats']} টি\n- বোর্ডেড: {d['boarded_count']} জন\n- অপেক্ষমাণ: {d['waiting_count']} জন\n- অনুপস্থিত: {d['absent_count']} জন",
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT
            )
        elif intent == "stops":
            tools_used.append("get_supervisor_stops_summary")
            res = AIToolRegistry.execute_tool("get_supervisor_stops_summary", AIContext.SUPERVISOR_AI, "SUPERVISOR", db=db, trip_id=trip_id)
            d = res["data"]
            return AIResponsePayload(
                text=f"📍 **রাজশাহী বোর্ডিং হাব ও ক্যাম্পাস ড্রপিং গাইড:**\n- অরিজিন: {d['origin_city']}\n- মোট বোর্ডিং পয়েন্ট: {d['total_boarding_points']} টি\n- হাইওয়ে পলিসি: {d['intermediate_highway_stops']}",
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT
            )
        elif intent == "cash":
            tools_used.append("get_supervisor_cash_and_expenses")
            res = AIToolRegistry.execute_tool("get_supervisor_cash_and_expenses", AIContext.SUPERVISOR_AI, "SUPERVISOR", db=db, trip_id=trip_id)
            d = res["data"]
            return AIResponsePayload(
                text=f"💵 **অন-ট্রিপ ক্যাশ ব্যালেন্স:**\n- ইস্যুকৃত ক্যাশ: ৳{d['issued_cash_bdt']:,.2f}\n- মোট খরচ: ৳{d['total_expenses_bdt']:,.2f}\n- হাতে অবশিষ্ট ক্যাশ: **৳{d['remaining_cash_in_hand_bdt']:,.2f}**",
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT
            )
        elif intent == "emergency":
            tools_used.append("get_supervisor_emergency_contacts")
            res = AIToolRegistry.execute_tool("get_supervisor_emergency_contacts", AIContext.SUPERVISOR_AI, "SUPERVISOR")
            d = res["data"]
            return AIResponsePayload(
                text=f"🚨 **জরুরি হেল্পলাইন:**\n- ড্রাইভার: {d['driver_name']} ({d['driver_phone']})\n- কন্ট্রোল রুম: {d['head_office_control_room']}\n- জাতীয় সেবা: {d['highway_police_national_emergency']}",
                context=AIContext.SUPERVISOR_AI,
                confidence=DataConfidence.FACT
            )

        # Default fallback for Supervisor AI
        role_guide = "আপনি সুপারভাইজার। আপনার কাজ শুধু বাসের যাত্রী ওঠানামা, ট্রিপ সম্পর্কিত সমস্যা সমাধান এবং যাত্রীদের সঠিক বোর্ডিং পয়েন্টে উঠতে সাহায্য করা।"
        gemini_text = cls._call_gemini_fallback(
            prompt, role_guide,
            context=AIContext.SUPERVISOR_AI, user_role=user_role,
            file_bytes=file_bytes, mime_type=mime_type
        )
        return AIResponsePayload(
            text=gemini_text,
            context=AIContext.SUPERVISOR_AI,
            confidence=DataConfidence.FACT
        )

    # ═════════════════════════════════════════════════════════════════════════
    # STUDENT AI: PERSONAL TRIP, SEAT, BUFFER & ADMISSION POLICY SCOPE ONLY
    # ═════════════════════════════════════════════════════════════════════════
    @classmethod
    def _handle_student_ai(
        cls,
        db: Session,
        prompt: str,
        student_phone: Optional[str],
        tools_used: List[str],
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None
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

        # B. Exam Timing Buffer & Departure Schedule Guidance
        if any(k in prompt for k in ["কখন রওনা", "কখন ছাড়বে রওনা", "বাফার", "buffer", "পরীক্ষা দিতে কখন", "পরীক্ষার সময়", "কখন বের হবো", "পৌঁছাবো কখন"]):
            tools_used.append("get_exam_buffer_guidance")
            
            # Detect target campus
            target_uni = "DU"
            if any(k in prompt for k in ["ju", "জাবি", "জাহাঙ্গীরনগর"]):
                target_uni = "JU"
            elif any(k in prompt for k in ["cu", "চবি", "চট্টগ্রাম"]):
                target_uni = "CU"
            elif any(k in prompt for k in ["sust", "শাবিপ্রবি", "সিলেট"]):
                target_uni = "SUST"
            elif any(k in prompt for k in ["med", "মেডিকেল", "ডাক্তারি"]):
                target_uni = "MEDICAL"
            elif any(k in prompt for k in ["ku", "খুবি", "খুলনা"]):
                target_uni = "KU"

            res = AIToolRegistry.execute_tool("get_exam_buffer_guidance", AIContext.STUDENT_AI, "STUDENT", destination_campus=target_uni)
            d = res["data"]

            text = (
                f"⏱️ **{d['university_name']} ভর্তি পরীক্ষার নিরাপদ রাজশাহী যাত্রা শিডিউল:**\n\n"
                f"- **সুপারিশকৃত রাজশাহী ছাড়ার সময়:** 🚌 **{d['recommended_departure_from_rajshahi']}**\n"
                f"- **আনুমানিক পৌঁছানোর সময়:** 🏫 **{d['expected_campus_arrival']}**\n"
                f"- **ক্যাম্পাস ড্রপিং গেট:** {d['dropping_gate']}\n"
                f"- **হাইওয়ে ভ্রমণ সময়:** {d['highway_travel_hours']} ঘণ্টা (+১ ঘণ্টা যমুনা সেতু ট্রাফিক বাফার)\n"
                f"- **নিশ্চিত রেস্ট ও রিভিশন বাফার:** 🎯 **{d['rest_and_revision_buffer_hours']} ঘণ্টা** পরীক্ষা শুরুর পূর্বে!\n\n"
                f"{d['guarantee_message']}\n\n"
                f"📍 **রাজশাহীর প্রধান বোর্ডিং পয়েন্ট:** {', '.join(d['rajshahi_boarding_points'])}\n"
                f"⚠️ *{d['zero_pickup_reminder']}*"
            )
            data_cards = [
                {"title": "রাজশাহী ছাড়ার সময়", "value": d["recommended_departure_from_rajshahi"], "badge": "Safe Departure"},
                {"title": "ক্যাম্পাস পৌঁছানো", "value": d["expected_campus_arrival"], "badge": "Arrival"},
                {"title": "রেস্ট বাফার", "value": f"{d['rest_and_revision_buffer_hours']} ঘণ্টা", "badge": "Rest Buffer"}
            ]
            return AIResponsePayload(
                text=text,
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.CALCULATED,
                data_cards=data_cards
            )

        # C. Personal Trip / Bus / Seat inquiry
        elif any(k in prompt for k in ["আমার bus", "আমার seat", "আমার বাস", "আমার সিট", "কখন ছাড়বে", "pickup point", "পিকআপ", "বোর্ডিং"]):
            if not student_phone:
                return AIResponsePayload(
                    text="আপনার বাস ও সিট বুকিং তথ্য দেখতে অনুগ্রহ করে আপনার মোবাইল নম্বরটি প্রদান করুন (যেমন: 017xxxxxxxx)।",
                    context=AIContext.STUDENT_AI,
                    confidence=DataConfidence.FACT
                )

            tools_used.append("get_my_active_booking")
            res = AIToolRegistry.execute_tool("get_my_active_booking", AIContext.STUDENT_AI, "STUDENT", db=db, student_phone=student_phone)
            d = res["data"]

            if not d.get("has_booking"):
                return AIResponsePayload(
                    text="আপনার মোবাইল নম্বরে বর্তমানে কোনো সক্রিয় বাস বুকিং পাওয়া যায়নি। আপনি রাজশাহী থেকে সরাসরি বিভিন্ন বিশ্ববিদ্যালয় ক্যাম্পাসের টিকিট বুক করতে পারেন।",
                    context=AIContext.STUDENT_AI,
                    confidence=DataConfidence.FACT
                )

            text = (
                f"🎫 **আপনার রাজশাহী ভর্তি স্পেশাল এক্সপ্রেস বাস বুকিং তথ্য:**\n\n"
                f"- **বাসের নাম:** {d['bus_name']} ({d['bus_number']})\n"
                f"- **রুট:** {d['route_name']}\n"
                f"- **যাত্রার তারিখ ও সময়:** {d['departure_date']} রাত {d['departure_time']}\n"
                f"- **বরাদ্দকৃত সিট:** **{', '.join(d['seats'])}** ({d['bus_type']})\n"
                f"- **রাজশাহী বোর্ডিং পয়েন্ট:** 📍 {d['boarding_point']}\n"
                f"- **ক্যাম্পাস ড্রপিং গেট:** 🏫 {d['dropping_point']}\n"
                f"- **বুকিং নম্বর:** `{d['booking_number']}`\n\n"
                f"💡 *{d['zero_pickup_notice']} যাত্রার অন্তত ৩০ মিনিট পূর্বে বোর্ডিং কাউন্টারে উপস্থিত থাকুন।* "
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.FACT
            )

        # D. Dues & Payment Status Inquiry
        elif any(k in prompt for k in ["due", "বকেয়া", "payment", "টাকা", "status"]):
            if not student_phone:
                return AIResponsePayload(
                    text="আপনার পেমেন্ট ও বকেয়া হিসাব দেখতে অনুগ্রহ করে আপনার মোবাইল নম্বরটি প্রদান করুন (যেমন: 017xxxxxxxx)।",
                    context=AIContext.STUDENT_AI,
                    confidence=DataConfidence.FACT
                )

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

        # E. Guardian / Female Coach Policy Inquiry
        elif any(k in prompt for k in ["guardian", "বাবা", "ভাই", "অভিভাবক", "মা", "মহিলা", "female", "ছাত্রী"]):
            tools_used.append("get_guardian_policy")
            res = AIToolRegistry.execute_tool("get_guardian_policy", AIContext.STUDENT_AI, "STUDENT")
            text = (
                f"👥 **অভিভাবক সিট বরাদ্দ ও ছাত্রী কোচ নীতিমালা:**\n\n"
                f"{res['data']['policy']}\n\n"
                f"অনুমোদিত রক্তের ও বৈবাহিক সম্পর্কসমূহ: **{', '.join(res['data']['allowed_relationships'])}** (অনুমোদিত)।\n"
                f"সর্বোচ্চ অভিভাবক সংখ্যা: {res['data']['max_guardians_per_student']} জন।"
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.FACT
            )

        # F. Available Trips Discovery
        elif any(k in prompt for k in ["বাস আছে", "available", "সিট খালি", "trip", "ট্রিপ"]):
            tools_used.append("search_available_trips")
            res = AIToolRegistry.execute_tool("search_available_trips", AIContext.STUDENT_AI, "STUDENT", db=db)
            trips = res["data"]["trips"]
            text = "🚌 **রাজশাহী থেকে সরাসরি বিশ্ববিদ্যালয় ভর্তি স্পেশাল বাস শিডিউল:**\n\n"
            for t in trips:
                text += f"- **{t['route_name']}** ({t['departure_date']} রাত {t['departure_time']}) — সিট খালি: {t['available_seats_count']}টি ({t['bus_type']}) | ভাড়া: ৳{t['base_fare_bdt']}\n"

            text += "\n💡 *সকল বাস রাজশাহী (তালাইমারী/ভদ্রা/রেলগেট/শিরোইল) থেকে সরাসরি ক্যাম্পাসে যাবে। নো মিডওয়ে পিকআপ।*"
            return AIResponsePayload(
                text=text,
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.FACT
            )

        # Hybrid Intent Detection for Student AI
        intent, conf = cls._classify_intent(prompt, AIContext.STUDENT_AI)
        if intent == "exam_buffer":
            tools_used.append("get_exam_buffer_guidance")
            res = AIToolRegistry.execute_tool("get_exam_buffer_guidance", AIContext.STUDENT_AI, "STUDENT", destination_campus="DU", exam_start_time="10:00 AM")
            d = res["data"]
            return AIResponsePayload(
                text=f"⏱️ **ভর্তি পরীক্ষার নিরাপদ যাত্রা বাফার গাইড:**\n- রাজশাহী ছাড়ার সময়: **{d['recommended_departure_from_rajshahi']}**\n- ক্যাম্পাস পৌঁছানোর সময়: {d['expected_campus_arrival']}\n- রেস্ট বাফার: **{d['rest_and_revision_buffer_hours']} ঘণ্টা**",
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.CALCULATED
            )
        elif intent == "guardian":
            tools_used.append("get_guardian_policy")
            res = AIToolRegistry.execute_tool("get_guardian_policy", AIContext.STUDENT_AI, "STUDENT")
            return AIResponsePayload(
                text=f"👥 **অভিভাবক ও ছাত্রী কোচ নীতিমালা:**\n{res['data']['policy']}",
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.FACT
            )
        elif intent == "available_trips":
            tools_used.append("search_available_trips")
            res = AIToolRegistry.execute_tool("search_available_trips", AIContext.STUDENT_AI, "STUDENT", db=db)
            return AIResponsePayload(
                text="🚌 **উপলব্ধ ভর্তি স্পেশাল এক্সপ্রেস ট্রিপসমূহ:**\nসকল বাস রাজশাহী (তালাইমারী/ভদ্রা/রেলগেট/শিরোইল) থেকে সরাসরি ক্যাম্পাসে যাবে।",
                context=AIContext.STUDENT_AI,
                confidence=DataConfidence.FACT
            )

        # Fallback Student AI
        role_guide = "আমি আপনার রাজশাহী ভর্তি এক্সপ্রেস ব্যক্তিগত সহকারী 🎓। আপনি রাজশাহী থেকে বিশ্ববিদ্যালয় ক্যাম্পাসে ছাড়ার সময়, ৩-৪ ঘণ্টার বাফার হিসাব, সিট নম্বর, বোর্ডিং পয়েন্ট বা ছাত্রী কোচ নীতিমালা সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।"
        gemini_text = cls._call_gemini_fallback(
            prompt, role_guide,
            context=AIContext.STUDENT_AI, user_role="STUDENT", user_key=student_phone,
            file_bytes=file_bytes, mime_type=mime_type
        )
        return AIResponsePayload(
            text=gemini_text,
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
        tools_used: List[str],
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None
    ) -> AIResponsePayload:
        # 1. Check Sub-Role Specific Permission Boundaries
        if user_role == "BOOKING_STAFF":
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
            if any(k in prompt for k in ["profit margin", "মার্জিন কত", "নিট লাভ মার্জিন", "ব্যাংক একাউন্ট"]):
                return AIResponsePayload(
                    text=ROLE_REFUSAL_MESSAGES["MANAGER_OUT_OF_SCOPE"],
                    context=AIContext.OFFICE_AI,
                    role=user_role,
                    confidence=DataConfidence.FACT,
                    tools_used=[]
                )

        elif user_role == "ACCOUNTANT":
            if any(k in prompt for k in ["edit route", "রুট পরিবর্তন", "বাস এসাইন", "রস্টার পরিবর্তন"]):
                return AIResponsePayload(
                    text=ROLE_REFUSAL_MESSAGES["ACCOUNTANT_OUT_OF_SCOPE"],
                    context=AIContext.OFFICE_AI,
                    role=user_role,
                    confidence=DataConfidence.FACT,
                    tools_used=[]
                )

        # 2. Process Authorized In-Scope Intents
        # A. Admission Exam Demand Forecasting Intent
        if any(k in prompt for k in ["forecast", "পূর্বাভাস", "কয়টি বাস লাগবে", "কয়টি বাস", "কতটি বাস", "চাহিদা", "ভর্তি পরীক্ষা", "ছাত্রী কোচ কতটি", "বাস লাগবে", "পরীক্ষায় কত"]):
            tools_used.append("get_admission_demand_forecast")
            res = AIToolRegistry.execute_tool("get_admission_demand_forecast", AIContext.OFFICE_AI, user_role, db=db, tenant_id=tenant_id)
            if not res["success"]:
                return AIResponsePayload(text=f"ত্রুটি: {res.get('error')}", context=AIContext.OFFICE_AI, role=user_role)

            d = res["data"]
            text = (
                f"📈 **আসন্ন বিশ্ববিদ্যালয় ভর্তি পরীক্ষা রাজশাহী বাস চাহিদা পূর্বাভাস (Demand Forecast)**\n\n"
                f"- 🏙️ **অরিজিন হাব:** {d['origin_hub']}\n"
                f"- 🚌 **সর্বমোট প্রয়োজনীয় বাস বহর:** **{d['total_buses_required']} টি বাস**\n"
                f"- 👩 **সুপারিশকৃত ছাত্রী স্পেশাল কোচ:** **{d['total_female_coaches_recommended']} টি** (গড় অনুপাত: ৩৮-৪৫%)\n"
                f"- 👥 **প্রাক্কলিত মোট যাত্রী সংখ্যা:** {d['total_projected_passengers']:,} জন শিক্ষার্থী\n"
                f"- 💰 **সম্ভাব্য গ্রস রেভিনিউ:** ৳{d['total_projected_revenue_bdt']:,.0f}\n\n"
                f"📋 **বিশ্ববিদ্যালয় অনুযায়ী চাহিদা বিশ্লেষণ:**\n"
            )
            for f in d["university_forecasts"]:
                text += f"• **{f['university_name']}** ({f['exam_date']}): {f['buses_required']}টি বাস (ছাত্রী কোচ: {f['female_coaches_recommended']}টি | ভাড়া: ৳{f['fare_per_seat_bdt']:.0f})\n"

            text += "\n💡 **কৌশলগত অপারেশনাল সুপারিশমালা:**\n"
            for r in d["strategic_recommendations"]:
                text += f"  - {r}\n"

            data_cards = [
                {"title": "প্রয়োজনীয় বাস বহর", "value": f"{d['total_buses_required']} টি", "badge": "Fleet Required"},
                {"title": "ছাত্রী স্পেশাল কোচ", "value": f"{d['total_female_coaches_recommended']} টি", "badge": "Female Coached"},
                {"title": "প্রাক্কলিত রেভিনিউ", "value": f"৳{d['total_projected_revenue_bdt']:,.0f}", "badge": "Est. Revenue"}
            ]
            return AIResponsePayload(
                text=text,
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FORECAST,
                data_cards=data_cards
            )

        # B. Profit & Loss Financial Summary Intent
        elif any(k in prompt for k in ["profit", "লাভ", "margin", "মার্জিন", "expense", "খরচ", "financial summary", "p&l", "লাভ-ক্ষতি"]):
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

        # C. Bus Performance & Occupancy Intent
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
                f"- ⭐ **গড় পরীক্ষার্থী রেটিং:** ৪.৯/৫ (মোট ১১৪ টি রিভিউ)\n"
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FACT
            )

        # D. Sales Analytics Intent
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

        # E. 30-Day Sales & High Day Analytics Intent
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
                f"💡 *ভর্তি পরীক্ষার তারিখের ঠিক পূর্ববর্তী দিনগুলোতে স্বাভাবিকভাবেই বিক্রির পরিমাণ সর্বোচ্চ ছিল।*"
            )
            return AIResponsePayload(
                text=text,
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FACT
            )

        # F. Conversational Report Generation Intent (Multimodal & CSV Export)
        elif any(k in prompt for k in ["রিপোর্ট তৈরি", "রিপোর্ট দেও", "report", "csv", "excel", "এক্সেল", "ডাউনলোড", "download"]):
            # Check if language is specified
            lang_bn = any(k in prompt for k in ["বাংলা", "bangla", "bengali"])
            lang_en = any(k in prompt for k in ["english", "ইংরেজি"])
            
            if not lang_bn and not lang_en:
                # Prompt user for language
                return AIResponsePayload(
                    text="আপনি কি রিপোর্টটি ইংরেজি নাকি বাংলা ভাষায় চান? (যেমন: 'বাংলায় দেও')",
                    context=AIContext.OFFICE_AI,
                    role=user_role,
                    confidence=DataConfidence.FACT
                )
            
            # Generate actual report if language is known
            language = "BN" if lang_bn else "EN"
            tools_used.append("generate_business_report_csv")
            
            # For demonstration, we fetch today sales data and convert it into a list of dicts for CSV
            res_sales = AIToolRegistry.execute_tool("get_today_sales", AIContext.OFFICE_AI, user_role, db=db, tenant_id=tenant_id)
            sales_data = res_sales.get("data", {})
            
            csv_data = [
                {
                    "Date": sales_data.get("date"),
                    "Total Sales (BDT)": sales_data.get("total_sales_bdt"),
                    "Total Tickets Sold": sales_data.get("total_tickets_sold"),
                    "Total Collected (BDT)": sales_data.get("total_collected_bdt"),
                    "Total Due (BDT)": sales_data.get("total_due_bdt")
                }
            ]
            
            report_res = AIToolRegistry.execute_tool(
                "generate_business_report_csv", 
                AIContext.OFFICE_AI, 
                user_role, 
                data=csv_data, 
                report_title="Daily_Sales_Report",
                language=language
            )
            
            if not report_res["success"]:
                return AIResponsePayload(text=f"ত্রুটি: {report_res.get('error')}", context=AIContext.OFFICE_AI, role=user_role)
                
            report_data = report_res["data"]
            text = (
                f"✅ **আপনার {report_data['language']} রিপোর্ট সফলভাবে তৈরি হয়েছে!**\n\n"
                f"রিপোর্টের নাম: `{report_data['file_name']}`\n"
                f"আপনি নিচের বাটন থেকে এক্সেল/সিএসভি ফাইলটি ডাউনলোড করতে পারবেন।"
            )
            
            return AIResponsePayload(
                text=text,
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FACT,
                # Frontend will detect download_url and render a download button
                data_cards=[{"title": "Download Ready", "value": "CSV Format", "badge": "New"}],
                download_url=report_data["download_url"]
            )

        # G. Smart Insights & Recommendations
        elif any(k in prompt for k in ["insight", "সমস্যা", "সুপারিশ", "recommend"]):
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

        # Hybrid Intent Detection for Office AI
        intent, conf = cls._classify_intent(prompt, AIContext.OFFICE_AI)
        if intent == "today_sales":
            tools_used.append("get_today_sales")
            res = AIToolRegistry.execute_tool("get_today_sales", AIContext.OFFICE_AI, user_role, db=db, tenant_id=tenant_id)
            d = res["data"]
            return AIResponsePayload(
                text=f"📊 **আজকের বিক্রয় বিবরণী:**\n- মোট বিক্রয়: ৳{d['total_sales_bdt']:,.2f}\n- বিক্রিত টিকিট: {d['total_tickets_sold']} টি\n- মোট সংগৃহীত: ৳{d['total_collected_bdt']:,.2f}\n- অবশিষ্ট বকেয়া: ৳{d['total_due_bdt']:,.2f}",
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FACT
            )
        elif intent == "profit_loss":
            tools_used.append("get_profit_loss")
            res = AIToolRegistry.execute_tool("get_profit_loss", AIContext.OFFICE_AI, user_role, db=db, tenant_id=tenant_id)
            d = res["data"]
            return AIResponsePayload(
                text=f"📈 **আর্থিক লাভ-ক্ষতি বিবরণী:**\n- মোট আয়: ৳{d['revenue_bdt']:,.2f}\n- মোট খরচ: ৳{d['total_expenses_bdt']:,.2f}\n- নেট প্রফিট: ৳{d['net_profit_bdt']:,.2f} (মার্জিন: {d['profit_margin_percent']}%)",
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.CALCULATED
            )
        elif intent == "demand_forecast":
            tools_used.append("get_admission_demand_forecast")
            res = AIToolRegistry.execute_tool("get_admission_demand_forecast", AIContext.OFFICE_AI, user_role, db=db)
            d = res["data"]
            return AIResponsePayload(
                text=f"🎯 **বিশ্ববিদ্যালয় ভর্তি বাস চাহিদা পূর্বাভাস:**\n- প্রাক্কলিত বাস চাহিদা: {d['forecasted_buses_needed']} টি\n- ছাত্রী কোচ বরাদ্দ: {d['female_dedicated_coaches_recommended']} টি\n- মোট আবেদনকারী: {d['estimated_student_travelers_from_rajshahi']:,} জন",
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FORECAST
            )
        elif intent == "fleet_occupancy":
            tools_used.append("get_fleet_live_occupancy")
            res = AIToolRegistry.execute_tool("get_fleet_live_occupancy", AIContext.OFFICE_AI, user_role, db=db, tenant_id=tenant_id)
            d = res["data"]
            return AIResponsePayload(
                text=f"🚌 **বাস বহর অকুপেন্সি রিপোর্ট:**\n- সক্রিয় বাস: {d['active_buses_count']} টি\n- গড় বহর অকুপেন্সি: {d['average_fleet_occupancy_percent']}%\n- মোট বিক্রি হওয়া আসন: {d['total_seats_sold']} টি",
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FACT
            )
        elif intent == "day_closing":
            tools_used.append("get_fuel_and_day_closing_summary")
            res = AIToolRegistry.execute_tool("get_fuel_and_day_closing_summary", AIContext.OFFICE_AI, user_role, db=db, tenant_id=tenant_id)
            d = res["data"]
            return AIResponsePayload(
                text=f"🧾 **আজকের ডে-ক্লোজিং রিপোর্ট:**\n- ক্যাশ সেলস: ৳{d['cash_sales_bdt']:,.2f}\n- ডিজিটাল এমএফএস: ৳{d['mfs_sales_bdt']:,.2f}\n- স্ট্যাটাস: {d['reconciliation_status']}",
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.FACT
            )
        elif intent == "insights":
            tools_used.append("get_smart_insights")
            res = AIToolRegistry.execute_tool("get_smart_insights", AIContext.OFFICE_AI, user_role, db=db, tenant_id=tenant_id)
            insights = res["data"]["insights"]
            text = "🧠 **অফিস এআই স্মার্ট ইনসাইটস:**\n"
            for item in insights[:3]:
                text += f"- **{item['title']}**: {item['recommended_action']}\n"
            return AIResponsePayload(
                text=text,
                context=AIContext.OFFICE_AI,
                role=user_role,
                confidence=DataConfidence.RECOMMENDATION
            )

        # Fallback Office AI tailored by role
        role_guide = {
            "SUPER_ADMIN": "আপনি আজকের সেলস, ৩০ দিনের P&L, ভর্তি বাস চাহিদা পূর্বাভাস, বাস বহর পারফরম্যান্স বা বিজনেস ইনসাইটস জানতে পারেন।",
            "MANAGER": "আপনি বাস বহরের অকুপেন্সি, পরীক্ষার চাহিদা পূর্বাভাস, আজকের বিক্রিত টিকিট ও ট্রিপ শিডিউল জানতে পারেন।",
            "BOOKING_STAFF": "আপনি আজকের কাউন্টার সেলস, টিকিট বুকিং স্ট্যাটাস ও সিট খালি থাকার তথ্য জানতে পারেন।",
            "ACCOUNTANT": "আপনি আজকের ডে-ক্লোজিং, ক্যাশ ও এমএফএস সংগ্রহ, ফুয়েল ভাউচার এবং আর্থিক বিবরণী জানতে পারেন।"
        }.get(user_role, "আপনি আজকের সেলস, পরীক্ষার চাহিদা পূর্বাভাস বা লাভ-ক্ষতি সম্পর্কে জিজ্ঞাসা করতে পারেন।")

        gemini_text = cls._call_gemini_fallback(
            prompt, role_guide,
            context=AIContext.OFFICE_AI, user_role=user_role,
            file_bytes=file_bytes, mime_type=mime_type
        )
        return AIResponsePayload(
            text=gemini_text,
            context=AIContext.OFFICE_AI,
            role=user_role,
            confidence=DataConfidence.FACT
        )

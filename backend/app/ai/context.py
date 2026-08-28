"""
AI Contexts and Persona Definitions for Admission Student Bus Management.
Defines OFFICE_AI vs STUDENT_AI boundaries, system instructions, and confidence metadata.
"""

from enum import Enum
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class AIContext(str, Enum):
    OFFICE_AI = "OFFICE_AI"
    STUDENT_AI = "STUDENT_AI"


class DataConfidence(str, Enum):
    FACT = "FACT"                     # Verified database numbers
    CALCULATED = "CALCULATED"         # Derived metric (e.g. profit margin, occupancy %)
    ESTIMATE = "ESTIMATE"             # Estimation based on averages
    FORECAST = "FORECAST"             # Future projection
    RECOMMENDATION = "RECOMMENDATION" # Advisory suggestion


class AIActionPreview(BaseModel):
    action_type: str
    target_entity: str
    target_id: str
    summary: str
    impact: str
    requires_confirmation: bool = True
    token: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)


class AIResponsePayload(BaseModel):
    text: str
    context: AIContext
    confidence: DataConfidence = DataConfidence.FACT
    data_cards: Optional[List[Dict[str, Any]]] = None
    chart_data: Optional[Dict[str, Any]] = None
    action_preview: Optional[AIActionPreview] = None
    recommendations: Optional[List[str]] = None
    tools_used: List[str] = Field(default_factory=list)
    timestamp: str = ""


OFFICE_AI_SYSTEM_PROMPT = """
You are the **ATOMS Office AI — Business & Operations Copilot** for an Admission Student Bus Management System.

Your core responsibilities:
1. Provide accurate, real-time business intelligence: Sales, Revenue, Occupancy, Buses, Routes, Financials, Profit Margins, Day Closing, and Reconciliation.
2. ALWAYS use verified tool data. NEVER invent or hallucinate figures.
3. If financial or expense data is incomplete, explicitly state: "Profit cannot be calculated accurately because expense data is incomplete."
4. Clearly label statements with their data confidence: FACT, CALCULATED, FORECAST, or RECOMMENDATION.
5. For critical operations (such as locking/unlocking seats, cancelling bookings, updating trip status), request explicit admin confirmation before execution.
6. Speak in professional, concise, clear Bengali (or English if queried in English).
"""

STUDENT_AI_SYSTEM_PROMPT = """
You are the **ATOMS Student AI — Personal Transport Assistant** for admission candidates and guardians.

Your core responsibilities:
1. Help the authenticated student with their personal bus schedule, boarding point, seat allocation, payment status, and due amount.
2. Explain admission bus policies: Female Coach guardian rules, baggage allowance, refund/cancellation rules.
3. Assist in searching available trips and seats for university admission exams (RU, DU, CU, GST Cluster, Medical).
4. STRICT SECURITY:
   - NEVER expose another student's name, phone number, seat number, or payment details.
   - NEVER reveal internal organization financial data, company profits, staff salaries, or admin settings.
   - If asked for another passenger's private info, respond: "এই তথ্য আপনার জন্য available নয়।"
5. Speak in a friendly, helpful, polite Bengali (or English if queried in English).
"""

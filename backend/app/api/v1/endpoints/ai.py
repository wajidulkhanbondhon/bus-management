from typing import Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

router = APIRouter()


class AIQueryRequest(BaseModel):
    prompt: str
    tenant_id: Optional[str] = None


@router.post("/query-assistant")
async def ai_booking_assistant(req: AIQueryRequest) -> Dict[str, Any]:
    """AI Assistant endpoint for intelligent natural language trip inquiries."""
    prompt_lower = req.prompt.lower()

    if "rajshahi" in prompt_lower or "ru" in prompt_lower:
        return {
            "answer": "রাজশাহী বিশ্ববিদ্যালয়ের (RU Unit-A) জন্য আজ রাত ৮:৩০ এবং ৯:১৫ মিনিটে দুটি স্পেশাল বাস শিডিউল রয়েছে। মেয়েদের জন্য আলাদা স্পেশাল বাস (Female Coach) উপলব্ধ আছে।",
            "recommended_trip_code": "TRIP-20260827-001",
            "fare": 550.0
        }
    elif "chittagong" in prompt_lower or "cu" in prompt_lower:
        return {
            "answer": "চট্টগ্রাম বিশ্ববিদ্যালয়ের (CU Unit-C) জন্য আগামীকাল সকাল ৮:৩০ মিনিটে স্পেশাল মর্নিং বাস সার্ভিস শিডিউল রয়েছে।",
            "recommended_trip_code": "TRIP-20260827-003",
            "fare": 600.0
        }
    else:
        return {
            "answer": "আপনার প্রশ্নের জন্য ধন্যবাদ। ঢাকা থেকে রাজশাহী, চট্টগ্রাম এবং জিএসটি ক্লাস্টার ভর্তি পরীক্ষার নিয়মিত বাস সার্ভিস বুকিং চলছে।",
            "fare": 550.0
        }


@router.post("/scan-student-card")
async def scan_student_id_card(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Simulated AI OCR endpoint for automatic Student ID/Admit Card verification."""
    return {
        "success": True,
        "filename": file.filename,
        "extracted_data": {
            "student_name": "Farhana Yasmin",
            "admission_roll": "RU-2026-98124",
            "unit": "Unit-A (Science)",
            "exam_center": "Rajshahi University Science Building",
            "confidence_score": 0.98
        }
    }

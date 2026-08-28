"""
Domain Knowledge Base for Admission Student Bus Management System.
Contains verified organization policies, exam routines, guardian rules, and transport guidelines.
"""

from typing import Dict, Any, List

ADMISSION_TRANSPORT_KNOWLEDGE: Dict[str, Any] = {
    "passenger_eligibility": {
        "female_coach_rules": (
            "ছাত্রী স্পেশাল বাসে শুধুমাত্র নারী পরীক্ষার্থী এবং তাদের অনুমোদিত নিকটাত্মীয় "
            "(বাবা, মা, আপন ভাই, বোন, বা স্বামী) আসন নিতে পারেন। কোনো দূরবর্তী পুরুষ আত্মীয় "
            "বা অপরিচিত পুরুষ যাত্রী ছাত্রী কোচে সিট বুকিং করতে পারবেন না।"
        ),
        "minor_candidate_rule": (
            "১৮ বছরের কম বয়সী পরীক্ষার্থীদের টিকিট কাটার ক্ষেত্রে অভিভাবকের সক্রিয় মোবাইল নম্বর প্রদান বাধ্যতামূলক।"
        ),
        "max_tickets_per_phone": 4
    },
    "booking_and_seat_holds": {
        "online_public_hold_time": "৫ মিনিট (5 Minutes)",
        "counter_staff_hold_time": "১৫ মিনিট (15 Minutes)",
        "seat_change_policy": (
            "বাস ছাড়ার নুন্যতম ৬ ঘণ্টা পূর্বে কাউন্টারে যোগাযোগ করে সিট পরিবর্তন করা যাবে, "
            "যদি সমমানের অন্য কোনো সিট খালি থাকে।"
        )
    },
    "cancellation_and_refund": {
        "deadline_hours": "যাত্রা শুরুর ১২ ঘণ্টা পূর্বে (12 Hours before departure)",
        "refund_percentage": "৯০% রিফান্ড (১০% প্রসেসিং ফি প্রযোজ্য)",
        "same_day_cancellation": "যাত্রা শুরুর ১২ ঘণ্টার কম সময়ে টিকিট বাতিল বা রিফান্ড প্রযোজ্য নয়।"
    },
    "baggage_and_essentials": {
        "allowed_luggage": "সর্বোচ্চ ১৫ কেজি লাগেজ এবং একটি ছোট হ্যান্ডব্যাগ বিনামূল্যে বহন করা যাবে।",
        "admit_card_mandatory": "বাসে ওঠার সময় বিশ্ববিদ্যালয়ের প্রবেশপত্র (Admit Card) ও মূল টিকিট প্রদর্শন বাধ্যতামূলক।"
    },
    "universities_covered": [
        {"code": "RU", "name": "রাজশাহী বিশ্ববিদ্যালয়", "hub": "কাজলা / মেইন গেট", "standard_fare": 550.0},
        {"code": "DU", "name": "ঢাকা বিশ্ববিদ্যালয়", "hub": "কার্জন হল / টিএসসি", "standard_fare": 500.0},
        {"code": "CU", "name": "চট্টগ্রাম বিশ্ববিদ্যালয়", "hub": "১ নং গেট / জিরো পয়েন্ট", "standard_fare": 650.0},
        {"code": "GST", "name": "জিএসটি গুচ্ছ বিশ্ববিদ্যালয়সমূহ", "hub": "সংশ্লিষ্ট ক্যাম্পাস পয়েন্ট", "standard_fare": 550.0}
    ]
}


def query_knowledge_base(topic: str) -> str:
    """Searches the verified knowledge base for policy guidelines."""
    topic_lower = topic.lower()
    if any(k in topic_lower for k in ["female", "মহিলা", "ছাত্রী", "guardian", "অভিভাবক", "বাবা", "ভাই"]):
        return ADMISSION_TRANSPORT_KNOWLEDGE["passenger_eligibility"]["female_coach_rules"]
    elif any(k in topic_lower for k in ["cancel", "বাতিল", "refund", "ফেরত", "টাকা ফেরত"]):
        c = ADMISSION_TRANSPORT_KNOWLEDGE["cancellation_and_refund"]
        return f"টিকিট বাতিল নীতিমালা: {c['deadline_hours']} আবেদন করতে হবে। {c['refund_percentage']} পাওয়া যাবে। {c['same_day_cancellation']}"
    elif any(k in topic_lower for k in ["hold", "টাইমার", "লক", "lock"]):
        b = ADMISSION_TRANSPORT_KNOWLEDGE["booking_and_seat_holds"]
        return f"সিট হোল্ড সময়: অনলাইনে {b['online_public_hold_time']} এবং কাউন্টারে {b['counter_staff_hold_time']}।"
    elif any(k in topic_lower for k in ["bag", "লাগেজ", "ব্যাগ", "luggage"]):
        return ADMISSION_TRANSPORT_KNOWLEDGE["baggage_and_essentials"]["allowed_luggage"]
    else:
        return (
            "ATOMS বাস সার্ভিস সংক্রান্ত যেকোনো অনুসন্ধানে আমাদের ২৪/৭ হেল্পলাইনে (০১৭১২৩৪৫৬৭৮) "
            "যোগাযোগ করতে পারেন অথবা নিকটস্থ কাউন্টারে ভিজিট করুন।"
        )

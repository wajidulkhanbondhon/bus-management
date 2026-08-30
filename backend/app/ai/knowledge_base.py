"""
Domain Knowledge Base for Rajshahi-Origin Admission Student Bus Management System.
Contains verified organization policies, exam routines, guardian rules, zero-pickup express transit guidelines,
and campus-specific arrival buffer calculation protocols.
"""

from typing import Dict, Any, List, Optional

ADMISSION_TRANSPORT_KNOWLEDGE: Dict[str, Any] = {
    "service_nature": {
        "title": "রাজশাহী ভর্তি স্পেশাল এক্সপ্রেস বাস সার্ভিস (Point-to-Point Admission Express)",
        "origin_hub": "রাজশাহী (Rajshahi)",
        "service_type": "সরাসরি পয়েন্ট-টু-পয়েন্ট ভর্তি এক্সপ্রেস (Non-Stop / Point-to-Point Express)",
        "pickup_policy": (
            "এটি কোনো সাধারণ বা লোকাল বাস সার্ভিস নয়। সকল বাস শুধুমাত্র রাজশাহী নির্ধারিত কেন্দ্রীয় পয়েন্ট "
            "(তালাইমারী, ভদ্রা, রাজশাহী রেলগেট, শিরোইল সেন্ট্রাল কাউন্টার) থেকে ছেড়ে যাবে। মাঝপথে হাইওয়েতে কোনো লোকাল "
            "বা অতিরিক্ত প্যাসেঞ্জার পিকআপ পয়েন্ট নেই (সাভার, নবীনগর বা চন্দ্রা থেকে কোনো যাত্রী তোলা সম্পূর্ণ নিষিদ্ধ)। "
            "বাস সরাসরি নন-স্টপ গিয়ে গন্তব্য বিশ্ববিদ্যালয় ক্যাম্পাসের নির্ধারিত প্রধান গেটে শিক্ষার্থীদের নামিয়ে দেবে।"
        ),
        "rajshahi_boarding_points": [
            {"point": "তালাইমারী প্রধান কাউন্টার", "landmark": "শহীদ মিনার মোড়, রাজশাহী", "time_slot": "রাত ১০:০০"},
            {"point": "ভদ্রা বাস টার্মিনাল কাউন্টার", "landmark": "ভদ্রা ওভারব্রিজ সংলগ্ন", "time_slot": "রাত ১০:২০"},
            {"point": "রাজশাহী রেলগেট স্পেশাল বুথ", "landmark": "রেলওয়ে স্টেশন রোড", "time_slot": "রাত ১০:৪০"},
            {"point": "শিরোইল সেন্ট্রাল কাউন্টার", "landmark": "কেন্দ্রীয় বাস টার্মিনাল", "time_slot": "রাত ১১:০০"}
        ]
    },
    "passenger_eligibility": {
        "female_coach_rules": (
            "ছাত্রী স্পেশাল বাসে শুধুমাত্র নারী পরীক্ষার্থী এবং তাদের অনুমোদিত নিকটাত্মীয় "
            "(বাবা, মা, আপন ভাই, আপন বোন, বা স্বামী) আসন নিতে পারেন। কোনো দূরবর্তী পুরুষ আত্মীয় "
            "বা অপরিচিত পুরুষ যাত্রী ছাত্রী কোচে কোনো অবস্থাতেই সিট বুকিং বা ভ্রমণ করতে পারবেন না।"
        ),
        "guardian_policy": (
            "পরীক্ষার্থীর সাথে সর্বোচ্চ ২ জন অভিভাবক ভ্রমণ করতে পারবেন। অনুমোদিত অভিভাবক সম্পর্ক: "
            "বাবা (Father), মা (Mother), আপন ভাই (Brother), আপন বোন (Sister), এবং স্বামী (Spouse)। "
            "অভিভাবকের বৈধ এনআইডি বা পরিচয়পত্র এবং পরীক্ষার্থীর সাথে সম্পর্কের প্রমাণপত্র প্রদর্শন আবশ্যক।"
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
        "allowed_luggage": "সর্বোচ্চ ১৫ কেজি লাগেজ এবং একটি ছোট হ্যান্ডব্যাগ বিনামূল্যে বহন করা যাবে। অতিরিক্ত ভারি কার্গো নিষিদ্ধ।",
        "admit_card_mandatory": "বাসে ওঠার সময় সংশ্লিষ্ট বিশ্ববিদ্যালয়ের মূল প্রবেশপত্র (Admit Card) ও ফটো আইডি কার্ড প্রদর্শন বাধ্যতামূলক।",
        "study_friendly_cabin": "বাসে পড়ার পরিবেশ রক্ষার্থে রাত ১১:৩০ টার পর মৃদু রিডিং লাইট এবং শান্ত পরিবেশ বজায় রাখা হয়।"
    },
    "buffer_protocol": {
        "standard_buffer_hours": 3.5,
        "description": (
            "পরীক্ষা শুরুর অন্তত ৩ থেকে ৪ ঘণ্টা পূর্বে পরীক্ষার্থীকে বিশ্ববিদ্যালয়ের প্রধান ফটকে পৌঁছে দেওয়া হয়। "
            "এর ফলে শিক্ষার্থী ফ্রেশ হওয়া, নাশতা করা, সিট প্ল্যান ও কেন্দ্র পরিদর্শন এবং মানসিক স্থিরতা নিশ্চিত করতে পারে।"
        ),
        "traffic_contingency": "বঙ্গবন্ধু যমুনা সেতু ও হাইওয়ে টোল প্লাজার সম্ভাব্য জটের জন্য অতিরিক্ত ১ ঘণ্টা ট্রাফিক বাফার অন্তর্ভুক্ত থাকে।"
    },
    "universities_covered": [
        {
            "code": "DU",
            "name": "ঢাকা বিশ্ববিদ্যালয় (DU)",
            "units": ["A ইউনিট (বিজ্ঞান)", "B ইউনিট (কলা ও সামাজিক বিজ্ঞান)", "C ইউনিট (ব্যবসায় শিক্ষা)"],
            "exam_centers": "কার্জন হল, টিএসসি, মল চত্বর, কলা ভবন, বিজনেস ফ্যাকাল্টি",
            "dropping_hub": "কার্জন হল ও নীলক্ষেত টিএসসি গেট",
            "travel_duration_hours": "৫.৫ - ৬.৫ ঘণ্টা (বঙ্গবন্ধু সেতু হয়ে)",
            "highway_distance_km": 248.0,
            "standard_fare": 650.0,
            "recommended_buffer": "পরীক্ষা শুরুর অন্তত ৩.৫ - ৪ ঘণ্টা পূর্বে সরাসরি ক্যাম্পাসে নামানো হয়।"
        },
        {
            "code": "JU",
            "name": "জাহাঙ্গীরনগর বিশ্ববিদ্যালয় (JU)",
            "units": ["A ইউনিট (গাণিতিক ও পদার্থবিজ্ঞান)", "B ইউনিট (সমাজবিজ্ঞান)", "C ইউনিট (কলা ও মানবিক)", "D ইউনিট (জীববিজ্ঞান)"],
            "exam_centers": "সমাজবিজ্ঞান অনুষদ, গাণিতিক ও পদার্থবিজ্ঞান অনুষদ, জীববিজ্ঞান অনুষদ",
            "dropping_hub": "ডেইরি গেট / প্রান্তিক গেট",
            "travel_duration_hours": "৫.০ - ৫.৫ ঘণ্টা",
            "highway_distance_km": 225.0,
            "standard_fare": 600.0,
            "recommended_buffer": "পরীক্ষা শুরুর অন্তত ৩.৫ ঘণ্টা পূর্বে ডেইরি গেটে পৌঁছানো হয়।"
        },
        {
            "code": "CU",
            "name": "চট্টগ্রাম বিশ্ববিদ্যালয় (CU)",
            "units": ["A ইউনিট (বিজ্ঞান)", "B ইউনিট (কলা)", "C ইউনিট (ব্যবসায়)", "D ইউনিট (সমাজবিজ্ঞান)"],
            "exam_centers": "১ নং গেট, জিরো পয়েন্ট, সমাজবিজ্ঞান অডিটোরিয়াম, শহীদ মিনার প্রাঙ্গণ",
            "dropping_hub": "১ নং গেট / জিরো পয়েন্ট ক্যাম্পাস শাটল স্টেশন",
            "travel_duration_hours": "১০.৫ - ১২.০ ঘণ্টা",
            "highway_distance_km": 500.0,
            "standard_fare": 1100.0,
            "recommended_buffer": "সরাসরি রাতের বাসে রওনা হয়ে পরদিন ভোরে পরীক্ষা শুরুর ৪ ঘণ্টা পূর্বে পৌঁছানো হয়।"
        },
        {
            "code": "GST",
            "name": "জিএসটি গুচ্ছ বিশ্ববিদ্যালয়সমূহ (GST Cluster)",
            "units": ["A ইউনিট (বিজ্ঞান)", "B ইউনিট (মানবিক)", "C ইউনিট (বাণিজ্য)"],
            "exam_centers": "সংশ্লিষ্ট গুচ্ছভুক্ত বিশ্ববিদ্যালয় কেন্দ্রসমূহ (ইবি, শাবিপ্রবি, যবিপ্রবি, বাকৃবি, বেরোবি ইত্যাদি)",
            "dropping_hub": "সংশ্লিষ্ট বিশ্ববিদ্যালয় প্রধান ফটক",
            "travel_duration_hours": "গন্তব্য ভেদে ৫.০ - ১০.০ ঘণ্টা",
            "highway_distance_km": 300.0,
            "standard_fare": 750.0,
            "recommended_buffer": "পরীক্ষা শুরুর অন্তত ৪ ঘণ্টা পূর্বে ক্যাম্পাসে ড্রপিং।"
        },
        {
            "code": "SUST",
            "name": "শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (SUST)",
            "units": ["A ইউনিট (বিজ্ঞান)", "B ইউনিট (মানবিক ও বাণিজ্য)"],
            "exam_centers": "একাডেমিক ভবন এ, বি, সি, ডি, এক কিলো রোড ও গোলচত্বর",
            "dropping_hub": "শাবিপ্রবি প্রধান ফটক / কুমারগাঁও বাসস্ট্যান্ড",
            "travel_duration_hours": "৯.৫ - ১০.৫ ঘণ্টা",
            "highway_distance_km": 435.0,
            "standard_fare": 950.0,
            "recommended_buffer": "পরীক্ষা শুরুর অন্তত ৪ ঘণ্টা পূর্বে নিরাপদ ড্রপিং নিশ্চিত।"
        },
        {
            "code": "MEDICAL",
            "name": "মেডিকেল ভর্তি পরীক্ষা কেন্দ্রসমূহ (Medical Centers)",
            "units": ["এমবিবিএস ও বিডিএস ভর্তি পরীক্ষা (MBBS / BDS)"],
            "exam_centers": "ঢাকা মেডিকেল কলেজ, স্যার সলিমুল্লাহ মেডিকেল, সোহরাওয়ার্দী মেডিকেল, মুগদা মেডিকেল",
            "dropping_hub": "ঢাকা মেডিকেল ও সলিমুল্লাহ মেডিকেল কলেজ সংলগ্ন গেট",
            "travel_duration_hours": "৫.৫ - ৬.৫ ঘণ্টা",
            "highway_distance_km": 250.0,
            "standard_fare": 650.0,
            "recommended_buffer": "সকাল ১০:০০ টায় পরীক্ষা হলে ভোর ৬:০০ টায় (৪ ঘণ্টা পূর্বে) ড্রপিং নিশ্চিত করা হয়।"
        },
        {
            "code": "KU",
            "name": "খুলনা বিশ্ববিদ্যালয় (KU)",
            "units": ["A ইউনিট (বিজ্ঞান ও প্রযুক্তি)", "B ইউনিট (কলা ও সামাজিক বিজ্ঞান)", "C ইউনিট (ব্যবসায়)"],
            "exam_centers": "কবি জীবনানন্দ দাস একাডেমিক ভবন, কবি কাজী নজরুল ইসলাম ভবন",
            "dropping_hub": "খুলনা বিশ্ববিদ্যালয় মেইন গেট (গল্লামারী)",
            "travel_duration_hours": "৫.৫ - ৬.০ ঘণ্টা (কুষ্টিয়া-যশোর রুট হয়ে)",
            "highway_distance_km": 240.0,
            "standard_fare": 650.0,
            "recommended_buffer": "পরীক্ষা শুরুর ৩.৫ ঘণ্টা পূর্বে ক্যাম্পাসে ড্রপিং।"
        }
    ]
}


from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeRule

def query_knowledge_base(topic: str, db: Optional[Session] = None, user_role: str = "VIEWER") -> str:
    """Searches the verified knowledge base for Rajshahi-Origin Admission Bus policy guidelines."""
    topic_lower = topic.lower()
    
    # 0. Check Dynamic Learned Rules first (RBAC enforced)
    if db:
        keywords = topic_lower.split()
        for kw in keywords:
            if len(kw) > 3: # Search with meaningful words
                # Using like for basic keyword matching in MVP (compatible with SQLite)
                rules = db.query(KnowledgeRule).filter(KnowledgeRule.topic_keywords.like(f"%{kw}%")).all()
                for rule in rules:
                    if "ALL" in rule.allowed_roles or user_role in rule.allowed_roles or user_role == "SUPER_ADMIN":
                        return f"🧠 **[AI Learned Rule]:**\n{rule.content}"
    
    # 1. Pickup, Boarding, and Highway Intermediate Stops Policy
    if any(k in topic_lower for k in ["pickup", "পিকআপ", "স্টপ", "stop", "লোকাল", "মাঝপথে", "কোথায় উঠবে", "বোর্ডিং", "তালাইমারী", "ভদ্রা", "রেলগেট", "শিরোইল", "সাভার", "চন্দ্রা", "নবীনগর"]):
        p = ADMISSION_TRANSPORT_KNOWLEDGE["service_nature"]
        points_str = "\n".join([f"  • **{pt['point']}** ({pt['landmark']}) — ছাড়ার সময়: {pt['time_slot']}" for pt in p["rajshahi_boarding_points"]])
        return (
            f"🚌 **রাজশাহী ভর্তি স্পেশাল এক্সপ্রেস বাস সার্ভিস পলিসি:**\n"
            f"{p['pickup_policy']}\n\n"
            f"📍 **রাজশাহীর অনুমোদিত ৪টি সেন্ট্রাল বোর্ডিং হাব:**\n{points_str}\n\n"
            f"🚫 **সতর্কবার্তা:** হাইওয়েতে সাভার, নবীনগর বা চন্দ্রা থেকে কোনো যাত্রী বা অভিভাবক তোলা হবে না।"
        )
        
    # 2. Female Coach & Guardian Eligibility Policy
    elif any(k in topic_lower for k in ["female", "মহিলা", "ছাত্রী", "guardian", "অভিভাবক", "বাবা", "ভাই", "মা", "বোন", "স্বামী", "spouse"]):
        p_rule = ADMISSION_TRANSPORT_KNOWLEDGE["passenger_eligibility"]["female_coach_rules"]
        g_rule = ADMISSION_TRANSPORT_KNOWLEDGE["passenger_eligibility"]["guardian_policy"]
        return (
            f"👩 **ছাত্রী স্পেশাল কোচ নীতিমালা:**\n{p_rule}\n\n"
            f"👥 **অভিভাবক সংক্রান্ত নিয়মাবলী:**\n{g_rule}\n\n"
            f"✅ **অনুমোদিত সম্পর্কসমূহ:** বাবা, মা, আপন ভাই, আপন বোন, স্বামী (সর্বোচ্চ ২ জন)।"
        )
        
    # 3. Cancellation & Refund Policy
    elif any(k in topic_lower for k in ["cancel", "বাতিল", "refund", "ফেরত", "টাকা ফেরত"]):
        c = ADMISSION_TRANSPORT_KNOWLEDGE["cancellation_and_refund"]
        return (
            f"🎫 **টিকিট বাতিল ও রিফান্ড নীতিমালা:**\n"
            f"- আবেদন সময়সীমা: যাত্রা শুরুর **{c['deadline_hours']}** এর মধ্যে।\n"
            f"- রিফান্ডের হার: **{c['refund_percentage']}**।\n"
            f"- জরুরি নোটিশ: {c['same_day_cancellation']}"
        )
        
    # 4. Seat Hold Policy
    elif any(k in topic_lower for k in ["hold", "টাইমার", "লক", "lock"]):
        b = ADMISSION_TRANSPORT_KNOWLEDGE["booking_and_seat_holds"]
        return (
            f"⏳ **সিট হোল্ড সময়সীমা:**\n"
            f"- অনলাইনে সাধারণ শিক্ষার্থীদের জন্য: **{b['online_public_hold_time']}**।\n"
            f"- কাউন্টার স্টাফদের বুকিংয়ের জন্য: **{b['counter_staff_hold_time']}**।\n"
            f"- সিট পরিবর্তন: {b['seat_change_policy']}"
        )
        
    # 5. Baggage & Admit Card Essentials
    elif any(k in topic_lower for k in ["bag", "লাগেজ", "ব্যাগ", "luggage", "admit", "প্রবেশপত্র", "আইডি", "id"]):
        b = ADMISSION_TRANSPORT_KNOWLEDGE["baggage_and_essentials"]
        return (
            f"🎒 **লাগেজ ও প্রয়োজনীয় ডকুমেন্টস নির্দেশিকা:**\n"
            f"- **লাগেজ সীমা:** {b['allowed_luggage']}\n"
            f"- **প্রবেশপত্র:** {b['admit_card_mandatory']}\n"
            f"- **পড়ার পরিবেশ:** {b['study_friendly_cabin']}"
        )
        
    # 6. Buffer and Safe Arrival Policy
    elif any(k in topic_lower for k in ["buffer", "বাফার", "কখন পৌঁছাবে", "সময়", "ট্রাফিক", "কখন নামাবে", "পৌঁছাতে", "দেরি"]):
        buf = ADMISSION_TRANSPORT_KNOWLEDGE["buffer_protocol"]
        return (
            f"⏱️ **অ্যাডমিশন বাফার গ্যারান্টি পলিসি:**\n"
            f"{buf['description']}\n\n"
            f"🚦 **হাইওয়ে ট্রাফিক বিবেচনা:** {buf['traffic_contingency']}\n"
            f"🎯 আমাদের উদ্দেশ্য: শিক্ষার্থীরা যেন কোনো ধরনের মানসিক বা শারীরিক ক্লান্তি ছাড়াই ফুরফুরে মেজাজে পরীক্ষা হলে ঢুকতে পারে।"
        )
        
    # 7. University Specific Transit Knowledge
    elif any(k in topic_lower for k in ["du", "ঢাকা বিশ্ববিদ্যালয়", "ঢাবি", "ju", "জাবি", "জাহাঙ্গীরনগর", "cu", "চবি", "চট্টগ্রাম", "sust", "শাবিপ্রবি", "gst", "গুচ্ছ", "medical", "মেডিকেল", "ku", "খুবি"]):
        for u in ADMISSION_TRANSPORT_KNOWLEDGE["universities_covered"]:
            if u["code"].lower() in topic_lower or any(part in topic_lower for part in u["name"].lower().split()):
                units_str = ", ".join(u.get("units", []))
                return (
                    f"🏫 **{u['name']} সরাসরি ভর্তি বাস তথ্য:**\n"
                    f"- **সমর্থিত ইউনিট:** {units_str}\n"
                    f"- **ক্যাম্পাস ড্রপিং গেট:** {u['dropping_hub']}\n"
                    f"- **পরীক্ষা কেন্দ্রসমূহ:** {u['exam_centers']}\n"
                    f"- **রাজশাহী থেকে আনুমানিক ভ্রমণ সময়:** {u['travel_duration_hours']}\n"
                    f"- **নির্ধারিত ভাড়া:** ৳{u['standard_fare']:,.0f}\n"
                    f"- **বাফার গ্যারান্টি:** {u['recommended_buffer']}"
                )
                
    return (
        "🎓 **রাজশাহী ভর্তি স্পেশাল এক্সপ্রেস বাস সার্ভিস হেল্পলাইন:**\n"
        "আমাদের সকল বাস রাজশাহী (তালাইমারী, ভদ্রা, রেলগেট, শিরোইল) থেকে সরাসরি বিভিন্ন বিশ্ববিদ্যালয় ক্যাম্পাসের প্রধান ফটকে নিয়ে যায়। "
        "মাঝপথে কোনো লোকাল বা হাইওয়ে পিকআপ নেই। যেকোনো তথ্য বা জরুরি প্রয়োজনে যোগাযোগ করুন: 📞 ০১৭১২-৩৪৫৬৭৮।"
    )

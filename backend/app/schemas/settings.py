from typing import Optional, Dict, Any
from pydantic import BaseModel


class SystemSettingItem(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class SystemSettingUpdate(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class LandingControlSettings(BaseModel):
    organization_name: Optional[str] = "ATOMS Transit"
    tagline: Optional[str] = "বাংলাদেশ বিশ্ববিদ্যালয় ভর্তি স্পেশাল এক্সপ্রেস বাস"
    support_phone: Optional[str] = "01711000001"
    whatsapp_number: Optional[str] = "8801711000001"
    announcement_banner: Optional[str] = None
    is_announcement_active: bool = False
    notice_text: Optional[str] = None
    social_facebook: Optional[str] = "https://facebook.com"


class OrganizationSaaSSettings(BaseModel):
    name: str = "ATOMS Transit Management"
    legal_name: Optional[str] = "ATOMS Express & Logistics Ltd."
    tagline: Optional[str] = "বাংলাদেশ বিশ্ববিদ্যালয় ভর্তি স্পেশাল এক্সপ্রেস পরিবহন"
    logo_url: Optional[str] = ""
    favicon_url: Optional[str] = ""
    phone: Optional[str] = "01711000001"
    alt_phone: Optional[str] = ""
    emergency_contact: Optional[str] = "01711000002"
    email: Optional[str] = "support@atomstransit.com"
    address: Optional[str] = "কেন্দ্রীয় বাস টার্মিনাল, ঢাকা"
    website: Optional[str] = "https://atoms-transit.com"
    ticket_footer_note: Optional[str] = "বাস ছাড়ার ৩০ মিনিট পূর্বে উপস্থিত থাকুন। ডিজিটাল টিকিট প্রদর্শন আবশ্যক।"


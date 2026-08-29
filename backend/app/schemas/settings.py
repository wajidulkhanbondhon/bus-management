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

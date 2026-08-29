from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class UniversityBase(BaseModel):
    name: str = Field(..., example="রাজশাহী বিশ্ববিদ্যালয়")
    name_en: str = Field(..., example="University of Rajshahi")
    apply_status: str = Field("OPEN", example="OPEN")  # OPEN, UPCOMING, CLOSED
    deadline: Optional[str] = Field(None, example="2026-09-15")
    exam_date: Optional[str] = Field(None, example="2026-10-05")
    units: List[str] = Field(default_factory=list, example=["A ইউনিট", "B ইউনিট", "C ইউনিট"])
    fees: Optional[str] = Field(None, example="৳৫০০ - ৳৮০০")
    requirements: List[str] = Field(default_factory=list)
    how_to_apply: Optional[str] = None
    location: str = Field(..., example="রাজশাহী")
    circular_url: Optional[str] = None


class UniversityCreate(UniversityBase):
    tenant_id: Optional[str] = None


class UniversityUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    apply_status: Optional[str] = None
    deadline: Optional[str] = None
    exam_date: Optional[str] = None
    units: Optional[List[str]] = None
    fees: Optional[str] = None
    requirements: Optional[List[str]] = None
    how_to_apply: Optional[str] = None
    location: Optional[str] = None
    circular_url: Optional[str] = None


class UniversityOut(UniversityBase):
    id: str
    tenant_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

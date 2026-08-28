from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class MethodActualSchema(BaseModel):
    method: str
    actual_amount: float


class SubmitDayClosingRequest(BaseModel):
    closing_date: datetime
    actual_total_cash: float
    method_actuals: List[MethodActualSchema]
    notes: Optional[str] = None


class DayClosingOut(BaseModel):
    id: str
    closing_date: datetime
    expected_gross_sales: float
    expected_net_sales: float
    expected_collected: float
    expected_due: float
    actual_total_cash: float
    cash_difference: float
    reconcile_status: str
    is_reopened: bool

    class Config:
        from_attributes = True

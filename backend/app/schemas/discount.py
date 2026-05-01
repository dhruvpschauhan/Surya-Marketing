from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from datetime import date, datetime


class DiscountBase(BaseModel):
    company: str
    category: str
    material_type: str
    discount_percent: Decimal


class DiscountResponse(DiscountBase):
    id: int
    effective_from: date
    is_active: bool
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DiscountMatrixCell(BaseModel):
    """Single cell in the 24-value discount matrix."""
    company: str
    category: str
    material_type: str
    discount_percent: Decimal
    updated_at: Optional[datetime] = None


class DiscountMatrix(BaseModel):
    """Full 24-value discount matrix."""
    cells: list[DiscountMatrixCell]


class DiscountUpdateRequest(BaseModel):
    """Request to update one or more discount cells."""
    updates: list[DiscountBase]


class DiscountUploadPreview(BaseModel):
    """Preview data from parsing discount_data Excel."""
    cells: list[DiscountBase]
    changes: list[dict]  # [{company, category, material_type, old_value, new_value}]
    errors: list[str]

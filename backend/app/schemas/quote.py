from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from datetime import datetime


class QuoteItem(BaseModel):
    """Single item in a quote request."""
    product_code: str
    quantity: Decimal


class QuoteRequest(BaseModel):
    """Full quote generation request."""
    client_name: str = ""
    items: list[QuoteItem]


class QuoteLineItem(BaseModel):
    """Computed line item in a quote result."""
    sr: int
    product_code: str
    description: str
    category: str
    material_type: str
    quantity: Decimal
    mrp_apollo: Optional[Decimal] = None
    mrp_supreme: Optional[Decimal] = None
    mrp_astral: Optional[Decimal] = None
    mrp_ashirvad: Optional[Decimal] = None
    discount_apollo: Optional[Decimal] = None
    discount_supreme: Optional[Decimal] = None
    discount_astral: Optional[Decimal] = None
    discount_ashirvad: Optional[Decimal] = None
    unit_price_apollo: Optional[Decimal] = None
    unit_price_supreme: Optional[Decimal] = None
    unit_price_astral: Optional[Decimal] = None
    unit_price_ashirvad: Optional[Decimal] = None
    line_total_apollo: Optional[Decimal] = None
    line_total_supreme: Optional[Decimal] = None
    line_total_astral: Optional[Decimal] = None
    line_total_ashirvad: Optional[Decimal] = None
    error: Optional[str] = None


class CompanyTotal(BaseModel):
    """Per-company grand total."""
    company: str
    total: Decimal
    is_best_price: bool = False


class DiscountUsed(BaseModel):
    """Discount percentage used in this quote."""
    company: str
    category: str
    material_type: str
    discount_percent: Decimal


class QuoteResponse(BaseModel):
    """Full quote generation response."""
    quote_id: str
    client_name: str
    created_at: datetime
    line_items: list[QuoteLineItem]
    company_totals: list[CompanyTotal]
    discounts_used: list[DiscountUsed]


class QuoteHistoryItem(BaseModel):
    """Summary item for quote history list."""
    id: str
    created_at: datetime
    client_name: str
    item_count: int
    total_apollo: Optional[Decimal] = None
    total_supreme: Optional[Decimal] = None
    total_astral: Optional[Decimal] = None
    total_ashirvad: Optional[Decimal] = None


class QuoteHistoryResponse(BaseModel):
    """Paginated quote history."""
    quotes: list[QuoteHistoryItem]
    total: int
    page: int
    page_size: int

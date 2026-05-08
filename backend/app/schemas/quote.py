from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from datetime import datetime


class DiscountOverrides(BaseModel):
    """Per-company discount overrides. null = use master rate."""
    Apollo: Optional[Decimal] = None
    Supreme: Optional[Decimal] = None
    Astral: Optional[Decimal] = None
    Ashirvad: Optional[Decimal] = None


class QuoteItem(BaseModel):
    """Single item in a quote request."""
    product_code: str
    quantity: Decimal
    discount_overrides: Optional[DiscountOverrides] = None


class QuoteRequest(BaseModel):
    """Full quote generation request."""
    client_name: str = ""
    items: list[QuoteItem]


class QuoteLineItem(BaseModel):
    """Computed line item in a quote result. No discount info exposed."""
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
    unit_price_apollo: Optional[Decimal] = None
    unit_price_supreme: Optional[Decimal] = None
    unit_price_astral: Optional[Decimal] = None
    unit_price_ashirvad: Optional[Decimal] = None
    line_total_apollo: Optional[Decimal] = None
    line_total_supreme: Optional[Decimal] = None
    line_total_astral: Optional[Decimal] = None
    line_total_ashirvad: Optional[Decimal] = None
    has_override: bool = False
    error: Optional[str] = None


class CompanyTotal(BaseModel):
    """Per-company grand total."""
    company: str
    total: Decimal
    cgst_rate: Decimal = Decimal("0")
    sgst_rate: Decimal = Decimal("0")
    cgst_amount: Decimal = Decimal("0")
    sgst_amount: Decimal = Decimal("0")
    total_with_gst: Decimal = Decimal("0")
    is_best_price: bool = False


class QuoteResponse(BaseModel):
    """Full quote generation response. No discount details."""
    quote_id: str
    client_name: str
    created_at: datetime
    line_items: list[QuoteLineItem]
    company_totals: list[CompanyTotal]


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

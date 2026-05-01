from pydantic import BaseModel
from decimal import Decimal
from typing import Optional


class ProductBase(BaseModel):
    product_code: str
    description: str
    category: str
    material_type: str
    mrp_apollo: Optional[Decimal] = None
    mrp_supreme: Optional[Decimal] = None
    mrp_astral: Optional[Decimal] = None
    mrp_ashirvad: Optional[Decimal] = None


class ProductResponse(ProductBase):
    class Config:
        from_attributes = True


class ProductSearchResult(BaseModel):
    product_code: str
    description: str
    category: str
    material_type: str
    mrp_apollo: Optional[Decimal] = None
    mrp_supreme: Optional[Decimal] = None
    mrp_astral: Optional[Decimal] = None
    mrp_ashirvad: Optional[Decimal] = None

    class Config:
        from_attributes = True


class ProductUploadPreview(BaseModel):
    """Preview data from parsing product_code_info Excel."""
    products: list[ProductBase]
    total_rows: int
    errors: list[str]


class ProductSyncResult(BaseModel):
    """Result of syncing products to database."""
    new_count: int
    updated_count: int
    unchanged_count: int
    error_count: int
    errors: list[str]

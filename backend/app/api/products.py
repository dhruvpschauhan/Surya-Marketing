"""Product search, upload, and sync API endpoints."""
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import verify_admin_password
from app.core.config import get_settings
from app.models.product import Product
from app.schemas.product import (
    ProductSearchResult, ProductUploadPreview, ProductSyncResult, ProductBase,
)
from app.services.excel_parser import parse_product_code_info

router = APIRouter(prefix="/api", tags=["Products"])


@router.get("/products/search", response_model=list[ProductSearchResult])
async def search_products(q: str = "", db: AsyncSession = Depends(get_db)):
    """Search products by code or description. Returns top 8 matches."""
    if not q or len(q) < 1:
        return []

    query = (
        select(Product)
        .where(
            or_(
                Product.product_code.ilike(f"%{q}%"),
                Product.description.ilike(f"%{q}%"),
            )
        )
        .limit(8)
    )
    result = await db.execute(query)
    products = result.scalars().all()
    return products


@router.get("/products", response_model=list[ProductSearchResult])
async def list_products(
    category: str = "",
    material_type: str = "",
    search: str = "",
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List products with optional filters."""
    query = select(Product)

    if category:
        query = query.where(Product.category == category)
    if material_type:
        query = query.where(Product.material_type == material_type)
    if search:
        query = query.where(
            or_(
                Product.product_code.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
            )
        )

    query = query.order_by(Product.product_code)
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/admin/products/upload", response_model=ProductUploadPreview)
async def upload_products(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_password),
):
    """Upload product_code_info Excel file and return parsed preview."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx or .xls files are accepted")

    settings = get_settings()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        preview = parse_product_code_info(file_path)
    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)

    return preview


@router.post("/admin/products/sync", response_model=ProductSyncResult)
async def sync_products(
    products: list[ProductBase],
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_password),
):
    """Sync parsed product data to database."""
    new_count = 0
    updated_count = 0
    unchanged_count = 0
    error_count = 0
    errors = []

    for prod in products:
        try:
            # Check if product exists
            result = await db.execute(
                select(Product).where(Product.product_code == prod.product_code)
            )
            existing = result.scalar_one_or_none()

            if existing:
                # Check if anything changed
                changed = False
                for field in ["description", "category", "material_type",
                             "mrp_apollo", "mrp_supreme", "mrp_astral", "mrp_ashirvad"]:
                    new_val = getattr(prod, field)
                    old_val = getattr(existing, field)
                    if str(new_val) != str(old_val):
                        setattr(existing, field, new_val)
                        changed = True

                if changed:
                    updated_count += 1
                else:
                    unchanged_count += 1
            else:
                # Insert new product
                new_product = Product(
                    product_code=prod.product_code,
                    description=prod.description,
                    category=prod.category,
                    material_type=prod.material_type,
                    mrp_apollo=prod.mrp_apollo,
                    mrp_supreme=prod.mrp_supreme,
                    mrp_astral=prod.mrp_astral,
                    mrp_ashirvad=prod.mrp_ashirvad,
                )
                db.add(new_product)
                new_count += 1

        except Exception as e:
            error_count += 1
            errors.append(f"Error processing {prod.product_code}: {str(e)}")

    await db.flush()

    return ProductSyncResult(
        new_count=new_count,
        updated_count=updated_count,
        unchanged_count=unchanged_count,
        error_count=error_count,
        errors=errors,
    )

"""Discount matrix CRUD, upload, and sync API endpoints."""
import os
import shutil
from decimal import Decimal
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import verify_admin_password
from app.core.config import get_settings
from app.models.discount import Discount
from app.schemas.discount import (
    DiscountMatrix, DiscountMatrixCell, DiscountUpdateRequest,
    DiscountUploadPreview, DiscountBase,
)
from app.services.excel_parser import parse_discount_data

router = APIRouter(prefix="/api/admin/discounts", tags=["Discounts"])


@router.get("", response_model=DiscountMatrix)
async def get_discounts(db: AsyncSession = Depends(get_db)):
    """Get the full 24-value active discount matrix."""
    result = await db.execute(
        select(Discount).where(Discount.is_active == True)
    )
    discounts = result.scalars().all()

    cells = [
        DiscountMatrixCell(
            company=d.company,
            category=d.category,
            material_type=d.material_type,
            discount_percent=d.discount_percent,
            updated_at=d.updated_at,
        )
        for d in discounts
    ]

    return DiscountMatrix(cells=cells)


@router.put("")
async def update_discounts(
    request: DiscountUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_password),
):
    """Update one or more discount cells. Deactivates old records, inserts new ones."""
    updated = 0
    today = date.today()

    for disc in request.updates:
        # Try to update the existing active record
        result = await db.execute(
            update(Discount)
            .where(
                Discount.company == disc.company,
                Discount.category == disc.category,
                Discount.material_type == disc.material_type,
                Discount.is_active == True,
            )
            .values(discount_percent=disc.discount_percent)
        )
        
        # If no active record exists for this combo, insert it
        if result.rowcount == 0:
            new_discount = Discount(
                company=disc.company,
                category=disc.category,
                material_type=disc.material_type,
                discount_percent=disc.discount_percent,
                effective_from=today,
                is_active=True,
            )
            db.add(new_discount)
            
        updated += 1

    await db.flush()
    return {"message": f"Updated {updated} discount(s)", "updated": updated}


@router.post("/upload", response_model=DiscountUploadPreview)
async def upload_discounts(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_password),
):
    """Upload discount_data Excel file and return parsed preview with diff."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx or .xls files are accepted")

    # Get current discounts for diff
    result = await db.execute(
        select(Discount).where(Discount.is_active == True)
    )
    current = result.scalars().all()
    current_lookup = {
        (d.company, d.category, d.material_type): Decimal(str(d.discount_percent))
        for d in current
    }

    settings = get_settings()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        preview = parse_discount_data(file_path, current_lookup)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    return preview


@router.post("/sync")
async def sync_discounts(
    cells: list[DiscountBase],
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_password),
):
    """Sync parsed discount data to database. Deactivates old, inserts new."""
    today = date.today()
    synced = 0

    for cell in cells:
        # Deactivate old
        await db.execute(
            update(Discount)
            .where(
                Discount.company == cell.company,
                Discount.category == cell.category,
                Discount.material_type == cell.material_type,
                Discount.is_active == True,
            )
            .values(is_active=False)
        )

        # Insert new
        new_discount = Discount(
            company=cell.company,
            category=cell.category,
            material_type=cell.material_type,
            discount_percent=cell.discount_percent,
            effective_from=today,
            is_active=True,
        )
        db.add(new_discount)
        synced += 1

    await db.flush()
    return {"message": f"Synced {synced} discount records", "synced": synced}

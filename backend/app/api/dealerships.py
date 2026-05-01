"""Dealerships directory API endpoints (internal contacts)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.dealership import Dealership
from app.schemas.dealership import (
    DealershipCreate, DealershipUpdate, DealershipResponse,
)

router = APIRouter(prefix="/api/settings/dealerships", tags=["Dealerships"])


@router.get("", response_model=list[DealershipResponse])
async def list_dealerships(db: AsyncSession = Depends(get_db)):
    """List all dealership contacts."""
    result = await db.execute(select(Dealership).order_by(Dealership.company_name))
    return result.scalars().all()


@router.post("", response_model=DealershipResponse)
async def create_dealership(
    data: DealershipCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a new dealership contact."""
    dealership = Dealership(**data.model_dump())
    db.add(dealership)
    await db.flush()
    return dealership


@router.put("/{dealership_id}", response_model=DealershipResponse)
async def update_dealership(
    dealership_id: int,
    data: DealershipUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a dealership contact."""
    result = await db.execute(
        select(Dealership).where(Dealership.id == dealership_id)
    )
    dealership = result.scalar_one_or_none()
    if not dealership:
        raise HTTPException(status_code=404, detail="Dealership not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(dealership, key, value)

    await db.flush()
    return dealership


@router.delete("/{dealership_id}")
async def delete_dealership(
    dealership_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a dealership contact."""
    result = await db.execute(
        select(Dealership).where(Dealership.id == dealership_id)
    )
    dealership = result.scalar_one_or_none()
    if not dealership:
        raise HTTPException(status_code=404, detail="Dealership not found")

    await db.delete(dealership)
    return {"message": "Dealership deleted"}

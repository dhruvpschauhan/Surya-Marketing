"""Dealer profile API endpoints."""
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.dealer_profile import DealerProfile
from app.schemas.dealer_profile import (
    DealerProfileResponse, DealerProfileUpdate, DealerProfileBase,
)

router = APIRouter(prefix="/api/settings/dealer-profile", tags=["Dealer Profile"])


@router.get("", response_model=DealerProfileResponse)
async def get_dealer_profile(db: AsyncSession = Depends(get_db)):
    """Get the dealer profile (single row)."""
    result = await db.execute(select(DealerProfile).limit(1))
    profile = result.scalar_one_or_none()

    if not profile:
        # Create default profile
        profile = DealerProfile(
            dealer_name="",
            gst_number="",
            mobile_number="",
            address="",
            logo_url="",
        )
        db.add(profile)
        await db.flush()

    return profile


@router.put("", response_model=DealerProfileResponse)
async def update_dealer_profile(
    data: DealerProfileUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update the dealer profile."""
    result = await db.execute(select(DealerProfile).limit(1))
    profile = result.scalar_one_or_none()

    if not profile:
        profile = DealerProfile()
        db.add(profile)
        await db.flush()

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    await db.flush()
    return profile


@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload dealer logo."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted")

    # Save to static directory
    upload_dir = os.path.join("uploads", "logos")
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"dealer_logo{os.path.splitext(file.filename)[1]}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Update profile
    logo_url = f"/uploads/logos/{filename}"
    result = await db.execute(select(DealerProfile).limit(1))
    profile = result.scalar_one_or_none()

    if profile:
        profile.logo_url = logo_url
    else:
        profile = DealerProfile(logo_url=logo_url)
        db.add(profile)

    await db.flush()
    return {"logo_url": logo_url}

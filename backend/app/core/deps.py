from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import get_settings


async def get_session(db: AsyncSession = Depends(get_db)):
    """Alias dependency for database session."""
    return db


async def verify_admin_password(
    x_admin_password: str = Header(..., alias="X-Admin-Password"),
):
    """Simple password check for admin routes."""
    settings = get_settings()
    if x_admin_password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    return True

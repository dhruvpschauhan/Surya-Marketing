"""
QuoteForge Backend — FastAPI Application Entry Point
Multi-brand quotation generation system for pipe materials dealership.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import get_settings
from app.core.database import init_db
from app.api import quote, products, discounts, dealer_profile, dealerships


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Create tables on startup
    await init_db()

    # Ensure upload directories exist
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("uploads/logos", exist_ok=True)

    yield


settings = get_settings()

app = FastAPI(
    title="QuoteForge API",
    description="Multi-brand quotation generation system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded logos
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers
app.include_router(quote.router)
app.include_router(quote.history_router)
app.include_router(products.router)
app.include_router(discounts.router)
app.include_router(dealer_profile.router)
app.include_router(dealerships.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "QuoteForge"}

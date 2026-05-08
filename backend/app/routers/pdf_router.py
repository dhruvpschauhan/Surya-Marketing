"""
PDF export router — generates Comparison + per-brand PDFs.
Registered at /api/pdf in main.py.
"""
import logging
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from io import BytesIO

from app.core.database import get_db
from app.models.quote_session import QuoteSession
from app.models.dealer_profile import DealerProfile
from app.models.discount import Discount
from app.pdf.renderer import render_comparison_pdf, render_brand_pdf

logger = logging.getLogger(__name__)

router = APIRouter(tags=["PDF Export"])

VALID_COMPANIES = {"Apollo", "Supreme", "Astral", "Ashirvad"}


class PDFRequest(BaseModel):
    quote_id: str


async def _build_quote_data(quote_id: str, db: AsyncSession) -> dict:
    """
    Fetch quote, dealer profile, and discounts from DB.
    Assemble the canonical quote_data dict expected by the renderer.
    """
    # Fetch quote
    result = await db.execute(
        select(QuoteSession).where(QuoteSession.id == quote_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Quote not found")

    # Fetch dealer profile
    dealer_result = await db.execute(select(DealerProfile).limit(1))
    dealer = dealer_result.scalar_one_or_none()

    # Fetch all active discounts
    disc_result = await db.execute(
        select(Discount).where(Discount.is_active == True)
    )
    discounts = disc_result.scalars().all()

    # Build discounts map: { company: [ { category, material_type, discount_percent, effective_from } ] }
    discounts_map = {}
    for d in discounts:
        if d.company not in discounts_map:
            discounts_map[d.company] = []
        discounts_map[d.company].append({
            "category": d.category,
            "material_type": d.material_type,
            "discount_percent": str(d.discount_percent),
            "effective_from": d.effective_from.isoformat() if d.effective_from else "",
        })

    # Parse stored results
    stored = session.results or {}
    line_items_raw = stored.get("line_items", [])
    company_totals_raw = stored.get("company_totals", [])

    # Build items list
    items = []
    for li in line_items_raw:
        if li.get("error"):
            continue
        item = {
            "sr": li.get("sr"),
            "product_code": li.get("product_code", ""),
            "description": li.get("description", ""),
            "category": li.get("category", ""),
            "material_type": li.get("material_type", ""),
            "quantity": li.get("quantity", ""),
            "mrp": {},
            "unit_price": {},
            "line_totals": {},
        }
        for company in VALID_COMPANIES:
            c_lower = company.lower()
            item["mrp"][company] = li.get(f"mrp_{c_lower}")
            item["unit_price"][company] = li.get(f"unit_price_{c_lower}")
            item["line_totals"][company] = li.get(f"line_total_{c_lower}")
        items.append(item)

    # Build grand totals and GST info
    grand_totals = {}
    best_company = None
    gst_info = {}

    for ct in company_totals_raw:
        company = ct.get("company")
        grand_totals[company] = ct.get("total", "0")
        if ct.get("is_best_price"):
            best_company = company
        gst_info[company] = {
            "cgst_rate": ct.get("cgst_rate", "0"),
            "sgst_rate": ct.get("sgst_rate", "0"),
            "cgst_amount": ct.get("cgst_amount", "0"),
            "sgst_amount": ct.get("sgst_amount", "0"),
            "total_with_gst": ct.get("total_with_gst", "0"),
        }

    # Format date
    created_at = ""
    if session.created_at:
        try:
            created_at = session.created_at.strftime("%d %b %Y")
        except Exception:
            created_at = str(session.created_at)[:10]

    return {
        "id": session.id,
        "created_at": created_at,
        "client_name": session.client_name or "N/A",
        "dealer": {
            "name": dealer.dealer_name if dealer else "QuoteForge",
            "gst": dealer.gst_number if dealer else "",
            "mobile": dealer.mobile_number if dealer else "",
        },
        "items": items,
        "grand_totals": grand_totals,
        "best_company": best_company or "",
        "gst_info": gst_info,
        "discounts_map": discounts_map,
    }


@router.post("/comparison")
async def export_comparison_pdf(body: PDFRequest, db: AsyncSession = Depends(get_db)):
    """Generate the multi-brand comparison PDF."""
    quote_data = await _build_quote_data(body.quote_id, db)

    try:
        pdf_bytes = render_comparison_pdf(quote_data)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="WeasyPrint is not installed. PDF export is unavailable.",
        )
    except Exception as e:
        logger.exception("PDF generation failed for comparison")
        raise HTTPException(status_code=500, detail="PDF generation failed")

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="Comparison.pdf"'},
    )


@router.post("/brand/{company}")
async def export_brand_pdf(company: str, body: PDFRequest, db: AsyncSession = Depends(get_db)):
    """Generate a single-company detailed quote PDF."""
    if company not in VALID_COMPANIES:
        raise HTTPException(status_code=422, detail="Invalid company name")

    quote_data = await _build_quote_data(body.quote_id, db)

    try:
        pdf_bytes = render_brand_pdf(quote_data, company)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="WeasyPrint is not installed. PDF export is unavailable.",
        )
    except Exception as e:
        logger.exception(f"PDF generation failed for {company}")
        raise HTTPException(status_code=500, detail="PDF generation failed")

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{company}.pdf"'},
    )

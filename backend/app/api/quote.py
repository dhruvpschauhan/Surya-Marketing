"""Quote generation, history, and export API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.quote_session import QuoteSession
from app.models.dealer_profile import DealerProfile
from app.schemas.quote import (
    QuoteRequest, QuoteResponse, QuoteHistoryItem, QuoteHistoryResponse,
)
from app.services.quote_service import generate_quote
from app.services.pdf_generator import generate_quote_pdf
from app.services.excel_generator import generate_quote_excel

router = APIRouter(prefix="/api/quote", tags=["Quote"])
history_router = APIRouter(prefix="/api/quotes", tags=["Quote History"])


@router.post("/generate", response_model=QuoteResponse)
async def create_quote(request: QuoteRequest, db: AsyncSession = Depends(get_db)):
    """Generate a multi-brand quotation."""
    if not request.items:
        raise HTTPException(status_code=400, detail="At least one item is required")

    result = await generate_quote(db, request)
    return result


@router.post("/{quote_id}/export/pdf")
async def export_pdf(quote_id: str, db: AsyncSession = Depends(get_db)):
    """Export a saved quote as PDF."""
    result = await db.execute(
        select(QuoteSession).where(QuoteSession.id == quote_id)
    )
    quote_session = result.scalar_one_or_none()
    if not quote_session:
        raise HTTPException(status_code=404, detail="Quote not found")

    # Get dealer profile
    dealer_result = await db.execute(select(DealerProfile).limit(1))
    dealer = dealer_result.scalar_one_or_none()
    dealer_data = {
        "dealer_name": dealer.dealer_name if dealer else "",
        "gst_number": dealer.gst_number if dealer else "",
        "mobile_number": dealer.mobile_number if dealer else "",
    }

    # Build quote data from stored results
    quote_data = {
        "quote_id": quote_session.id,
        "client_name": quote_session.client_name,
        "created_at": quote_session.created_at.isoformat() if quote_session.created_at else "",
        **(quote_session.results or {}),
    }

    try:
        pdf_bytes = generate_quote_pdf(quote_data, dealer_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="QuoteForge_{quote_id[:8]}.pdf"'
        },
    )


@router.post("/{quote_id}/export/excel")
async def export_excel(quote_id: str, db: AsyncSession = Depends(get_db)):
    """Export a saved quote as Excel."""
    result = await db.execute(
        select(QuoteSession).where(QuoteSession.id == quote_id)
    )
    quote_session = result.scalar_one_or_none()
    if not quote_session:
        raise HTTPException(status_code=404, detail="Quote not found")

    dealer_result = await db.execute(select(DealerProfile).limit(1))
    dealer = dealer_result.scalar_one_or_none()
    dealer_data = {
        "dealer_name": dealer.dealer_name if dealer else "",
        "gst_number": dealer.gst_number if dealer else "",
        "mobile_number": dealer.mobile_number if dealer else "",
    }

    quote_data = {
        "quote_id": quote_session.id,
        "client_name": quote_session.client_name,
        "created_at": quote_session.created_at.isoformat() if quote_session.created_at else "",
        **(quote_session.results or {}),
    }

    try:
        excel_bytes = generate_quote_excel(quote_data, dealer_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel generation failed: {str(e)}")

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="QuoteForge_{quote_id[:8]}.xlsx"'
        },
    )


@history_router.get("/history", response_model=QuoteHistoryResponse)
async def get_history(
    page: int = 1,
    page_size: int = 20,
    search: str = "",
    date_from: str = "",
    date_to: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Get paginated quote history."""
    query = select(QuoteSession).order_by(QuoteSession.created_at.desc())

    if search:
        query = query.where(QuoteSession.client_name.ilike(f"%{search}%"))

    if date_from:
        query = query.where(QuoteSession.created_at >= date_from)
    if date_to:
        query = query.where(QuoteSession.created_at <= date_to + " 23:59:59")

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    sessions = result.scalars().all()

    quotes = []
    for s in sessions:
        results = s.results or {}
        company_totals = {
            ct["company"]: ct["total"]
            for ct in results.get("company_totals", [])
        }
        line_items = results.get("line_items", [])
        item_count = len([li for li in line_items if not li.get("error")])

        quotes.append(QuoteHistoryItem(
            id=s.id,
            created_at=s.created_at,
            client_name=s.client_name or "",
            item_count=item_count,
            total_apollo=company_totals.get("Apollo"),
            total_supreme=company_totals.get("Supreme"),
            total_astral=company_totals.get("Astral"),
            total_ashirvad=company_totals.get("Ashirvad"),
        ))

    return QuoteHistoryResponse(
        quotes=quotes, total=total, page=page, page_size=page_size,
    )


@history_router.delete("/{quote_id}")
async def delete_quote(quote_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a quote from history."""
    result = await db.execute(
        select(QuoteSession).where(QuoteSession.id == quote_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Quote not found")

    await db.delete(session)
    return {"message": "Quote deleted"}


@history_router.get("/{quote_id}")
async def get_quote_detail(quote_id: str, db: AsyncSession = Depends(get_db)):
    """Get full quote details by ID."""
    result = await db.execute(
        select(QuoteSession).where(QuoteSession.id == quote_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Quote not found")

    return {
        "quote_id": session.id,
        "client_name": session.client_name,
        "created_at": session.created_at.isoformat() if session.created_at else "",
        **(session.results or {}),
    }

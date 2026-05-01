"""
Core quote calculation engine.
All monetary calculations use Python Decimal — never float.
"""
import uuid
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.models.discount import Discount
from app.models.quote_session import QuoteSession
from app.schemas.quote import (
    QuoteRequest, QuoteResponse, QuoteLineItem,
    CompanyTotal, DiscountUsed,
)

COMPANIES = ["Apollo", "Supreme", "Astral", "Ashirvad"]
MRP_COLUMNS = {
    "Apollo": "mrp_apollo",
    "Supreme": "mrp_supreme",
    "Astral": "mrp_astral",
    "Ashirvad": "mrp_ashirvad",
}


async def generate_quote(db: AsyncSession, request: QuoteRequest) -> QuoteResponse:
    """
    Generate a multi-brand quotation.
    For each item, looks up product + 4 MRPs, fetches discount per (company, category, material_type),
    computes selling prices and line totals.
    """
    # Fetch all active discounts into a lookup dict
    discount_result = await db.execute(
        select(Discount).where(Discount.is_active == True)
    )
    discounts = discount_result.scalars().all()
    discount_lookup = {}
    for d in discounts:
        key = (d.company, d.category, d.material_type)
        discount_lookup[key] = Decimal(str(d.discount_percent))

    line_items = []
    grand_totals = {c: Decimal("0") for c in COMPANIES}
    discounts_used_set = set()

    for idx, item in enumerate(request.items, start=1):
        # Fetch product
        product_result = await db.execute(
            select(Product).where(Product.product_code == item.product_code)
        )
        product = product_result.scalar_one_or_none()

        if product is None:
            # Invalid product code — non-blocking error
            line_items.append(QuoteLineItem(
                sr=idx,
                product_code=item.product_code,
                description="",
                category="",
                material_type="",
                quantity=item.quantity,
                error=f"Product code '{item.product_code}' not found",
            ))
            continue

        qty = Decimal(str(item.quantity))
        line = QuoteLineItem(
            sr=idx,
            product_code=product.product_code,
            description=product.description,
            category=product.category,
            material_type=product.material_type,
            quantity=qty,
        )

        for company in COMPANIES:
            mrp_attr = MRP_COLUMNS[company]
            mrp_value = getattr(product, mrp_attr)

            if mrp_value is None:
                # No MRP for this company — skip
                continue

            mrp = Decimal(str(mrp_value))
            discount_key = (company, product.category, product.material_type)
            discount_pct = discount_lookup.get(discount_key, Decimal("0"))

            # selling_price = MRP × (1 - discount% / 100)
            selling_price = (mrp * (Decimal("1") - discount_pct / Decimal("100"))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            # line_total = selling_price × quantity
            line_total = (selling_price * qty).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            # Set values on line item
            company_lower = company.lower()
            setattr(line, f"mrp_{company_lower}", mrp)
            setattr(line, f"discount_{company_lower}", discount_pct)
            setattr(line, f"unit_price_{company_lower}", selling_price)
            setattr(line, f"line_total_{company_lower}", line_total)

            grand_totals[company] += line_total

            # Track which discounts were used
            discounts_used_set.add((company, product.category, product.material_type, discount_pct))

        line_items.append(line)

    # Determine best price
    valid_totals = {c: t for c, t in grand_totals.items() if t > 0}
    best_company = min(valid_totals, key=valid_totals.get) if valid_totals else None

    company_totals = []
    for company in COMPANIES:
        company_totals.append(CompanyTotal(
            company=company,
            total=grand_totals[company],
            is_best_price=(company == best_company),
        ))

    discounts_used = [
        DiscountUsed(
            company=company,
            category=category,
            material_type=material_type,
            discount_percent=discount_pct,
        )
        for company, category, material_type, discount_pct in discounts_used_set
    ]

    # Save to database
    quote_id = str(uuid.uuid4())
    now = datetime.utcnow()

    # Serialize for JSON storage
    items_json = [{"product_code": i.product_code, "quantity": str(i.quantity)} for i in request.items]
    results_json = {
        "line_items": [li.model_dump(mode="json") for li in line_items],
        "company_totals": [ct.model_dump(mode="json") for ct in company_totals],
        "discounts_used": [du.model_dump(mode="json") for du in discounts_used],
    }

    quote_session = QuoteSession(
        id=quote_id,
        created_at=now,
        client_name=request.client_name,
        items=items_json,
        results=results_json,
    )
    db.add(quote_session)
    await db.flush()

    return QuoteResponse(
        quote_id=quote_id,
        client_name=request.client_name,
        created_at=now,
        line_items=line_items,
        company_totals=company_totals,
        discounts_used=discounts_used,
    )

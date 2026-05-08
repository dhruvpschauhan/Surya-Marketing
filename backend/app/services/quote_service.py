"""
Core quote calculation engine.
All monetary calculations use Python Decimal — never float.
"""
import uuid
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.models.discount import Discount
from app.models.dealer_profile import DealerProfile
from app.models.quote_session import QuoteSession
from app.schemas.quote import (
    QuoteRequest, QuoteResponse, QuoteLineItem,
    CompanyTotal,
)

COMPANIES = ["Apollo", "Supreme", "Astral", "Ashirvad"]
MRP_COLUMNS = {
    "Apollo": "mrp_apollo",
    "Supreme": "mrp_supreme",
    "Astral": "mrp_astral",
    "Ashirvad": "mrp_ashirvad",
}


def _get_effective_discount(
    override_value,
    master_value: Decimal,
) -> Decimal:
    """
    Return override if provided (not None), else master.
    Zero override means 0% discount — NOT master.
    """
    if override_value is not None:
        return Decimal(str(override_value))
    return master_value


async def generate_quote(db: AsyncSession, request: QuoteRequest) -> QuoteResponse:
    """
    Generate a multi-brand quotation.
    Supports per-item discount overrides: null = master, number = use that value.
    """
    # Fetch dealer profile for GST rates
    profile_result = await db.execute(select(DealerProfile).limit(1))
    profile = profile_result.scalar_one_or_none()
    cgst_rate = Decimal(str(profile.cgst_rate)) if profile and profile.cgst_rate is not None else Decimal("9")
    sgst_rate = Decimal(str(profile.sgst_rate)) if profile and profile.sgst_rate is not None else Decimal("9")

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
    internal_discounts = []  # audit trail — never sent to frontend

    for idx, item in enumerate(request.items, start=1):
        # Validate discount overrides if provided
        if item.discount_overrides:
            for company in COMPANIES:
                ov = getattr(item.discount_overrides, company, None)
                if ov is not None:
                    ov_dec = Decimal(str(ov))
                    if ov_dec < 0 or ov_dec > 100:
                        raise HTTPException(
                            status_code=422,
                            detail=f"Discount override must be between 0 and 100 (got {ov} for {company} on item {idx})"
                        )

        # Fetch product
        product_result = await db.execute(
            select(Product).where(Product.product_code == item.product_code)
        )
        product = product_result.scalar_one_or_none()

        if product is None:
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

        item_has_override = False
        item_audit = {"product_code": product.product_code, "discounts": {}}

        for company in COMPANIES:
            mrp_attr = MRP_COLUMNS[company]
            mrp_value = getattr(product, mrp_attr)

            if mrp_value is None:
                continue

            mrp = Decimal(str(mrp_value))
            master_key = (company, product.category, product.material_type)
            master_pct = discount_lookup.get(master_key, Decimal("0"))

            # Get override if provided
            override_val = None
            if item.discount_overrides:
                override_val = getattr(item.discount_overrides, company, None)

            effective_pct = _get_effective_discount(override_val, master_pct)

            if override_val is not None:
                item_has_override = True

            # selling_price = MRP × (1 - discount% / 100)
            selling_price = (mrp * (Decimal("1") - effective_pct / Decimal("100"))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            # line_total = selling_price × quantity
            line_total = (selling_price * qty).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            # Set values on line item (NO discount fields exposed)
            company_lower = company.lower()
            setattr(line, f"mrp_{company_lower}", mrp)
            setattr(line, f"unit_price_{company_lower}", selling_price)
            setattr(line, f"line_total_{company_lower}", line_total)

            grand_totals[company] += line_total

            # Audit trail
            item_audit["discounts"][company] = {
                "master": str(master_pct),
                "override": str(override_val) if override_val is not None else None,
                "effective": str(effective_pct),
            }

        line.has_override = item_has_override
        line_items.append(line)
        internal_discounts.append(item_audit)

    # Compute GST amounts per company
    company_gst = {}
    for company in COMPANIES:
        subtotal = grand_totals[company]
        cgst_amt = (subtotal * cgst_rate / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        sgst_amt = (subtotal * sgst_rate / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_with_gst = subtotal + cgst_amt + sgst_amt
        company_gst[company] = {
            "cgst_amount": cgst_amt,
            "sgst_amount": sgst_amt,
            "total_with_gst": total_with_gst,
        }

    # Determine best price (based on total_with_gst)
    valid_totals = {c: company_gst[c]["total_with_gst"] for c in COMPANIES if grand_totals[c] > 0}
    best_company = min(valid_totals, key=valid_totals.get) if valid_totals else None

    company_totals = []
    for company in COMPANIES:
        gst = company_gst[company]
        company_totals.append(CompanyTotal(
            company=company,
            total=grand_totals[company],
            cgst_rate=cgst_rate,
            sgst_rate=sgst_rate,
            cgst_amount=gst["cgst_amount"],
            sgst_amount=gst["sgst_amount"],
            total_with_gst=gst["total_with_gst"],
            is_best_price=(company == best_company),
        ))

    # Save to database
    quote_id = str(uuid.uuid4())
    now = datetime.utcnow()

    # Serialize for JSON storage
    items_json = [{"product_code": i.product_code, "quantity": str(i.quantity)} for i in request.items]
    results_json = {
        "line_items": [li.model_dump(mode="json") for li in line_items],
        "company_totals": [ct.model_dump(mode="json") for ct in company_totals],
        "_internal_discounts": internal_discounts,  # audit only — never returned in API
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
    )

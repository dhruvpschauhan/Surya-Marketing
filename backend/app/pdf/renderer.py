"""
PDF rendering engine for QuoteForge.
Generates self-contained HTML strings and converts them to PDF via WeasyPrint.
"""
from decimal import Decimal, ROUND_HALF_UP
from app.pdf.styles import PDF_CSS

COMPANIES = ["Apollo", "Supreme", "Astral", "Ashirvad"]
COMPANY_HEADER_COLORS = {
    "Apollo": "#DC2626",
    "Supreme": "#2563EB",
    "Astral": "#16A34A",
    "Ashirvad": "#D97706",
}


def format_inr(amount) -> str:
    """
    Converts a number to Indian currency format.
    123456.50 → ₹1,23,456.50
    """
    if amount is None:
        return "₹0.00"
    try:
        num = float(amount)
    except (TypeError, ValueError):
        return "₹0.00"

    is_negative = num < 0
    num = abs(num)

    integer_part = int(num)
    decimal_part = f"{num - integer_part:.2f}"[1:]  # .XX

    s = str(integer_part)
    if len(s) <= 3:
        formatted = s
    else:
        last3 = s[-3:]
        remaining = s[:-3]
        groups = []
        while remaining:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        formatted = ",".join(groups) + "," + last3

    result = f"₹{formatted}{decimal_part}"
    if is_negative:
        result = f"-{result}"
    return result


def _truncate(text: str, max_len: int = 35) -> str:
    """Truncate text with ellipsis."""
    if not text:
        return ""
    return text[:max_len] + "…" if len(text) > max_len else text


def _badge_class(value: str) -> str:
    """Get badge CSS class for category or material type."""
    if not value:
        return ""
    v = value.lower()
    if v in ("pipe", "fitting", "solvent", "pvc", "cpvc"):
        return f"badge-{v}"
    return ""


def _render_header(dealer: dict, quote_data: dict, subtitle: str = "") -> str:
    """Render the shared header block."""
    d_name = dealer.get("name", "QuoteForge")
    d_gst = dealer.get("gst", "")
    d_mob = dealer.get("mobile", "")
    q_id = quote_data.get("id", "")[:8]
    q_date = quote_data.get("created_at", "")
    client = quote_data.get("client_name", "N/A")

    sub_parts = []
    if d_gst:
        sub_parts.append(f"GST: {d_gst}")
    if d_mob:
        sub_parts.append(f"Mob: {d_mob}")
    sub_line = " &nbsp;|&nbsp; ".join(sub_parts)

    html = f"""
    <div class="header">
      <div class="header-left">
        <h1>{d_name}</h1>
        <div class="sub">{sub_line}</div>
      </div>
      <div class="header-right">
        <div class="label">QUOTATION</div>
        <div class="meta">ID: {q_id} &nbsp;|&nbsp; {q_date}</div>
      </div>
    </div>
    <div class="client-row">Prepared for: <strong>{client}</strong></div>
    """
    if subtitle:
        html += f'<div style="text-align:center;margin-bottom:18px;"><span style="font-size:14px;font-weight:700;color:#F5A623;letter-spacing:1px;">{subtitle}</span></div>'
    return html


def _render_footer(dealer: dict, quote_data: dict) -> str:
    """Render the shared footer block."""
    d_name = dealer.get("name", "")
    d_gst = dealer.get("gst", "")
    d_mob = dealer.get("mobile", "")
    q_date = quote_data.get("created_at", "")

    right_parts = []
    if d_name:
        right_parts.append(d_name)
    if d_gst:
        right_parts.append(f"GST: {d_gst}")
    if d_mob:
        right_parts.append(f"Mob: {d_mob}")

    return f"""
    <div class="footer">
      <div>Prices valid as of {q_date}</div>
      <div>{" &nbsp;|&nbsp; ".join(right_parts)}</div>
    </div>
    <div class="branding">
      Made With <span class="branding-name">QUOTE FORGE</span>
    </div>
    """


# ═══════════════════════════════════════════════════════════════
# COMPARISON PDF
# ═══════════════════════════════════════════════════════════════

def render_comparison_pdf(quote_data: dict) -> bytes:
    """Generate the multi-brand comparison PDF."""
    from weasyprint import HTML

    dealer = quote_data.get("dealer", {})
    items = quote_data.get("items", [])
    grand_totals = quote_data.get("grand_totals", {})
    best_company = quote_data.get("best_company", "")
    gst_info = quote_data.get("gst_info", {})

    # ─── Summary Comparison Table ───
    summary_rows = ""
    for company in COMPANIES:
        total = grand_totals.get(company, 0)
        total_with_gst = gst_info.get(company, {}).get("total_with_gst", total)
        is_best = company == best_company
        row_class = ' class="best"' if is_best else ""
        badge = ' <span class="badge badge-best">★ Best Price</span>' if is_best else ""

        summary_rows += f"""
        <tr{row_class}>
          <td><strong>{company}</strong></td>
          <td class="text-right mono">{format_inr(total_with_gst)}</td>
          <td class="text-center">{badge}</td>
        </tr>"""

    summary_table = f"""
    <table>
      <thead><tr>
        <th>Company</th>
        <th class="text-right">Total (incl. GST)</th>
        <th class="text-center">Status</th>
      </tr></thead>
      <tbody>{summary_rows}</tbody>
    </table>
    """

    # ─── Line Items Table ───
    item_rows = ""
    for item in items:
        line_totals = item.get("line_totals", {})

        # Find the lowest line total in this row
        valid_vals = [float(v) for v in line_totals.values() if v is not None and float(v) > 0]
        row_min = min(valid_vals) if valid_vals else None

        cells = ""
        for company in COMPANIES:
            val = line_totals.get(company)
            if val is not None and float(val) > 0:
                is_lowest = row_min is not None and abs(float(val) - row_min) < 0.01
                cell_class = ' class="text-right mono best-cell"' if is_lowest else ' class="text-right mono"'
                cells += f"<td{cell_class}>{format_inr(val)}</td>"
            else:
                cells += '<td class="text-right mono">—</td>'

        cat = item.get("category", "")
        mat = item.get("material_type", "")
        cat_badge = f'<span class="badge {_badge_class(cat)}">{cat}</span>' if cat else "—"
        mat_badge = f'<span class="badge {_badge_class(mat)}">{mat}</span>' if mat else "—"

        item_rows += f"""
        <tr>
          <td class="text-center">{item.get('sr', '')}</td>
          <td class="mono">{item.get('product_code', '')}</td>
          <td>{_truncate(item.get('description', ''))}</td>
          <td class="text-center">{cat_badge}</td>
          <td class="text-center">{mat_badge}</td>
          <td class="text-center mono">{item.get('quantity', '')}</td>
          {cells}
        </tr>"""

    # Grand total row
    total_cells = ""
    for company in COMPANIES:
        val = grand_totals.get(company, 0)
        is_best = company == best_company
        cell_class = ' class="text-right mono best"' if is_best else ' class="text-right mono"'
        total_cells += f"<td{cell_class}>{format_inr(val)}</td>"

    # GST rows
    cgst_rate = gst_info.get(COMPANIES[0], {}).get("cgst_rate", 0)
    sgst_rate = gst_info.get(COMPANIES[0], {}).get("sgst_rate", 0)

    cgst_cells = ""
    sgst_cells = ""
    payable_cells = ""
    for company in COMPANIES:
        gi = gst_info.get(company, {})
        cgst_cells += f'<td class="text-right mono">{format_inr(gi.get("cgst_amount", 0))}</td>'
        sgst_cells += f'<td class="text-right mono">{format_inr(gi.get("sgst_amount", 0))}</td>'
        is_best = company == best_company
        p_class = ' best' if is_best else ''
        payable_cells += f'<td class="text-right mono{p_class}">{format_inr(gi.get("total_with_gst", 0))}</td>'

    items_table = f"""
    <table>
      <thead><tr>
        <th class="text-center">Sr.</th>
        <th>Item Code</th>
        <th>Description</th>
        <th class="text-center">Cat.</th>
        <th class="text-center">Material</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Apollo</th>
        <th class="text-right">Supreme</th>
        <th class="text-right">Astral</th>
        <th class="text-right">Ashirvad</th>
      </tr></thead>
      <tbody>
        {item_rows}
        <tr class="total-row">
          <td colspan="6"><strong>SUBTOTAL</strong></td>
          {total_cells}
        </tr>
        <tr class="gst-row">
          <td colspan="6">CGST @ {cgst_rate}%</td>
          {cgst_cells}
        </tr>
        <tr class="gst-row">
          <td colspan="6">SGST @ {sgst_rate}%</td>
          {sgst_cells}
        </tr>
        <tr class="payable-row">
          <td colspan="6"><strong>TOTAL PAYABLE (incl. GST)</strong></td>
          {payable_cells}
        </tr>
      </tbody>
    </table>
    """

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Comparison Quote</title>
<style>{PDF_CSS}</style></head><body>
<div class="page">
  {_render_header(dealer, quote_data)}
  {summary_table}
  {items_table}
  {_render_footer(dealer, quote_data)}
</div>
</body></html>"""

    return HTML(string=html).write_pdf()


# ═══════════════════════════════════════════════════════════════
# PER-BRAND PDF
# ═══════════════════════════════════════════════════════════════

def render_brand_pdf(quote_data: dict, company: str) -> bytes:
    """Generate a single-company detailed quote PDF."""
    from weasyprint import HTML

    dealer = quote_data.get("dealer", {})
    items = quote_data.get("items", [])
    grand_totals = quote_data.get("grand_totals", {})
    discounts_map = quote_data.get("discounts_map", {})
    gst_info = quote_data.get("gst_info", {})
    c_lower = company.lower()
    header_color = COMPANY_HEADER_COLORS.get(company, "#1a1a1a")

    subtitle = f"{company} — Detailed Quotation"

    # ─── Line Items with category subtotals ───
    # Group items by category for subtotals
    category_totals = {}
    item_rows = ""

    for item in items:
        cat = item.get("category", "Other")
        line_totals = item.get("line_totals", {})
        lt = line_totals.get(company)
        lt_val = float(lt) if lt is not None else 0

        if cat not in category_totals:
            category_totals[cat] = Decimal("0")
        category_totals[cat] += Decimal(str(lt_val))

        mrp_val = item.get("mrp", {}).get(company)
        unit_price = item.get("unit_price", {}).get(company)
        lt = line_totals.get(company)

        cat_badge = f'<span class="badge {_badge_class(cat)}">{cat}</span>' if cat else "—"
        mat = item.get("material_type", "")
        mat_badge = f'<span class="badge {_badge_class(mat)}">{mat}</span>' if mat else "—"

        item_rows += f"""
        <tr>
          <td class="text-center">{item.get('sr', '')}</td>
          <td class="mono">{item.get('product_code', '')}</td>
          <td>{_truncate(item.get('description', ''))}</td>
          <td class="text-center">{cat_badge}</td>
          <td class="text-center">{mat_badge}</td>
          <td class="text-right mono">{format_inr(mrp_val) if mrp_val else '—'}</td>
          <td class="text-center mono">{item.get('quantity', '')}</td>
          <td class="text-right mono">{format_inr(unit_price) if unit_price else '—'}</td>
          <td class="text-right mono">{format_inr(lt) if lt else '—'}</td>
        </tr>"""

    # GST data
    gi = gst_info.get(company, {})
    cgst_rate = gi.get("cgst_rate", 0)
    sgst_rate = gi.get("sgst_rate", 0)
    cgst_amount = gi.get("cgst_amount", 0)
    sgst_amount = gi.get("sgst_amount", 0)
    total_with_gst = gi.get("total_with_gst", 0)

    grand_total_val = grand_totals.get(company, 0)

    items_table = f"""
    <table>
      <thead><tr>
        <th style="background:{header_color}" class="text-center">Sr.</th>
        <th style="background:{header_color}">Item Code</th>
        <th style="background:{header_color}">Description</th>
        <th style="background:{header_color}" class="text-center">Cat.</th>
        <th style="background:{header_color}" class="text-center">Material</th>
        <th style="background:{header_color}" class="text-right">MRP</th>
        <th style="background:{header_color}" class="text-center">Qty</th>
        <th style="background:{header_color}" class="text-right">Unit Price</th>
        <th style="background:{header_color}" class="text-right">Line Total</th>
      </tr></thead>
      <tbody>
        {item_rows}
        <tr class="total-row">
          <td colspan="8" class="grand-total-accent"><strong>SUBTOTAL — {company}</strong></td>
          <td class="text-right mono">{format_inr(grand_total_val)}</td>
        </tr>
        <tr class="gst-row">
          <td colspan="8">CGST @ {cgst_rate}%</td>
          <td class="text-right mono">{format_inr(cgst_amount)}</td>
        </tr>
        <tr class="gst-row">
          <td colspan="8">SGST @ {sgst_rate}%</td>
          <td class="text-right mono">{format_inr(sgst_amount)}</td>
        </tr>
        <tr class="payable-row">
          <td colspan="8"><strong>TOTAL PAYABLE (incl. GST)</strong></td>
          <td class="text-right mono">{format_inr(total_with_gst)}</td>
        </tr>
      </tbody>
    </table>
    """

    # ─── Discount Summary Box ───
    discount_box = ""

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>{company} Quote</title>
<style>{PDF_CSS}</style></head><body>
<div class="page">
  {_render_header(dealer, quote_data, subtitle)}
  {items_table}
  {discount_box}
  {_render_footer(dealer, quote_data)}
</div>
</body></html>"""

    return HTML(string=html).write_pdf()

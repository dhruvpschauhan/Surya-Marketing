"""
PDF generator using WeasyPrint + Jinja2.
Generates a multi-page quotation PDF with comparison summary and per-company detail pages.
WeasyPrint is imported lazily — the app starts fine without it, PDF export just won't work.
"""
from jinja2 import Environment, FileSystemLoader, select_autoescape
from decimal import Decimal
import os

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")


def format_indian_currency(value) -> str:
    """Format a number in Indian numbering system (e.g., ₹1,23,456.50)."""
    if value is None:
        return "₹0.00"
    try:
        num = float(value)
    except (TypeError, ValueError):
        return "₹0.00"

    is_negative = num < 0
    num = abs(num)

    # Split integer and decimal
    integer_part = int(num)
    decimal_part = f"{num - integer_part:.2f}"[1:]  # .XX

    # Indian grouping: last 3 digits, then groups of 2
    s = str(integer_part)
    if len(s) <= 3:
        formatted = s
    else:
        last3 = s[-3:]
        remaining = s[:-3]
        # Group remaining in pairs from right
        groups = []
        while remaining:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        formatted = ",".join(groups) + "," + last3

    result = f"₹{formatted}{decimal_part}"
    if is_negative:
        result = f"-{result}"
    return result


def generate_quote_pdf(quote_data: dict, dealer_profile: dict) -> bytes:
    """
    Generate a PDF quotation.

    Args:
        quote_data: Full quote response data (line_items, company_totals, discounts_used)
        dealer_profile: Dealer business info (name, GST, mobile)

    Returns:
        PDF bytes

    Raises:
        ImportError: If WeasyPrint is not installed
    """
    try:
        from weasyprint import HTML
    except ImportError:
        raise ImportError(
            "WeasyPrint is not installed. Install it with: pip install weasyprint. "
            "Note: WeasyPrint requires GTK/Cairo system libraries on Windows. "
            "See https://doc.courtbouillon.org/weasyprint/stable/first_steps.html"
        )

    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html"]),
    )
    env.filters["indian_currency"] = format_indian_currency

    template = env.get_template("quote_pdf.html")

    companies = ["Apollo", "Supreme", "Astral", "Ashirvad"]

    # Prepare per-company line items
    company_details = {}
    for company in companies:
        c_lower = company.lower()
        company_items = []
        for item in quote_data.get("line_items", []):
            if item.get("error"):
                continue
            company_items.append({
                "sr": item["sr"],
                "product_code": item["product_code"],
                "description": item["description"],
                "category": item["category"],
                "material_type": item["material_type"],
                "mrp": item.get(f"mrp_{c_lower}"),
                "quantity": item["quantity"],
                "discount": item.get(f"discount_{c_lower}"),
                "unit_price": item.get(f"unit_price_{c_lower}"),
                "line_total": item.get(f"line_total_{c_lower}"),
            })
        company_details[company] = company_items

    html_content = template.render(
        dealer=dealer_profile,
        quote=quote_data,
        companies=companies,
        company_details=company_details,
        format_currency=format_indian_currency,
    )

    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes

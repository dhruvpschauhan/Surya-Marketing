import asyncio
from app.core.database import AsyncSessionLocal
from app.routers.pdf_router import _build_quote_data
from app.pdf.renderer import render_comparison_pdf

async def test():
    async with AsyncSessionLocal() as db:
        try:
            data = await _build_quote_data("d362efaf-6f74-4a1c-99b7-617d8dbe20b3", db)
            print("Quote data built OK")
            print("Items:", len(data["items"]))
            print("Grand totals:", data["grand_totals"])
        except Exception as e:
            print("ERROR building quote data:", e)
            import traceback
            traceback.print_exc()
            return

        try:
            pdf_bytes = render_comparison_pdf(data)
            print("PDF generated OK, size:", len(pdf_bytes), "bytes")
        except Exception as e:
            print("ERROR generating PDF:", e)
            import traceback
            traceback.print_exc()

asyncio.run(test())

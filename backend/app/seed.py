"""
Seed script — populates the database with sample products and discounts for testing.
Run: python -m app.seed  (from backend/ directory)
"""
import asyncio
from decimal import Decimal
from datetime import date
from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal, Base
from app.models.product import Product
from app.models.discount import Discount
from app.models.dealer_profile import DealerProfile


SAMPLE_PRODUCTS = [
    # PVC Pipes
    ("APVC001", "PVC PIPE 1/2 INCH CLASS 1", "Pipe", "PVC", 85, 82, 88, 80),
    ("APVC002", "PVC PIPE 3/4 INCH CLASS 1", "Pipe", "PVC", 120, 115, 125, 118),
    ("APVC003", "PVC PIPE 1 INCH CLASS 1", "Pipe", "PVC", 180, 175, 185, 172),
    ("APVC004", "PVC PIPE 1.5 INCH CLASS 1", "Pipe", "PVC", 280, 270, 290, 265),
    ("APVC005", "PVC PIPE 2 INCH CLASS 1", "Pipe", "PVC", 420, 410, 430, 405),
    ("APVC006", "PVC PIPE 3 INCH CLASS 1", "Pipe", "PVC", 750, 730, 770, 720),
    ("APVC007", "PVC PIPE 4 INCH CLASS 1", "Pipe", "PVC", 1100, 1080, 1120, 1060),
    # CPVC Pipes
    ("ACPVC001", "CPVC PIPE 1/2 INCH SDR 11", "Pipe", "CPVC", 145, 140, 150, 138),
    ("ACPVC002", "CPVC PIPE 3/4 INCH SDR 11", "Pipe", "CPVC", 210, 205, 220, 200),
    ("ACPVC003", "CPVC PIPE 1 INCH SDR 11", "Pipe", "CPVC", 320, 310, 335, 305),
    ("ACPVC004", "CPVC PIPE 1.5 INCH SDR 11", "Pipe", "CPVC", 540, 525, 560, 515),
    ("ACPVC005", "CPVC PIPE 2 INCH SDR 11", "Pipe", "CPVC", 810, 790, 840, 775),
    # PVC Fittings
    ("FPVC001", "PVC ELBOW 1/2 INCH 90 DEG", "Fitting", "PVC", 12, 11, 13, 10),
    ("FPVC002", "PVC ELBOW 3/4 INCH 90 DEG", "Fitting", "PVC", 18, 17, 19, 16),
    ("FPVC003", "PVC TEE 1/2 INCH", "Fitting", "PVC", 15, 14, 16, 13),
    ("FPVC004", "PVC TEE 3/4 INCH", "Fitting", "PVC", 22, 21, 24, 20),
    ("FPVC005", "PVC COUPLING 1/2 INCH", "Fitting", "PVC", 8, 7.50, 9, 7),
    ("FPVC006", "PVC COUPLING 1 INCH", "Fitting", "PVC", 14, 13, 15, 12),
    ("FPVC007", "PVC REDUCER 3/4 X 1/2", "Fitting", "PVC", 16, 15, 17, 14),
    ("FPVC008", "PVC END CAP 1 INCH", "Fitting", "PVC", 10, 9, 11, 8),
    # CPVC Fittings
    ("FCPVC001", "CPVC ELBOW 1/2 INCH 90 DEG", "Fitting", "CPVC", 28, 27, 30, 26),
    ("FCPVC002", "CPVC ELBOW 3/4 INCH 90 DEG", "Fitting", "CPVC", 42, 40, 45, 38),
    ("FCPVC003", "CPVC TEE 1/2 INCH", "Fitting", "CPVC", 35, 33, 38, 32),
    ("FCPVC004", "CPVC TEE 3/4 INCH", "Fitting", "CPVC", 52, 50, 55, 48),
    ("FCPVC005", "CPVC COUPLING 1/2 INCH", "Fitting", "CPVC", 18, 17, 20, 16),
    ("FCPVC006", "CPVC UNION 1/2 INCH", "Fitting", "CPVC", 85, 82, 90, 80),
    # Solvents
    ("SPVC001", "PVC SOLVENT CEMENT 100ML", "Solvent", "PVC", 65, 62, 68, 60),
    ("SPVC002", "PVC SOLVENT CEMENT 250ML", "Solvent", "PVC", 140, 135, 145, 130),
    ("SPVC003", "PVC SOLVENT CEMENT 500ML", "Solvent", "PVC", 250, 240, 260, 235),
    ("SCPVC001", "CPVC SOLVENT CEMENT 100ML", "Solvent", "CPVC", 120, 115, 125, 110),
    ("SCPVC002", "CPVC SOLVENT CEMENT 250ML", "Solvent", "CPVC", 260, 250, 270, 245),
]

# 24-value discount matrix: (company, category, material_type, discount%)
SAMPLE_DISCOUNTS = [
    # PVC Discounts
    ("Apollo", "Pipe", "PVC", 63),
    ("Supreme", "Pipe", "PVC", 60),
    ("Astral", "Pipe", "PVC", 58),
    ("Ashirvad", "Pipe", "PVC", 65),
    ("Apollo", "Fitting", "PVC", 55),
    ("Supreme", "Fitting", "PVC", 52),
    ("Astral", "Fitting", "PVC", 50),
    ("Ashirvad", "Fitting", "PVC", 57),
    ("Apollo", "Solvent", "PVC", 30),
    ("Supreme", "Solvent", "PVC", 28),
    ("Astral", "Solvent", "PVC", 25),
    ("Ashirvad", "Solvent", "PVC", 32),
    # CPVC Discounts
    ("Apollo", "Pipe", "CPVC", 45),
    ("Supreme", "Pipe", "CPVC", 42),
    ("Astral", "Pipe", "CPVC", 40),
    ("Ashirvad", "Pipe", "CPVC", 47),
    ("Apollo", "Fitting", "CPVC", 40),
    ("Supreme", "Fitting", "CPVC", 38),
    ("Astral", "Fitting", "CPVC", 35),
    ("Ashirvad", "Fitting", "CPVC", 42),
    ("Apollo", "Solvent", "CPVC", 22),
    ("Supreme", "Solvent", "CPVC", 20),
    ("Astral", "Solvent", "CPVC", 18),
    ("Ashirvad", "Solvent", "CPVC", 25),
]


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(Product).limit(1))
        if result.scalar_one_or_none():
            print("Database already has data. Skipping seed.")
            return

        # Seed products
        for code, desc, cat, mat, a, s, ast, ash in SAMPLE_PRODUCTS:
            session.add(Product(
                product_code=code,
                description=desc,
                category=cat,
                material_type=mat,
                mrp_apollo=Decimal(str(a)),
                mrp_supreme=Decimal(str(s)),
                mrp_astral=Decimal(str(ast)),
                mrp_ashirvad=Decimal(str(ash)),
            ))
        print(f"Seeded {len(SAMPLE_PRODUCTS)} products.")

        # Seed discounts
        today = date.today()
        for company, cat, mat, pct in SAMPLE_DISCOUNTS:
            session.add(Discount(
                company=company,
                category=cat,
                material_type=mat,
                discount_percent=Decimal(str(pct)),
                effective_from=today,
                is_active=True,
            ))
        print(f"Seeded {len(SAMPLE_DISCOUNTS)} discounts.")

        # Seed dealer profile
        session.add(DealerProfile(
            dealer_name="Surya Marketing",
            gst_number="24ABCDE1234F1Z5",
            mobile_number="+91 98765 43210",
            address="Shop 12, Industrial Area, Rajkot, Gujarat 360002",
        ))
        print("Seeded dealer profile.")

        await session.commit()
        print("✅ Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())

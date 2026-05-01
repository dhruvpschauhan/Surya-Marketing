from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company = Column(String, nullable=False)  # 'Apollo', 'Supreme', 'Astral', 'Ashirvad'
    category = Column(String, nullable=False)  # 'Pipe', 'Fitting', 'Solvent'
    material_type = Column(String, nullable=False)  # 'PVC', 'CPVC'
    discount_percent = Column(Numeric(5, 2), nullable=False)
    effective_from = Column(Date, nullable=False, server_default=func.current_date())
    is_active = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Note: SQLite doesn't support partial unique indexes natively.
    # We enforce uniqueness at application level for active records.
    __table_args__ = (
        UniqueConstraint("company", "category", "material_type", "is_active",
                         name="uq_discount_active"),
    )

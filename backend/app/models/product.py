from sqlalchemy import Column, String, Text, Numeric
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    product_code = Column(String, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # 'Pipe', 'Fitting', 'Solvent'
    material_type = Column(String, nullable=False)  # 'PVC', 'CPVC'
    mrp_apollo = Column(Numeric(10, 2), nullable=True)
    mrp_supreme = Column(Numeric(10, 2), nullable=True)
    mrp_astral = Column(Numeric(10, 2), nullable=True)
    mrp_ashirvad = Column(Numeric(10, 2), nullable=True)

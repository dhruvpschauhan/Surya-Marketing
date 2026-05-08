from sqlalchemy import Column, Integer, String, Text, Float
from app.core.database import Base


class DealerProfile(Base):
    __tablename__ = "dealer_profile"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dealer_name = Column(String, nullable=True, default="")
    gst_number = Column(String, nullable=True, default="")
    mobile_number = Column(String, nullable=True, default="")
    address = Column(Text, nullable=True, default="")
    logo_url = Column(String, nullable=True, default="")
    cgst_rate = Column(Float, nullable=False, default=9.0)
    sgst_rate = Column(Float, nullable=False, default=9.0)

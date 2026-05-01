from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base


class DealerProfile(Base):
    __tablename__ = "dealer_profile"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dealer_name = Column(String, nullable=True, default="")
    gst_number = Column(String, nullable=True, default="")
    mobile_number = Column(String, nullable=True, default="")
    address = Column(Text, nullable=True, default="")
    logo_url = Column(String, nullable=True, default="")

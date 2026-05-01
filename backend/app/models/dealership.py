from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base


class Dealership(Base):
    __tablename__ = "dealerships"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String, nullable=False)
    contact_person = Column(String, nullable=True, default="")
    mobile_number = Column(String, nullable=True, default="")
    email = Column(String, nullable=True, default="")
    address = Column(Text, nullable=True, default="")
    notes = Column(Text, nullable=True, default="")

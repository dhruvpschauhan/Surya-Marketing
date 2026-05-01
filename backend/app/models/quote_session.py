import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class QuoteSession(Base):
    __tablename__ = "quote_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, server_default=func.now())
    client_name = Column(String, nullable=True, default="")
    items = Column(JSON, nullable=True)      # Input items [{product_code, quantity}]
    results = Column(JSON, nullable=True)    # Full computed results

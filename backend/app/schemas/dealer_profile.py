from pydantic import BaseModel
from typing import Optional


class DealerProfileBase(BaseModel):
    dealer_name: str = ""
    gst_number: str = ""
    mobile_number: str = ""
    address: str = ""
    logo_url: str = ""


class DealerProfileResponse(DealerProfileBase):
    id: int

    class Config:
        from_attributes = True


class DealerProfileUpdate(BaseModel):
    dealer_name: Optional[str] = None
    gst_number: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None

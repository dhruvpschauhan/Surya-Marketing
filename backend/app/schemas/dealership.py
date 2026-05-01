from pydantic import BaseModel
from typing import Optional


class DealershipBase(BaseModel):
    company_name: str
    contact_person: str = ""
    mobile_number: str = ""
    email: str = ""
    address: str = ""
    notes: str = ""


class DealershipCreate(DealershipBase):
    pass


class DealershipUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class DealershipResponse(DealershipBase):
    id: int

    class Config:
        from_attributes = True

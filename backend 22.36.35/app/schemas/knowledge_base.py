from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class KbCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False


class KbUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class KbResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    owner_id: UUID
    is_public: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

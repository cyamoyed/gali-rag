from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class DocumentResponse(BaseModel):
    id: UUID
    kb_id: UUID
    title: str
    file_path: Optional[str]
    file_type: Optional[str]
    file_size: Optional[int]
    status: str
    version: int
    uploaded_by: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True

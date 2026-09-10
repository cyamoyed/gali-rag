from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class QueryRequest(BaseModel):
    query: str
    kb_id: UUID
    conversation_id: Optional[UUID] = None


class SourceInfo(BaseModel):
    chunk_id: str
    doc_id: str
    content: str
    score: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceInfo]
    conversation_id: UUID


class ConversationResponse(BaseModel):
    id: UUID
    title: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    sources_json: list[dict] = []
    created_at: str

    class Config:
        from_attributes = True

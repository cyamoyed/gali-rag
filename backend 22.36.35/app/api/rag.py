from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.rag import QueryRequest, QueryResponse, ConversationResponse, MessageResponse
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.post("/query", response_model=QueryResponse)
async def query(data: QueryRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await rag_service.query(db, user.id, data.kb_id, data.query, data.conversation_id)
    return QueryResponse(answer=result["answer"], sources=result["sources"], conversation_id=result["conversation_id"])


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await rag_service.list_conversations(db, user.id)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(conversation_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await rag_service.get_messages(db, conversation_id)

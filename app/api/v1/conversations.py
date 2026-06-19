from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.schemas.schemas import ConversationResponse, MessageResponse
from app.services.conv_service import conv_service
from app.models.models import Conversation, ChatMessage
import json

router = APIRouter()


@router.get("/conversations", response_model=List[ConversationResponse], summary="查询会话列表")
def list_conversations(agent_id: int = None, source: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Conversation)
    if agent_id is not None:
        query = query.filter(Conversation.agent_id == agent_id)
    if source:
        query = query.filter(Conversation.source == source)
    convs = query.order_by(Conversation.updated_at.desc()).all()

    conv_ids = [c.id for c in convs]
    count_map = {}
    if conv_ids:
        rows = db.query(ChatMessage.conversation_id, func.count(ChatMessage.id)).filter(
            ChatMessage.conversation_id.in_(conv_ids)
        ).group_by(ChatMessage.conversation_id).all()
        count_map = {cid: cnt for cid, cnt in rows}

    return [
        ConversationResponse(
            id=c.id, agent_id=c.agent_id, title=c.title, source=c.source,
            message_count=count_map.get(c.id, 0),
            created_at=c.created_at, updated_at=c.updated_at,
        )
        for c in convs
    ]


@router.post("/conversations", response_model=ConversationResponse, summary="新建会话")
def create_conversation(agent_id: int, title: str = "新对话", source: str = "test", db: Session = Depends(get_db)):
    from app.services.agent_service import agent_service
    agent = agent_service.get(db, agent_id)
    if not agent:
        raise HTTPException(404, "智能体不存在")
    conv = conv_service.create(db, agent_id=agent_id, title=title, source=source)
    return ConversationResponse(
        id=conv.id, agent_id=conv.agent_id, title=conv.title, source=conv.source,
        message_count=0,
        created_at=conv.created_at, updated_at=conv.updated_at,
    )


@router.delete("/conversations/{conv_id}", summary="删除会话")
def delete_conversation(conv_id: int, db: Session = Depends(get_db)):
    if not conv_service.delete(db, conv_id):
        raise HTTPException(404, "会话不存在")
    return {"code": 200, "message": "会话已删除"}


@router.get("/conversations/{conv_id}/messages", response_model=List[MessageResponse], summary="查询会话消息")
def list_messages(conv_id: int, db: Session = Depends(get_db)):
    return conv_service.get_messages(db, conv_id)


@router.get("/conversations/{conv_id}/export", summary="导出会话日志")
def export_conversation(conv_id: int, db: Session = Depends(get_db)):
    messages = conv_service.export_messages(db, conv_id)
    return JSONResponse(
        content={"code": 200, "data": messages},
        headers={"Content-Disposition": f"attachment; filename=conversation_{conv_id}.json"},
    )


@router.get("/export/messages", summary="导出全部问答日志")
def export_all_messages(agent_id: int = None, db: Session = Depends(get_db)):
    messages = conv_service.export_messages(db, agent_id=agent_id)
    return JSONResponse(
        content={"code": 200, "data": messages},
        headers={"Content-Disposition": "attachment; filename=all_messages.json"},
    )

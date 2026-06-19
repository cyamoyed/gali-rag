from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import Conversation, ChatMessage
import json


class ConversationService:
    def create(self, db: Session, agent_id: int, title: str = "新对话", source: str = "test") -> Conversation:
        conv = Conversation(agent_id=agent_id, title=title, source=source)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    def get(self, db: Session, conv_id: int) -> Optional[Conversation]:
        return db.query(Conversation).filter(Conversation.id == conv_id).first()

    def get_all(self, db: Session, agent_id: int = None, source: str = None) -> List[Conversation]:
        query = db.query(Conversation)
        if agent_id:
            query = query.filter(Conversation.agent_id == agent_id)
        if source:
            query = query.filter(Conversation.source == source)
        return query.order_by(Conversation.updated_at.desc()).all()

    def get_by_agent(self, db: Session, agent_id: int, source: str = None) -> List[Conversation]:
        query = db.query(Conversation).filter(Conversation.agent_id == agent_id)
        if source:
            query = query.filter(Conversation.source == source)
        return query.order_by(Conversation.updated_at.desc()).all()

    def delete(self, db: Session, conv_id: int) -> bool:
        conv = self.get(db, conv_id)
        if not conv:
            return False
        db.delete(conv)
        db.commit()
        return True

    def add_message(self, db: Session, conversation_id: int, role: str,
                    content: str, cited_sources: str = "[]",
                    conflict_info: str = "", latency_ms: int = 0) -> ChatMessage:
        msg = ChatMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
            cited_sources=cited_sources,
            conflict_info=conflict_info,
            latency_ms=latency_ms,
        )
        db.add(msg)
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            if role == "user" and conv.title == "新对话":
                conv.title = content[:50]
            from datetime import datetime, timezone
            conv.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(msg)
        return msg

    def get_messages(self, db: Session, conversation_id: int) -> List[ChatMessage]:
        return db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation_id
        ).order_by(ChatMessage.created_at.asc()).all()

    def get_chat_history(self, db: Session, conversation_id: int) -> List[dict]:
        messages = self.get_messages(db, conversation_id)
        return [{"role": m.role, "content": m.content} for m in messages]

    def export_messages(self, db: Session, conversation_id: int = None,
                        agent_id: int = None) -> List[dict]:
        query = db.query(ChatMessage)
        if conversation_id:
            query = query.filter(ChatMessage.conversation_id == conversation_id)
        elif agent_id:
            conv_ids = [c.id for c in db.query(Conversation).filter(Conversation.agent_id == agent_id).all()]
            if not conv_ids:
                return []
            query = query.filter(ChatMessage.conversation_id.in_(conv_ids))
        messages = query.order_by(ChatMessage.created_at.desc()).limit(1000).all()
        result = []
        for m in messages:
            result.append({
                "id": m.id,
                "conversation_id": m.conversation_id,
                "role": m.role,
                "content": m.content,
                "cited_sources": json.loads(m.cited_sources) if m.cited_sources else [],
                "conflict_info": m.conflict_info,
                "latency_ms": m.latency_ms,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            })
        return result


conv_service = ConversationService()

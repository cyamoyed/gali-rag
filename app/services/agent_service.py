import secrets
import json
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import Agent, KnowledgeBase, agent_knowledge_bases


class AgentService:
    def create(self, db: Session, kb_ids: List[int] = None, **kwargs) -> Agent:
        api_key = f"agent_{secrets.token_hex(16)}"
        kwargs["api_key"] = api_key
        agent = Agent(**kwargs)
        if kb_ids:
            kbs = db.query(KnowledgeBase).filter(KnowledgeBase.id.in_(kb_ids)).all()
            agent.knowledge_bases = kbs
        db.add(agent)
        db.commit()
        db.refresh(agent)
        return agent

    def get(self, db: Session, agent_id: int) -> Optional[Agent]:
        return db.query(Agent).filter(Agent.id == agent_id).first()

    def get_by_api_key(self, db: Session, api_key: str) -> Optional[Agent]:
        return db.query(Agent).filter(Agent.api_key == api_key, Agent.status == "published").first()

    def get_all(self, db: Session, status: Optional[str] = None) -> List[Agent]:
        q = db.query(Agent)
        if status:
            q = q.filter(Agent.status == status)
        return q.order_by(Agent.created_at.desc()).all()

    def update(self, db: Session, agent_id: int, kb_ids: List[int] = None, **kwargs) -> Optional[Agent]:
        agent = self.get(db, agent_id)
        if not agent:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(agent, key):
                setattr(agent, key, value)
        if kb_ids is not None:
            kbs = db.query(KnowledgeBase).filter(KnowledgeBase.id.in_(kb_ids)).all()
            agent.knowledge_bases = kbs
        db.commit()
        db.refresh(agent)
        return agent

    def delete(self, db: Session, agent_id: int) -> bool:
        agent = self.get(db, agent_id)
        if not agent:
            return False
        db.delete(agent)
        db.commit()
        return True

    def publish(self, db: Session, agent_id: int) -> Optional[Agent]:
        agent = self.get(db, agent_id)
        if not agent:
            return None
        agent.status = "published"
        db.commit()
        db.refresh(agent)
        return agent

    def unpublish(self, db: Session, agent_id: int) -> Optional[Agent]:
        agent = self.get(db, agent_id)
        if not agent:
            return None
        agent.status = "draft"
        db.commit()
        db.refresh(agent)
        return agent

    def regenerate_api_key(self, db: Session, agent_id: int) -> Optional[str]:
        agent = self.get(db, agent_id)
        if not agent:
            return None
        agent.api_key = f"agent_{secrets.token_hex(16)}"
        db.commit()
        return agent.api_key

    def get_kb_ids(self, db: Session, agent_id: int) -> List[int]:
        agent = self.get(db, agent_id)
        if not agent:
            return []
        return [kb.id for kb in agent.knowledge_bases]


agent_service = AgentService()

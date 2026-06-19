from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import KnowledgeBase, Document, DocumentChunk
from app.rag.vector_store import vector_store
from app.core.config import settings
import uuid


class KnowledgeBaseService:
    def create(self, db: Session, name: str, description: str = "", **kwargs) -> KnowledgeBase:
        collection_name = f"kb_{uuid.uuid4().hex[:12]}"
        kb = KnowledgeBase(
            name=name,
            description=description,
            chroma_collection=collection_name,
            category_id=kwargs.get("category_id"),
            kb_type=kwargs.get("kb_type", "general"),
            embedding_model_id=kwargs.get("embedding_model_id"),
            web_config=kwargs.get("web_config", "{}"),
            chunk_size=kwargs.get("chunk_size", settings.CHUNK_SIZE),
            chunk_overlap=kwargs.get("chunk_overlap", settings.CHUNK_OVERLAP),
            semantic_chunk_enabled=kwargs.get("semantic_chunk_enabled", False),
        )
        db.add(kb)
        db.commit()
        db.refresh(kb)
        vector_store.get_or_create_collection(kb.id, collection_name)
        return kb

    def get(self, db: Session, kb_id: int) -> Optional[KnowledgeBase]:
        return db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()

    def get_all(self, db: Session, category_id: int = None, kb_type: str = None) -> List[KnowledgeBase]:
        q = db.query(KnowledgeBase)
        if category_id is not None:
            q = q.filter(KnowledgeBase.category_id == category_id)
        if kb_type:
            q = q.filter(KnowledgeBase.kb_type == kb_type)
        return q.order_by(KnowledgeBase.created_at.desc()).all()

    def update(self, db: Session, kb_id: int, **kwargs) -> Optional[KnowledgeBase]:
        kb = self.get(db, kb_id)
        if not kb:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(kb, key):
                setattr(kb, key, value)
        db.commit()
        db.refresh(kb)
        return kb

    def delete(self, db: Session, kb_id: int) -> bool:
        kb = self.get(db, kb_id)
        if not kb:
            return False
        vector_store.delete_collection(kb.chroma_collection)
        db.delete(kb)
        db.commit()
        return True

    def get_document_count(self, db: Session, kb_id: int) -> int:
        return db.query(Document).filter(Document.kb_id == kb_id).count()

    def get_chunk_count(self, db: Session, kb_id: int) -> int:
        return (
            db.query(DocumentChunk)
            .join(Document, Document.id == DocumentChunk.doc_id)
            .filter(Document.kb_id == kb_id)
            .count()
        )


kb_service = KnowledgeBaseService()

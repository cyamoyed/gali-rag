import os
from sqlalchemy.orm import Session
from app.core.config import settings
from app.rag.vector_store import vector_store


class SystemService:
    def get_resources(self, db: Session) -> dict:
        from app.models.models import Document, DocumentChunk
        chroma_size = vector_store.get_storage_size()
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        db_size = os.path.getsize(db_path) / (1024 * 1024) if os.path.exists(db_path) else 0
        upload_size = 0
        for dirpath, _, filenames in os.walk(settings.UPLOAD_DIR):
            for f in filenames:
                upload_size += os.path.getsize(os.path.join(dirpath, f))
        upload_size = upload_size / (1024 * 1024)
        total_docs = db.query(Document).count()
        total_chunks = db.query(DocumentChunk).count()
        return {
            "chroma_size_mb": round(chroma_size, 2),
            "database_size_mb": round(db_size, 2),
            "upload_size_mb": round(upload_size, 2),
            "total_documents": total_docs,
            "total_chunks": total_chunks,
        }


sys_service = SystemService()

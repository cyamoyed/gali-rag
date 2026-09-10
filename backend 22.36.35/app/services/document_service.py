from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, UploadFile
from app.models.document import Document, DocVersion
from app.models.knowledge_base import KnowledgeBase
from app.services.storage_service import storage_service
from app.services.tasks import process_document
from uuid import UUID


class DocumentService:
    @staticmethod
    async def upload_document(db: AsyncSession, kb_id: UUID, file: UploadFile, user_id: UUID) -> Document:
        result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.id == kb_id))
        kb = result.scalar_one_or_none()
        if not kb:
            raise HTTPException(status_code=404, detail="Knowledge base not found")
        content = await file.read()
        file_size = len(content)
        file_path = await storage_service.upload_file(content, file.filename, file.content_type)
        doc = Document(
            kb_id=kb_id,
            title=file.filename,
            file_path=file_path,
            file_type=file.content_type,
            file_size=file_size,
            status="draft",
            uploaded_by=user_id,
        )
        db.add(doc)
        await db.flush()
        version = DocVersion(doc_id=doc.id, version_num=1, file_path=file_path)
        db.add(version)
        process_document.delay(str(doc.id))
        return doc

    @staticmethod
    async def list_documents(db: AsyncSession, kb_id: UUID) -> list[Document]:
        result = await db.execute(
            select(Document).where(Document.kb_id == kb_id, Document.status != "deleted")
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_document(db: AsyncSession, doc_id: UUID) -> Document:
        result = await db.execute(select(Document).where(Document.id == doc_id))
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc

    @staticmethod
    async def delete_document(db: AsyncSession, doc_id: UUID):
        doc = await DocumentService.get_document(db, doc_id)
        doc.status = "deleted"


document_service = DocumentService()

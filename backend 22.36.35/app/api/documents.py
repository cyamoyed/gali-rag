from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.document_service import document_service

router = APIRouter(tags=["documents"])


@router.post("/api/knowledge-bases/{kb_id}/documents/upload", response_model=DocumentResponse)
async def upload_document(
    kb_id: UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await document_service.upload_document(db, kb_id, file, user.id)
    return doc


@router.get("/api/knowledge-bases/{kb_id}/documents", response_model=list[DocumentResponse])
async def list_documents(
    kb_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await document_service.list_documents(db, kb_id)


@router.get("/api/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await document_service.get_document(db, doc_id)


@router.delete("/api/documents/{doc_id}")
async def delete_document(
    doc_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await document_service.delete_document(db, doc_id)
    return {"message": "deleted"}

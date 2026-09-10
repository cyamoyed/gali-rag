from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.knowledge_base import KbCreate, KbUpdate, KbResponse
from app.services.kb_service import KbService

router = APIRouter(prefix="/api/knowledge-bases", tags=["knowledge-bases"])


@router.get("", response_model=list[KbResponse])
async def list_kbs(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await KbService.list_kbs(db, user)


@router.post("", response_model=KbResponse)
async def create_kb(data: KbCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await KbService.create_kb(db, user, data.name, data.description, data.is_public)


@router.get("/{kb_id}", response_model=KbResponse)
async def get_kb(kb_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await KbService.get_kb(db, kb_id)


@router.put("/{kb_id}", response_model=KbResponse)
async def update_kb(
    kb_id: UUID, data: KbUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await KbService.update_kb(db, kb_id, **data.model_dump(exclude_unset=True))


@router.delete("/{kb_id}")
async def delete_kb(kb_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await KbService.delete_kb(db, kb_id)
    return {"message": "deleted"}

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.models.knowledge_base import KnowledgeBase, KbMember
from app.models.user import User
from uuid import UUID


class KbService:
    @staticmethod
    async def list_kbs(db: AsyncSession, user: User) -> list[KnowledgeBase]:
        if user.role == "superadmin":
            result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.status == "active"))
        else:
            result = await db.execute(
                select(KnowledgeBase).where(
                    (KnowledgeBase.status == "active")
                    & ((KnowledgeBase.is_public == True) | (KnowledgeBase.owner_id == user.id))
                )
            )
        return list(result.scalars().all())

    @staticmethod
    async def create_kb(
        db: AsyncSession, user: User, name: str, description: str = None, is_public: bool = False
    ) -> KnowledgeBase:
        kb = KnowledgeBase(name=name, description=description, is_public=is_public, owner_id=user.id)
        db.add(kb)
        await db.flush()
        member = KbMember(kb_id=kb.id, user_id=user.id, permission="admin")
        db.add(member)
        return kb

    @staticmethod
    async def get_kb(db: AsyncSession, kb_id: UUID) -> KnowledgeBase:
        result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.id == kb_id))
        kb = result.scalar_one_or_none()
        if not kb:
            raise HTTPException(status_code=404, detail="Knowledge base not found")
        return kb

    @staticmethod
    async def update_kb(db: AsyncSession, kb_id: UUID, **kwargs) -> KnowledgeBase:
        kb = await KbService.get_kb(db, kb_id)
        for key, value in kwargs.items():
            if value is not None:
                setattr(kb, key, value)
        return kb

    @staticmethod
    async def delete_kb(db: AsyncSession, kb_id: UUID):
        kb = await KbService.get_kb(db, kb_id)
        kb.status = "deleted"

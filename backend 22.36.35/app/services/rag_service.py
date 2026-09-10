from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.conversation import Conversation, Message
from app.rag.retriever.hybrid_retriever import hybrid_retriever
from app.rag.generator.llm_generator import llm_generator
from uuid import UUID


class RAGService:
    @staticmethod
    async def query(db: AsyncSession, user_id: UUID, kb_id: UUID, query: str, conversation_id: UUID = None) -> dict:
        if conversation_id:
            result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
            conversation = result.scalar_one_or_none()
            if not conversation:
                conversation = Conversation(user_id=user_id, kb_id=kb_id, title=query[:100])
                db.add(conversation)
                await db.flush()
        else:
            conversation = Conversation(user_id=user_id, kb_id=kb_id, title=query[:100])
            db.add(conversation)
            await db.flush()

        chunks = await hybrid_retriever.retrieve(query, [str(kb_id)], top_k=5)

        history = []
        if conversation_id:
            result = await db.execute(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at).limit(10))
            messages = list(result.scalars().all())
            for msg in messages:
                history.append({"role": msg.role, "content": msg.content})

        result = await llm_generator.generate(query, chunks, history)

        user_msg = Message(conversation_id=conversation.id, role="user", content=query)
        db.add(user_msg)
        assistant_msg = Message(conversation_id=conversation.id, role="assistant", content=result["answer"], sources_json=result["sources"])
        db.add(assistant_msg)

        return {"answer": result["answer"], "sources": result["sources"], "conversation_id": conversation.id}

    @staticmethod
    async def list_conversations(db: AsyncSession, user_id: UUID) -> list[Conversation]:
        result = await db.execute(select(Conversation).where(Conversation.user_id == user_id).order_by(Conversation.created_at.desc()))
        return list(result.scalars().all())

    @staticmethod
    async def get_messages(db: AsyncSession, conversation_id: UUID) -> list[Message]:
        result = await db.execute(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at))
        return list(result.scalars().all())


rag_service = RAGService()

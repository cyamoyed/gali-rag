import asyncio
import re

from app.core.celery_app import celery_app
from app.core.database import async_session
from app.models.document import Document
from app.models.chunk import Chunk
from app.services.storage_service import storage_service
from app.rag.parser.document_parser import DocumentParser
from app.rag.chunker.text_chunker import TextChunker
from app.rag.embeddings.embedding_client import embedding_client
from app.services.vector_service import vector_service
from sqlalchemy import select
from uuid import UUID


@celery_app.task(bind=True, max_retries=3)
def process_document(self, doc_id: str):
    asyncio.run(_process_document_async(doc_id))


async def _process_document_async(doc_id: str):
    async with async_session() as db:
        result = await db.execute(
            select(Document).where(Document.id == UUID(doc_id))
        )
        doc = result.scalar_one_or_none()
        if not doc:
            return
        try:
            file_content = await storage_service.download_file(doc.file_path)
            text = await DocumentParser.parse(file_content, doc.file_type, doc.title)
            text = _clean_text(text)
            if not text.strip():
                doc.status = "failed"
                await db.commit()
                return
            chunker = TextChunker(chunk_size=500, chunk_overlap=50)
            chunks = chunker.chunk_text(text)
            for chunk_data in chunks:
                chunk = Chunk(
                    doc_id=doc.id,
                    content=chunk_data["content"],
                    chunk_index=chunk_data["chunk_index"],
                    token_count=chunk_data["token_count"],
                )
                db.add(chunk)
            await db.flush()

            result = await db.execute(select(Chunk).where(Chunk.doc_id == doc.id))
            db_chunks = list(result.scalars().all())
            chunk_ids = [str(c.id) for c in db_chunks]
            contents = [c.content for c in db_chunks]

            embeddings = await embedding_client.embed(contents)

            vector_service.ensure_collection()
            await vector_service.insert_chunks(
                doc_id=str(doc.id),
                kb_id=str(doc.kb_id),
                chunk_ids=chunk_ids,
                embeddings=embeddings,
                contents=contents,
            )

            doc.status = "published"
            await db.commit()
        except Exception as e:
            doc.status = "failed"
            await db.commit()
            raise


def _clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"Page \d+ of \d+", "", text)
    return text.strip()

import os
import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from pathlib import Path
from app.models.models import Document, DocumentChunk, KnowledgeBase
from app.rag.vector_store import vector_store
from app.rag.multi_retriever import bm25_cache
from app.rag.embedding_client import get_embedding_client
from app.utils.document_parser import parse_document, clean_text, get_file_type
from app.utils.text_splitter import split_text
from app.utils.token_counter import count_tokens
from app.services.prompt_service import prompt_service
from app.services.model_service import model_service
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class DocumentService:
    def _get_embedding_client(self, kb):
        if kb.embedding_model:
            model = kb.embedding_model
            return get_embedding_client(
                provider=model.provider,
                model_name=model.model_name,
                api_key=model.api_key or "",
                base_url=model.base_url or "",
            )
        raise ValueError("知识库未配置Embedding模型，请先在模型管理中设置并关联")

    def save_upload(self, file_content: bytes, filename: str) -> str:
        ext = Path(filename).suffix
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        with open(file_path, "wb") as f:
            f.write(file_content)
        return file_path

    def create_record(self, db: Session, kb_id: int, filename: str,
                      file_path: str, file_size: int) -> Document:
        doc = Document(
            kb_id=kb_id,
            filename=filename,
            file_path=file_path,
            file_type=get_file_type(filename),
            file_size=file_size,
            status="pending",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    def process_document(self, db: Session, doc_id: int) -> dict:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise ValueError("文档不存在")
        kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == doc.kb_id).first()
        if not kb:
            raise ValueError("知识库不存在")

        old_chunk_ids = []
        try:
            doc.status = "processing"
            db.commit()

            raw_text = parse_document(doc.file_path)
            cleaned = clean_text(raw_text)
            if not cleaned or len(cleaned.strip()) < 2:
                raise ValueError("文档解析后内容为空或过短")

            chunks = split_text(
                cleaned,
                chunk_size=kb.chunk_size,
                chunk_overlap=kb.chunk_overlap,
                semantic=kb.semantic_chunk_enabled,
            )

            chunks = [c for c in chunks if c.strip()]
            if not chunks:
                raise ValueError("切片后无有效内容")

            db.query(DocumentChunk).filter(DocumentChunk.doc_id == doc_id).delete()
            db.flush()

            chunk_records = []
            for i, chunk_text in enumerate(chunks):
                record = DocumentChunk(
                    doc_id=doc.id,
                    chunk_index=i,
                    content=chunk_text,
                    token_count=count_tokens(chunk_text),
                )
                db.add(record)
                chunk_records.append(record)
            db.flush()

            ids = [f"doc{doc.id}_chunk{i}" for i in range(len(chunks))]
            metadatas = [
                {
                    "doc_id": doc.id,
                    "doc_name": doc.filename,
                    "chunk_db_id": chunk_records[i].id,
                    "chunk_index": i,
                    "kb_id": kb.id,
                }
                for i in range(len(chunks))
            ]

            emb_client = self._get_embedding_client(kb)
            embeddings = emb_client.embed(chunks)
            vector_store.add_documents(kb.chroma_collection, chunks, metadatas, ids, embeddings)
            bm25_cache.invalidate(kb.chroma_collection)

            doc.chunk_count = len(chunks)
            doc.status = "completed"
            doc.error_message = ""
            db.commit()

            return {"chunk_count": len(chunks), "status": "completed"}
        except Exception as e:
            db.rollback()
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if doc:
                doc.status = "failed"
                doc.error_message = str(e)[:1000]
                db.commit()
            logger.error(f"文档处理失败 doc_id={doc_id}: {e}", exc_info=True)
            return {"error": str(e)}

    def get_documents(self, db: Session, kb_id: int) -> List[Document]:
        return db.query(Document).filter(Document.kb_id == kb_id).order_by(Document.created_at.desc()).all()

    def get_document(self, db: Session, doc_id: int) -> Optional[Document]:
        return db.query(Document).filter(Document.id == doc_id).first()

    def get_file_for_download(self, db: Session, doc_id: int) -> tuple:
        doc = self.get_document(db, doc_id)
        if not doc:
            raise ValueError("文档不存在")
        if not os.path.exists(doc.file_path):
            raise ValueError("文件已丢失")
        return doc.file_path, doc.filename, doc.file_type

    def delete_document(self, db: Session, doc_id: int) -> bool:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return False
        if doc.status == "processing":
            raise ValueError("文档正在处理中，无法删除，请稍后再试")
        kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == doc.kb_id).first()
        if kb:
            vector_store.delete_by_doc_id(kb.chroma_collection, doc_id)
            bm25_cache.invalidate(kb.chroma_collection)
        file_path = doc.file_path
        db.delete(doc)
        db.commit()
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError as e:
                logger.warning(f"删除文档文件失败 {file_path}: {e}")
        return True

    def reprocess_document(self, db: Session, doc_id: int) -> dict:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise ValueError("文档不存在")
        if doc.status == "processing":
            raise ValueError("文档正在处理中，请稍后再试")
        if not os.path.exists(doc.file_path):
            raise ValueError(f"文档文件已丢失: {doc.file_path}")
        kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == doc.kb_id).first()
        if kb:
            vector_store.delete_by_doc_id(kb.chroma_collection, doc_id)
            bm25_cache.invalidate(kb.chroma_collection)
        db.query(DocumentChunk).filter(DocumentChunk.doc_id == doc_id).delete()
        doc.status = "pending"
        doc.chunk_count = 0
        doc.error_message = ""
        db.commit()
        return self.process_document(db, doc_id)

    def generate_summary(self, db: Session, doc_id: int) -> str:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise ValueError("文档不存在")
        raw_text = parse_document(doc.file_path)
        cleaned = clean_text(raw_text)
        sample = cleaned[:3000]

        template = prompt_service.get_prompt_by_category("doc_summary", db)
        prompt = template.replace("{{doc_raw_text}}", sample) if template else f"请为以下文档生成简要摘要（200字以内）：\n\n{sample}"

        summary = model_service.get_default_llm_client(db).generate(prompt, max_tokens=512)
        doc.summary = summary[:2000]
        db.commit()
        return summary

    def clean_orphan_vectors(self, db: Session, kb_id: int) -> int:
        kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
        if not kb:
            return 0
        docs = db.query(Document).filter(Document.kb_id == kb_id).all()
        valid_doc_ids = [d.id for d in docs]
        count = vector_store.clean_orphan_chunks(kb.chroma_collection, valid_doc_ids)
        if count > 0:
            bm25_cache.invalidate(kb.chroma_collection)
        return count

    async def crawl_and_process(self, db: Session, kb, urls: List[str]) -> List[dict]:
        import httpx
        from bs4 import BeautifulSoup
        results = []
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            for url in urls:
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    soup = BeautifulSoup(resp.text, "html.parser")
                    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                        tag.decompose()
                    text = soup.get_text(separator="\n", strip=True)
                    cleaned = clean_text(text)
                    if len(cleaned) < 10:
                        results.append({"url": url, "doc_id": None, "status": "failed", "chunk_count": 0, "error": "页面内容为空"})
                        continue
                    file_name = f"web_{uuid.uuid4().hex[:8]}_{url.replace('https://', '').replace('http://', '').replace('/', '_')[:80]}"
                    file_path = os.path.join(settings.UPLOAD_DIR, f"web_{file_name}.txt")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(cleaned)
                    doc = Document(
                        kb_id=kb.id,
                        filename=f"[Web] {url[:200]}",
                        file_path=file_path,
                        file_type="web",
                        file_size=len(cleaned.encode("utf-8")),
                        status="pending",
                    )
                    db.add(doc)
                    db.commit()
                    db.refresh(doc)
                    result = self.process_document(db, doc.id)
                    results.append({
                        "url": url,
                        "doc_id": doc.id,
                        "status": result.get("status", "completed"),
                        "chunk_count": result.get("chunk_count", 0),
                        "error": "",
                    })
                except Exception as e:
                    results.append({"url": url, "doc_id": None, "status": "failed", "chunk_count": 0, "error": str(e)})
        return results


doc_service = DocumentService()

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.schemas import (
    KBCreate, KBUpdate, KBResponse, DocumentResponse, ChunkConfig,
    CategoryCreate, CategoryUpdate, CategoryResponse, CategoryTreeResponse,
)
from app.services.kb_service import kb_service
from app.services.doc_service import doc_service
from app.services.conv_service import conv_service
from app.services.category_service import category_service
from app.utils.document_parser import validate_file
from app.core.config import settings
from app.models.models import KnowledgeBase

router = APIRouter()


@router.post("/knowledge-bases", response_model=KBResponse, summary="创建知识库")
def create_knowledge_base(data: KBCreate, db: Session = Depends(get_db)):
    if db.query(KnowledgeBase).filter(KnowledgeBase.name == data.name).first():
        raise HTTPException(400, "知识库名称已存在")
    if data.embedding_model_id:
        from app.services.model_service import model_service
        model = model_service.get(db, data.embedding_model_id)
        if not model or model.model_type != "embedding":
            raise HTTPException(400, "向量模型不存在或类型不正确")
    if data.category_id:
        if not category_service.get(db, data.category_id):
            raise HTTPException(400, "目录层级不存在")
    kb = kb_service.create(
        db,
        name=data.name,
        description=data.description,
        category_id=data.category_id,
        kb_type=data.kb_type,
        embedding_model_id=data.embedding_model_id,
        web_config=data.web_config,
        chunk_size=data.chunk_size,
        chunk_overlap=data.chunk_overlap,
        semantic_chunk_enabled=data.semantic_chunk_enabled,
    )
    return _kb_to_response(kb, db)


@router.get("/knowledge-bases", summary="查询知识库列表")
def list_knowledge_bases(
    category_id: int = None,
    kb_type: str = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(KnowledgeBase)
    if category_id is not None:
        query = query.filter(KnowledgeBase.category_id == category_id)
    if kb_type:
        query = query.filter(KnowledgeBase.kb_type == kb_type)
    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    items = query.order_by(KnowledgeBase.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [_kb_to_response(kb, db) for kb in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/knowledge-bases/{kb_id}", response_model=KBResponse, summary="查询单个知识库")
def get_knowledge_base(kb_id: int, db: Session = Depends(get_db)):
    kb = kb_service.get(db, kb_id)
    if not kb:
        raise HTTPException(404, "知识库不存在")
    return _kb_to_response(kb, db)


@router.put("/knowledge-bases/{kb_id}", response_model=KBResponse, summary="修改知识库")
def update_knowledge_base(kb_id: int, data: KBUpdate, db: Session = Depends(get_db)):
    if data.embedding_model_id:
        from app.services.model_service import model_service
        model = model_service.get(db, data.embedding_model_id)
        if not model or model.model_type != "embedding":
            raise HTTPException(400, "向量模型不存在或类型不正确")
    kb = kb_service.update(
        db, kb_id,
        name=data.name,
        description=data.description,
        category_id=data.category_id,
        embedding_model_id=data.embedding_model_id,
        web_config=data.web_config,
        chunk_size=data.chunk_size,
        chunk_overlap=data.chunk_overlap,
        semantic_chunk_enabled=data.semantic_chunk_enabled,
    )
    if not kb:
        raise HTTPException(404, "知识库不存在")
    return _kb_to_response(kb, db)


@router.delete("/knowledge-bases/{kb_id}", summary="删除知识库")
def delete_knowledge_base(kb_id: int, db: Session = Depends(get_db)):
    if not kb_service.delete(db, kb_id):
        raise HTTPException(404, "知识库不存在")
    return {"code": 200, "message": "知识库已删除"}


@router.post("/knowledge-bases/{kb_id}/documents/upload", summary="上传文档")
async def upload_documents(
    kb_id: int,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    kb = kb_service.get(db, kb_id)
    if not kb:
        raise HTTPException(404, "知识库不存在")
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    results = []
    for file in files:
        if not validate_file(file.filename):
            results.append({"filename": file.filename, "error": "不支持的文件格式"})
            continue
        content = await file.read()
        if len(content) == 0:
            results.append({"filename": file.filename, "error": "文件内容为空"})
            continue
        if len(content) > max_size:
            results.append({"filename": file.filename, "error": f"文件大小超过限制({settings.MAX_UPLOAD_SIZE_MB}MB)"})
            continue
        if not validate_file(file.filename, content):
            results.append({"filename": file.filename, "error": "文件内容与扩展名不匹配"})
            continue
        file_path = doc_service.save_upload(content, file.filename)
        doc = doc_service.create_record(db, kb_id, file.filename, file_path, len(content))
        background_tasks.add_task(_process_doc_background, doc.id)
        results.append({
            "doc_id": doc.id,
            "filename": file.filename,
            "status": "pending",
            "chunk_count": 0,
            "error": "",
        })
    if all(r.get("error") for r in results):
        raise HTTPException(400, detail={"message": "所有文件上传失败", "errors": results})
    return {"code": 200, "message": "上传成功，文档正在后台处理", "data": results}


def _process_doc_background(doc_id: int):
    import logging
    logger = logging.getLogger(__name__)
    from app.core.database import SessionLocal
    from app.models.models import Document
    bg_db = SessionLocal()
    try:
        doc_service.process_document(bg_db, doc_id)
    except Exception as e:
        logger.error(f"后台文档处理失败 doc_id={doc_id}: {e}", exc_info=True)
        try:
            doc = bg_db.query(Document).filter(Document.id == doc_id).first()
            if doc and doc.status not in ("completed", "failed"):
                doc.status = "failed"
                doc.error_message = f"后台处理异常: {str(e)[:500]}"
                bg_db.commit()
        except Exception:
            logger.error(f"更新失败文档状态也失败 doc_id={doc_id}", exc_info=True)
    finally:
        bg_db.close()


@router.get("/knowledge-bases/{kb_id}/documents", summary="查询文档列表")
def list_documents(
    kb_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    kb = kb_service.get(db, kb_id)
    if not kb:
        raise HTTPException(404, "知识库不存在")
    from app.models.models import Document
    query = db.query(Document).filter(Document.kb_id == kb_id)
    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    items = query.order_by(Document.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.delete("/documents/{doc_id}", summary="删除文档")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    if not doc_service.delete_document(db, doc_id):
        raise HTTPException(404, "文档不存在")
    return {"code": 200, "message": "文档已删除"}


@router.post("/documents/batch-delete", summary="批量删除文档")
def batch_delete_documents(doc_ids: List[int], db: Session = Depends(get_db)):
    if not doc_ids:
        raise HTTPException(400, "文档ID列表不能为空")
    deleted = 0
    failed = []
    for doc_id in doc_ids:
        try:
            if doc_service.delete_document(db, doc_id):
                deleted += 1
            else:
                failed.append({"doc_id": doc_id, "error": "文档不存在"})
        except Exception as e:
            failed.append({"doc_id": doc_id, "error": str(e)})
    if deleted == 0:
        raise HTTPException(404, detail={"message": "未找到任何可删除的文档", "errors": failed})
    return {"code": 200, "message": f"已删除 {deleted} 个文档", "failed": failed}


@router.post("/documents/{doc_id}/reprocess", summary="重新处理文档")
def reprocess_document(doc_id: int, db: Session = Depends(get_db)):
    try:
        result = doc_service.reprocess_document(db, doc_id)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, f"重新处理失败: {e}")
    return {"code": 200, "message": "重新处理完成", "data": result}


@router.post("/documents/{doc_id}/summary", summary="生成文档摘要")
def generate_summary(doc_id: int, db: Session = Depends(get_db)):
    doc = doc_service.get_document(db, doc_id)
    if not doc:
        raise HTTPException(404, "文档不存在")
    try:
        summary = doc_service.generate_summary(db, doc_id)
    except Exception as e:
        raise HTTPException(500, f"摘要生成失败: {e}")
    return {"code": 200, "data": {"summary": summary}}


@router.get("/documents/{doc_id}/chunks", summary="获取文档切片列表")
def get_document_chunks(
    doc_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from app.models.models import DocumentChunk
    doc = doc_service.get_document(db, doc_id)
    if not doc:
        raise HTTPException(404, "文档不存在")
    query = db.query(DocumentChunk).filter(DocumentChunk.doc_id == doc_id)
    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    items = query.order_by(DocumentChunk.chunk_index).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [
            {
                "id": chunk.id,
                "doc_id": chunk.doc_id,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "token_count": chunk.token_count,
                "created_at": chunk.created_at.isoformat() if chunk.created_at else None,
            }
            for chunk in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/documents/{doc_id}/download", summary="下载文档原始文件")
def download_document(doc_id: int, db: Session = Depends(get_db)):
    try:
        file_path, filename, file_type = doc_service.get_file_for_download(db, doc_id)
    except ValueError as e:
        raise HTTPException(404, str(e))
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
    )


@router.get("/documents/{doc_id}/preview", summary="预览文档内容")
def preview_document(doc_id: int, db: Session = Depends(get_db)):
    try:
        file_path, filename, file_type = doc_service.get_file_for_download(db, doc_id)
    except ValueError as e:
        raise HTTPException(404, str(e))

    if file_type == "pdf":
        return FileResponse(
            path=file_path,
            media_type="application/pdf",
            headers={"Content-Disposition": "inline"},
        )

    if file_type in ("markdown", "txt"):
        for enc in ("utf-8", "gbk", "gb2312", "latin-1"):
            try:
                with open(file_path, "r", encoding=enc) as f:
                    content = f.read()
                break
            except (UnicodeDecodeError, LookupError):
                continue
        else:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
    else:
        from app.utils.document_parser import parse_document
        try:
            content = parse_document(file_path)
        except Exception as e:
            raise HTTPException(500, f"文件解析失败: {e}")

    return {"code": 200, "data": {"content": content, "filename": filename, "file_type": file_type}}


@router.post("/knowledge-bases/{kb_id}/clean-vectors", summary="清理失效向量")
def clean_vectors(kb_id: int, db: Session = Depends(get_db)):
    kb = kb_service.get(db, kb_id)
    if not kb:
        raise HTTPException(404, "知识库不存在")
    count = doc_service.clean_orphan_vectors(db, kb_id)
    return {"code": 200, "message": f"清理了 {count} 条失效向量"}


@router.post("/knowledge-bases/{kb_id}/clear-vectors", summary="清空知识库向量")
def clear_vectors(kb_id: int, db: Session = Depends(get_db)):
    from app.rag.vector_store import vector_store
    from app.rag.multi_retriever import bm25_cache
    kb = kb_service.get(db, kb_id)
    if not kb:
        raise HTTPException(404, "知识库不存在")
    stats = vector_store.get_collection_stats(kb.chroma_collection)
    count = stats.get("count", 0)
    vector_store.delete_collection(kb.chroma_collection)
    vector_store.get_or_create_collection(kb.id, kb.chroma_collection)
    bm25_cache.invalidate(kb.chroma_collection)
    return {"code": 200, "message": f"已清空 {count} 条向量数据"}


@router.put("/knowledge-bases/{kb_id}/chunk-config", summary="配置切片参数")
def update_chunk_config(kb_id: int, config: ChunkConfig, db: Session = Depends(get_db)):
    kb = kb_service.update(
        db, kb_id,
        chunk_size=config.chunk_size,
        chunk_overlap=config.chunk_overlap,
        semantic_chunk_enabled=config.semantic_chunk_enabled,
    )
    if not kb:
        raise HTTPException(404, "知识库不存在")
    return {"code": 200, "message": "切片参数已更新"}


@router.post("/knowledge-bases/{kb_id}/crawl", summary="抓取网页内容(web类型知识库)")
async def crawl_web_content(kb_id: int, db: Session = Depends(get_db)):
    kb = kb_service.get(db, kb_id)
    if not kb:
        raise HTTPException(404, "知识库不存在")
    if kb.kb_type != "web":
        raise HTTPException(400, "仅支持网站链接类型的知识库")
    import json
    web_config = json.loads(kb.web_config) if kb.web_config else {}
    urls = web_config.get("urls", [])
    if not urls:
        raise HTTPException(400, "未配置抓取URL，请在知识库web_config中配置urls列表")
    from app.services.doc_service import doc_service
    results = await doc_service.crawl_and_process(db, kb, urls)
    return {"code": 200, "message": "网页抓取完成", "data": results}


@router.post("/knowledge-bases/{kb_id}/hit-test", summary="命中测试（仅检索，不调用LLM）")
def hit_test(kb_id: int, query: str = Query(..., min_length=1, max_length=4096),
             top_k: int = Query(default=5, ge=1, le=50),
             similarity_threshold: float = Query(default=0.6, ge=0.0, le=1.0),
             db: Session = Depends(get_db)):
    kb = kb_service.get(db, kb_id)
    if not kb:
        raise HTTPException(404, "知识库不存在")

    import time
    from app.rag.multi_retriever import multi_retriever
    from app.rag.reranker import reranker
    from app.rag.query_rewriter import query_rewriter
    from app.services.doc_service import doc_service
    from app.services.model_service import model_service

    start_time = time.time()
    try:
        default_llm = model_service.get_default_llm_client(db)
    except ValueError:
        default_llm = None
    rewritten_query = query_rewriter.rewrite(query, chat_history=None, custom_llm_client=default_llm)
    emb_client = doc_service._get_embedding_client(kb)
    query_embedding = emb_client.embed_query(rewritten_query)
    candidates = multi_retriever.retrieve(
        collection_name=kb.chroma_collection,
        query=rewritten_query,
        query_embedding=query_embedding,
    )
    reranked = reranker.rerank(
        query=rewritten_query,
        documents=candidates,
        top_k=top_k,
        threshold=similarity_threshold,
    )
    latency = int((time.time() - start_time) * 1000)

    hits = []
    for chunk in reranked:
        hits.append({
            "chunk_id": chunk.get("metadata", {}).get("chunk_db_id", 0),
            "doc_id": chunk.get("metadata", {}).get("doc_id", 0),
            "doc_name": chunk.get("metadata", {}).get("doc_name", ""),
            "content": chunk.get("content", "")[:500],
            "score": chunk.get("final_score", chunk.get("score", 0)),
            "retrieval_source": chunk.get("retrieval_source", ""),
        })

    return {
        "code": 200,
        "data": {
            "query": query,
            "rewritten_query": rewritten_query,
            "hits": hits,
            "total_hits": len(hits),
            "latency_ms": latency,
        },
    }


def _kb_to_response(kb, db: Session) -> KBResponse:
    return KBResponse(
        id=kb.id, name=kb.name, description=kb.description,
        category_id=kb.category_id, kb_type=kb.kb_type,
        embedding_model_id=kb.embedding_model_id, web_config=kb.web_config,
        chunk_size=kb.chunk_size, chunk_overlap=kb.chunk_overlap,
        semantic_chunk_enabled=kb.semantic_chunk_enabled,
        chroma_collection=kb.chroma_collection,
        document_count=kb_service.get_document_count(db, kb.id),
        chunk_count=kb_service.get_chunk_count(db, kb.id),
        created_at=kb.created_at, updated_at=kb.updated_at,
    )


# ──────────────────────────── 目录层级管理 ────────────────────────────

@router.post("/categories", response_model=CategoryResponse, summary="创建目录层级")
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    if data.parent_id is not None:
        parent = category_service.get(db, data.parent_id)
        if not parent:
            raise HTTPException(404, "父级目录不存在")
    cat = category_service.create(
        db,
        name=data.name,
        parent_id=data.parent_id,
        description=data.description,
        sort_order=data.sort_order,
    )
    return cat


@router.get("/categories", response_model=List[CategoryResponse], summary="查询目录列表")
def list_categories(parent_id: int = None, db: Session = Depends(get_db)):
    if parent_id is not None:
        return category_service.get_children(db, parent_id)
    return category_service.get_all(db)


@router.get("/categories/tree", summary="获取目录树")
def get_category_tree(db: Session = Depends(get_db)):
    try:
        return category_service.get_tree(db)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"获取目录树失败: {e}", exc_info=True)
        raise HTTPException(500, f"获取目录树失败: {str(e)}")


@router.get("/categories/{cat_id}", response_model=CategoryResponse, summary="查询单个目录")
def get_category(cat_id: int, db: Session = Depends(get_db)):
    cat = category_service.get(db, cat_id)
    if not cat:
        raise HTTPException(404, "目录不存在")
    return cat


@router.put("/categories/{cat_id}", response_model=CategoryResponse, summary="更新目录")
def update_category(cat_id: int, data: CategoryUpdate, db: Session = Depends(get_db)):
    cat = category_service.update(
        db, cat_id,
        name=data.name,
        parent_id=data.parent_id,
        description=data.description,
        sort_order=data.sort_order,
    )
    if not cat:
        raise HTTPException(404, "目录不存在")
    return cat


@router.delete("/categories/{cat_id}", summary="删除目录")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    if not category_service.delete(db, cat_id):
        raise HTTPException(404, "目录不存在")
    return {"code": 200, "message": "目录已删除，其下知识库已移至未分类"}

"""多路检索模块。

融合稠密向量检索（ChromaDB）和稀疏BM25检索的结果：
1. 向量检索：基于语义相似度召回
2. BM25检索：基于关键词匹配召回
3. 合并去重：同一文档如果两种方式都命中，标记为 "both" 并保留双分数
"""
from typing import List, Dict, Optional
from app.rag.vector_store import vector_store
from app.rag.bm25_retriever import bm25_retriever
from app.core.config import settings
import logging
import threading

logger = logging.getLogger(__name__)


class BM25Cache:
    def __init__(self):
        self._lock = threading.Lock()
        self._index: Dict[str, dict] = {}

    def get(self, collection_name: str) -> Optional[dict]:
        with self._lock:
            return self._index.get(collection_name)

    def set(self, collection_name: str, data: dict):
        with self._lock:
            self._index[collection_name] = data

    def invalidate(self, collection_name: str):
        with self._lock:
            self._index.pop(collection_name, None)

    def invalidate_all(self):
        with self._lock:
            self._index.clear()


bm25_cache = BM25Cache()


class MultiPathRetriever:
    def retrieve(
        self,
        collection_name: str,
        query: str,
        vector_top_n: int = None,
        bm25_top_n: int = None,
        query_embedding: list = None,
    ) -> List[Dict]:
        vector_top_n = vector_top_n or settings.VECTOR_TOP_N
        bm25_top_n = bm25_top_n or settings.BM25_TOP_N

        vector_results = vector_store.query(
            collection_name=collection_name,
            query_text=query,
            n_results=vector_top_n,
            query_embedding=query_embedding,
        )
        logger.info(f"稠密向量召回 {len(vector_results)} 条")

        all_docs = self._get_all_docs(collection_name)

        bm25_results = bm25_retriever.search(query, all_docs, bm25_top_n)
        logger.info(f"BM25召回 {len(bm25_results)} 条")

        seen_ids = set()
        merged = []
        for doc in vector_results:
            doc_id = doc["id"]
            if doc_id not in seen_ids:
                seen_ids.add(doc_id)
                doc["retrieval_source"] = "vector"
                merged.append(doc)
        for doc in bm25_results:
            doc_id = doc["id"]
            if doc_id not in seen_ids:
                seen_ids.add(doc_id)
                doc["retrieval_source"] = "bm25"
                merged.append(doc)
            else:
                for m in merged:
                    if m["id"] == doc_id:
                        m["bm25_score"] = doc.get("bm25_score", 0)
                        m["retrieval_source"] = "both"
                        break
        logger.info(f"合并去重后共 {len(merged)} 条")
        return merged

    def _get_all_docs(self, collection_name: str) -> List[Dict]:
        cached = bm25_cache.get(collection_name)
        if cached:
            return cached["docs"]

        try:
            collection = vector_store.client.get_collection(collection_name)
            data = collection.get()
            if data and data["documents"]:
                all_docs = [
                    {
                        "id": data["ids"][i],
                        "content": data["documents"][i],
                        "metadata": data["metadatas"][i] if data["metadatas"] else {},
                        "score": 0.0,
                    }
                    for i in range(len(data["documents"]))
                ]
                bm25_cache.set(collection_name, {"docs": all_docs})
                return all_docs
        except Exception as e:
            logger.error(f"加载BM25文档失败 collection={collection_name}: {e}")
        return []


multi_retriever = MultiPathRetriever()

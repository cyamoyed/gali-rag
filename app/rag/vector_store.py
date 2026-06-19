"""ChromaDB 向量存储管理。

封装 ChromaDB 的增删查操作，每个知识库对应一个独立的 collection。
支持批量写入、按文档ID删除、孤儿向量清理等功能。
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class VectorStoreManager:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

    def get_or_create_collection(self, kb_id: int, collection_name: str):
        return self.client.get_or_create_collection(
            name=collection_name,
            metadata={
                "hnsw:space": "cosine",
                "hnsw:M": settings.HNSW_M,
                "hnsw:construction_ef": settings.HNSW_EF_CONSTRUCTION,
                "hnsw:search_ef": settings.HNSW_EF_SEARCH,
            },
        )

    def get_collection(self, collection_name: str):
        try:
            return self.client.get_collection(name=collection_name)
        except Exception as e:
            err_str = str(e).lower()
            if "does not exist" in err_str or "not found" in err_str:
                return None
            logger.error(f"获取向量集合失败 {collection_name}: {e}")
            raise

    def add_documents(
        self,
        collection_name: str,
        chunks: List[str],
        metadatas: List[Dict],
        ids: List[str],
        embeddings: Optional[List[List[float]]] = None,
    ):
        collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={
                "hnsw:space": "cosine",
                "hnsw:M": settings.HNSW_M,
                "hnsw:construction_ef": settings.HNSW_EF_CONSTRUCTION,
                "hnsw:search_ef": settings.HNSW_EF_SEARCH,
            },
        )
        batch_size = 500
        for i in range(0, len(chunks), batch_size):
            end = min(i + batch_size, len(chunks))
            kwargs = {
                "documents": chunks[i:end],
                "metadatas": metadatas[i:end],
                "ids": ids[i:end],
            }
            if embeddings:
                kwargs["embeddings"] = embeddings[i:end]
            collection.add(**kwargs)
        return len(chunks)

    def query(
        self,
        collection_name: str,
        query_text: str,
        n_results: int = 5,
        where: Optional[Dict] = None,
        query_embedding: Optional[List[float]] = None,
    ) -> List[Dict]:
        collection = self.client.get_collection(name=collection_name)
        if collection.count() == 0:
            return []
        actual_n = min(n_results, collection.count())
        kwargs: Dict = {"n_results": actual_n}
        if query_embedding:
            kwargs["query_embeddings"] = [query_embedding]
        else:
            kwargs["query_texts"] = [query_text]
        if where:
            kwargs["where"] = where
        results = collection.query(**kwargs)
        documents = results["documents"][0] if results["documents"] else []
        metadatas = results["metadatas"][0] if results["metadatas"] else []
        distances = results["distances"][0] if results["distances"] else []
        ids = results["ids"][0] if results["ids"] else []
        out = []
        for i in range(len(documents)):
            score = 1.0 - distances[i] if i < len(distances) else 0.0
            out.append({
                "id": ids[i] if i < len(ids) else "",
                "content": documents[i],
                "metadata": metadatas[i] if i < len(metadatas) else {},
                "score": round(score, 4),
            })
        return out

    def delete_by_doc_id(self, collection_name: str, doc_id: int):
        try:
            collection = self.client.get_collection(name=collection_name)
        except Exception:
            return 0
        results = collection.get(where={"doc_id": doc_id})
        if results and results["ids"]:
            collection.delete(ids=results["ids"])
            return len(results["ids"])
        return 0

    def delete_collection(self, collection_name: str):
        try:
            self.client.delete_collection(name=collection_name)
        except Exception as e:
            logger.warning(f"删除向量集合失败 {collection_name}: {e}")

    def clean_orphan_chunks(self, collection_name: str, valid_doc_ids: List[int]) -> int:
        try:
            collection = self.client.get_collection(name=collection_name)
        except Exception:
            return 0
        all_data = collection.get()
        if not all_data or not all_data["ids"]:
            return 0
        orphan_ids = []
        for i, meta in enumerate(all_data["metadatas"]):
            if meta and meta.get("doc_id") not in valid_doc_ids:
                orphan_ids.append(all_data["ids"][i])
        if orphan_ids:
            collection.delete(ids=orphan_ids)
        return len(orphan_ids)

    def get_collection_stats(self, collection_name: str) -> Dict:
        try:
            collection = self.client.get_collection(name=collection_name)
            return {"count": collection.count(), "name": collection_name}
        except Exception:
            return {"count": 0, "name": collection_name}

    def get_storage_size(self) -> float:
        import os
        total = 0
        for dirpath, _, filenames in os.walk(settings.CHROMA_PERSIST_DIR):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                total += os.path.getsize(fp)
        return round(total / (1024 * 1024), 2)


vector_store = VectorStoreManager()

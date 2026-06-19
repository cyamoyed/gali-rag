"""重排序模块。

使用 Reciprocal Rank Fusion (RRF) 算法对混合检索结果进行融合排序。
- 同时命中向量和BM25的文档获得更高权重
- 仅命中单一来源的文档权重减半
- 按 final_score 降序排列，低于阈值的文档被过滤
"""
from typing import List, Dict
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# RRF常量K，控制排名差异的平滑程度，K越大排名差距影响越小
RRF_K = 60


class Reranker:
    def rerank(
        self,
        query: str,
        documents: List[Dict],
        top_k: int = None,
        threshold: float = None,
    ) -> List[Dict]:
        top_k = top_k or settings.DEFAULT_TOP_K
        threshold = threshold if threshold is not None else settings.SIMILARITY_THRESHOLD

        for doc in documents:
            vector_score = doc.get("score", 0.0)
            bm25_score = doc.get("bm25_score", 0.0)
            source = doc.get("retrieval_source", "vector")

            if source == "both":
                vector_rank = self._rank_by_score(doc, documents, "score")
                bm25_rank = self._rank_by_score(doc, documents, "bm25_score")
                doc["final_score"] = round(
                    1.0 / (RRF_K + vector_rank) + 1.0 / (RRF_K + bm25_rank), 4
                )
            elif source == "bm25":
                bm25_rank = self._rank_by_score(doc, documents, "bm25_score")
                doc["final_score"] = round(0.5 / (RRF_K + bm25_rank), 4)
            else:
                doc["final_score"] = vector_score

        documents.sort(key=lambda x: x.get("final_score", 0), reverse=True)
        filtered = [d for d in documents if d.get("final_score", 0) >= threshold]
        logger.info(f"重排序后保留 {len(filtered)} 条（阈值={threshold}），原始 {len(documents)} 条")
        return filtered[:top_k]

    def _rank_by_score(self, doc: Dict, all_docs: List[Dict], score_key: str) -> int:
        target = doc.get(score_key, 0)
        rank = 1
        for d in all_docs:
            if d.get(score_key, 0) > target:
                rank += 1
        return rank


reranker = Reranker()

"""BM25稀疏检索模块。

使用 jieba 分词 + BM25Okapi 算法对文档进行关键词匹配检索。
适用于精确术语匹配场景，与向量检索互补。
"""
from typing import List, Dict
from rank_bm25 import BM25Okapi
import jieba


class BM25Retriever:
    def __init__(self):
        pass

    def _tokenize(self, text: str) -> List[str]:
        return list(jieba.cut(text))

    def search(
        self,
        query: str,
        documents: List[Dict],
        top_n: int = 5,
    ) -> List[Dict]:
        if not documents:
            return []
        corpus = [self._tokenize(doc["content"]) for doc in documents]
        bm25 = BM25Okapi(corpus)
        query_tokens = self._tokenize(query)
        scores = bm25.get_scores(query_tokens)
        scored_docs = []
        for i, doc in enumerate(documents):
            scored_docs.append({
                **doc,
                "bm25_score": round(float(scores[i]), 4),
            })
        scored_docs.sort(key=lambda x: x["bm25_score"], reverse=True)
        return scored_docs[:top_n]


bm25_retriever = BM25Retriever()

from app.services.vector_service import vector_service
from app.rag.embeddings.embedding_client import embedding_client


class HybridRetriever:
    async def retrieve(self, query: str, kb_ids: list[str], top_k: int = 5) -> list[dict]:
        query_embeddings = await embedding_client.embed([query])
        query_embedding = query_embeddings[0]
        results = await vector_service.search(query_embedding=query_embedding, kb_ids=kb_ids, top_k=top_k)
        return results


hybrid_retriever = HybridRetriever()

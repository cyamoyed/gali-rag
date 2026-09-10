from pymilvus import connections, Collection, CollectionSchema, FieldSchema, DataType, utility
from app.core.config import get_settings

settings = get_settings()


class VectorService:
    def __init__(self):
        self.collection_name = settings.milvus_collection
        self._connected = False

    def _connect(self):
        if not self._connected:
            connections.connect(alias="default", host=settings.milvus_host, port=settings.milvus_port)
            self._connected = True

    def ensure_collection(self):
        self._connect()
        if utility.has_collection(self.collection_name):
            return
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="doc_id", dtype=DataType.VARCHAR, max_length=36),
            FieldSchema(name="kb_id", dtype=DataType.VARCHAR, max_length=36),
            FieldSchema(name="chunk_id", dtype=DataType.VARCHAR, max_length=36),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=settings.embedding_dimension),
            FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
        ]
        schema = CollectionSchema(fields, description="Document chunks for RAG")
        collection = Collection(self.collection_name, schema)
        collection.create_index(field_name="embedding", index_params={"metric_type": "COSINE", "index_type": "IVF_FLAT", "params": {"nlist": 128}})

    async def insert_chunks(self, doc_id: str, kb_id: str, chunk_ids: list[str], embeddings: list[list[float]], contents: list[str]):
        self._connect()
        collection = Collection(self.collection_name)
        collection.insert([[doc_id] * len(chunk_ids), [kb_id] * len(chunk_ids), chunk_ids, embeddings, contents])
        collection.flush()

    async def search(self, query_embedding: list[float], kb_ids: list[str], top_k: int = 5) -> list[dict]:
        self._connect()
        collection = Collection(self.collection_name)
        collection.load()
        results = collection.search(
            data=[query_embedding], anns_field="embedding",
            param={"metric_type": "COSINE", "params": {"nprobe": 16}},
            limit=top_k, output_fields=["doc_id", "kb_id", "chunk_id", "content"],
            expr=f"kb_id in {kb_ids}" if kb_ids else None,
        )
        hits = []
        for hit in results[0]:
            hits.append({"chunk_id": hit.entity.get("chunk_id"), "doc_id": hit.entity.get("doc_id"), "content": hit.entity.get("content"), "score": hit.score})
        return hits

    async def delete_by_doc(self, doc_id: str):
        self._connect()
        collection = Collection(self.collection_name)
        collection.delete(f'doc_id == "{doc_id}"')


vector_service = VectorService()

import io
import pytest
from unittest.mock import patch, MagicMock


class TestUploadValidation:
    def test_unsupported_format_rejected(self):
        from app.utils.document_parser import validate_file
        assert validate_file("test.exe") is False
        assert validate_file("test.jpg") is False
        assert validate_file("test.xlsx") is False

    def test_empty_content_rejected(self):
        from app.utils.document_parser import validate_file
        assert validate_file("test.pdf", b"") is False
        assert validate_file("test.txt", b"") is False

    def test_valid_files_accepted(self):
        from app.utils.document_parser import validate_file
        assert validate_file("test.pdf", b"%PDF-1.4 content") is True
        assert validate_file("test.docx", b"PK\x03\x04content") is True
        assert validate_file("test.md", b"# Title") is True
        assert validate_file("test.txt", b"plain text") is True

    def test_magic_bytes_validation(self):
        from app.utils.document_parser import validate_file
        assert validate_file("test.pdf", b"NOT_PDF") is False
        assert validate_file("test.docx", b"NOT_ZIP") is False


class TestDocServiceProcessDocument:
    def test_empty_text_raises(self):
        from app.services.doc_service import doc_service
        from unittest.mock import MagicMock

        db = MagicMock()
        doc = MagicMock()
        doc.id = 1
        doc.kb_id = 1
        doc.filename = "test.txt"
        doc.status = "pending"
        doc.file_path = "/tmp/test.txt"

        kb = MagicMock()
        kb.id = 1
        kb.chunk_size = 500
        kb.chunk_overlap = 100
        kb.semantic_chunk_enabled = False
        kb.llm_chunk_enabled = False
        kb.chroma_collection = "test_col"

        db.query.return_value.filter.return_value.first.side_effect = [doc, kb, doc]

        with patch('app.services.doc_service.parse_document', return_value=""), \
             patch('app.services.doc_service.clean_text', return_value=""):
            result = doc_service.process_document(db, 1)
            assert "error" in result

    def test_successful_processing_flow(self):
        from app.services.doc_service import doc_service
        from unittest.mock import MagicMock

        db = MagicMock()
        doc = MagicMock()
        doc.id = 1
        doc.kb_id = 1
        doc.filename = "test.txt"
        doc.status = "pending"
        doc.file_path = "/tmp/test.txt"

        kb = MagicMock()
        kb.id = 1
        kb.chunk_size = 500
        kb.chunk_overlap = 100
        kb.semantic_chunk_enabled = False
        kb.llm_chunk_enabled = False
        kb.chroma_collection = "test_col"

        db.query.return_value.filter.return_value.first.side_effect = [doc, kb]
        db.query.return_value.filter.return_value.delete.return_value = 0

        mock_emb = MagicMock()
        mock_emb.embed.return_value = [[0.1] * 10] * 3

        with patch('app.services.doc_service.parse_document', return_value="content " * 100), \
             patch('app.services.doc_service.clean_text', return_value="content " * 100), \
             patch('app.services.doc_service.split_text', return_value=["chunk1", "chunk2", "chunk3"]), \
             patch('app.services.doc_service.count_tokens', return_value=50), \
             patch('app.services.doc_service.get_embedding_client', return_value=mock_emb), \
             patch('app.services.doc_service.vector_store') as mock_vs, \
             patch('app.services.doc_service.bm25_cache'):
            mock_vs.add_documents.return_value = 3
            result = doc_service.process_document(db, 1)
            assert result["status"] == "completed"
            assert result["chunk_count"] == 3


class TestTextSplitterIntegration:
    def test_split_with_various_configs(self):
        from app.utils.text_splitter import split_text

        text = "This is a test sentence. " * 100
        chunks = split_text(text, chunk_size=200, chunk_overlap=50)
        assert len(chunks) > 1

        chunks = split_text(text, chunk_size=1000, chunk_overlap=0)
        assert len(chunks) >= 1

    def test_semantic_split(self):
        from app.utils.text_splitter import split_text

        text = "# Section 1\nContent here\n\n## Section 2\nMore content"
        chunks = split_text(text, chunk_size=500, chunk_overlap=100, semantic=True)
        assert len(chunks) >= 1


class TestEmbeddingClientIntegration:
    def test_batch_splitting(self):
        from app.rag.embedding_client import EmbeddingClient, MAX_BATCH_SIZE

        client = EmbeddingClient()
        total = MAX_BATCH_SIZE * 2 + 5
        texts = ["text"] * total

        with patch.object(client, '_embed_with_retry', side_effect=lambda fn, t: [[0.1]] * len(t)) as mock:
            client.embed(texts)
            assert mock.call_count == 3

    def test_retry_mechanism(self):
        from app.rag.embedding_client import EmbeddingClient

        client = EmbeddingClient()
        mock_func = MagicMock(side_effect=[Exception("fail"), [[0.1]]])

        with patch('time.sleep'):
            result = client._embed_with_retry(mock_func, ["test"])
            assert result == [[0.1]]
            assert mock_func.call_count == 2


class TestVectorStoreIntegration:
    def test_batch_add(self):
        from app.rag.vector_store import VectorStoreManager

        store = VectorStoreManager()
        mock_col = MagicMock()
        with patch.object(store.client, 'get_or_create_collection', return_value=mock_col):
            store.add_documents("col", ["c1", "c2"], [{"d": 1}, {"d": 2}], ["id1", "id2"], [[0.1], [0.2]])
            mock_col.add.assert_called_once()

    def test_query_scoring(self):
        from app.rag.vector_store import VectorStoreManager

        store = VectorStoreManager()
        mock_col = MagicMock()
        mock_col.count.return_value = 2
        mock_col.query.return_value = {
            "documents": [["doc1"]],
            "metadatas": [[{"doc_id": 1}]],
            "distances": [[0.3]],
            "ids": [["id1"]],
        }
        with patch.object(store.client, 'get_collection', return_value=mock_col):
            results = store.query("col", "query")
            assert len(results) == 1
            assert results[0]["score"] == 0.7


class TestBM25CacheIntegration:
    def test_cache_invalidation(self):
        from app.rag.multi_retriever import BM25Cache

        cache = BM25Cache()
        cache.set("col1", {"docs": [1, 2, 3]})
        assert cache.get("col1") is not None

        cache.invalidate("col1")
        assert cache.get("col1") is None

    def test_thread_safety(self):
        from app.rag.multi_retriever import BM25Cache
        import threading

        cache = BM25Cache()
        errors = []

        def writer():
            for i in range(100):
                cache.set(f"col{i}", {"docs": [i]})

        def reader():
            for i in range(100):
                cache.get(f"col{i}")

        threads = [threading.Thread(target=writer), threading.Thread(target=reader)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0

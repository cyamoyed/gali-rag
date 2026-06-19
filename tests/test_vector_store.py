import pytest
from unittest.mock import patch, MagicMock
from app.rag.vector_store import VectorStoreManager


class TestVectorStoreManager:
    def test_singleton_instance(self):
        from app.rag.vector_store import vector_store
        assert isinstance(vector_store, VectorStoreManager)


class TestAddDocuments:
    def test_batch_add(self):
        store = VectorStoreManager()
        mock_collection = MagicMock()
        with patch.object(store.client, 'get_or_create_collection', return_value=mock_collection):
            chunks = ["chunk1", "chunk2", "chunk3"]
            metadatas = [{"doc_id": 1}, {"doc_id": 1}, {"doc_id": 1}]
            ids = ["id1", "id2", "id3"]
            embeddings = [[0.1], [0.2], [0.3]]
            result = store.add_documents("test_col", chunks, metadatas, ids, embeddings)
            assert result == 3
            mock_collection.add.assert_called_once()

    def test_large_batch_split(self):
        store = VectorStoreManager()
        mock_collection = MagicMock()
        with patch.object(store.client, 'get_or_create_collection', return_value=mock_collection):
            size = 1200
            chunks = [f"chunk{i}" for i in range(size)]
            metadatas = [{"doc_id": 1} for _ in range(size)]
            ids = [f"id{i}" for i in range(size)]
            store.add_documents("test_col", chunks, metadatas, ids)
            assert mock_collection.add.call_count == 3


class TestQuery:
    def test_empty_collection_returns_empty(self):
        store = VectorStoreManager()
        mock_collection = MagicMock()
        mock_collection.count.return_value = 0
        with patch.object(store.client, 'get_collection', return_value=mock_collection):
            result = store.query("test_col", "query text")
            assert result == []

    def test_query_returns_scored_results(self):
        store = VectorStoreManager()
        mock_collection = MagicMock()
        mock_collection.count.return_value = 5
        mock_collection.query.return_value = {
            "documents": [["doc1", "doc2"]],
            "metadatas": [[{"doc_id": 1}, {"doc_id": 2}]],
            "distances": [[0.2, 0.5]],
            "ids": [["id1", "id2"]],
        }
        with patch.object(store.client, 'get_collection', return_value=mock_collection):
            results = store.query("test_col", "query", n_results=5)
            assert len(results) == 2
            assert results[0]["score"] == 0.8
            assert results[1]["score"] == 0.5


class TestDeleteByDocId:
    def test_delete_existing_doc(self):
        store = VectorStoreManager()
        mock_collection = MagicMock()
        mock_collection.get.return_value = {"ids": ["id1", "id2"]}
        with patch.object(store.client, 'get_collection', return_value=mock_collection):
            count = store.delete_by_doc_id("test_col", 1)
            assert count == 2
            mock_collection.delete.assert_called_once()

    def test_delete_nonexistent_doc(self):
        store = VectorStoreManager()
        mock_collection = MagicMock()
        mock_collection.get.return_value = {"ids": []}
        with patch.object(store.client, 'get_collection', return_value=mock_collection):
            count = store.delete_by_doc_id("test_col", 999)
            assert count == 0

    def test_delete_collection_not_found(self):
        store = VectorStoreManager()
        with patch.object(store.client, 'get_collection', side_effect=Exception("not found")):
            count = store.delete_by_doc_id("nonexistent", 1)
            assert count == 0


class TestDeleteCollection:
    def test_successful_delete(self):
        store = VectorStoreManager()
        with patch.object(store.client, 'delete_collection'):
            store.delete_collection("test_col")

    def test_delete_nonexistent_collection(self):
        store = VectorStoreManager()
        with patch.object(store.client, 'delete_collection', side_effect=Exception("not found")):
            store.delete_collection("nonexistent")


class TestCleanOrphanChunks:
    def test_clean_orphans(self):
        store = VectorStoreManager()
        mock_collection = MagicMock()
        mock_collection.get.return_value = {
            "ids": ["id1", "id2", "id3"],
            "metadatas": [
                {"doc_id": 1},
                {"doc_id": 2},
                {"doc_id": 999},
            ],
        }
        with patch.object(store.client, 'get_collection', return_value=mock_collection):
            count = store.clean_orphan_chunks("test_col", [1, 2])
            assert count == 1
            mock_collection.delete.assert_called_once_with(ids=["id3"])

    def test_no_orphans(self):
        store = VectorStoreManager()
        mock_collection = MagicMock()
        mock_collection.get.return_value = {
            "ids": ["id1", "id2"],
            "metadatas": [{"doc_id": 1}, {"doc_id": 2}],
        }
        with patch.object(store.client, 'get_collection', return_value=mock_collection):
            count = store.clean_orphan_chunks("test_col", [1, 2])
            assert count == 0

    def test_collection_not_found(self):
        store = VectorStoreManager()
        with patch.object(store.client, 'get_collection', side_effect=Exception("not found")):
            count = store.clean_orphan_chunks("nonexistent", [1])
            assert count == 0


class TestGetCollectionStats:
    def test_existing_collection(self):
        store = VectorStoreManager()
        mock_collection = MagicMock()
        mock_collection.count.return_value = 42
        with patch.object(store.client, 'get_collection', return_value=mock_collection):
            stats = store.get_collection_stats("test_col")
            assert stats["count"] == 42
            assert stats["name"] == "test_col"

    def test_nonexistent_collection(self):
        store = VectorStoreManager()
        with patch.object(store.client, 'get_collection', side_effect=Exception("not found")):
            stats = store.get_collection_stats("nonexistent")
            assert stats["count"] == 0

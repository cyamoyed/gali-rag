import pytest
from unittest.mock import patch, MagicMock
from app.rag.embedding_client import EmbeddingClient, get_embedding_client, MAX_BATCH_SIZE


class TestEmbeddingClientInit:
    def test_default_values(self):
        client = EmbeddingClient()
        assert client.provider == "ollama"
        assert client.model_name == ""
        assert client.timeout == 60.0

    def test_custom_values(self):
        client = EmbeddingClient(
            provider="openai", model_name="text-embedding-3-small",
            api_key="sk-test", base_url="https://api.openai.com/v1", timeout=30.0
        )
        assert client.provider == "openai"
        assert client.model_name == "text-embedding-3-small"
        assert client.api_key == "sk-test"


class TestGetEmbeddingClient:
    def test_returns_embedding_client(self):
        client = get_embedding_client("ollama", "nomic-embed-text")
        assert isinstance(client, EmbeddingClient)
        assert client.provider == "ollama"
        assert client.model_name == "nomic-embed-text"


class TestEmbedEmptyInput:
    def test_empty_texts_returns_empty(self):
        client = EmbeddingClient()
        assert client.embed([]) == []

    def test_embed_query_returns_single_vector(self):
        client = EmbeddingClient()
        with patch.object(client, 'embed', return_value=[[0.1, 0.2, 0.3]]):
            result = client.embed_query("test")
            assert result == [0.1, 0.2, 0.3]

    def test_embed_query_empty_result(self):
        client = EmbeddingClient()
        with patch.object(client, 'embed', return_value=[]):
            result = client.embed_query("test")
            assert result == []


class TestEmbedBatching:
    def test_large_input_batched(self):
        client = EmbeddingClient()
        texts = ["text"] * (MAX_BATCH_SIZE * 3)
        mock_embeddings = [[0.1]] * MAX_BATCH_SIZE

        with patch.object(client, '_embed_with_retry', return_value=mock_embeddings) as mock_retry:
            client.embed(texts)
            assert mock_retry.call_count == 3

    def test_small_input_single_batch(self):
        client = EmbeddingClient()
        texts = ["text"] * 5
        mock_embeddings = [[0.1]] * 5

        with patch.object(client, '_embed_with_retry', return_value=mock_embeddings) as mock_retry:
            client.embed(texts)
            assert mock_retry.call_count == 1


class TestEmbedWithRetry:
    def test_success_on_first_try(self):
        client = EmbeddingClient()
        mock_func = MagicMock(return_value=[[0.1, 0.2]])
        result = client._embed_with_retry(mock_func, ["test"])
        assert result == [[0.1, 0.2]]
        assert mock_func.call_count == 1

    def test_retry_on_failure_then_success(self):
        client = EmbeddingClient()
        mock_func = MagicMock(side_effect=[Exception("fail"), [[0.1, 0.2]]])
        with patch('time.sleep'):
            result = client._embed_with_retry(mock_func, ["test"])
            assert result == [[0.1, 0.2]]
            assert mock_func.call_count == 2

    def test_all_retries_fail_raises(self):
        client = EmbeddingClient()
        mock_func = MagicMock(side_effect=Exception("always fail"))
        with patch('time.sleep'):
            with pytest.raises(Exception, match="always fail"):
                client._embed_with_retry(mock_func, ["test"])
            assert mock_func.call_count == 3

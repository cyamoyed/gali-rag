"""Embedding向量化客户端。

封装 Ollama 和 OpenAI 兼容格式的 Embedding 调用。
支持批量分片（每批最多10条）和自动重试（最多3次，指数退避）。
"""
from typing import List, Optional
import httpx
import json
import logging
import time

logger = logging.getLogger(__name__)

MAX_BATCH_SIZE = 10
MAX_RETRIES = 3


class EmbeddingClient:
    def __init__(self, provider: str = "ollama", model_name: str = "",
                 api_key: str = "", base_url: str = "", timeout: float = 60.0):
        self.provider = provider
        self.model_name = model_name
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        all_embeddings = []
        for i in range(0, len(texts), MAX_BATCH_SIZE):
            batch = texts[i:i + MAX_BATCH_SIZE]
            if self.provider == "ollama":
                batch_embeddings = self._embed_with_retry(self._embed_ollama, batch)
            else:
                batch_embeddings = self._embed_with_retry(self._embed_openai, batch)
            all_embeddings.extend(batch_embeddings)
        return all_embeddings

    def _embed_with_retry(self, func, texts: List[str]) -> List[List[float]]:
        last_exc = None
        for attempt in range(MAX_RETRIES):
            try:
                return func(texts)
            except Exception as e:
                last_exc = e
                if attempt < MAX_RETRIES - 1:
                    wait = 2 ** attempt
                    logger.warning(f"Embedding调用失败(第{attempt+1}次)，{wait}秒后重试: {e}")
                    time.sleep(wait)
        raise last_exc

    def embed_query(self, text: str) -> List[float]:
        results = self.embed([text])
        return results[0] if results else []

    def _build_error_message(self, e: Exception, resp_text: str = "") -> str:
        base = str(e)
        if resp_text:
            try:
                detail = json.loads(resp_text)
                msg = detail.get("message") or detail.get("error", {}).get("message", "") or detail.get("detail", "")
                if msg:
                    return f"{base} | API返回: {msg}"
            except (json.JSONDecodeError, AttributeError):
                pass
            if len(resp_text) < 500:
                return f"{base} | API返回: {resp_text}"
        return base

    def _embed_ollama(self, texts: List[str]) -> List[List[float]]:
        url = f"{self.base_url}/api/embed"
        payload = {"model": self.model_name, "input": texts}
        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(url, json=payload)
                if resp.status_code != 200:
                    raise Exception(self._build_error_message(
                        f"Ollama返回 {resp.status_code}", resp.text))
                data = resp.json()
                return data.get("embeddings", [])
        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama embedding调用失败: {e}")
            raise
        except Exception as e:
            if "API返回" in str(e):
                raise
            logger.error(f"Ollama embedding调用失败: {e}")
            raise

    def _embed_openai(self, texts: List[str]) -> List[List[float]]:
        url = f"{self.base_url}/embeddings"
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        payload = {"model": self.model_name, "input": texts}
        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(url, json=payload, headers=headers)
                if resp.status_code != 200:
                    raise Exception(self._build_error_message(
                        f"Embedding API返回 {resp.status_code}", resp.text))
                data = resp.json()
                return [item["embedding"] for item in data.get("data", [])]
        except Exception as e:
            if "API返回" in str(e):
                raise
            logger.error(f"OpenAI格式embedding调用失败: {e}")
            raise


def get_embedding_client(provider: str, model_name: str,
                         api_key: str = "", base_url: str = "") -> EmbeddingClient:
    return EmbeddingClient(
        provider=provider,
        model_name=model_name,
        api_key=api_key,
        base_url=base_url,
    )

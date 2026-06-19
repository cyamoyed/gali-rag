"""LLM客户端模块。

统一封装 Ollama 和 OpenAI 兼容格式的 LLM 调用，支持：
- 同步生成 (generate / chat_generate)
- 流式生成 (generate_stream)
- 自动根据 provider 选择对应的 API 格式
"""
from typing import List, Optional, Generator
import httpx
import json
import logging

logger = logging.getLogger(__name__)


class LLMClient:
    def __init__(self):
        self._provider = "ollama"
        self._api_key = ""
        self._base_url = "http://localhost:11434"
        self._model = "qwen2.5:7b"
        self._temperature = 0.1
        self._timeout = 120.0

    def clone(self) -> "LLMClient":
        client = LLMClient()
        client._provider = self._provider
        client._api_key = self._api_key
        client._base_url = self._base_url
        client._model = self._model
        client._temperature = self._temperature
        client._timeout = self._timeout
        return client

    def configure(self, provider: str, api_key: str = "", base_url: str = "",
                  model: str = "", temperature: float = 0.1, timeout: float = 120.0):
        self._provider = provider
        if api_key:
            self._api_key = api_key
        if base_url:
            self._base_url = base_url
        if model:
            self._model = model
        self._temperature = temperature
        self._timeout = timeout

    def generate(self, prompt: str, max_tokens: int = 2048) -> str:
        if self._provider == "ollama":
            return self._generate_ollama(prompt, max_tokens)
        return self._generate_openai(prompt, max_tokens)

    def generate_stream(self, prompt: str, max_tokens: int = 2048) -> Generator[str, None, None]:
        if self._provider == "ollama":
            yield from self._stream_ollama(prompt, max_tokens)
        else:
            yield from self._stream_openai(prompt, max_tokens)

    def _generate_ollama(self, prompt: str, max_tokens: int) -> str:
        url = f"{self._base_url}/api/generate"
        payload = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": self._temperature,
                "num_predict": max_tokens,
            },
        }
        try:
            with httpx.Client(timeout=self._timeout) as client:
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                return resp.json().get("response", "")
        except Exception as e:
            logger.error(f"Ollama调用失败: {e}")
            raise

    def _stream_ollama(self, prompt: str, max_tokens: int) -> Generator[str, None, None]:
        url = f"{self._base_url}/api/generate"
        payload = {
            "model": self._model,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": self._temperature,
                "num_predict": max_tokens,
            },
        }
        try:
            with httpx.Client(timeout=self._timeout) as client:
                with client.stream("POST", url, json=payload) as resp:
                    resp.raise_for_status()
                    for line in resp.iter_lines():
                        if line:
                            data = json.loads(line)
                            token = data.get("response", "")
                            if token:
                                yield token
                            if data.get("done", False):
                                break
        except Exception as e:
            logger.error(f"Ollama流式调用失败: {e}")
            raise

    def _generate_openai(self, prompt: str, max_tokens: int) -> str:
        url = f"{self._base_url}/chat/completions"
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self._temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        try:
            with httpx.Client(timeout=self._timeout) as client:
                resp = client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"OpenAI格式API调用失败: {e}")
            raise

    def _stream_openai(self, prompt: str, max_tokens: int) -> Generator[str, None, None]:
        url = f"{self._base_url}/chat/completions"
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self._temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        try:
            with httpx.Client(timeout=self._timeout) as client:
                with client.stream("POST", url, json=payload, headers=headers) as resp:
                    resp.raise_for_status()
                    for line in resp.iter_lines():
                        if line and line.startswith("data: "):
                            data_str = line[6:]
                            if data_str.strip() == "[DONE]":
                                break
                            data = json.loads(data_str)
                            delta = data["choices"][0].get("delta", {})
                            token = delta.get("content", "")
                            if token:
                                yield token
        except Exception as e:
            logger.error(f"OpenAI格式流式调用失败: {e}")
            raise

    def chat_generate(self, messages: List[dict], max_tokens: int = 2048) -> str:
        if self._provider == "ollama":
            prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
            return self._generate_ollama(prompt, max_tokens)
        url = f"{self._base_url}/chat/completions"
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": self._temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        try:
            with httpx.Client(timeout=self._timeout) as client:
                resp = client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"chat_generate调用失败: {e}")
            raise

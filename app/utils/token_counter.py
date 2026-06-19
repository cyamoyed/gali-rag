"""Token计数工具模块。

提供三种计数方式：
1. count_tokens: 基于 tiktoken 精确计算（推荐）
2. estimate_tokens: 基于字符类型的快速估算（CJK按1token/字，英文按4字符/token）
3. truncate_to_tokens: 按token数截断文本
"""
import tiktoken
import logging

logger = logging.getLogger(__name__)


def count_tokens(text: str, model: str = "cl100k_base") -> int:
    try:
        enc = tiktoken.encoding_for_model(model)
    except KeyError:
        enc = tiktoken.get_encoding("cl100k_base")
    return len(enc.encode(text))


def estimate_tokens(text: str) -> int:
    cjk_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    other_chars = len(text) - cjk_chars
    return cjk_chars + (other_chars // 4) + 1


def truncate_to_tokens(text: str, max_tokens: int, model: str = "cl100k_base") -> str:
    try:
        enc = tiktoken.encoding_for_model(model)
    except KeyError:
        enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)
    if len(tokens) <= max_tokens:
        return text
    return enc.decode(tokens[:max_tokens])


def truncate_history_by_tokens(
    chat_history: list,
    max_tokens: int = 1024,
) -> list:
    if not chat_history:
        return []
    total = 0
    result = []
    for msg in reversed(chat_history):
        msg_tokens = estimate_tokens(msg.get("content", ""))
        if total + msg_tokens > max_tokens:
            break
        result.insert(0, msg)
        total += msg_tokens
    return result


def estimate_prompt_tokens(
    system_prompt: str,
    context: str,
    chat_history: str,
    query: str,
) -> int:
    combined = (system_prompt or "") + (context or "") + (chat_history or "") + (query or "")
    return count_tokens(combined)

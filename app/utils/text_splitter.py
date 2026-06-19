"""文本切片模块。

提供两种切片策略：
1. 固定长度切片：基于 RecursiveCharacterTextSplitter，支持中文分隔符
2. 语义切片：先按标题/段落分割，再对超长段落做固定长度切片，最后合并过短片段
"""
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
import re


SHORT_CHUNK_RATIO = 0.3


def fixed_length_split(text: str, chunk_size: int = 500, chunk_overlap: int = 100) -> List[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", "。", ".", "！", "!", "？", "?", "；", ";", " "],
    )
    return splitter.split_text(text)


def semantic_split(text: str, chunk_size: int = 500, chunk_overlap: int = 100) -> List[str]:
    sections = _split_by_headers(text)
    if len(sections) <= 1:
        sections = _split_by_paragraphs(text)

    chunks = []
    for section in sections:
        section = section.strip()
        if not section:
            continue
        if len(section) <= chunk_size:
            chunks.append(section)
        else:
            paragraphs = _split_by_paragraphs(section)
            if len(paragraphs) <= 1:
                sub_chunks = fixed_length_split(section, chunk_size, chunk_overlap)
                chunks.extend(sub_chunks)
            else:
                for para in paragraphs:
                    para = para.strip()
                    if not para:
                        continue
                    if len(para) <= chunk_size:
                        chunks.append(para)
                    else:
                        sub_chunks = fixed_length_split(para, chunk_size, chunk_overlap)
                        chunks.extend(sub_chunks)

    if not chunks:
        chunks = fixed_length_split(text, chunk_size, chunk_overlap)

    chunks = merge_short_chunks(chunks, chunk_size)
    return chunks


def merge_short_chunks(chunks: List[str], chunk_size: int) -> List[str]:
    if len(chunks) <= 1:
        return chunks

    min_size = int(chunk_size * SHORT_CHUNK_RATIO)
    merged = []
    i = 0
    while i < len(chunks):
        current = chunks[i]
        if len(current) >= min_size:
            merged.append(current)
            i += 1
            continue

        prev = merged[-1] if merged else None
        nxt = chunks[i + 1] if i + 1 < len(chunks) else None

        best = _pick_merge_target(current, prev, nxt, chunk_size)
        if best == "prev" and prev is not None:
            merged[-1] = prev + "\n" + current
        elif best == "next" and nxt is not None:
            merged.append(current + "\n" + nxt)
            i += 2
            continue
        else:
            merged.append(current)
        i += 1

    return merged


def _pick_merge_target(current: str, prev: str | None, nxt: str | None, chunk_size: int) -> str:
    candidates = []
    if prev is not None and len(prev) + len(current) + 1 <= chunk_size:
        candidates.append(("prev", len(prev)))
    if nxt is not None and len(current) + len(nxt) + 1 <= chunk_size:
        candidates.append(("next", len(nxt)))

    if not candidates:
        if prev is not None and len(prev) + len(current) + 1 <= chunk_size * 1.5:
            return "prev"
        if nxt is not None and len(current) + len(nxt) + 1 <= chunk_size * 1.5:
            return "next"
        return "none"

    candidates.sort(key=lambda x: x[1])
    return candidates[0][0]


def _split_by_headers(text: str) -> List[str]:
    return [s for s in re.split(r"(?=^#{1,6}\s)", text, flags=re.MULTILINE) if s.strip()]


def _split_by_paragraphs(text: str) -> List[str]:
    paragraphs = re.split(r"\n\s*\n", text)
    if len(paragraphs) <= 1:
        paragraphs = re.split(r"(?<=[。！？.!?；;])\s*", text)
    return [p for p in paragraphs if p.strip()]


def split_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 100,
    semantic: bool = False,
) -> List[str]:
    if not text or not text.strip():
        return []
    chunk_size = max(100, min(chunk_size, 10000))
    chunk_overlap = max(0, min(chunk_overlap, chunk_size - 10))
    if semantic:
        return semantic_split(text, chunk_size, chunk_overlap)
    return fixed_length_split(text, chunk_size, chunk_overlap)

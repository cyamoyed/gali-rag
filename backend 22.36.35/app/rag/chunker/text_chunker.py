import tiktoken


class TextChunker:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str) -> list[dict]:
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""
        current_tokens = 0
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            para_tokens = self._count_tokens(para)
            if current_tokens + para_tokens > self.chunk_size and current_chunk:
                chunks.append(
                    {
                        "content": current_chunk.strip(),
                        "chunk_index": len(chunks),
                        "token_count": current_tokens,
                    }
                )
                overlap_text = self._get_tail(current_chunk, self.chunk_overlap)
                current_chunk = overlap_text + "\n\n" + para
                current_tokens = self._count_tokens(current_chunk)
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
                current_tokens = self._count_tokens(current_chunk)
        if current_chunk.strip():
            chunks.append(
                {
                    "content": current_chunk.strip(),
                    "chunk_index": len(chunks),
                    "token_count": current_tokens,
                }
            )
        return chunks

    def _count_tokens(self, text: str) -> int:
        try:
            encoding = tiktoken.encoding_for_model("gpt-4")
            return len(encoding.encode(text))
        except Exception:
            return len(text) // 4

    def _get_tail(self, text: str, token_count: int) -> str:
        words = text.split()
        word_count = int(token_count * 0.75)
        if word_count >= len(words):
            return text
        return " ".join(words[-word_count:])

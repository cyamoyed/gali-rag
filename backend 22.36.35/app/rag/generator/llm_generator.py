from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()

SYSTEM_PROMPT = """你是一个企业知识库问答助手。基于以下检索到的参考资料回答用户问题。

规则：
1. 只基于提供的参考资料回答，不要编造信息
2. 如果参考资料中没有相关信息，明确告知用户
3. 在回答中标注信息来源（文档名称和相关段落）
4. 使用清晰、专业的语言

参考资料：
{context}"""


class LLMGenerator:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.openai_api_base)
        self.model = settings.openai_model

    async def generate(self, query: str, context_chunks: list[dict], history: list[dict] = None) -> dict:
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            context_parts.append(f"[{i}] (来源: 文档ID {chunk['doc_id']}, 相似度: {chunk['score']:.2f})\n{chunk['content']}")
        context = "\n\n".join(context_parts)
        messages = [{"role": "system", "content": SYSTEM_PROMPT.format(context=context)}]
        if history:
            messages.extend(history[-6:])
        messages.append({"role": "user", "content": query})
        response = await self.client.chat.completions.create(model=self.model, messages=messages, temperature=0.3, max_tokens=2000)
        answer = response.choices[0].message.content
        sources = [{"chunk_id": chunk["chunk_id"], "doc_id": chunk["doc_id"], "content": chunk["content"][:200], "score": chunk["score"]} for chunk in context_chunks]
        return {"answer": answer, "sources": sources}


llm_generator = LLMGenerator()

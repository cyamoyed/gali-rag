"""查询改写模块。

基于对话历史将用户当前问题改写为更适合向量检索的独立查询。
补充对话中的指代信息（如"它"、"这个"等），使检索更精准。
无 LLM 时直接返回原始查询。
"""
from typing import List, Optional
from app.services.prompt_service import prompt_service
import logging

logger = logging.getLogger(__name__)


class QueryRewriter:
    def rewrite(
        self,
        query: str,
        chat_history: Optional[List[dict]] = None,
        custom_llm_client=None,
        db=None,
        preset_id: int = None,
    ) -> str:
        if not custom_llm_client:
            return query
        try:
            template = prompt_service.get_prompt_by_category("query_rewrite", db, preset_id=preset_id)
            if not template:
                return query

            history_text = ""
            if chat_history:
                for msg in chat_history[-5:]:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_text += f"{role}: {content}\n"

            prompt = template.replace("{{user_query}}", query)
            prompt = prompt.replace("{{chat_history}}", history_text)

            result = custom_llm_client.generate(prompt, max_tokens=256)
            rewritten = result.strip().strip('"').strip("'")
            if rewritten and len(rewritten) > 2:
                logger.info(f"Query改写: '{query}' -> '{rewritten}'")
                return rewritten
            return query
        except Exception as e:
            logger.warning(f"Query改写失败，使用原始查询: {e}")
            return query


query_rewriter = QueryRewriter()

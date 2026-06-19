"""检索结果冲突检测模块。

使用 LLM 分析多个检索片段之间是否存在事实矛盾或信息冲突。
无 LLM 时退化为简单检测（始终返回无冲突）。
"""
from typing import List, Dict, Optional
from app.services.prompt_service import prompt_service
import logging
import json
import re

logger = logging.getLogger(__name__)


class ConflictDetector:
    def detect(
        self,
        query: str,
        chunks: List[Dict],
        custom_llm_client=None,
        db=None,
        preset_id: int = None,
    ) -> Dict:
        if len(chunks) < 2:
            return {"has_conflict": False, "description": "", "involved_chunks": []}

        if not custom_llm_client:
            return self._simple_detect(chunks)

        try:
            template = prompt_service.get_prompt_by_category("conflict_detect", db, preset_id=preset_id)
            if not template:
                return self._simple_detect(chunks)

            chunks_text = ""
            for i, chunk in enumerate(chunks):
                chunk_id = chunk.get("id", f"chunk_{i}")
                content = chunk.get("content", "")[:500]
                chunks_text += f"[片段ID: {chunk_id}]\n{content}\n\n"

            prompt = template.replace("{{user_query}}", query)
            prompt = prompt.replace("{{retrieval_chunks}}", chunks_text)

            result = custom_llm_client.generate(prompt, max_tokens=512)
            return self._parse_conflict_result(result, chunks)
        except Exception as e:
            logger.warning(f"冲突检测失败: {e}")
            return {"has_conflict": False, "description": "", "involved_chunks": []}

    def _simple_detect(self, chunks: List[Dict]) -> Dict:
        return {"has_conflict": False, "description": "", "involved_chunks": []}

    def _parse_conflict_result(self, result: str, chunks: List[Dict]) -> Dict:
        json_obj = self._extract_json(result)
        if json_obj is not None:
            return {
                "has_conflict": json_obj.get("has_conflict", False),
                "description": json_obj.get("description", ""),
                "involved_chunks": json_obj.get("involved_chunks", []),
            }

        has_conflict = any(kw in result.lower() for kw in ["冲突", "矛盾", "不一致", "conflict", "contradiction"])
        return {
            "has_conflict": has_conflict,
            "description": result[:500] if has_conflict else "",
            "involved_chunks": [],
        }

    def _extract_json(self, text: str) -> Optional[Dict]:
        patterns = [
            re.compile(r'\{[^{}]*"has_conflict"[^{}]*\}'),
            re.compile(r'```(?:json)?\s*(\{.*?\})\s*```', re.DOTALL),
            re.compile(r'\{.*?\}', re.DOTALL),
        ]
        for pattern in patterns:
            match = pattern.search(text)
            if match:
                try:
                    json_str = match.group(1) if match.lastindex else match.group(0)
                    return json.loads(json_str)
                except (json.JSONDecodeError, IndexError):
                    continue

        try:
            start = text.index("{")
            depth = 0
            for i in range(start, len(text)):
                if text[i] == "{":
                    depth += 1
                elif text[i] == "}":
                    depth -= 1
                    if depth == 0:
                        return json.loads(text[start:i + 1])
        except (ValueError, json.JSONDecodeError):
            pass
        return None


conflict_detector = ConflictDetector()

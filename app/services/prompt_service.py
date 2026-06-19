import re
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import PromptTemplate, PromptPreset


CATEGORIES = ["qa_main", "query_rewrite", "doc_chunk", "doc_summary", "conflict_detect"]

DEFAULT_PROMPTS = {
    "通用知识库": {
        "qa_main": {
            "name": "通用知识库问答主提示词",
            "content": """你是一个精准的知识库问答助手。请严格基于以下提供的参考文档片段回答用户问题。

## 参考文档片段
{{retrieval_chunks}}

## 对话历史
{{chat_history}}

## 引用来源
{{cited_sources}}

## 冲突信息
{{conflict_info}}

## 用户问题
{{user_query}}

## 回答要求
1. 仅使用上述参考文档中的信息回答，不要使用你的自有知识
2. 如果参考文档中没有相关信息，请明确说明"根据现有文档无法回答该问题"
3. 在回答末尾以"[来源: 文档名, 片段X]"格式标注引用来源
4. 如果发现不同片段之间存在信息冲突，请明确指出并标注冲突片段ID
5. 回答要准确、简洁、有条理，使用中文回答

回答:""",
            "description": "通用知识库问答主提示词模板",
        },
        "query_rewrite": {
            "name": "Query检索改写提示词",
            "content": """你是一个搜索查询优化专家。请根据对话历史，将用户的当前问题改写为更适合向量检索的独立查询。

## 对话历史
{{chat_history}}

## 当前用户问题
{{user_query}}

## 改写要求
1. 保留用户问题的核心意图
2. 补充对话历史中的指代信息（如"它"、"这个"等）
3. 使查询更完整、更适合语义检索
4. 只输出改写后的查询，不要添加解释

改写后的查询:""",
            "description": "将用户Query改写为更适合检索的形式",
        },
        "doc_chunk": {
            "name": "文档智能切片提示词",
            "content": """请将以下文本片段进行智能合并和整理，保持信息完整性，去除重复内容。

## 原始文本
{{doc_raw_text}}

## 要求
1. 保留所有关键信息
2. 去除重复内容
3. 保持段落结构清晰
4. 输出整理后的文本

整理后的文本:""",
            "description": "用于LLM辅助合并短文本片段",
        },
        "doc_summary": {
            "name": "文档摘要生成提示词",
            "content": """请为以下文档内容生成简要摘要。

## 文档内容
{{doc_raw_text}}

## 要求
1. 摘要长度控制在200字以内
2. 提取文档的核心主题和关键信息
3. 使用中文输出

摘要:""",
            "description": "为上传的文档生成摘要",
        },
        "conflict_detect": {
            "name": "检索结果重排过滤提示词",
            "content": """请分析以下检索片段之间是否存在事实矛盾或信息冲突。

## 用户问题
{{user_query}}

## 检索片段
{{retrieval_chunks}}

## 分析要求
1. 仔细比较各片段中的事实信息
2. 检测是否存在矛盾、不一致或相互冲突的内容
3. 以JSON格式输出结果：
   {"has_conflict": true/false, "description": "冲突描述", "involved_chunks": ["片段ID1", "片段ID2"]}
4. 如果没有冲突，has_conflict设为false

分析结果:""",
            "description": "检测检索结果中的信息冲突",
        },
    },
    "技术文档": {
        "qa_main": {
            "name": "技术文档问答主提示词",
            "content": """你是一个专业的技术文档问答助手。请严格基于以下技术文档片段回答用户的技术问题。

## 技术文档片段
{{retrieval_chunks}}

## 对话历史
{{chat_history}}

## 引用来源
{{cited_sources}}

## 冲突信息
{{conflict_info}}

## 用户技术问题
{{user_query}}

## 回答要求
1. 仅使用上述技术文档中的信息回答
2. 保持技术术语的准确性
3. 如果涉及代码或配置，请完整引用原文
4. 如果文档中没有相关信息，明确说明"现有技术文档中未找到相关信息"
5. 标注引用的文档来源和片段位置
6. 如有版本差异或配置冲突，请明确指出

技术回答:""",
            "description": "技术文档专业问答提示词模板",
        },
        "query_rewrite": {
            "name": "技术Query改写提示词",
            "content": """你是一个技术搜索查询优化专家。请将用户的技术问题改写为更适合技术文档检索的查询。

## 对话历史
{{chat_history}}

## 当前技术问题
{{user_query}}

## 改写要求
1. 保留技术关键词和专业术语
2. 补充对话上下文中的技术引用
3. 将口语化表述转为更精确的技术表述
4. 只输出改写后的查询

改写后的技术查询:""",
            "description": "技术文档Query改写提示词",
        },
        "doc_chunk": {
            "name": "技术文档智能切片提示词",
            "content": """请将以下技术文本片段进行智能合并，保持代码和技术信息完整性。

## 原始技术文本
{{doc_raw_text}}

## 要求
1. 保持代码块完整性
2. 保留技术配置信息
3. 保持API接口定义的完整性
4. 输出整理后的技术文本

整理后的技术文本:""",
            "description": "技术文档智能切片提示词",
        },
        "doc_summary": {
            "name": "技术文档摘要提示词",
            "content": """请为以下技术文档生成专业摘要。

## 技术文档内容
{{doc_raw_text}}

## 要求
1. 提取技术要点和核心功能
2. 列出涉及的技术栈和工具
3. 摘要长度控制在300字以内
4. 使用中文输出

技术摘要:""",
            "description": "技术文档摘要生成提示词",
        },
        "conflict_detect": {
            "name": "技术文档冲突检测提示词",
            "content": """请分析以下技术文档片段之间是否存在版本差异、配置矛盾或技术冲突。

## 用户技术问题
{{user_query}}

## 技术文档片段
{{retrieval_chunks}}

## 分析要求
1. 检查版本号差异
2. 检查配置参数冲突
3. 检查API接口变更
4. 以JSON格式输出：{"has_conflict": true/false, "description": "冲突描述", "involved_chunks": ["片段ID"]}

分析结果:""",
            "description": "技术文档冲突检测提示词",
        },
    },
    "企业客服": {
        "qa_main": {
            "name": "企业客服问答主提示词",
            "content": """你是一个专业的企业客服助手。请基于以下知识库文档为客户提供准确、友好的服务。

## 知识库文档
{{retrieval_chunks}}

## 对话历史
{{chat_history}}

## 引用来源
{{cited_sources}}

## 冲突信息
{{conflict_info}}

## 客户问题
{{user_query}}

## 服务要求
1. 使用礼貌、专业的服务用语
2. 仅基于知识库文档回答，不编造信息
3. 如果知识库中没有相关信息，请引导客户联系人工客服
4. 回答要通俗易懂，避免过于专业的表述
5. 标注信息来源以便客户核实
6. 如有政策变更或时效性信息，请特别提醒

客服回答:""",
            "description": "企业客服问答提示词模板",
        },
        "query_rewrite": {
            "name": "客服Query改写提示词",
            "content": """你是一个客服查询理解专家。请将客户的口语化问题改写为更适合知识库检索的查询。

## 对话历史
{{chat_history}}

## 客户问题
{{user_query}}

## 改写要求
1. 理解客户的真实意图
2. 将口语化表述转为标准表述
3. 补充上下文中的指代信息
4. 只输出改写后的查询

改写后的查询:""",
            "description": "客服场景Query改写提示词",
        },
        "doc_chunk": {
            "name": "客服知识库智能切片提示词",
            "content": """请将以下客服知识库文本进行智能合并和整理。

## 原始文本
{{doc_raw_text}}

## 要求
1. 保持问答对的完整性
2. 保留政策条款的完整性
3. 保持业务流程的连贯性
4. 输出整理后的文本

整理后的文本:""",
            "description": "客服知识库智能切片提示词",
        },
        "doc_summary": {
            "name": "客服文档摘要提示词",
            "content": """请为以下客服知识库文档生成摘要。

## 文档内容
{{doc_raw_text}}

## 要求
1. 提取核心业务信息
2. 列出涉及的产品或服务
3. 摘要长度控制在200字以内
4. 使用中文输出

摘要:""",
            "description": "客服文档摘要生成提示词",
        },
        "conflict_detect": {
            "name": "客服知识库冲突检测提示词",
            "content": """请分析以下客服知识库片段之间是否存在政策冲突或信息不一致。

## 客户问题
{{user_query}}

## 知识库片段
{{retrieval_chunks}}

## 分析要求
1. 检查政策条款是否一致
2. 检查价格或优惠信息是否冲突
3. 检查业务流程描述是否矛盾
4. 以JSON格式输出：{"has_conflict": true/false, "description": "冲突描述", "involved_chunks": ["片段ID"]}

分析结果:""",
            "description": "客服知识库冲突检测提示词",
        },
    },
}


class PromptService:

    # ── 初始化 ──────────────────────────────────────────────────

    def init_default_prompts(self, db: Session):
        existing = db.query(PromptPreset).filter(PromptPreset.is_system == True).count()
        if existing > 0:
            return
        for preset_name, templates in DEFAULT_PROMPTS.items():
            preset = PromptPreset(
                name=preset_name,
                description=f"{preset_name}场景预设模板",
                is_system=True,
                is_active=(preset_name == "通用知识库"),
            )
            db.add(preset)
            db.flush()
            for category, info in templates.items():
                pt = PromptTemplate(
                    name=info["name"],
                    category=category,
                    content=info["content"],
                    description=info["description"],
                    is_system=True,
                    is_default=(preset_name == "通用知识库"),
                    preset_id=preset.id,
                )
                db.add(pt)
        db.commit()

    # ── 预设 CRUD ──────────────────────────────────────────────

    def get_presets(self, db: Session) -> List[PromptPreset]:
        return db.query(PromptPreset).order_by(
            PromptPreset.is_active.desc(), PromptPreset.created_at.asc()
        ).all()

    def get_preset(self, db: Session, preset_id: int) -> Optional[PromptPreset]:
        return db.query(PromptPreset).filter(PromptPreset.id == preset_id).first()

    def get_active_preset(self, db: Session) -> Optional[PromptPreset]:
        return db.query(PromptPreset).filter(PromptPreset.is_active == True).first()

    def create_preset(self, db: Session, name: str, description: str, templates_data: list) -> PromptPreset:
        preset = PromptPreset(name=name, description=description, is_system=False, is_active=False)
        db.add(preset)
        db.flush()
        for item in templates_data:
            pt = PromptTemplate(
                name=item["name"],
                category=item["category"],
                content=item["content"],
                description=item.get("description", ""),
                is_system=False,
                is_default=False,
                preset_id=preset.id,
            )
            db.add(pt)
        db.commit()
        db.refresh(preset)
        return preset

    def switch_preset(self, db: Session, preset_id: int) -> Optional[PromptPreset]:
        preset = self.get_preset(db, preset_id)
        if not preset:
            return None
        db.query(PromptPreset).filter(PromptPreset.is_active == True).update({"is_active": False})
        db.query(PromptTemplate).filter(PromptTemplate.is_default == True).update({"is_default": False})
        preset.is_active = True
        for t in preset.templates:
            t.is_default = True
        db.commit()
        db.refresh(preset)
        return preset

    def duplicate_preset(self, db: Session, preset_id: int, new_name: str) -> Optional[PromptPreset]:
        source = self.get_preset(db, preset_id)
        if not source:
            return None
        preset = PromptPreset(name=new_name, description=source.description, is_system=False, is_active=False)
        db.add(preset)
        db.flush()
        for t in source.templates:
            pt = PromptTemplate(
                name=t.name,
                category=t.category,
                content=t.content,
                description=t.description,
                is_system=False,
                is_default=False,
                preset_id=preset.id,
            )
            db.add(pt)
        db.commit()
        db.refresh(preset)
        return preset

    def delete_preset(self, db: Session, preset_id: int) -> bool:
        preset = self.get_preset(db, preset_id)
        if not preset or preset.is_system:
            return False
        db.delete(preset)
        db.commit()
        return True

    # ── 模板查询（运行时使用）──────────────────────────────────

    def get_prompt_by_category(self, category: str, db: Session = None, preset_id: int = None) -> Optional[str]:
        if db:
            if preset_id:
                pt = db.query(PromptTemplate).filter(
                    PromptTemplate.preset_id == preset_id,
                    PromptTemplate.category == category,
                ).first()
                if pt:
                    return pt.content
            pt = db.query(PromptTemplate).filter(
                PromptTemplate.category == category,
                PromptTemplate.is_default == True,
            ).first()
            if pt:
                return pt.content
        for preset_name, templates in DEFAULT_PROMPTS.items():
            if preset_name == "通用知识库" and category in templates:
                return templates[category]["content"]
        return None

    # ── 单模板 CRUD（兼容保留）──────────────────────────────────

    def get_prompts(self, db: Session, category: str = None, preset_id: int = None) -> List[PromptTemplate]:
        query = db.query(PromptTemplate)
        if category:
            query = query.filter(PromptTemplate.category == category)
        if preset_id:
            query = query.filter(PromptTemplate.preset_id == preset_id)
        return query.order_by(PromptTemplate.is_default.desc(), PromptTemplate.created_at.desc()).all()

    def get_prompt(self, db: Session, prompt_id: int) -> Optional[PromptTemplate]:
        return db.query(PromptTemplate).filter(PromptTemplate.id == prompt_id).first()

    def create_prompt(self, db: Session, **kwargs) -> PromptTemplate:
        if kwargs.get("is_default"):
            db.query(PromptTemplate).filter(
                PromptTemplate.category == kwargs["category"],
                PromptTemplate.is_default == True,
            ).update({"is_default": False})
        pt = PromptTemplate(**kwargs)
        db.add(pt)
        db.commit()
        db.refresh(pt)
        return pt

    def update_prompt(self, db: Session, prompt_id: int, **kwargs) -> Optional[PromptTemplate]:
        pt = self.get_prompt(db, prompt_id)
        if not pt:
            return None
        if kwargs.get("is_default") and (kwargs.get("category") or pt.category):
            cat = kwargs.get("category", pt.category)
            db.query(PromptTemplate).filter(
                PromptTemplate.category == cat,
                PromptTemplate.is_default == True,
                PromptTemplate.id != prompt_id,
            ).update({"is_default": False})
        for key, value in kwargs.items():
            if value is not None and hasattr(pt, key):
                setattr(pt, key, value)
        db.commit()
        db.refresh(pt)
        return pt

    def delete_prompt(self, db: Session, prompt_id: int) -> bool:
        pt = self.get_prompt(db, prompt_id)
        if not pt:
            return False
        if pt.is_system:
            return False
        db.delete(pt)
        db.commit()
        return True

    def reset_to_default(self, db: Session, prompt_id: int) -> Optional[PromptTemplate]:
        pt = self.get_prompt(db, prompt_id)
        if not pt:
            return None
        default_content = self.get_prompt_by_category(pt.category)
        if default_content:
            pt.content = default_content
            db.commit()
            db.refresh(pt)
        return pt

    def get_no_match_message(self) -> str:
        return "抱歉，根据现有知识库文档，无法找到与您问题相关的信息。请尝试换个方式提问，或确认知识库中是否包含相关文档。"


prompt_service = PromptService()

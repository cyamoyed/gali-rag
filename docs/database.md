# 数据库设计文档

## 一、ER关系图

```
AIModel (AI模型)
    │ 1
    │
    ├──< KnowledgeBase.embedding_model_id (知识库关联向量模型)
    │
    └──< Agent.llm_model_id (智能体关联对话模型)

KnowledgeBaseCategory (目录层级)
    │ 1
    │
    ├──< KnowledgeBase.category_id (知识库所属目录层级)
    │
    └──< KnowledgeBaseCategory.parent_id (自引用父子关系)

KnowledgeBase (知识库)
    │ 1
    │
    ├──< N Document (文档)
    │       │ 1
    │       │
    │       └──< N DocumentChunk (文档切片)
    │
    └──>< N Agent (多对多: agent_knowledge_bases)

Agent (智能体)
    │ 1
    │
    └──< N Conversation (会话)
            │ 1
            │
            └──< N ChatMessage (聊天消息)

PromptTemplate (提示词模板)  -- 独立表
SystemConfig (系统配置)      -- 独立表
```

## 二、表结构详细设计

### 2.1 ai_models（AI模型表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| name | VARCHAR(128) | NOT NULL | 模型显示名称 |
| provider | VARCHAR(64) | NOT NULL | 提供商(ollama/openai等) |
| model_type | VARCHAR(32) | NOT NULL, INDEX | 类型(llm/embedding/reranking/speech/vision) |
| model_name | VARCHAR(128) | NOT NULL | 实际模型名 |
| api_key | VARCHAR(512) | DEFAULT '' | API密钥 |
| base_url | VARCHAR(512) | DEFAULT '' | 接口地址 |
| config | TEXT | DEFAULT '{}' | 扩展配置JSON |
| is_builtin | BOOLEAN | DEFAULT FALSE | 是否内置模型 |
| is_default | BOOLEAN | DEFAULT FALSE, INDEX | 是否默认模型 |
| status | VARCHAR(16) | DEFAULT 'active', INDEX | 状态(active/inactive) |
| created_at | DATETIME | DEFAULT utcnow | 创建时间 |
| updated_at | DATETIME | DEFAULT utcnow | 更新时间 |

**复合索引**: `ix_model_type_default` → (model_type, is_default)

### 2.2 kb_categories（目录层级表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| name | VARCHAR(128) | NOT NULL | 目录名称 |
| parent_id | INTEGER | FK→kb_categories.id, ON DELETE SET NULL, INDEX | 父级目录 |
| description | TEXT | DEFAULT '' | 描述 |
| sort_order | INTEGER | DEFAULT 0 | 排序权重 |
| created_at | DATETIME | DEFAULT utcnow | 创建时间 |

### 2.3 knowledge_bases（知识库表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| name | VARCHAR(128) | NOT NULL, INDEX | 知识库名称 |
| description | TEXT | DEFAULT '' | 知识库描述 |
| category_id | INTEGER | FK→kb_categories.id, ON DELETE SET NULL, INDEX | 所属目录层级 |
| kb_type | VARCHAR(16) | DEFAULT 'general', INDEX | 类型(general/web) |
| embedding_model_id | INTEGER | FK→ai_models.id, ON DELETE SET NULL | 向量模型 |
| web_config | TEXT | DEFAULT '{}' | web类型配置JSON |
| chunk_size | INTEGER | DEFAULT 500 | 切片长度 |
| chunk_overlap | INTEGER | DEFAULT 100 | 切片重叠字符数 |
| semantic_chunk_enabled | BOOLEAN | DEFAULT FALSE | 是否启用语义切片 |
| llm_chunk_enabled | BOOLEAN | DEFAULT FALSE | 是否启用LLM辅助切片 |
| chroma_collection | VARCHAR(128) | NOT NULL, UNIQUE | Chroma集合名称 |
| created_at | DATETIME | DEFAULT utcnow | 创建时间 |
| updated_at | DATETIME | DEFAULT utcnow | 更新时间 |

### 2.4 agents（智能体表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| name | VARCHAR(128) | NOT NULL, INDEX | 智能体名称 |
| description | TEXT | DEFAULT '' | 描述 |
| avatar | VARCHAR(512) | DEFAULT '' | 头像URL |
| llm_model_id | INTEGER | FK→ai_models.id, ON DELETE SET NULL | 对话模型 |
| system_prompt | TEXT | DEFAULT '' | 系统提示词 |
| opening_message | TEXT | DEFAULT '' | 开场白 |
| suggested_questions | TEXT | DEFAULT '[]' | 建议问题JSON数组 |
| temperature | FLOAT | DEFAULT 0.1 | 温度参数 |
| max_tokens | INTEGER | DEFAULT 2048 | 最大Token数 |
| top_k | INTEGER | DEFAULT 5 | 检索TopK |
| similarity_threshold | FLOAT | DEFAULT 0.6 | 相似度阈值 |
| api_key | VARCHAR(128) | DEFAULT '', UNIQUE | 独立API Key |
| status | VARCHAR(16) | DEFAULT 'draft', INDEX | 状态(draft/published) |
| created_at | DATETIME | DEFAULT utcnow | 创建时间 |
| updated_at | DATETIME | DEFAULT utcnow | 更新时间 |

### 2.5 agent_knowledge_bases（智能体-知识库关联表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| agent_id | INTEGER | FK→agents.id, ON DELETE CASCADE, PK | 智能体ID |
| knowledge_base_id | INTEGER | FK→knowledge_bases.id, ON DELETE CASCADE, PK | 知识库ID |

### 2.6 documents（文档表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| kb_id | INTEGER | FK→knowledge_bases.id, ON DELETE CASCADE, INDEX | 所属知识库 |
| filename | VARCHAR(256) | NOT NULL | 原始文件名 |
| file_path | VARCHAR(512) | NOT NULL | 存储路径 |
| file_type | VARCHAR(16) | NOT NULL | 文件类型(pdf/docx/txt/markdown) |
| file_size | INTEGER | DEFAULT 0 | 文件大小(字节) |
| chunk_count | INTEGER | DEFAULT 0 | 切片数量 |
| status | VARCHAR(32) | DEFAULT 'pending', INDEX | 状态(pending/processing/completed/failed) |
| summary | TEXT | DEFAULT '' | 文档摘要 |
| error_message | TEXT | DEFAULT '' | 错误信息 |
| created_at | DATETIME | DEFAULT utcnow | 创建时间 |
| updated_at | DATETIME | DEFAULT utcnow | 更新时间 |

**复合索引**: `ix_doc_kb_status` → (kb_id, status)

### 2.7 document_chunks（文档切片表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| doc_id | INTEGER | FK→documents.id, ON DELETE CASCADE, INDEX | 所属文档 |
| chunk_index | INTEGER | NOT NULL | 切片序号 |
| content | TEXT | NOT NULL | 切片内容 |
| token_count | INTEGER | DEFAULT 0 | Token数量 |
| created_at | DATETIME | DEFAULT utcnow | 创建时间 |

**复合索引**: `ix_chunk_doc_index` → (doc_id, chunk_index)

### 2.8 prompt_templates（提示词模板表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| name | VARCHAR(128) | NOT NULL, INDEX | 模板名称 |
| category | VARCHAR(64) | NOT NULL, INDEX | 类别(qa_main/query_rewrite/doc_chunk/doc_summary/conflict_detect) |
| content | TEXT | NOT NULL | 模板内容 |
| description | TEXT | DEFAULT '' | 描述 |
| is_system | BOOLEAN | DEFAULT FALSE | 是否系统内置 |
| is_default | BOOLEAN | DEFAULT FALSE | 是否当前默认 |
| created_at | DATETIME | DEFAULT utcnow | 创建时间 |
| updated_at | DATETIME | DEFAULT utcnow | 更新时间 |

**复合索引**: `ix_prompt_category_default` → (category, is_default)

### 2.9 conversations（会话表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| agent_id | INTEGER | FK→agents.id, ON DELETE CASCADE, INDEX | 关联智能体 |
| title | VARCHAR(256) | DEFAULT '新对话' | 会话标题 |
| created_at | DATETIME | DEFAULT utcnow | 创建时间 |
| updated_at | DATETIME | DEFAULT utcnow | 更新时间 |

### 2.10 chat_messages（聊天消息表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| conversation_id | INTEGER | FK→conversations.id, ON DELETE CASCADE, INDEX | 所属会话 |
| role | VARCHAR(16) | NOT NULL | 角色(user/assistant) |
| content | TEXT | NOT NULL | 消息内容 |
| cited_sources | TEXT | DEFAULT '[]' | 引用来源JSON |
| conflict_info | TEXT | DEFAULT '' | 冲突信息JSON |
| latency_ms | INTEGER | DEFAULT 0 | 响应耗时(ms) |
| created_at | DATETIME | DEFAULT utcnow | 创建时间 |

**复合索引**: `ix_msg_conv_created` → (conversation_id, created_at)

### 2.11 system_configs（系统配置表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| key | VARCHAR(128) | NOT NULL, UNIQUE, INDEX | 配置键 |
| value | TEXT | NOT NULL | 配置值 |
| description | TEXT | DEFAULT '' | 描述 |
| updated_at | DATETIME | DEFAULT utcnow | 更新时间 |

## 三、外键约束汇总

| 表 | 字段 | 引用 | 删除策略 |
|----|------|------|----------|
| kb_categories | parent_id | kb_categories.id | SET NULL |
| knowledge_bases | category_id | kb_categories.id | SET NULL |
| knowledge_bases | embedding_model_id | ai_models.id | SET NULL |
| agents | llm_model_id | ai_models.id | SET NULL |
| agent_knowledge_bases | agent_id | agents.id | CASCADE |
| agent_knowledge_bases | knowledge_base_id | knowledge_bases.id | CASCADE |
| documents | kb_id | knowledge_bases.id | CASCADE |
| document_chunks | doc_id | documents.id | CASCADE |
| conversations | agent_id | agents.id | CASCADE |
| chat_messages | conversation_id | conversations.id | CASCADE |

## 四、索引汇总

| 索引名 | 表 | 字段 | 类型 |
|--------|-----|------|------|
| ix_model_type_default | ai_models | model_type, is_default | COMPOSITE |
| ix_ai_models_model_type | ai_models | model_type | INDEX |
| ix_ai_models_is_default | ai_models | is_default | INDEX |
| ix_ai_models_status | ai_models | status | INDEX |
| ix_kb_categories_parent_id | kb_categories | parent_id | INDEX |
| ix_knowledge_bases_name | knowledge_bases | name | INDEX |
| ix_knowledge_bases_category_id | knowledge_bases | category_id | INDEX |
| ix_knowledge_bases_kb_type | knowledge_bases | kb_type | INDEX |
| ix_agents_name | agents | name | INDEX |
| ix_agents_status | agents | status | INDEX |
| ix_documents_kb_id | documents | kb_id | INDEX |
| ix_documents_status | documents | status | INDEX |
| ix_doc_kb_status | documents | kb_id, status | COMPOSITE |
| ix_document_chunks_doc_id | document_chunks | doc_id | INDEX |
| ix_chunk_doc_index | document_chunks | doc_id, chunk_index | COMPOSITE |
| ix_prompt_templates_name | prompt_templates | name | INDEX |
| ix_prompt_templates_category | prompt_templates | category | INDEX |
| ix_prompt_category_default | prompt_templates | category, is_default | COMPOSITE |
| ix_conversations_agent_id | conversations | agent_id | INDEX |
| ix_chat_messages_conversation_id | chat_messages | conversation_id | INDEX |
| ix_msg_conv_created | chat_messages | conversation_id, created_at | COMPOSITE |
| ix_system_configs_key | system_configs | key | UNIQUE |

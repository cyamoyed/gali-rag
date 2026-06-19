# RESTful API 接口文档

## 基础信息
- **Base URL**: `http://localhost:8000/api/v1`
- **请求格式**: `application/json`
- **响应格式**: `application/json`
- **流式响应**: `text/event-stream`

## 认证方式

请求头携带 `X-API-Key`：
- **主Key**：系统级管理Key（`.env` 中配置 `API_KEY`）
- **Agent Key**：智能体独立Key（`agent_` 前缀），仅用于智能体对话接口

公开路径（无需认证）：`/health`、`/docs`、`/redoc`、`/openapi.json`

## 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 统一错误格式

```json
{
  "detail": "错误描述"
}
```

---

## 一、模型管理

### 1.1 创建模型
**POST** `/api/v1/models`

**请求参数**:
```json
{
  "name": "Qwen2.5-7B",
  "provider": "ollama",
  "model_type": "llm",
  "model_name": "qwen2.5:7b",
  "api_key": "",
  "base_url": "http://localhost:11434",
  "config": "{}"
}
```

`model_type` 可选值：`llm` | `embedding` | `reranking` | `speech` | `vision`

**响应**:
```json
{
  "id": 1,
  "name": "Qwen2.5-7B",
  "provider": "ollama",
  "model_type": "llm",
  "model_name": "qwen2.5:7b",
  "api_key": "",
  "base_url": "http://localhost:11434",
  "config": "{}",
  "is_builtin": false,
  "is_default": false,
  "status": "active",
  "created_at": "2026-01-01T00:00:00",
  "updated_at": "2026-01-01T00:00:00"
}
```

### 1.2 查询模型列表
**GET** `/api/v1/models?model_type=llm`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model_type | string | 否 | 按类型筛选：`llm` / `embedding` |

### 1.3 查询单个模型
**GET** `/api/v1/models/{model_id}`

### 1.4 更新模型
**PUT** `/api/v1/models/{model_id}`

**请求参数**（均可选）:
```json
{
  "name": "新名称",
  "provider": "openai",
  "model_name": "gpt-4",
  "api_key": "sk-xxx",
  "base_url": "https://api.openai.com/v1",
  "config": "{}",
  "status": "active"
}
```

### 1.5 删除模型
**DELETE** `/api/v1/models/{model_id}`

**异常**（内置模型不可删除）:
```json
{"detail": "模型不存在或为内置模型，不可删除"}
```

### 1.6 设为默认模型
**POST** `/api/v1/models/{model_id}/set-default`

**响应**:
```json
{"code": 200, "message": "已设为默认模型"}
```

### 1.7 测试模型连接
**POST** `/api/v1/models/{model_id}/test`

**响应**:
```json
{"code": 200, "data": {"success": true, "message": "Ollama连接成功"}}
```

---

## 二、知识库管理

### 2.1 创建知识库
**POST** `/api/v1/knowledge-bases`

**请求参数**:
```json
{
  "name": "技术文档库",
  "description": "存储技术文档",
  "category_id": 1,
  "kb_type": "general",
  "embedding_model_id": 2,
  "web_config": "{}",
  "chunk_size": 500,
  "chunk_overlap": 100,
  "semantic_chunk_enabled": false,
  "llm_chunk_enabled": false
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 知识库名称，不可重复 |
| description | string | 否 | 描述 |
| category_id | int | 否 | 所属分类ID |
| kb_type | string | 否 | 类型：`general`(默认) / `web` |
| embedding_model_id | int | 否 | 向量模型ID，需为embedding类型 |
| web_config | string | 否 | web类型知识库的URL配置JSON |
| chunk_size | int | 否 | 切片长度，100-2000，默认500 |
| chunk_overlap | int | 否 | 切片重叠，0-500，默认100 |
| semantic_chunk_enabled | bool | 否 | 语义切片开关 |
| llm_chunk_enabled | bool | 否 | LLM辅助切片开关 |

**响应**:
```json
{
  "id": 1,
  "name": "技术文档库",
  "description": "存储技术文档",
  "category_id": 1,
  "kb_type": "general",
  "embedding_model_id": 2,
  "web_config": "{}",
  "chunk_size": 500,
  "chunk_overlap": 100,
  "semantic_chunk_enabled": false,
  "llm_chunk_enabled": false,
  "chroma_collection": "kb_a1b2c3d4e5f6",
  "document_count": 0,
  "created_at": "2026-01-01T00:00:00",
  "updated_at": "2026-01-01T00:00:00"
}
```

### 2.2 查询知识库列表
**GET** `/api/v1/knowledge-bases?category_id=1&kb_type=general`

### 2.3 查询单个知识库
**GET** `/api/v1/knowledge-bases/{kb_id}`

### 2.4 修改知识库
**PUT** `/api/v1/knowledge-bases/{kb_id}`

### 2.5 删除知识库
**DELETE** `/api/v1/knowledge-bases/{kb_id}`

### 2.6 配置切片参数
**PUT** `/api/v1/knowledge-bases/{kb_id}/chunk-config`

**请求参数**:
```json
{
  "chunk_size": 500,
  "chunk_overlap": 100,
  "semantic_chunk_enabled": true,
  "llm_chunk_enabled": false
}
```

### 2.7 清理失效向量
**POST** `/api/v1/knowledge-bases/{kb_id}/clean-vectors`

### 2.8 清空知识库向量
**POST** `/api/v1/knowledge-bases/{kb_id}/clear-vectors`

### 2.9 网页抓取（web类型知识库）
**POST** `/api/v1/knowledge-bases/{kb_id}/crawl`

**说明**: 仅 `kb_type=web` 的知识库可用，需在 `web_config` 中配置 `urls` 列表

**响应**:
```json
{
  "code": 200,
  "message": "网页抓取完成",
  "data": [
    {"url": "https://example.com", "status": "completed", "chunk_count": 12},
    {"url": "https://example.com/about", "status": "failed", "error": "连接超时"}
  ]
}
```

### 2.10 命中测试（仅检索，不调用LLM）
**POST** `/api/v1/knowledge-bases/{kb_id}/hit-test`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | string | 是 | 查询文本，1-4096字符 |
| top_k | int | 否 | 返回数量，1-50，默认5 |
| similarity_threshold | float | 否 | 相似度阈值，0.0-1.0，默认0.6 |

**响应**:
```json
{
  "code": 200,
  "data": {
    "query": "什么是RAG？",
    "rewritten_query": "RAG检索增强生成技术是什么",
    "hits": [
      {
        "chunk_id": 1,
        "doc_id": 1,
        "doc_name": "readme.pdf",
        "content": "RAG是检索增强生成...",
        "score": 0.85,
        "retrieval_source": "vector"
      }
    ],
    "total_hits": 1,
    "latency_ms": 120
  }
}
```

---

## 三、文档管理

### 3.1 上传文档
**POST** `/api/v1/knowledge-bases/{kb_id}/documents/upload`

**请求**: `multipart/form-data`，字段 `files` 支持多文件

**支持格式**: PDF、DOCX、MD、TXT

**文件限制**: 默认最大 50MB（可配置 `MAX_UPLOAD_SIZE_MB`）

**响应**:
```json
{
  "code": 200,
  "message": "上传处理完成",
  "data": [
    {
      "doc_id": 1,
      "filename": "readme.pdf",
      "status": "completed",
      "chunk_count": 15,
      "error": ""
    }
  ]
}
```

### 3.2 查询文档列表
**GET** `/api/v1/knowledge-bases/{kb_id}/documents`

### 3.3 删除文档
**DELETE** `/api/v1/documents/{doc_id}`

### 3.4 重新处理文档
**POST** `/api/v1/documents/{doc_id}/reprocess`

### 3.5 生成文档摘要
**POST** `/api/v1/documents/{doc_id}/summary`

**响应**:
```json
{"code": 200, "data": {"summary": "本文档介绍了..."}}
```

---

## 四、目录层级管理

> 目录层级管理属于知识库管理的子功能，用于组织和管理知识库的目录结构。

### 4.1 创建目录层级
**POST** `/api/v1/categories`

**请求参数**:
```json
{
  "name": "技术文档",
  "parent_id": null,
  "description": "技术相关文档分类",
  "sort_order": 0
}
```

**响应**:
```json
{
  "id": 1,
  "name": "技术文档",
  "parent_id": null,
  "description": "技术相关文档分类",
  "sort_order": 0,
  "created_at": "2026-01-01T00:00:00"
}
```

### 4.2 查询目录列表
**GET** `/api/v1/categories?parent_id=1`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| parent_id | int | 否 | 按父级筛选，不传返回全部 |

### 4.3 获取目录树
**GET** `/api/v1/categories/tree`

**响应**:
```json
[
  {
    "id": 1,
    "name": "技术文档",
    "parent_id": null,
    "description": "技术相关文档分类",
    "sort_order": 0,
    "children": [
      {
        "id": 2,
        "name": "Python",
        "parent_id": 1,
        "description": "",
        "sort_order": 0,
        "children": [],
        "kb_count": 3
      }
    ],
    "kb_count": 5
  }
]
```

### 4.4 查询单个目录
**GET** `/api/v1/categories/{cat_id}`

### 4.5 更新目录
**PUT** `/api/v1/categories/{cat_id}`

### 4.6 删除目录
**DELETE** `/api/v1/categories/{cat_id}`

**说明**: 删除后其下知识库移至未分类，子目录的 parent_id 置为被删除目录的 parent_id

---

## 五、智能体管理

### 5.1 创建智能体
**POST** `/api/v1/agents`

**请求参数**:
```json
{
  "name": "客服助手",
  "description": "智能客服机器人",
  "avatar": "https://example.com/avatar.png",
  "llm_model_id": 1,
  "system_prompt": "你是一个专业的客服助手，请根据知识库文档回答用户问题。",
  "opening_message": "您好，我是客服助手，有什么可以帮您？",
  "suggested_questions": "[\"如何退款？\", \"配送时间多久？\"]",
  "temperature": 0.1,
  "max_tokens": 2048,
  "top_k": 5,
  "similarity_threshold": 0.6,
  "knowledge_base_ids": [1, 2]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 智能体名称 |
| description | string | 否 | 描述 |
| avatar | string | 否 | 头像URL |
| llm_model_id | int | 否 | 对话模型ID，需为llm类型 |
| system_prompt | string | 否 | 系统提示词 |
| opening_message | string | 否 | 开场白 |
| suggested_questions | string | 否 | 建议问题JSON数组 |
| temperature | float | 否 | 温度，0.0-2.0，默认0.1 |
| max_tokens | int | 否 | 最大Token数，64-32768，默认2048 |
| top_k | int | 否 | 检索TopK，1-50，默认5 |
| similarity_threshold | float | 否 | 相似度阈值，0.0-1.0，默认0.6 |
| knowledge_base_ids | int[] | 否 | 关联知识库ID列表 |

**响应**:
```json
{
  "id": 1,
  "name": "客服助手",
  "description": "智能客服机器人",
  "avatar": "https://example.com/avatar.png",
  "llm_model_id": 1,
  "system_prompt": "你是一个专业的客服助手...",
  "opening_message": "您好，我是客服助手，有什么可以帮您？",
  "suggested_questions": "[\"如何退款？\", \"配送时间多久？\"]",
  "temperature": 0.1,
  "max_tokens": 2048,
  "top_k": 5,
  "similarity_threshold": 0.6,
  "api_key": "agent_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "status": "draft",
  "knowledge_base_ids": [1, 2],
  "created_at": "2026-01-01T00:00:00",
  "updated_at": "2026-01-01T00:00:00"
}
```

### 5.2 查询智能体列表
**GET** `/api/v1/agents?status=published`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 按状态筛选：`draft` / `published` |

### 5.3 查询单个智能体
**GET** `/api/v1/agents/{agent_id}`

### 5.4 更新智能体
**PUT** `/api/v1/agents/{agent_id}`

### 5.5 删除智能体
**DELETE** `/api/v1/agents/{agent_id}`

### 5.6 发布智能体
**POST** `/api/v1/agents/{agent_id}/publish`

**说明**: 发布后智能体状态变为 `published`，可通过独立API Key进行对话

**响应**:
```json
{"code": 200, "message": "智能体已发布", "data": {"api_key": "agent_xxx"}}
```

### 5.7 下线智能体
**POST** `/api/v1/agents/{agent_id}/unpublish`

### 5.8 重新生成API Key
**POST** `/api/v1/agents/{agent_id}/regenerate-key`

**响应**:
```json
{"code": 200, "data": {"api_key": "agent_new_key_xxx"}}
```

### 5.9 智能体对话（流式/非流式）
**POST** `/api/v1/agents/{agent_id}/chat`

**说明**: 智能体必须配置了对话模型和关联知识库

**请求参数**:
```json
{
  "query": "如何申请退款？",
  "conversation_id": null,
  "stream": true
}
```

**支持多知识库联合检索**: 自动遍历智能体关联的所有知识库，合并去重后取TopK

**非流式响应**:
```json
{
  "code": 200,
  "data": {
    "answer": "根据我们的退款政策...",
    "conversation_id": 1,
    "cited_sources": [
      {
        "chunk_id": 5,
        "doc_id": 1,
        "doc_name": "退款政策.pdf",
        "content": "退款申请流程...",
        "score": 0.85
      }
    ],
    "conflict_info": null,
    "latency_ms": 1200
  }
}
```

**流式响应（SSE格式）**:
```
data: {"type": "start"}
data: {"type": "token", "content": "根据"}
data: {"type": "token", "content": "我们的"}
...
data: {"type": "sources", "cited_sources": [...]}
data: {"type": "conflict", "conflict_info": {...}}
data: {"type": "latency", "latency_ms": 1200}
data: {"type": "end"}
```

**错误响应**:
- 未配置模型：`{"detail": "智能体未配置对话模型"}`
- 未关联知识库：`{"detail": "智能体未关联知识库"}`

### 5.10 查询智能体会话列表
**GET** `/api/v1/agents/{agent_id}/conversations`

---

## 六、Prompt配置管理

### 6.1 查询提示词列表
**GET** `/api/v1/prompts?category=qa_main`

### 6.2 查询单个提示词
**GET** `/api/v1/prompts/{prompt_id}`

### 6.3 创建自定义提示词
**POST** `/api/v1/prompts`

**请求参数**:
```json
{
  "name": "自定义问答提示词",
  "category": "qa_main",
  "content": "你是...",
  "description": "自定义模板",
  "is_default": true
}
```

### 6.4 修改提示词
**PUT** `/api/v1/prompts/{prompt_id}`

### 6.5 删除提示词
**DELETE** `/api/v1/prompts/{prompt_id}`

**异常**（系统内置不可删除）:
```json
{"detail": "系统内置提示词不可删除"}
```

### 6.6 重置为系统默认
**POST** `/api/v1/prompts/{prompt_id}/reset`

### 6.7 设为默认提示词
**POST** `/api/v1/prompts/{prompt_id}/set-default`

---

## 七、会话管理

### 7.1 查询会话列表
**GET** `/api/v1/conversations?agent_id=1`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | int | 否 | 按智能体筛选 |

### 7.2 新建会话
**POST** `/api/v1/conversations?agent_id=1&title=新对话`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | int | 是 | 关联智能体ID |
| title | string | 否 | 会话标题，默认"新对话" |

### 7.3 删除会话
**DELETE** `/api/v1/conversations/{conv_id}`

### 7.4 查询会话消息
**GET** `/api/v1/conversations/{conv_id}/messages`

### 7.5 导出会话日志
**GET** `/api/v1/conversations/{conv_id}/export`

### 7.6 导出全部问答日志
**GET** `/api/v1/export/messages?agent_id=1`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | int | 否 | 按智能体筛选 |

---

## 八、系统配置

### 8.1 查询系统资源
**GET** `/api/v1/resources`

**响应**:
```json
{
  "chroma_size_mb": 12.5,
  "database_size_mb": 0.8,
  "upload_size_mb": 45.2,
  "total_documents": 10,
  "total_chunks": 150
}
```

---

## 九、健康检查

**GET** `/health`

**响应**:
```json
{"status": "ok", "version": "1.0.0"}
```

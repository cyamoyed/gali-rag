# 功能测试用例

## 测试环境准备

```bash
# 确保服务已启动
curl http://localhost:8000/health
```

---

## 一、模型管理

### 1.1 创建并测试模型连接

```bash
# 1. 创建Ollama LLM模型
curl -X POST http://localhost:8000/api/v1/models \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "Qwen2.5-7B",
    "provider": "ollama",
    "model_type": "llm",
    "model_name": "qwen2.5:7b",
    "base_url": "http://localhost:11434"
  }'

# 2. 创建Embedding模型
curl -X POST http://localhost:8000/api/v1/models \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "Nomic Embed Text",
    "provider": "ollama",
    "model_type": "embedding",
    "model_name": "nomic-embed-text",
    "base_url": "http://localhost:11434"
  }'

# 3. 测试模型连接
curl -X POST http://localhost:8000/api/v1/models/1/test \
  -H "X-API-Key: your-api-key"

# 4. 设为默认模型
curl -X POST http://localhost:8000/api/v1/models/1/set-default \
  -H "X-API-Key: your-api-key"

# 5. 查询模型列表（按类型筛选）
curl http://localhost:8000/api/v1/models?model_type=llm \
  -H "X-API-Key: your-api-key"
```

### 1.2 内置模型不可删除

```bash
# 尝试删除内置模型（预期失败）
curl -X DELETE http://localhost:8000/api/v1/models/1 \
  -H "X-API-Key: your-api-key"
# 预期: {"detail": "模型不存在或为内置模型，不可删除"}
```

---

## 二、目录层级管理

### 2.1 树形目录CRUD

```bash
# 1. 创建父级目录
curl -X POST http://localhost:8000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "技术文档", "description": "技术相关"}'

# 2. 创建子目录
curl -X POST http://localhost:8000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "Python", "parent_id": 1, "sort_order": 1}'

# 3. 获取目录树
curl http://localhost:8000/api/v1/categories/tree \
  -H "X-API-Key: your-api-key"

# 4. 删除父级目录（子目录应保留，parent_id置为被删除目录的parent_id）
curl -X DELETE http://localhost:8000/api/v1/categories/1 \
  -H "X-API-Key: your-api-key"
```

---

## 三、智能体管理

### 3.1 智能体生命周期

```bash
# 1. 创建智能体（草稿状态）
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "客服助手",
    "description": "智能客服",
    "llm_model_id": 1,
    "system_prompt": "你是客服助手，请根据文档回答问题。",
    "opening_message": "您好，有什么可以帮您？",
    "suggested_questions": "[\"如何退款？\",\"配送时间？\"]",
    "temperature": 0.1,
    "top_k": 5,
    "similarity_threshold": 0.6,
    "knowledge_base_ids": [1]
  }'

# 2. 发布智能体
curl -X POST http://localhost:8000/api/v1/agents/1/publish \
  -H "X-API-Key: your-api-key"
# 预期返回 api_key

# 3. 重新生成API Key
curl -X POST http://localhost:8000/api/v1/agents/1/regenerate-key \
  -H "X-API-Key: your-api-key"

# 4. 下线智能体
curl -X POST http://localhost:8000/api/v1/agents/1/unpublish \
  -H "X-API-Key: your-api-key"

# 5. 删除智能体
curl -X DELETE http://localhost:8000/api/v1/agents/1 \
  -H "X-API-Key: your-api-key"
```

### 3.2 智能体对话

```bash
# 1. 使用Agent API Key进行对话（非流式）
curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "如何退款？", "stream": false}'

# 2. 流式对话
curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "如何退款？", "stream": true}'

# 3. 多轮对话（携带conversation_id）
curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "需要多长时间？", "conversation_id": 1, "stream": false}'

# 4. 查询智能体会话列表
curl http://localhost:8000/api/v1/agents/1/conversations \
  -H "X-API-Key: your-api-key"
```

### 3.3 智能体配置验证

```bash
# 智能体未配置模型时对话（预期失败）
curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "测试"}'
# 预期: {"detail": "智能体未配置对话模型"}

# 智能体未关联知识库时对话（预期失败）
# 预期: {"detail": "智能体未关联知识库"}
```

---

## 四、知识库隔离验证

**目的**: 验证A库文档在B库提问返回无匹配

```bash
# 1. 创建知识库A
curl -X POST http://localhost:8000/api/v1/knowledge-bases \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "知识库A"}'

# 2. 创建知识库B
curl -X POST http://localhost:8000/api/v1/knowledge-bases \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "知识库B"}'

# 3. 向知识库A上传文档
echo "RAG是检索增强生成技术的缩写" > test_a.txt
curl -X POST http://localhost:8000/api/v1/knowledge-bases/1/documents/upload \
  -H "X-API-Key: your-api-key" \
  -F "files=@test_a.txt"

# 4. 在知识库A进行命中测试（应有结果）
curl -X POST "http://localhost:8000/api/v1/knowledge-bases/1/hit-test?query=什么是RAG" \
  -H "X-API-Key: your-api-key"

# 5. 在知识库B进行命中测试（应返回空结果）
curl -X POST "http://localhost:8000/api/v1/knowledge-bases/2/hit-test?query=什么是RAG" \
  -H "X-API-Key: your-api-key"
# 预期：B库返回空hits列表
```

---

## 五、文档删除后验证

```bash
# 1. 上传文档
echo "FastAPI是一个现代Python Web框架" > test_del.txt
curl -X POST http://localhost:8000/api/v1/knowledge-bases/1/documents/upload \
  -H "X-API-Key: your-api-key" \
  -F "files=@test_del.txt"

# 2. 确认可以召回
curl -X POST "http://localhost:8000/api/v1/knowledge-bases/1/hit-test?query=FastAPI是什么" \
  -H "X-API-Key: your-api-key"

# 3. 删除文档
curl -X DELETE http://localhost:8000/api/v1/documents/2 \
  -H "X-API-Key: your-api-key"

# 4. 再次命中测试（应返回空结果）
curl -X POST "http://localhost:8000/api/v1/knowledge-bases/1/hit-test?query=FastAPI是什么" \
  -H "X-API-Key: your-api-key"
```

---

## 六、无匹配阈值验证

```bash
# 1. 上传文档
echo "今天天气很好" > test_weather.txt
curl -X POST http://localhost:8000/api/v1/knowledge-bases/1/documents/upload \
  -H "X-API-Key: your-api-key" \
  -F "files=@test_weather.txt"

# 2. 提问完全不相关的内容
curl -X POST "http://localhost:8000/api/v1/knowledge-bases/1/hit-test?query=量子纠缠的原理是什么" \
  -H "X-API-Key: your-api-key"
# 预期：返回空hits列表
```

---

## 七、Prompt自定义验证

```bash
# 1. 查看当前默认Prompt
curl http://localhost:8000/api/v1/prompts?category=qa_main \
  -H "X-API-Key: your-api-key"

# 2. 创建自定义Prompt（要求用英文回答，语气幽默）
curl -X POST http://localhost:8000/api/v1/prompts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "幽默英文助手",
    "category": "qa_main",
    "content": "You are a humorous assistant. Answer strictly based on the provided documents. Be funny but accurate.\n\nDocuments:\n{{retrieval_chunks}}\n\nChat History:\n{{chat_history}}\n\nSources:\n{{cited_sources}}\n\nConflicts:\n{{conflict_info}}\n\nUser Question:\n{{user_query}}\n\nAnswer in English with humor:",
    "description": "幽默英文风格",
    "is_default": true
  }'

# 3. 重置为默认
curl -X POST http://localhost:8000/api/v1/prompts/1/reset \
  -H "X-API-Key: your-api-key"
```

---

## 八、流式对话验证

```bash
# 流式对话
curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "RAG技术的优势是什么？", "stream": true}'

# 预期SSE输出：
# data: {"type": "start"}
# data: {"type": "token", "content": "RAG"}
# data: {"type": "token", "content": "技术"}
# ...
# data: {"type": "sources", "cited_sources": [...]}
# data: {"type": "conflict", "conflict_info": {...}}
# data: {"type": "latency", "latency_ms": 1200}
# data: {"type": "end"}
```

---

## 九、冲突信息检出验证

```bash
# 1. 上传两个包含矛盾信息的文档
echo "Python最新版本是3.12" > conflict_a.txt
echo "Python最新版本是3.13" > conflict_b.txt

curl -X POST http://localhost:8000/api/v1/knowledge-bases/1/documents/upload \
  -H "X-API-Key: your-api-key" \
  -F "files=@conflict_a.txt"
curl -X POST http://localhost:8000/api/v1/knowledge-bases/1/documents/upload \
  -H "X-API-Key: your-api-key" \
  -F "files=@conflict_b.txt"

# 2. 使用智能体对话（需先创建关联该知识库的智能体）
curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "Python最新版本是多少？", "stream": false}'
# 预期：conflict_info.has_conflict 应为 true
```

---

## 十、多轮对话上下文理解

```bash
# 1. 创建智能体并关联知识库
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "测试助手",
    "llm_model_id": 1,
    "knowledge_base_ids": [1]
  }'

curl -X POST http://localhost:8000/api/v1/agents/1/publish \
  -H "X-API-Key: your-api-key"

# 2. 第一轮提问
curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "RAG是什么技术？", "stream": false}'

# 3. 第二轮追问（指代理解）
curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "它的优势是什么？", "conversation_id": 1, "stream": false}'
# 预期：第二轮应理解"它"指的是RAG
```

---

## 十一、系统资源查询

```bash
# 查看系统资源
curl http://localhost:8000/api/v1/resources \
  -H "X-API-Key: your-api-key"

# 预期响应：
# {
#   "chroma_size_mb": 12.5,
#   "database_size_mb": 0.8,
#   "upload_size_mb": 45.2,
#   "total_documents": 10,
#   "total_chunks": 150
# }
```

---

## 十二、多知识库联合检索（智能体）

```bash
# 1. 创建两个知识库并上传不同文档
curl -X POST http://localhost:8000/api/v1/knowledge-bases \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "产品知识库"}'

curl -X POST http://localhost:8000/api/v1/knowledge-bases \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "售后知识库"}'

# 分别上传文档
echo "产品A售价999元" > product.txt
echo "7天无理由退款" > aftersale.txt

curl -X POST http://localhost:8000/api/v1/knowledge-bases/1/documents/upload \
  -H "X-API-Key: your-api-key" -F "files=@product.txt"
curl -X POST http://localhost:8000/api/v1/knowledge-bases/2/documents/upload \
  -H "X-API-Key: your-api-key" -F "files=@aftersale.txt"

# 2. 创建关联两个知识库的智能体
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "综合客服",
    "llm_model_id": 1,
    "knowledge_base_ids": [1, 2],
    "top_k": 10
  }'

# 3. 发布并对话
curl -X POST http://localhost:8000/api/v1/agents/1/publish \
  -H "X-API-Key: your-api-key"

curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "产品A多少钱？能退款吗？", "stream": false}'
# 预期：回答应同时包含产品价格和退款政策信息
```

---

## 十三、API Key认证验证

```bash
# 1. 无Key访问（预期401）
curl http://localhost:8000/api/v1/knowledge-bases
# 预期: {"code": 401, "message": "未授权：无效或缺失的API Key"}

# 2. 错误Key访问（预期401）
curl http://localhost:8000/api/v1/knowledge-bases \
  -H "X-API-Key: wrong-key"

# 3. 正确Key访问（预期200）
curl http://localhost:8000/api/v1/knowledge-bases \
  -H "X-API-Key: your-api-key"

# 4. 公开路径无需Key
curl http://localhost:8000/health
```

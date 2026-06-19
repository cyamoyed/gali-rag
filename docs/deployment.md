# 本地环境部署教程

## 一、环境准备

### 1.1 Python环境
- 要求：Python 3.10+
- 推荐使用虚拟环境

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 确认Python版本
python --version
```

### 1.2 安装依赖

```bash
pip install -r requirements.txt
```

## 二、Ollama本地大模型安装

### 2.1 安装Ollama

**Windows**:
访问 https://ollama.com/download 下载安装包

**Linux**:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Mac**:
```bash
brew install ollama
```

### 2.2 拉取默认模型

```bash
# 拉取对话模型
ollama pull qwen2.5:7b

# 拉取向量模型
ollama pull nomic-embed-text

# 验证模型
ollama list
```

### 2.3 启动Ollama服务

```bash
# Ollama默认监听 http://localhost:11434
ollama serve
```

## 三、项目初始化

### 3.1 目录结构确认

```
gali-rag-2/
├── app/
│   ├── api/v1/          # API路由
│   ├── core/            # 配置、数据库
│   ├── models/          # 数据模型
│   ├── schemas/         # Pydantic校验
│   ├── services/        # 业务逻辑
│   ├── rag/             # RAG核心
│   ├── utils/           # 工具类
│   └── prompts/         # Prompt模板
├── data/
│   ├── chroma/          # Chroma向量库持久化
│   ├── uploads/         # 上传文件存储
│   └── exports/         # 导出文件
├── tests/               # 测试
├── docs/                # 文档
├── main.py              # 启动入口
├── requirements.txt     # 依赖
└── .env                 # 环境变量（可选）
```

### 3.2 配置环境变量（可选）

复制 `.env.example` 为 `.env` 并修改：

```bash
cp .env.example .env
```

主要配置项：
- `LLM_PROVIDER`: ollama 或 openai
- `OLLAMA_BASE_URL`: Ollama地址（默认 http://localhost:11434）
- `LLM_MODEL`: 对话模型名（默认 qwen2.5:7b）
- `EMBEDDING_MODEL`: 向量模型名（默认 nomic-embed-text）
- `API_KEY`: 系统管理API Key（留空则不需要认证）

## 四、启动服务

```bash
# 开发模式（自动重载）
python main.py

# 或使用uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 五、访问验证

### 5.1 健康检查

```bash
curl http://localhost:8000/health
```

预期响应：
```json
{"status": "ok", "version": "1.0.0"}
```

### 5.2 API文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 5.3 快速体验

```bash
# 1. 创建模型（需要先配置API Key或留空）
curl -X POST http://localhost:8000/api/v1/models \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Qwen2.5-7B",
    "provider": "ollama",
    "model_type": "llm",
    "model_name": "qwen2.5:7b",
    "base_url": "http://localhost:11434"
  }'

# 2. 创建知识库
curl -X POST http://localhost:8000/api/v1/knowledge-bases \
  -H "Content-Type: application/json" \
  -d '{"name": "测试知识库", "description": "测试用"}'

# 3. 上传文档
curl -X POST http://localhost:8000/api/v1/knowledge-bases/1/documents/upload \
  -F "files=@test.txt"

# 4. 命中测试（仅检索）
curl -X POST "http://localhost:8000/api/v1/knowledge-bases/1/hit-test?query=测试问题"

# 5. 创建智能体并对话
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试助手",
    "llm_model_id": 1,
    "knowledge_base_ids": [1],
    "system_prompt": "你是一个知识库问答助手。"
  }'

curl -X POST http://localhost:8000/api/v1/agents/1/publish

curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "文档说了什么？", "stream": false}'
```

## 六、常见问题

### Q1: Ollama连接失败
确认Ollama服务已启动：`curl http://localhost:11434`

### Q2: 向量模型加载慢
首次使用向量模型需要下载，耐心等待或提前 `ollama pull nomic-embed-text`

### Q3: 端口占用
修改启动端口：`uvicorn main:app --port 8001`

### Q4: SQLite并发写入问题
默认已配置WAL模式，适合读多写少场景。高并发写入建议迁移到PostgreSQL。

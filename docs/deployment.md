# 部署指南

## 一、环境准备

### 1.1 Python 环境

- 要求：Python 3.10+
- 推荐使用虚拟环境

```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# 确认 Python 版本
python --version
```

### 1.2 安装依赖

```bash
pip install -r requirements.txt

# 开发环境（含测试、lint 工具）
pip install -r requirements-dev.txt
```

## 二、Ollama 本地大模型安装

### 2.1 安装 Ollama

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

### 2.3 启动 Ollama 服务

```bash
# Ollama 默认监听 http://localhost:11434
ollama serve
```

## 三、项目初始化

### 3.1 目录结构确认

```
gali-rag/
├── app/
│   ├── api/v1/          # API 路由
│   ├── core/            # 配置、数据库
│   ├── models/          # 数据模型
│   ├── schemas/         # Pydantic 校验
│   ├── services/        # 业务逻辑
│   ├── rag/             # RAG 核心
│   └── utils/           # 工具类
├── frontend/            # React 前端
├── data/
│   ├── chroma/          # Chroma 向量库持久化
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

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `API_KEY` | 系统管理 API Key，留空则跳过鉴权 | `""` |
| `CORS_ORIGINS` | CORS 允许的来源，逗号分隔 | `""`（允许 localhost） |
| `MAX_UPLOAD_SIZE_MB` | 单文件上传大小上限 (MB) | `50` |
| `CHUNK_SIZE` | 文本切片长度 | `500` |
| `CHUNK_OVERLAP` | 切片重叠长度 | `100` |
| `DEFAULT_TOP_K` | 检索返回结果数 | `5` |
| `BM25_TOP_N` | BM25 召回数 | `5` |
| `VECTOR_TOP_N` | 向量召回数 | `5` |
| `SIMILARITY_THRESHOLD` | 相似度阈值 | `0.6` |
| `SEMANTIC_CHUNK_ENABLED` | 启用语义切片 | `false` |
| `LLM_CHUNK_ENABLED` | 启用 LLM 辅助切片 | `false` |
| `HNSW_M` | HNSW 索引 M 参数 | `16` |
| `HNSW_EF_CONSTRUCTION` | HNSW 构建 ef 参数 | `200` |
| `HNSW_EF_SEARCH` | HNSW 搜索 ef 参数 | `100` |

## 四、启动服务

### 4.1 手动启动

```bash
# 开发模式（自动重载）
python main.py

# 或使用 uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 生产模式（多 worker）
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4.2 启动前端（开发模式）

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，开发模式下自动代理 `/api/` 请求到后端。

## 五、Docker 部署

### 5.1 Docker Compose 一键部署

项目提供了 `docker-compose.yml`，可一键启动前后端服务：

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env 设置 API_KEY 等配置

# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

启动后：
- **前端**：`http://localhost:80`（Nginx 反向代理，自动转发 `/api/` 到后端）
- **后端 API**：`http://localhost:8000`

### 5.2 单独构建后端镜像

```bash
docker build -t gali-rag-backend .
docker run -d \
  -p 8000:8000 \
  -v gali-data:/app/data \
  --env-file .env \
  --name gali-rag \
  gali-rag-backend
```

### 5.3 单独构建前端镜像

```bash
cd frontend

# 默认 API 地址为 /api/v1（Nginx 反向代理模式）
docker build -t gali-rag-frontend .

# 自定义 API 地址（直连后端模式）
docker build --build-arg VITE_API_BASE_URL=http://your-backend:8000/api/v1 -t gali-rag-frontend .

docker run -d -p 80:80 --name gali-frontend gali-rag-frontend
```

### 5.4 数据持久化

Docker Compose 默认使用 named volumes 持久化数据：

| Volume | 挂载路径 | 说明 |
|--------|---------|------|
| `gali-db` | `/app/data` | SQLite 数据库 |
| `gali-chroma` | `/app/data/chroma` | ChromaDB 向量库 |
| 绑定挂载 | `./data/uploads` | 上传文件（宿主机目录） |
| 绑定挂载 | `./data/exports` | 导出文件（宿主机目录） |

## 六、生产环境配置建议

### 6.1 CORS 配置

生产环境务必配置 `CORS_ORIGINS`，限制允许的前端域名：

```bash
# .env
CORS_ORIGINS=https://your-domain.com
```

多个来源用逗号分隔：`CORS_ORIGINS=https://a.com,https://b.com`

### 6.2 API Key 鉴权

```bash
# .env
API_KEY=your-strong-secret-key
```

配置后所有 API 请求需在 `X-API-Key` 头中携带此 Key。留空则跳过鉴权（仅建议开发环境使用）。

### 6.3 Nginx 反向代理（手动部署）

如果不用 Docker，手动部署时建议用 Nginx 反向代理前后端：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /path/to/frontend/dist;
    index index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        client_max_body_size 50M;
    }

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 6.4 HTTPS 配置

建议使用 Let's Encrypt + Certbot 配置 HTTPS：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d your-domain.com
```

## 七、访问验证

### 7.1 健康检查

```bash
curl http://localhost:8000/health
```

预期响应：
```json
{"status": "ok", "version": "1.0.0"}
```

### 7.2 API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 7.3 快速体验

```bash
# 1. 创建模型（需要先配置 API Key 或留空）
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

# 2. 创建知识库
curl -X POST http://localhost:8000/api/v1/knowledge-bases \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "测试知识库", "description": "测试用"}'

# 3. 上传文档
curl -X POST http://localhost:8000/api/v1/knowledge-bases/1/documents/upload \
  -H "X-API-Key: your-api-key" \
  -F "files=@test.txt"

# 4. 命中测试（仅检索）
curl -X POST "http://localhost:8000/api/v1/knowledge-bases/1/hit-test?query=测试问题" \
  -H "X-API-Key: your-api-key"

# 5. 创建智能体并对话
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "测试助手",
    "llm_model_id": 1,
    "knowledge_base_ids": [1],
    "system_prompt": "你是一个知识库问答助手。"
  }'

curl -X POST http://localhost:8000/api/v1/agents/1/publish \
  -H "X-API-Key: your-api-key"

# 使用 Agent Key 对话
curl -X POST http://localhost:8000/api/v1/agents/1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: agent_xxx" \
  -d '{"query": "文档说了什么？", "stream": false}'
```

## 八、常见问题

### Q1: Ollama 连接失败
确认 Ollama 服务已启动：`curl http://localhost:11434`

### Q2: 向量模型加载慢
首次使用向量模型需要下载，耐心等待或提前 `ollama pull nomic-embed-text`

### Q3: 端口占用
修改启动端口：`uvicorn main:app --port 8001`

### Q4: SQLite 并发写入问题
默认已配置 WAL 模式，适合读多写少场景。高并发写入建议迁移到 PostgreSQL。

### Q5: Docker 容器内无法连接 Ollama
Docker 容器中 `localhost` 指向容器自身。如果 Ollama 运行在宿主机上，需要使用宿主机 IP 或 Docker 内网地址（如 `http://host.docker.internal:11434`）。

### Q6: 前端无法访问后端 API
- Docker 部署：确认 `frontend` 容器的 Nginx 配置中 `proxy_pass` 指向 `http://backend:8000`
- 手动部署：确认 `CORS_ORIGINS` 包含前端域名，或留空使用默认 localhost

### Q7: 文件上传大小限制
默认限制 50MB，可通过 `MAX_UPLOAD_SIZE_MB` 环境变量调整。Docker 部署时还需确认 Nginx 的 `client_max_body_size` 配置。

# Gali-RAG

私有化部署的 RAG（检索增强生成）知识库问答系统。支持文档上传、智能切片、多路召回、流式对话，开箱即用。

## 功能特性

- **知识库管理** — 创建知识库，上传 PDF / DOCX / MD / TXT 文档，自动解析、切片、向量化
- **智能体** — 配置独立的系统提示词、关联多个知识库、绑定 LLM 模型，一键发布并提供 API 对话接口
- **RAG 管线** — Query 改写 → 多路召回（稠密向量 + BM25） → 重排序 → 冲突检测 → LLM 生成
- **多模型支持** — 兼容 Ollama 本地模型和 OpenAI 兼容接口，支持 LLM / Embedding / Reranking 等多种模型类型
- **流式对话** — SSE 实时返回 token，支持引用溯源和冲突提示
- **Prompt 模板** — 自定义提示词模板，系统内置默认模板
- **会话管理** — 对话历史记录、按智能体筛选、导出问答日志
- **网页抓取** — 支持 web 类型知识库，配置 URL 自动抓取入库
- **前端界面** — React + TypeScript + Tailwind CSS 构建的完整管理后台

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | FastAPI + Uvicorn |
| 数据库 | SQLite + SQLAlchemy |
| 向量存储 | ChromaDB |
| RAG 引擎 | LangChain + BM25 + 自研重排序 |
| 前端框架 | React 19 + TypeScript + Vite |
| 状态管理 | Zustand |
| UI 样式 | Tailwind CSS |

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- Ollama（或 OpenAI 兼容的 API 服务）

### 1. 安装后端

```bash
# 克隆项目
git clone <repository-url>
cd gali-rag

# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 开发环境（含测试、lint 工具）
pip install -r requirements-dev.txt

# 配置环境变量（可选）
cp .env.example .env
```

### 2. 安装 Ollama 并拉取模型

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# 拉取默认模型
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
```

### 3. 启动后端

```bash
python main.py
# 或
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

后端运行在 `http://localhost:8000`，API 文档访问 `http://localhost:8000/docs`。

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`。

## 项目结构

```
gali-rag/
├── app/
│   ├── api/v1/          # RESTful API 路由
│   ├── core/            # 配置、数据库初始化
│   ├── models/          # SQLAlchemy ORM 模型
│   ├── schemas/         # Pydantic 请求/响应模型
│   ├── services/        # 业务逻辑层
│   ├── rag/             # RAG 核心（检索、重排、生成）
│   └── utils/           # 文档解析、文本切片、Token 计数
├── frontend/            # React + TypeScript 前端
├── tests/               # 测试
├── docs/                # 项目文档
├── data/                # 运行时数据（SQLite、向量库、上传文件）
├── main.py              # 后端入口
└── requirements.txt     # Python 依赖
```

## 环境变量

在 `.env` 文件中配置（参考 `.env.example`）：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `API_KEY` | 系统管理 API Key，留空则跳过鉴权 | `""` |
| `MAX_UPLOAD_SIZE_MB` | 单文件上传大小上限 (MB) | `50` |
| `CHUNK_SIZE` | 文本切片长度 | `500` |
| `CHUNK_OVERLAP` | 切片重叠长度 | `100` |
| `DEFAULT_TOP_K` | 检索返回结果数 | `5` |
| `SIMILARITY_THRESHOLD` | 相似度阈值 | `0.6` |

更多配置项（HNSW 索引参数、BM25/Vector 召回数等）见 `app/core/config.py`。

## 文档

- [系统架构](docs/architecture.md)
- [API 接口文档](docs/api.md)
- [数据库设计](docs/database.md)
- [部署指南](docs/deployment.md)
- [测试用例](docs/test_cases.md)

## 许可证

[MIT](LICENSE)

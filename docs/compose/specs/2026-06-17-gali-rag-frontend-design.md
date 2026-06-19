# Gali RAG 前端工程设计规格

## [S1] 概述

为 Gali RAG 知识库系统构建现代化前端界面，采用简约美观的设计风格，重点突出用户友好性和操作便捷性。

**技术栈**: React 18 + TypeScript + Vite + Semi Design
**后端API**: FastAPI RESTful API (端口 8000)
**通信方式**: REST API + SSE 流式对话

## [S2] 导航结构

### 主导航（侧边栏）

| 优先级 | 菜单项 | 图标 | 说明 |
|--------|--------|------|------|
| 1 | 对话问答 | 💬 | 最高优先级，独立入口，视觉突出 |
| 2 | 知识库 | 📁 | 文件管理器风格，统一管理文件夹和知识库 |
| 3 | 智能体 | 🤖 | 智能体列表和管理 |
| 4 | 模型管理 | ⚙️ | AI模型配置 |
| 5 | 系统设置 | 🔧 | 系统参数配置 |

### 次级导航

- 帮助文档（侧边栏底部）
- 用户头像/退出

## [S3] 页面设计

### S3.1 对话问答页

**路由**: `/chat`

**布局**:
- 左侧面板（280px）：智能体选择列表 + 历史会话列表
- 右侧主区域：对话界面

**功能**:
- 选择智能体后进入对话
- SSE 流式输出
- 显示引用来源和冲突信息
- 支持新建会话、查看历史

**API**:
- `GET /api/v1/agents` - 获取智能体列表
- `POST /api/v1/agents/{id}/chat` - 发送消息（SSE流式）
- `GET /api/v1/agents/{id}/conversations` - 获取会话列表
- `GET /api/v1/conversations/{id}/messages` - 获取消息历史

### S3.2 知识库页

**路由**: `/knowledge-bases`

**布局（文件管理器风格）**:
- 左侧面板（240px）：文件夹树 + 新建文件夹按钮
- 右侧内容区：知识库卡片网格 + 操作工具栏

**功能**:
- 文件夹树形导航（支持多级嵌套）
- 知识库卡片展示（名称、描述、文档数、状态）
- 新建知识库、新建文件夹
- 拖拽移动知识库到文件夹
- 搜索和筛选

**API**:
- `GET /api/v1/categories/tree` - 获取目录树
- `POST /api/v1/categories` - 创建目录
- `GET /api/v1/knowledge-bases?category_id=` - 获取知识库列表
- `POST /api/v1/knowledge-bases` - 创建知识库

### S3.3 知识库详情页

**路由**: `/knowledge-bases/:id`

**布局**: 标签页切换

**标签页**:
1. **文档管理** - 文档列表、上传、删除、重新处理
2. **切片配置** - 分词参数、语义切片、LLM切片配置
3. **命中测试** - 输入问题测试检索效果
4. **基础设置** - 名称、描述、Embedding模型、Web配置

**API**:
- `GET /api/v1/knowledge-bases/{id}` - 获取知识库详情
- `POST /api/v1/knowledge-bases/{id}/documents/upload` - 上传文档
- `GET /api/v1/knowledge-bases/{id}/documents` - 文档列表
- `PUT /api/v1/knowledge-bases/{id}/chunk-config` - 切片配置
- `POST /api/v1/chat` - 命中测试对话
- `PUT /api/v1/knowledge-bases/{id}` - 更新设置

### S3.4 智能体页

**路由**: `/agents`

**布局**: 卡片网格列表

**功能**:
- 智能体卡片展示（名称、描述、状态、关联KB数）
- 新建智能体
- 发布/下线操作
- 点击进入详情页

**API**:
- `GET /api/v1/agents` - 获取智能体列表
- `POST /api/v1/agents` - 创建智能体
- `POST /api/v1/agents/{id}/publish` - 发布
- `POST /api/v1/agents/{id}/unpublish` - 下线

### S3.5 智能体详情页

**路由**: `/agents/:id`

**布局**: 左配置右预览

**左侧面板（配置区）**:
- 基本信息（名称、描述、头像）
- 模型配置（LLM模型、温度、最大token）
- 关联知识库（多选）
- Prompt管理（系统提示词、开场白、推荐问题）
- 检索配置（top_k、相似度阈值）

**右侧区域（预览区）**:
- 实时对话预览窗口
- 显示引用来源

**API**:
- `GET /api/v1/agents/{id}` - 获取详情
- `PUT /api/v1/agents/{id}` - 更新配置
- `POST /api/v1/agents/{id}/chat` - 预览对话
- `GET /api/v1/models?type=llm` - 获取可用模型
- `GET /api/v1/knowledge-bases` - 获取可用知识库

### S3.6 模型管理页

**路由**: `/models`

**布局**: 表格列表 + 抽屉编辑

**功能**:
- 模型列表（名称、提供商、类型、状态）
- 新建模型（LLM/Embedding/Reranking）
- 编辑、删除、设为默认
- 测试连接

**API**:
- `GET /api/v1/models` - 模型列表
- `POST /api/v1/models` - 创建模型
- `PUT /api/v1/models/{id}` - 更新模型
- `DELETE /api/v1/models/{id}` - 删除模型
- `POST /api/v1/models/{id}/test` - 测试连接
- `POST /api/v1/models/{id}/set-default` - 设为默认

### S3.7 系统设置页

**路由**: `/settings`

**布局**: 表单卡片

**功能**:
- LLM默认配置（提供商、API Key、模型、温度）
- 检索参数配置（top_k、BM25/Vector权重、相似度阈值）
- 系统资源监控（向量库大小、文档数、切片数）

**API**:
- `GET/PUT /api/v1/config/llm` - LLM配置
- `GET/PUT /api/v1/config/retrieval` - 检索配置
- `GET /api/v1/resources` - 系统资源

## [S4] 设计规范

### 色彩方案（基于 DESIGN.md）

- 主色调：`#171717`（墨黑）
- 强调色：`#0070f3`（链接蓝）
- 背景：`#fafafa`（柔白）
- 卡片：`#ffffff`（纯白）
- 文字：`#171717` / `#4d4d4d` / `#888888`
- 边框：`#ebebeb`

### 字体

- 主字体：Inter / system-ui
- 等宽：JetBrains Mono / SF Mono

### 圆角

- 按钮：6px
- 卡片：8px / 12px
- 输入框：6px

### 阴影

- 卡片：`0px 1px 2px rgba(0,0,0,0.04), 0px 4px 12px rgba(0,0,0,0.06)`
- 悬浮：`0px 1px 2px rgba(0,0,0,0.04), 0px 8px 24px rgba(0,0,0,0.08)`

## [S5] 项目结构

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/                    # API 请求封装
│   │   ├── client.ts           # axios 实例
│   │   ├── knowledgeBase.ts
│   │   ├── agent.ts
│   │   ├── chat.ts
│   │   ├── model.ts
│   │   └── system.ts
│   ├── components/             # 通用组件
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── index.tsx
│   │   ├── Chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── SourceCard.tsx
│   │   └── FileTree/
│   │       └── FolderTree.tsx
│   ├── pages/                  # 页面组件
│   │   ├── Chat/
│   │   │   └── index.tsx
│   │   ├── KnowledgeBase/
│   │   │   ├── List.tsx
│   │   │   └── Detail.tsx
│   │   ├── Agent/
│   │   │   ├── List.tsx
│   │   │   └── Detail.tsx
│   │   ├── Model/
│   │   │   └── index.tsx
│   │   └── Settings/
│   │       └── index.tsx
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useChat.ts
│   │   └── useSSE.ts
│   ├── types/                  # TypeScript 类型
│   │   └── index.ts
│   └── utils/                  # 工具函数
│       └── index.ts
└── public/
```

## [S6] 错误处理

- API 请求统一拦截，显示 Toast 提示
- 网络错误显示重试按钮
- 表单验证使用 Semi Design 内置校验
- SSE 连接断开自动重连（最多3次）

## [S7] 响应式设计

- 侧边栏：桌面端固定，移动端抽屉式
- 卡片网格：自动填充，最小宽度 300px
- 对话界面：移动端全屏

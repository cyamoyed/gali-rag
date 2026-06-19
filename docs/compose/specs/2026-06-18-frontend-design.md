# Gali RAG 前端工程设计文档

## [S1] 概述

### 项目背景
Gali RAG 是一个私有化部署的 RAG 知识库问答服务后端，已具备完整的 API 接口。本项目为其设计并实现前端管理界面，面向 B 端用户提供友好的知识库管理体验。

### 设计目标
- 现代化卡片式设计，视觉层次分明
- 响应式布局，适配不同屏幕尺寸
- 清晰的导航系统，模块间快速切换
- 简约色彩方案，主色调不超过 3 种
- 合理运用留白，避免界面拥挤
- 直观的功能模块视觉标识

### 技术栈
| 类别 | 选型 | 版本 |
|------|------|------|
| 构建工具 | Vite | 5.x |
| 前端框架 | React | 18.x |
| 类型系统 | TypeScript | 5.x |
| 路由 | React Router | 6.x |
| 状态管理 | Zustand | 4.x |
| HTTP 客户端 | Axios | 1.x |
| 样式方案 | Tailwind CSS | 3.x |
| 图标库 | Lucide React | latest |
| 表单处理 | React Hook Form | 7.x |

## [S2] 目录结构

```
frontend/
├── src/
│   ├── app/                        # 应用入口
│   │   ├── layout/                 # 布局组件
│   │   │   ├── AppShell.tsx        # 主布局容器
│   │   │   ├── Sidebar.tsx         # 侧边导航
│   │   │   ├── Header.tsx          # 顶部栏
│   │   │   └── PageHeader.tsx      # 页面标题区
│   │   ├── routes.tsx              # 路由配置
│   │   └── App.tsx                 # 应用根组件
│   ├── features/                   # 功能模块
│   │   ├── dashboard/              # 工作台
│   │   │   ├── components/         # 页面组件
│   │   │   ├── hooks/              # 自定义 Hooks
│   │   │   └── index.tsx           # 页面入口
│   │   ├── knowledge-base/         # 知识库管理
│   │   │   ├── components/
│   │   │   │   ├── KBList.tsx      # 知识库列表
│   │   │   │   ├── KBDetail.tsx    # 知识库详情
│   │   │   │   ├── KBForm.tsx      # 创建/编辑表单
│   │   │   │   ├── DocumentList.tsx # 文档列表
│   │   │   │   └── HitTest.tsx     # 命中测试
│   │   │   ├── hooks/
│   │   │   └── index.tsx
│   │   ├── categories/             # 目录层级
│   │   │   ├── components/
│   │   │   │   ├── CategoryTree.tsx # 树形目录
│   │   │   │   └── CategoryForm.tsx
│   │   │   ├── hooks/
│   │   │   └── index.tsx
│   │   ├── agents/                 # 智能体管理
│   │   │   ├── components/
│   │   │   │   ├── AgentList.tsx
│   │   │   │   ├── AgentDetail.tsx
│   │   │   │   ├── AgentForm.tsx
│   │   │   │   └── ChatPanel.tsx   # 对话测试面板
│   │   │   ├── hooks/
│   │   │   └── index.tsx
│   │   ├── models/                 # 模型管理
│   │   │   ├── components/
│   │   │   │   ├── ModelList.tsx
│   │   │   │   └── ModelForm.tsx
│   │   │   ├── hooks/
│   │   │   └── index.tsx
│   │   ├── conversations/          # 会话管理
│   │   │   ├── components/
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   └── MessageView.tsx
│   │   │   ├── hooks/
│   │   │   └── index.tsx
│   │   ├── prompts/                # Prompt 模板
│   │   │   ├── components/
│   │   │   │   ├── PromptList.tsx
│   │   │   │   └── PromptForm.tsx
│   │   │   ├── hooks/
│   │   │   └── index.tsx
│   │   └── settings/               # 系统设置
│   │       ├── components/
│   │       │   └── ResourceView.tsx
│   │       ├── hooks/
│   │       └── index.tsx
│   ├── shared/                     # 共享资源
│   │   ├── components/             # 通用组件
│   │   │   ├── ui/                 # 基础 UI 组件
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Textarea.tsx
│   │   │   │   ├── Switch.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── Table.tsx
│   │   │   ├── cards/              # 卡片组件
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── KBCard.tsx
│   │   │   │   └── AgentCard.tsx
│   │   │   └── layout/             # 布局辅助
│   │   │       ├── PageHeader.tsx
│   │   │       └── Breadcrumb.tsx
│   │   ├── hooks/                  # 自定义 Hooks
│   │   │   ├── useApi.ts
│   │   │   ├── useToast.ts
│   │   │   └── useModal.ts
│   │   ├── services/               # API 服务
│   │   │   ├── apiClient.ts        # Axios 实例
│   │   │   ├── kbService.ts
│   │   │   ├── agentService.ts
│   │   │   ├── modelService.ts
│   │   │   ├── conversationService.ts
│   │   │   ├── promptService.ts
│   │   │   ├── categoryService.ts
│   │   │   └── systemService.ts
│   │   ├── stores/                 # Zustand 状态
│   │   │   ├── useKBStore.ts
│   │   │   ├── useAgentStore.ts
│   │   │   ├── useModelStore.ts
│   │   │   └── useUIStore.ts
│   │   ├── types/                  # TypeScript 类型
│   │   │   ├── api.ts
│   │   │   ├── knowledgeBase.ts
│   │   │   ├── agent.ts
│   │   │   ├── model.ts
│   │   │   └── index.ts
│   │   └── utils/                  # 工具函数
│   │       ├── format.ts
│   │       └── validation.ts
│   ├── styles/                     # 全局样式
│   │   └── globals.css             # Tailwind 配置
│   └── main.tsx                    # 入口文件
├── public/
│   └── favicon.ico
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## [S3] 设计系统

### 颜色方案 (基于 DESIGN.md)

```css
:root {
  /* 主色调 */
  --color-ink: #171717;           /* 主要文字 */
  --color-body: #525252;          /* 次要文字 */
  --color-muted: #a3a3a3;         /* 弱化文字 */
  
  /* 背景色 */
  --color-canvas: #ffffff;        /* 卡片背景 */
  --color-canvas-soft: #fafafa;   /* 页面背景 */
  --color-canvas-soft-2: #f5f5f5; /* 次级背景 */
  
  /* 边框色 */
  --color-hairline: #e5e5e5;      /* 默认边框 */
  --color-hairline-strong: #a1a1a1; /* 强调边框 */
  
  /* 强调色 */
  --color-accent: #2563eb;        /* 主强调色 (蓝色) */
  --color-accent-soft: #dbeafe;   /* 强调色浅色背景 */
  
  /* 语义色 */
  --color-success: #16a34a;
  --color-success-soft: #dcfce7;
  --color-warning: #f59e0b;
  --color-warning-soft: #fef3c7;
  --color-error: #dc2626;
  --color-error-soft: #fee2e2;
}
```

### 字体系统

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'SF Mono', 'Fira Code', monospace;
```

### 圆角系统

```css
--radius-sm: 6px;    /* 按钮、输入框 */
--radius-md: 10px;   /* 卡片 */
--radius-lg: 14px;   /* 大卡片 */
--radius-xl: 18px;   /* 特殊场景 */
--radius-pill: 100px; /* 胶囊按钮 */
```

### 阴影系统

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06);
--shadow-lg: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08);
```

## [S4] 页面设计

### 4.1 工作台 (Dashboard)

**路由**: `/`

**布局**:
- 统计卡片行 (4 列)
- 知识库卡片网格 (响应式)
- 最近动态 + 快捷操作 (双列)

**组件**:
- `StatCard` x4: 知识库总数、文档总数、活跃智能体、今日对话数
- `KBCard` xN: 知识库卡片，显示名称、描述、状态、文档数、切片数
- `ActivityList`: 最近动态列表
- `QuickActions`: 快捷操作面板

### 4.2 知识库列表

**路由**: `/knowledge-bases`

**功能**:
- 知识库卡片网格展示
- 创建知识库 (弹窗表单)
- 编辑知识库
- 删除知识库 (确认弹窗)
- 按目录层级筛选
- 按类型筛选 (general/web)

**表单字段**:
- 名称 (必填)
- 描述
- 目录层级 (下拉选择)
- 类型 (general/web)
- Embedding 模型 (下拉选择)
- 切片配置 (chunk_size, chunk_overlap, semantic_chunk, llm_chunk)

### 4.3 知识库详情

**路由**: `/knowledge-bases/:id`

**功能**:
- 文档列表 (表格)
- 上传文档 (多文件)
- 删除文档
- 重新处理文档
- 生成文档摘要
- 配置切片参数
- 清理失效向量
- 清空向量库
- 命中测试 (检索测试)

**文档表格列**:
- 文件名
- 文件类型
- 文件大小
- 切片数
- 状态 (pending/processing/ready/error)
- 操作 (重新处理、删除)

### 4.4 目录层级

**路由**: `/categories`

**功能**:
- 树形目录展示
- 创建目录 (支持多级)
- 编辑目录
- 删除目录 (子目录和知识库移至未分类)

### 4.5 智能体列表

**路由**: `/agents`

**功能**:
- 智能体卡片网格展示
- 创建智能体 (弹窗表单)
- 编辑智能体
- 删除智能体
- 发布/下线智能体
- 重新生成 API Key

**表单字段**:
- 名称 (必填)
- 描述
- 头像 URL
- LLM 模型 (下拉选择)
- 系统提示词
- 开场白
- 推荐问题 (JSON 数组)
- 参数配置 (temperature, max_tokens, top_k, similarity_threshold)
- 关联知识库 (多选)

### 4.6 智能体详情

**路由**: `/agents/:id`

**功能**:
- 配置编辑
- 对话测试面板 (流式输出)
- 会话历史列表
- API Key 展示/复制

**对话测试面板**:
- 消息列表 (用户/助手)
- 引用来源展示
- 冲突信息提示
- 响应时间显示
- 输入框 + 发送按钮

### 4.7 模型管理

**路由**: `/models`

**功能**:
- 模型列表 (表格)
- 创建模型 (弹窗表单)
- 编辑模型
- 删除模型 (内置模型不可删)
- 设为默认模型
- 测试模型连接

**表单字段**:
- 名称 (必填)
- 提供商 (ollama/openai/其他)
- 模型类型 (llm/embedding/reranking/speech/vision)
- 模型名称 (必填)
- API Key
- Base URL
- 配置 (JSON)

### 4.8 会话管理

**路由**: `/conversations`

**功能**:
- 会话列表 (表格)
- 查看会话消息
- 删除会话
- 导出会话日志
- 导出全部问答日志

**会话表格列**:
- 会话 ID
- 关联智能体
- 标题
- 消息数
- 创建时间
- 操作 (查看、删除、导出)

### 4.9 Prompt 模板

**路由**: `/prompts`

**功能**:
- 模板列表 (表格)
- 创建自定义模板 (弹窗表单)
- 编辑模板
- 删除模板 (系统内置不可删)
- 重置为系统默认
- 设为默认模板

**表单字段**:
- 名称 (必填)
- 类别 (qa_main/其他)
- 内容 (必填，多行文本)
- 描述
- 设为默认

### 4.10 系统设置

**路由**: `/settings`

**功能**:
- 系统资源展示
  - ChromaDB 大小
  - 数据库大小
  - 上传文件大小
  - 文档总数
  - 切片总数

## [S5] 组件设计

### 5.1 基础 UI 组件

#### Button
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

#### Input
```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (value: string) => void;
}
```

#### Modal
```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

#### Table
```typescript
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationProps;
  onRowClick?: (row: T) => void;
}
```

### 5.2 业务组件

#### StatCard
```typescript
interface StatCardProps {
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'amber' | 'red';
  value: number | string;
  label: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
}
```

#### KBCard
```typescript
interface KBCardProps {
  id: number;
  name: string;
  description: string;
  status: 'ready' | 'pending' | 'error';
  documentCount: number;
  chunkCount: number;
  lastUpdated: string;
  onClick?: () => void;
}
```

#### AgentCard
```typescript
interface AgentCardProps {
  id: number;
  name: string;
  description: string;
  status: 'draft' | 'published';
  modelName?: string;
  kbCount: number;
  onClick?: () => void;
}
```

## [S6] API 集成

### 6.1 API 客户端配置

```typescript
// shared/services/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

// 请求拦截器 - 添加 API Key
apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('api_key');
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || '请求失败';
    // 统一错误提示
    toast.error(message);
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 6.2 API 服务示例

```typescript
// shared/services/kbService.ts
import apiClient from './apiClient';
import type { KBCreate, KBUpdate, KBResponse } from '../types';

export const kbService = {
  // 获取知识库列表
  list: (params?: { category_id?: number; kb_type?: string }) =>
    apiClient.get<any, KBResponse[]>('/knowledge-bases', { params }),

  // 获取单个知识库
  get: (id: number) =>
    apiClient.get<any, KBResponse>(`/knowledge-bases/${id}`),

  // 创建知识库
  create: (data: KBCreate) =>
    apiClient.post<any, KBResponse>('/knowledge-bases', data),

  // 更新知识库
  update: (id: number, data: KBUpdate) =>
    apiClient.put<any, KBResponse>(`/knowledge-bases/${id}`, data),

  // 删除知识库
  delete: (id: number) =>
    apiClient.delete(`/knowledge-bases/${id}`),

  // 上传文档
  uploadDocuments: (kbId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return apiClient.post(`/knowledge-bases/${kbId}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 命中测试
  hitTest: (kbId: number, params: { query: string; top_k?: number; similarity_threshold?: number }) =>
    apiClient.post(`/knowledge-bases/${kbId}/hit-test`, null, { params }),
};
```

### 6.3 状态管理示例

```typescript
// shared/stores/useKBStore.ts
import { create } from 'zustand';
import { kbService } from '../services/kbService';
import type { KBResponse, KBCreate, KBUpdate } from '../types';

interface KBState {
  kbs: KBResponse[];
  currentKB: KBResponse | null;
  loading: boolean;
  error: string | null;

  fetchKBs: (params?: { category_id?: number; kb_type?: string }) => Promise<void>;
  fetchKB: (id: number) => Promise<void>;
  createKB: (data: KBCreate) => Promise<void>;
  updateKB: (id: number, data: KBUpdate) => Promise<void>;
  deleteKB: (id: number) => Promise<void>;
}

export const useKBStore = create<KBState>((set) => ({
  kbs: [],
  currentKB: null,
  loading: false,
  error: null,

  fetchKBs: async (params) => {
    set({ loading: true, error: null });
    try {
      const kbs = await kbService.list(params);
      set({ kbs, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchKB: async (id) => {
    set({ loading: true, error: null });
    try {
      const kb = await kbService.get(id);
      set({ currentKB: kb, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createKB: async (data) => {
    set({ loading: true, error: null });
    try {
      await kbService.create(data);
      // 重新获取列表
      const kbs = await kbService.list();
      set({ kbs, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateKB: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await kbService.update(id, data);
      set((state) => ({
        kbs: state.kbs.map(kb => kb.id === id ? updated : kb),
        currentKB: state.currentKB?.id === id ? updated : state.currentKB,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteKB: async (id) => {
    set({ loading: true, error: null });
    try {
      await kbService.delete(id);
      set((state) => ({
        kbs: state.kbs.filter(kb => kb.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
```

## [S7] 路由配置

```typescript
// app/routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import AppShell from './layout/AppShell';

// 懒加载页面
const Dashboard = lazy(() => import('../features/dashboard'));
const KBList = lazy(() => import('../features/knowledge-base/KBList'));
const KBDetail = lazy(() => import('../features/knowledge-base/KBDetail'));
const CategoryPage = lazy(() => import('../features/categories'));
const AgentList = lazy(() => import('../features/agents/AgentList'));
const AgentDetail = lazy(() => import('../features/agents/AgentDetail'));
const ModelPage = lazy(() => import('../features/models'));
const ConversationPage = lazy(() => import('../features/conversations'));
const PromptPage = lazy(() => import('../features/prompts'));
const SettingsPage = lazy(() => import('../features/settings'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'knowledge-bases', element: <KBList /> },
      { path: 'knowledge-bases/:id', element: <KBDetail /> },
      { path: 'categories', element: <CategoryPage /> },
      { path: 'agents', element: <AgentList /> },
      { path: 'agents/:id', element: <AgentDetail /> },
      { path: 'models', element: <ModelPage /> },
      { path: 'conversations', element: <ConversationPage /> },
      { path: 'prompts', element: <PromptPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
```

## [S8] 错误处理

### 全局错误处理
- API 请求错误统一拦截，显示 Toast 提示
- 网络错误显示友好提示
- 401 错误：显示 API Key 配置弹窗，用户输入 Key 后存储到 localStorage

### 表单验证
- 使用 React Hook Form 进行表单验证
- 必填字段验证
- 格式验证（邮箱、URL 等）
- 长度限制验证

### 加载状态
- 页面级加载：Spinner 组件
- 按钮级加载：按钮 loading 状态
- 骨架屏：Dashboard 统计卡片、知识库列表使用骨架屏

### Toast 组件设计
```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // 默认 3 秒
  onClose?: () => void;
}
```
- 右上角弹出
- 自动消失
- 支持手动关闭
- 最多显示 3 条

## [S9] 响应式设计

### 断点设置
```css
/* Tailwind 默认断点 */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### 响应式策略
- **桌面端 (>= 1024px)**: 完整侧边栏 + 主内容区
- **平板端 (768px - 1023px)**: 可折叠侧边栏
- **移动端 (< 768px)**: 隐藏侧边栏，汉堡菜单

### 组件响应式
- 统计卡片：4列 → 2列 → 1列
- 知识库卡片：3列 → 2列 → 1列
- 表格：水平滚动
- 表单：单列布局

## [S10] 实现优先级

### Phase 1: 基础框架
1. 项目初始化 (Vite + React + TypeScript + Tailwind)
2. 基础 UI 组件库
3. 布局组件 (AppShell, Sidebar, Header)
4. 路由配置
5. API 客户端配置

### Phase 2: 核心功能
1. 工作台 Dashboard
2. 知识库列表 + 详情
3. 目录层级管理
4. 文档上传和管理

### Phase 3: 智能体功能
1. 智能体列表 + 详情
2. 对话测试面板
3. 会话管理

### Phase 4: 系统功能
1. 模型管理
2. Prompt 模板管理
3. 系统设置

### Phase 5: 优化完善
1. 响应式适配
2. 错误处理完善
3. 加载状态优化
4. 用户体验优化

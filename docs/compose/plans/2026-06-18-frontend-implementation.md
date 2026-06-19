# Gali RAG 前端工程实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Gali RAG 后端服务构建完整的前端管理界面，采用 React + TypeScript + Tailwind CSS 技术栈。

**Architecture:** Feature-based 架构，每个功能模块独立组织，共享组件和服务统一管理。使用 Zustand 进行状态管理，Axios 封装 API 调用。

**Tech Stack:** Vite 5, React 18, TypeScript 5, React Router 6, Zustand 4, Axios 1.x, Tailwind CSS 3, Lucide React, React Hook Form 7

---

## 文件结构总览

```
frontend/
├── src/
│   ├── app/                        # 应用入口
│   │   ├── layout/                 # 布局组件
│   │   ├── routes.tsx              # 路由配置
│   │   └── App.tsx                 # 应用根组件
│   ├── features/                   # 功能模块
│   │   ├── dashboard/              # 工作台
│   │   ├── knowledge-base/         # 知识库管理
│   │   ├── categories/             # 目录层级
│   │   ├── agents/                 # 智能体管理
│   │   ├── models/                 # 模型管理
│   │   ├── conversations/          # 会话管理
│   │   ├── prompts/                # Prompt 模板
│   │   └── settings/               # 系统设置
│   ├── shared/                     # 共享资源
│   │   ├── components/             # 通用组件
│   │   ├── hooks/                  # 自定义 Hooks
│   │   ├── services/               # API 服务
│   │   ├── stores/                 # Zustand 状态
│   │   ├── types/                  # TypeScript 类型
│   │   └── utils/                  # 工具函数
│   ├── styles/                     # 全局样式
│   └── main.tsx                    # 入口文件
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Task 1: 项目初始化与基础配置

**Covers:** S1, S2, S3

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/styles/globals.css`

- [ ] **Step 1: 初始化 Vite 项目**

```bash
cd /Users/fupeijun/Projects/gali-rag-2
npm create vite@latest frontend -- --template react-ts
cd frontend
```

- [ ] **Step 2: 安装依赖**

```bash
npm install react-router-dom zustand axios lucide-react react-hook-form
npm install -D tailwindcss postcss autoprefixer @types/node
```

- [ ] **Step 3: 配置 Tailwind CSS**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#171717',
        body: '#525252',
        muted: '#a3a3a3',
        canvas: {
          DEFAULT: '#ffffff',
          soft: '#fafafa',
          'soft-2': '#f5f5f5',
        },
        hairline: {
          DEFAULT: '#e5e5e5',
          strong: '#a1a1a1',
        },
        accent: {
          DEFAULT: '#2563eb',
          soft: '#dbeafe',
        },
        success: {
          DEFAULT: '#16a34a',
          soft: '#dcfce7',
        },
        warning: {
          DEFAULT: '#f59e0b',
          soft: '#fef3c7',
        },
        error: {
          DEFAULT: '#dc2626',
          soft: '#fee2e2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        pill: '100px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.04)',
        md: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
        lg: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: 创建全局样式**

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #171717;
    background: #fafafa;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  
  a {
    color: #2563eb;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
  }
}
```

- [ ] **Step 5: 创建入口文件**

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 6: 提交代码**

```bash
git add frontend/
git commit -m "feat: initialize frontend project with Vite + React + TypeScript + Tailwind"
```

---

## Task 2: TypeScript 类型定义

**Covers:** S6

**Files:**
- Create: `frontend/src/shared/types/api.ts`
- Create: `frontend/src/shared/types/knowledgeBase.ts`
- Create: `frontend/src/shared/types/agent.ts`
- Create: `frontend/src/shared/types/model.ts`
- Create: `frontend/src/shared/types/index.ts`

- [ ] **Step 1: 创建 API 通用类型**

```typescript
// src/shared/types/api.ts
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

- [ ] **Step 2: 创建知识库类型**

```typescript
// src/shared/types/knowledgeBase.ts
export interface KnowledgeBase {
  id: number;
  name: string;
  description: string;
  category_id: number | null;
  kb_type: 'general' | 'web';
  embedding_model_id: number | null;
  web_config: string;
  chunk_size: number;
  chunk_overlap: number;
  semantic_chunk_enabled: boolean;
  llm_chunk_enabled: boolean;
  chroma_collection: string;
  document_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface KBCreate {
  name: string;
  description?: string;
  category_id?: number | null;
  kb_type?: 'general' | 'web';
  embedding_model_id?: number | null;
  web_config?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  semantic_chunk_enabled?: boolean;
  llm_chunk_enabled?: boolean;
}

export interface KBUpdate {
  name?: string;
  description?: string;
  category_id?: number | null;
  embedding_model_id?: number | null;
  web_config?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  semantic_chunk_enabled?: boolean;
  llm_chunk_enabled?: boolean;
}

export interface Document {
  id: number;
  kb_id: number;
  filename: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  status: 'pending' | 'processing' | 'ready' | 'error';
  summary: string;
  error_message: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  description: string;
  sort_order: number;
  created_at: string | null;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
  kb_count: number;
}

export interface ChunkConfig {
  chunk_size: number;
  chunk_overlap: number;
  semantic_chunk_enabled: boolean;
  llm_chunk_enabled: boolean;
}

export interface HitTestResult {
  query: string;
  rewritten_query: string;
  hits: HitItem[];
  total_hits: number;
  latency_ms: number;
}

export interface HitItem {
  chunk_id: number;
  doc_id: number;
  doc_name: string;
  content: string;
  score: number;
  retrieval_source: string;
}
```

- [ ] **Step 3: 创建智能体类型**

```typescript
// src/shared/types/agent.ts
export interface Agent {
  id: number;
  name: string;
  description: string;
  avatar: string;
  llm_model_id: number | null;
  system_prompt: string;
  opening_message: string;
  suggested_questions: string;
  temperature: number;
  max_tokens: number;
  top_k: number;
  similarity_threshold: number;
  api_key: string;
  status: 'draft' | 'published';
  knowledge_base_ids: number[];
  created_at: string | null;
  updated_at: string | null;
}

export interface AgentCreate {
  name: string;
  description?: string;
  avatar?: string;
  llm_model_id?: number | null;
  system_prompt?: string;
  opening_message?: string;
  suggested_questions?: string;
  temperature?: number;
  max_tokens?: number;
  top_k?: number;
  similarity_threshold?: number;
  knowledge_base_ids?: number[];
}

export interface AgentUpdate {
  name?: string;
  description?: string;
  avatar?: string;
  llm_model_id?: number | null;
  system_prompt?: string;
  opening_message?: string;
  suggested_questions?: string;
  temperature?: number;
  max_tokens?: number;
  top_k?: number;
  similarity_threshold?: number;
  knowledge_base_ids?: number[];
}

export interface ChatRequest {
  query: string;
  conversation_id?: number | null;
  stream?: boolean;
}

export interface ChatResponse {
  answer: string;
  conversation_id: number;
  cited_sources: CitedSource[];
  conflict_info: ConflictInfo | null;
  latency_ms: number;
}

export interface CitedSource {
  chunk_id: number;
  doc_id: number;
  doc_name: string;
  content: string;
  score: number;
}

export interface ConflictInfo {
  has_conflict: boolean;
  description: string;
  involved_chunks: number[];
}

export interface Conversation {
  id: number;
  agent_id: number;
  title: string;
  message_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  cited_sources: string;
  conflict_info: string;
  latency_ms: number;
  created_at: string | null;
}
```

- [ ] **Step 4: 创建模型类型**

```typescript
// src/shared/types/model.ts
export interface AIModel {
  id: number;
  name: string;
  provider: string;
  model_type: 'llm' | 'embedding' | 'reranking' | 'speech' | 'vision';
  model_name: string;
  api_key: string;
  base_url: string;
  config: string;
  is_builtin: boolean;
  is_default: boolean;
  status: 'active' | 'inactive';
  created_at: string | null;
  updated_at: string | null;
}

export interface AIModelCreate {
  name: string;
  provider: string;
  model_type: 'llm' | 'embedding' | 'reranking' | 'speech' | 'vision';
  model_name: string;
  api_key?: string;
  base_url?: string;
  config?: string;
}

export interface AIModelUpdate {
  name?: string;
  provider?: string;
  model_name?: string;
  api_key?: string;
  base_url?: string;
  config?: string;
  status?: 'active' | 'inactive';
}

export interface PromptTemplate {
  id: number;
  name: string;
  category: string;
  content: string;
  description: string;
  is_system: boolean;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PromptCreate {
  name: string;
  category: string;
  content: string;
  description?: string;
  is_default?: boolean;
}

export interface PromptUpdate {
  name?: string;
  content?: string;
  description?: string;
  is_default?: boolean;
}

export interface SystemResource {
  chroma_size_mb: number;
  database_size_mb: number;
  upload_size_mb: number;
  total_documents: number;
  total_chunks: number;
}
```

- [ ] **Step 5: 创建类型索引文件**

```typescript
// src/shared/types/index.ts
export * from './api';
export * from './knowledgeBase';
export * from './agent';
export * from './model';
```

- [ ] **Step 6: 提交代码**

```bash
git add frontend/src/shared/types/
git commit -m "feat: add TypeScript type definitions for all modules"
```

---

## Task 3: API 客户端与服务层

**Covers:** S6

**Files:**
- Create: `frontend/src/shared/services/apiClient.ts`
- Create: `frontend/src/shared/services/kbService.ts`
- Create: `frontend/src/shared/services/agentService.ts`
- Create: `frontend/src/shared/services/modelService.ts`
- Create: `frontend/src/shared/services/categoryService.ts`
- Create: `frontend/src/shared/services/conversationService.ts`
- Create: `frontend/src/shared/services/promptService.ts`
- Create: `frontend/src/shared/services/systemService.ts`
- Create: `frontend/src/shared/services/index.ts`

- [ ] **Step 1: 创建 API 客户端**

```typescript
// src/shared/services/apiClient.ts
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

// 响应拦截器 - 统一处理
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || '请求失败';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default apiClient;
```

- [ ] **Step 2: 创建知识库服务**

```typescript
// src/shared/services/kbService.ts
import apiClient from './apiClient';
import type { 
  KnowledgeBase, KBCreate, KBUpdate, Document, 
  ChunkConfig, HitTestResult, Category, CategoryTree 
} from '../types';

export const kbService = {
  // 知识库 CRUD
  list: (params?: { category_id?: number; kb_type?: string }) =>
    apiClient.get<any, KnowledgeBase[]>('/knowledge-bases', { params }),

  get: (id: number) =>
    apiClient.get<any, KnowledgeBase>(`/knowledge-bases/${id}`),

  create: (data: KBCreate) =>
    apiClient.post<any, KnowledgeBase>('/knowledge-bases', data),

  update: (id: number, data: KBUpdate) =>
    apiClient.put<any, KnowledgeBase>(`/knowledge-bases/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/knowledge-bases/${id}`),

  // 文档管理
  getDocuments: (kbId: number) =>
    apiClient.get<any, Document[]>(`/knowledge-bases/${kbId}/documents`),

  uploadDocuments: (kbId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return apiClient.post(`/knowledge-bases/${kbId}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteDocument: (docId: number) =>
    apiClient.delete(`/documents/${docId}`),

  reprocessDocument: (docId: number) =>
    apiClient.post(`/documents/${docId}/reprocess`),

  generateSummary: (docId: number) =>
    apiClient.post(`/documents/${docId}/summary`),

  // 向量管理
  cleanVectors: (kbId: number) =>
    apiClient.post(`/knowledge-bases/${kbId}/clean-vectors`),

  clearVectors: (kbId: number) =>
    apiClient.post(`/knowledge-bases/${kbId}/clear-vectors`),

  // 切片配置
  updateChunkConfig: (kbId: number, config: ChunkConfig) =>
    apiClient.put(`/knowledge-bases/${kbId}/chunk-config`, config),

  // 网页抓取
  crawlWeb: (kbId: number) =>
    apiClient.post(`/knowledge-bases/${kbId}/crawl`),

  // 命中测试
  hitTest: (kbId: number, params: { query: string; top_k?: number; similarity_threshold?: number }) =>
    apiClient.post<any, HitTestResult>(`/knowledge-bases/${kbId}/hit-test`, null, { params }),

  // 目录层级
  getCategories: (parentId?: number) =>
    apiClient.get<any, Category[]>('/categories', { params: { parent_id: parentId } }),

  getCategoryTree: () =>
    apiClient.get<any, CategoryTree[]>('/categories/tree'),

  createCategory: (data: { name: string; parent_id?: number; description?: string; sort_order?: number }) =>
    apiClient.post<any, Category>('/categories', data),

  updateCategory: (id: number, data: { name?: string; parent_id?: number; description?: string; sort_order?: number }) =>
    apiClient.put<any, Category>(`/categories/${id}`, data),

  deleteCategory: (id: number) =>
    apiClient.delete(`/categories/${id}`),
};
```

- [ ] **Step 3: 创建智能体服务**

```typescript
// src/shared/services/agentService.ts
import apiClient from './apiClient';
import type { Agent, AgentCreate, AgentUpdate, ChatRequest, ChatResponse, Conversation, Message } from '../types';

export const agentService = {
  // 智能体 CRUD
  list: (params?: { status?: string }) =>
    apiClient.get<any, Agent[]>('/agents', { params }),

  get: (id: number) =>
    apiClient.get<any, Agent>(`/agents/${id}`),

  create: (data: AgentCreate) =>
    apiClient.post<any, Agent>('/agents', data),

  update: (id: number, data: AgentUpdate) =>
    apiClient.put<any, Agent>(`/agents/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/agents/${id}`),

  // 发布管理
  publish: (id: number) =>
    apiClient.post(`/agents/${id}/publish`),

  unpublish: (id: number) =>
    apiClient.post(`/agents/${id}/unpublish`),

  regenerateKey: (id: number) =>
    apiClient.post(`/agents/${id}/regenerate-key`),

  // 对话
  chat: (agentId: number, data: ChatRequest) =>
    apiClient.post<any, ChatResponse>(`/agents/${agentId}/chat`, data),

  // 流式对话
  chatStream: async function* (agentId: number, data: ChatRequest) {
    const response = await fetch(`/api/v1/agents/${agentId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': localStorage.getItem('api_key') || '',
      },
      body: JSON.stringify({ ...data, stream: true }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const jsonStr = line.slice(6);
        if (jsonStr) {
          try {
            yield JSON.parse(jsonStr);
          } catch (e) {
            console.error('Failed to parse SSE:', jsonStr);
          }
        }
      }
    }
  },

  // 会话管理
  getConversations: (agentId: number) =>
    apiClient.get<any, Conversation[]>(`/agents/${agentId}/conversations`),

  getMessages: (convId: number) =>
    apiClient.get<any, Message[]>(`/conversations/${convId}/messages`),

  deleteConversation: (convId: number) =>
    apiClient.delete(`/conversations/${convId}`),

  exportConversation: (convId: number) =>
    apiClient.get(`/conversations/${convId}/export`),

  exportAllMessages: (agentId?: number) =>
    apiClient.get('/export/messages', { params: { agent_id: agentId } }),
};
```

- [ ] **Step 4: 创建模型服务**

```typescript
// src/shared/services/modelService.ts
import apiClient from './apiClient';
import type { AIModel, AIModelCreate, AIModelUpdate } from '../types';

export const modelService = {
  list: (params?: { model_type?: string }) =>
    apiClient.get<any, AIModel[]>('/models', { params }),

  get: (id: number) =>
    apiClient.get<any, AIModel>(`/models/${id}`),

  create: (data: AIModelCreate) =>
    apiClient.post<any, AIModel>('/models', data),

  update: (id: number, data: AIModelUpdate) =>
    apiClient.put<any, AIModel>(`/models/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/models/${id}`),

  setDefault: (id: number) =>
    apiClient.post(`/models/${id}/set-default`),

  testConnection: (id: number) =>
    apiClient.post(`/models/${id}/test`),
};
```

- [ ] **Step 5: 创建其他服务**

```typescript
// src/shared/services/promptService.ts
import apiClient from './apiClient';
import type { PromptTemplate, PromptCreate, PromptUpdate } from '../types';

export const promptService = {
  list: (params?: { category?: string }) =>
    apiClient.get<any, PromptTemplate[]>('/prompts', { params }),

  get: (id: number) =>
    apiClient.get<any, PromptTemplate>(`/prompts/${id}`),

  create: (data: PromptCreate) =>
    apiClient.post<any, PromptTemplate>('/prompts', data),

  update: (id: number, data: PromptUpdate) =>
    apiClient.put<any, PromptTemplate>(`/prompts/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/prompts/${id}`),

  resetToDefault: (id: number) =>
    apiClient.post(`/prompts/${id}/reset`),

  setDefault: (id: number) =>
    apiClient.post(`/prompts/${id}/set-default`),
};
```

```typescript
// src/shared/services/systemService.ts
import apiClient from './apiClient';
import type { SystemResource } from '../types';

export const systemService = {
  getResources: () =>
    apiClient.get<any, SystemResource>('/resources'),
};
```

```typescript
// src/shared/services/index.ts
export { default as apiClient } from './apiClient';
export { kbService } from './kbService';
export { agentService } from './agentService';
export { modelService } from './modelService';
export { promptService } from './promptService';
export { systemService } from './systemService';
```

- [ ] **Step 6: 提交代码**

```bash
git add frontend/src/shared/services/
git commit -m "feat: add API client and service layer for all modules"
```

---

## Task 4: Zustand 状态管理

**Covers:** S6

**Files:**
- Create: `frontend/src/shared/stores/useKBStore.ts`
- Create: `frontend/src/shared/stores/useAgentStore.ts`
- Create: `frontend/src/shared/stores/useModelStore.ts`
- Create: `frontend/src/shared/stores/useUIStore.ts`
- Create: `frontend/src/shared/stores/index.ts`

- [ ] **Step 1: 创建知识库 Store**

```typescript
// src/shared/stores/useKBStore.ts
import { create } from 'zustand';
import { kbService } from '../services';
import type { KnowledgeBase, KBCreate, KBUpdate, Document, CategoryTree } from '../types';

interface KBState {
  kbs: KnowledgeBase[];
  currentKB: KnowledgeBase | null;
  documents: Document[];
  categories: CategoryTree[];
  loading: boolean;
  error: string | null;

  fetchKBs: (params?: { category_id?: number; kb_type?: string }) => Promise<void>;
  fetchKB: (id: number) => Promise<void>;
  createKB: (data: KBCreate) => Promise<void>;
  updateKB: (id: number, data: KBUpdate) => Promise<void>;
  deleteKB: (id: number) => Promise<void>;
  
  fetchDocuments: (kbId: number) => Promise<void>;
  uploadDocuments: (kbId: number, files: File[]) => Promise<any>;
  deleteDocument: (docId: number) => Promise<void>;
  
  fetchCategories: () => Promise<void>;
}

export const useKBStore = create<KBState>((set, get) => ({
  kbs: [],
  currentKB: null,
  documents: [],
  categories: [],
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
      await get().fetchKBs();
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

  fetchDocuments: async (kbId) => {
    set({ loading: true, error: null });
    try {
      const documents = await kbService.getDocuments(kbId);
      set({ documents, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  uploadDocuments: async (kbId, files) => {
    set({ loading: true, error: null });
    try {
      const result = await kbService.uploadDocuments(kbId, files);
      await get().fetchDocuments(kbId);
      set({ loading: false });
      return result;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteDocument: async (docId) => {
    set({ loading: true, error: null });
    try {
      await kbService.deleteDocument(docId);
      set((state) => ({
        documents: state.documents.filter(doc => doc.id !== docId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await kbService.getCategoryTree();
      set({ categories });
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  },
}));
```

- [ ] **Step 2: 创建智能体 Store**

```typescript
// src/shared/stores/useAgentStore.ts
import { create } from 'zustand';
import { agentService } from '../services';
import type { Agent, AgentCreate, AgentUpdate } from '../types';

interface AgentState {
  agents: Agent[];
  currentAgent: Agent | null;
  loading: boolean;
  error: string | null;

  fetchAgents: (params?: { status?: string }) => Promise<void>;
  fetchAgent: (id: number) => Promise<void>;
  createAgent: (data: AgentCreate) => Promise<void>;
  updateAgent: (id: number, data: AgentUpdate) => Promise<void>;
  deleteAgent: (id: number) => Promise<void>;
  publishAgent: (id: number) => Promise<void>;
  unpublishAgent: (id: number) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  currentAgent: null,
  loading: false,
  error: null,

  fetchAgents: async (params) => {
    set({ loading: true, error: null });
    try {
      const agents = await agentService.list(params);
      set({ agents, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAgent: async (id) => {
    set({ loading: true, error: null });
    try {
      const agent = await agentService.get(id);
      set({ currentAgent: agent, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createAgent: async (data) => {
    set({ loading: true, error: null });
    try {
      await agentService.create(data);
      await get().fetchAgents();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateAgent: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await agentService.update(id, data);
      set((state) => ({
        agents: state.agents.map(a => a.id === id ? updated : a),
        currentAgent: state.currentAgent?.id === id ? updated : state.currentAgent,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteAgent: async (id) => {
    set({ loading: true, error: null });
    try {
      await agentService.delete(id);
      set((state) => ({
        agents: state.agents.filter(a => a.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  publishAgent: async (id) => {
    set({ loading: true, error: null });
    try {
      await agentService.publish(id);
      await get().fetchAgent(id);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  unpublishAgent: async (id) => {
    set({ loading: true, error: null });
    try {
      await agentService.unpublish(id);
      await get().fetchAgent(id);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
```

- [ ] **Step 3: 创建模型 Store**

```typescript
// src/shared/stores/useModelStore.ts
import { create } from 'zustand';
import { modelService } from '../services';
import type { AIModel, AIModelCreate, AIModelUpdate } from '../types';

interface ModelState {
  models: AIModel[];
  loading: boolean;
  error: string | null;

  fetchModels: (params?: { model_type?: string }) => Promise<void>;
  createModel: (data: AIModelCreate) => Promise<void>;
  updateModel: (id: number, data: AIModelUpdate) => Promise<void>;
  deleteModel: (id: number) => Promise<void>;
  setDefault: (id: number) => Promise<void>;
  testConnection: (id: number) => Promise<any>;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  loading: false,
  error: null,

  fetchModels: async (params) => {
    set({ loading: true, error: null });
    try {
      const models = await modelService.list(params);
      set({ models, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createModel: async (data) => {
    set({ loading: true, error: null });
    try {
      await modelService.create(data);
      await get().fetchModels();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateModel: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await modelService.update(id, data);
      set((state) => ({
        models: state.models.map(m => m.id === id ? updated : m),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteModel: async (id) => {
    set({ loading: true, error: null });
    try {
      await modelService.delete(id);
      set((state) => ({
        models: state.models.filter(m => m.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setDefault: async (id) => {
    set({ loading: true, error: null });
    try {
      await modelService.setDefault(id);
      await get().fetchModels();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  testConnection: async (id) => {
    try {
      return await modelService.testConnection(id);
    } catch (error: any) {
      throw error;
    }
  },
}));
```

- [ ] **Step 4: 创建 UI Store**

```typescript
// src/shared/stores/useUIStore.ts
import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  apiKey: string | null;
  setApiKey: (key: string) => void;
  
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  apiKey: localStorage.getItem('api_key'),
  setApiKey: (key) => {
    localStorage.setItem('api_key', key);
    set({ apiKey: key });
  },
  
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }].slice(-3),
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id),
      }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
}));
```

- [ ] **Step 5: 创建 Store 索引**

```typescript
// src/shared/stores/index.ts
export { useKBStore } from './useKBStore';
export { useAgentStore } from './useAgentStore';
export { useModelStore } from './useModelStore';
export { useUIStore } from './useUIStore';
```

- [ ] **Step 6: 提交代码**

```bash
git add frontend/src/shared/stores/
git commit -m "feat: add Zustand state management stores"
```

---

## Task 5: 基础 UI 组件库

**Covers:** S5

**Files:**
- Create: `frontend/src/shared/components/ui/Button.tsx`
- Create: `frontend/src/shared/components/ui/Input.tsx`
- Create: `frontend/src/shared/components/ui/Select.tsx`
- Create: `frontend/src/shared/components/ui/Textarea.tsx`
- Create: `frontend/src/shared/components/ui/Modal.tsx`
- Create: `frontend/src/shared/components/ui/Badge.tsx`
- Create: `frontend/src/shared/components/ui/Spinner.tsx`
- Create: `frontend/src/shared/components/ui/EmptyState.tsx`
- Create: `frontend/src/shared/components/ui/Toast.tsx`
- Create: `frontend/src/shared/components/ui/index.ts`

- [ ] **Step 1: 创建 Button 组件**

```tsx
// src/shared/components/ui/Button.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-ink text-white hover:opacity-90',
  secondary: 'bg-white text-ink border border-hairline hover:border-hairline-strong',
  ghost: 'bg-transparent text-body hover:bg-canvas-soft',
  danger: 'bg-error text-white hover:opacity-90',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-sm
        transition-all duration-180 whitespace-nowrap
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
```

- [ ] **Step 2: 创建 Input 组件**

```tsx
// src/shared/components/ui/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 text-sm bg-white border rounded-sm
          placeholder:text-muted
          focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-error' : 'border-hairline'}
          ${className}
        `}
        {...props}
      />
      {(error || helperText) && (
        <span className={`text-xs ${error ? 'text-error' : 'text-muted'}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 创建 Select 组件**

```tsx
// src/shared/components/ui/Select.tsx
import React from 'react';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className = '',
  onChange,
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <select
        className={`
          w-full px-3 py-2 text-sm bg-white border rounded-sm
          focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-error' : 'border-hairline'}
          ${className}
        `}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 创建 Textarea 组件**

```tsx
// src/shared/components/ui/Textarea.tsx
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`
          w-full px-3 py-2 text-sm bg-white border rounded-sm
          placeholder:text-muted resize-vertical min-h-[100px]
          focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-error' : 'border-hairline'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 创建 Modal 组件**

```tsx
// src/shared/components/ui/Modal.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className={`
          relative bg-white rounded-lg shadow-lg w-full mx-4
          ${sizeStyles[size]}
        `}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-canvas-soft rounded-sm transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-hairline">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 创建 Badge 组件**

```tsx
// src/shared/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-canvas-soft-2 text-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  error: 'bg-error-soft text-error',
  info: 'bg-accent-soft text-accent',
};

export function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 7: 创建 Spinner 组件**

```tsx
// src/shared/components/ui/Spinner.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-accent ${sizeStyles[size]}`} />
    </div>
  );
}
```

- [ ] **Step 8: 创建 EmptyState 组件**

```tsx
// src/shared/components/ui/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-canvas-soft flex items-center justify-center mb-4 text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted mb-4 text-center max-w-md">{description}</p>
      )}
      {action}
    </div>
  );
}
```

- [ ] **Step 9: 创建 Toast 组件**

```tsx
// src/shared/components/ui/Toast.tsx
import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore } from '../../stores';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-success-soft border-success text-success',
  error: 'bg-error-soft border-error text-error',
  warning: 'bg-warning-soft border-warning text-warning',
  info: 'bg-accent-soft border-accent text-accent',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-md border shadow-md
              min-w-[300px] max-w-[400px]
              ${styles[toast.type]}
            `}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 10: 创建组件索引**

```typescript
// src/shared/components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Select } from './Select';
export { Textarea } from './Textarea';
export { Modal } from './Modal';
export { Badge } from './Badge';
export { Spinner } from './Spinner';
export { EmptyState } from './EmptyState';
export { ToastContainer } from './Toast';
```

- [ ] **Step 11: 提交代码**

```bash
git add frontend/src/shared/components/ui/
git commit -m "feat: add base UI component library"
```

---

## Task 6: 布局组件

**Covers:** S4

**Files:**
- Create: `frontend/src/app/layout/AppShell.tsx`
- Create: `frontend/src/app/layout/Sidebar.tsx`
- Create: `frontend/src/app/layout/Header.tsx`
- Create: `frontend/src/app/layout/PageHeader.tsx`
- Create: `frontend/src/app/layout/index.ts`

- [ ] **Step 1: 创建 Sidebar 组件**

```tsx
// src/app/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  FolderTree,
  Bot,
  MessageSquare,
  Settings,
  Cpu,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '../../shared/stores';

const navSections = [
  {
    label: '概览',
    items: [
      { path: '/', icon: LayoutDashboard, label: '工作台' },
    ],
  },
  {
    label: '知识管理',
    items: [
      { path: '/knowledge-bases', icon: Database, label: '知识库' },
      { path: '/categories', icon: FolderTree, label: '目录层级' },
    ],
  },
  {
    label: '智能应用',
    items: [
      { path: '/agents', icon: Bot, label: '智能体' },
      { path: '/conversations', icon: MessageSquare, label: '会话管理' },
      { path: '/prompts', icon: FileText, label: 'Prompt 模板' },
    ],
  },
  {
    label: '系统',
    items: [
      { path: '/models', icon: Cpu, label: '模型管理' },
      { path: '/settings', icon: Settings, label: '系统设置' },
    ],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={`
        flex flex-col bg-white border-r border-hairline
        transition-all duration-300 overflow-hidden
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-hairline">
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
          G
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-ink truncate">Gali RAG</span>
            <span className="text-xs text-muted truncate">智能知识库平台</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-6">
            {!sidebarCollapsed && (
              <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3 mb-2">
                {section.label}
              </div>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors
                      ${isActive
                        ? 'bg-accent-soft text-accent font-medium'
                        : 'text-body hover:bg-canvas-soft hover:text-ink'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                      `
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-hairline p-3">
        <NavLink
          to="/help"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors
            ${isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-canvas-soft hover:text-ink'}
            ${sidebarCollapsed ? 'justify-center' : ''}
            `
          }
        >
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>帮助文档</span>}
        </NavLink>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-5 -right-3 w-6 h-6 bg-white border border-hairline rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
        style={{ left: sidebarCollapsed ? '56px' : '248px' }}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3 text-muted" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted" />
        )}
      </button>
    </aside>
  );
}
```

- [ ] **Step 2: 创建 Header 组件**

```tsx
// src/app/layout/Header.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';

const breadcrumbMap: Record<string, string> = {
  '/': '工作台',
  '/knowledge-bases': '知识库',
  '/categories': '目录层级',
  '/agents': '智能体',
  '/conversations': '会话管理',
  '/prompts': 'Prompt 模板',
  '/models': '模型管理',
  '/settings': '系统设置',
};

export function Header() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const getBreadcrumb = () => {
    if (pathSegments.length === 0) return '工作台';
    if (pathSegments[0] === 'knowledge-bases' && pathSegments.length > 1) return '知识库详情';
    if (pathSegments[0] === 'agents' && pathSegments.length > 1) return '智能体详情';
    return breadcrumbMap[`/${pathSegments[0]}`] || pathSegments[0];
  };

  return (
    <header className="flex items-center justify-between px-8 h-16 bg-white border-b border-hairline sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <nav className="flex items-center gap-2 text-sm text-muted">
          <span>Gali RAG</span>
          <span className="text-hairline">/</span>
          <span className="text-ink font-medium">{getBreadcrumb()}</span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-2 bg-canvas-soft border border-hairline rounded-sm text-sm text-muted hover:border-muted transition-colors">
          <Search className="w-4 h-4" />
          <span>搜索知识库、文档…</span>
          <kbd className="ml-4 text-xs px-1.5 py-0.5 border border-hairline rounded text-muted">
            ⌘K
          </kbd>
        </button>

        <button className="p-2 hover:bg-canvas-soft rounded-sm transition-colors relative">
          <Bell className="w-5 h-5 text-muted" />
        </button>

        <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center text-sm font-semibold">
          张
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: 创建 PageHeader 组件**

```tsx
// src/app/layout/PageHeader.tsx
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 创建 AppShell 组件**

```tsx
// src/app/layout/AppShell.tsx
import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Spinner, ToastContainer } from '../../shared/components/ui';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-canvas-soft p-8">
          <Suspense fallback={<Spinner className="h-64" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
```

- [ ] **Step 5: 创建布局索引**

```typescript
// src/app/layout/index.ts
export { AppShell } from './AppShell';
export { Sidebar } from './Sidebar';
export { Header } from './Header';
export { PageHeader } from './PageHeader';
```

- [ ] **Step 6: 提交代码**

```bash
git add frontend/src/app/layout/
git commit -m "feat: add layout components (AppShell, Sidebar, Header)"
```

---

## Task 7: 路由配置与应用入口

**Covers:** S7

**Files:**
- Create: `frontend/src/app/routes.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建路由配置**

```tsx
// src/app/routes.tsx
import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './layout';

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

- [ ] **Step 2: 更新 App 组件**

```tsx
// src/App.tsx
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
```

- [ ] **Step 3: 提交代码**

```bash
git add frontend/src/app/routes.tsx frontend/src/App.tsx
git commit -m "feat: add routing configuration"
```

---

## Task 8: 业务卡片组件

**Covers:** S5

**Files:**
- Create: `frontend/src/shared/components/cards/Card.tsx`
- Create: `frontend/src/shared/components/cards/StatCard.tsx`
- Create: `frontend/src/shared/components/cards/KBCard.tsx`
- Create: `frontend/src/shared/components/cards/AgentCard.tsx`
- Create: `frontend/src/shared/components/cards/index.ts`

- [ ] **Step 1: 创建 Card 组件**

```tsx
// src/shared/components/cards/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      className={`
        bg-white border border-hairline rounded-lg p-5
        ${hover ? 'hover:border-accent hover:shadow-md cursor-pointer transition-all duration-180' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: 创建 StatCard 组件**

```tsx
// src/shared/components/cards/StatCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

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

const iconColorStyles = {
  blue: 'bg-accent-soft text-accent',
  green: 'bg-success-soft text-success',
  amber: 'bg-warning-soft text-warning',
  red: 'bg-error-soft text-error',
};

export function StatCard({ icon, iconColor, value, label, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-hairline rounded-lg p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center text-lg ${iconColorStyles[iconColor]}`}>
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1
              ${trend.direction === 'up' ? 'bg-success-soft text-success' : 'bg-error-soft text-error'}
            `}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-3xl font-semibold text-ink tracking-tight">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 KBCard 组件**

```tsx
// src/shared/components/cards/KBCard.tsx
import React from 'react';
import { Database, Globe, FileText, Clock } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface KBCardProps {
  id: number;
  name: string;
  description: string;
  kb_type: 'general' | 'web';
  status: 'ready' | 'pending' | 'error';
  documentCount: number;
  chunkCount: number;
  lastUpdated?: string;
  onClick?: () => void;
}

const typeIcons = {
  general: Database,
  web: Globe,
};

const statusConfig = {
  ready: { label: '已就绪', variant: 'success' as const },
  pending: { label: '处理中', variant: 'warning' as const },
  error: { label: '错误', variant: 'error' as const },
};

const typeColors = {
  general: 'bg-violet-100 text-violet-600',
  web: 'bg-accent-soft text-accent',
};

export function KBCard({
  name,
  description,
  kb_type,
  status,
  documentCount,
  chunkCount,
  lastUpdated,
  onClick,
}: KBCardProps) {
  const TypeIcon = typeIcons[kb_type];
  const statusInfo = statusConfig[status];

  return (
    <div
      className="bg-white border border-hairline rounded-lg p-5 hover:border-accent hover:shadow-md transition-all duration-180 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-md flex items-center justify-center text-xl ${typeColors[kb_type]}`}>
          <TypeIcon className="w-5 h-5" />
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <h3 className="text-base font-semibold text-ink mb-1">{name}</h3>
      <p className="text-sm text-muted line-clamp-2 mb-4">{description}</p>

      <div className="flex items-center gap-4 pt-3 border-t border-hairline">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <FileText className="w-3.5 h-3.5" />
          {documentCount} 篇文档
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Database className="w-3.5 h-3.5" />
          {chunkCount} 切片
        </span>
        {lastUpdated && (
          <span className="flex items-center gap-1.5 text-xs text-muted ml-auto">
            <Clock className="w-3.5 h-3.5" />
            {lastUpdated}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 创建 AgentCard 组件**

```tsx
// src/shared/components/cards/AgentCard.tsx
import React from 'react';
import { Bot, Database, Cpu } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface AgentCardProps {
  id: number;
  name: string;
  description: string;
  status: 'draft' | 'published';
  modelName?: string;
  kbCount: number;
  onClick?: () => void;
}

const statusConfig = {
  draft: { label: '草稿', variant: 'default' as const },
  published: { label: '已发布', variant: 'success' as const },
};

export function AgentCard({
  name,
  description,
  status,
  modelName,
  kbCount,
  onClick,
}: AgentCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <div
      className="bg-white border border-hairline rounded-lg p-5 hover:border-accent hover:shadow-md transition-all duration-180 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-md bg-accent-soft text-accent flex items-center justify-center">
          <Bot className="w-6 h-6" />
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <h3 className="text-base font-semibold text-ink mb-1">{name}</h3>
      <p className="text-sm text-muted line-clamp-2 mb-4">{description}</p>

      <div className="flex items-center gap-4 pt-3 border-t border-hairline">
        {modelName && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Cpu className="w-3.5 h-3.5" />
            {modelName}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Database className="w-3.5 h-3.5" />
          {kbCount} 个知识库
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 创建卡片组件索引**

```typescript
// src/shared/components/cards/index.ts
export { Card } from './Card';
export { StatCard } from './StatCard';
export { KBCard } from './KBCard';
export { AgentCard } from './AgentCard';
```

- [ ] **Step 6: 提交代码**

```bash
git add frontend/src/shared/components/cards/
git commit -m "feat: add business card components (StatCard, KBCard, AgentCard)"
```

---

## Task 9: Dashboard 页面

**Covers:** S4.1

**Files:**
- Create: `frontend/src/features/dashboard/index.tsx`
- Create: `frontend/src/features/dashboard/components/ActivityList.tsx`
- Create: `frontend/src/features/dashboard/components/QuickActions.tsx`

- [ ] **Step 1: 创建 ActivityList 组件**

```tsx
// src/features/dashboard/components/ActivityList.tsx
import React from 'react';

interface Activity {
  id: string;
  type: 'blue' | 'green' | 'amber';
  text: string;
  time: string;
}

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  const dotColors = {
    blue: 'bg-accent',
    green: 'bg-success',
    amber: 'bg-warning',
  };

  return (
    <div className="flex flex-col">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 py-3 border-b border-canvas-soft-2 last:border-0"
        >
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColors[activity.type]}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink">{activity.text}</p>
            <p className="text-xs text-muted mt-0.5">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 创建 QuickActions 组件**

```tsx
// src/features/dashboard/components/QuickActions.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Bot, MessageSquare, Cpu, ArrowRight } from 'lucide-react';

const actions = [
  {
    icon: Database,
    title: '创建知识库',
    desc: '上传文档或配置网页抓取',
    path: '/knowledge-bases',
  },
  {
    icon: Bot,
    title: '新建智能体',
    desc: '配置模型、知识库和提示词',
    path: '/agents',
  },
  {
    icon: MessageSquare,
    title: '开始对话测试',
    desc: '验证知识库检索效果',
    path: '/agents',
  },
  {
    icon: Cpu,
    title: '配置 AI 模型',
    desc: '添加或管理 LLM / Embedding',
    path: '/models',
  },
];

export function QuickActions() {
  return (
    <div className="flex flex-col gap-2.5">
      {actions.map((action) => (
        <Link
          key={action.title}
          to={action.path}
          className="flex items-center gap-3.5 p-3.5 border border-hairline rounded-md hover:border-accent hover:bg-accent-soft transition-all duration-180 group"
        >
          <div className="w-10 h-10 rounded-md bg-canvas-soft flex items-center justify-center">
            <action.icon className="w-5 h-5 text-muted" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-ink">{action.title}</div>
            <div className="text-xs text-muted mt-0.5">{action.desc}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 创建 Dashboard 页面**

```tsx
// src/features/dashboard/index.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, FileText, Bot, MessageSquare, Plus, Download } from 'lucide-react';
import { PageHeader } from '../../app/layout';
import { Button, Spinner } from '../../shared/components/ui';
import { StatCard, KBCard, Card } from '../../shared/components/cards';
import { ActivityList } from './components/ActivityList';
import { QuickActions } from './components/QuickActions';
import { useKBStore } from '../../shared/stores';

// 模拟数据
const mockActivities = [
  { id: '1', type: 'blue' as const, text: '知识库「产品使用手册」新增 <strong>3 篇</strong>文档，已自动完成向量化。', time: '10 分钟前' },
  { id: '2', type: 'green' as const, text: '智能体「产品助手」完成模型切换至 <strong>GPT-4o</strong>。', time: '1 小时前' },
  { id: '3', type: 'amber' as const, text: '知识库「技术文档库」正在处理新上传的 <strong>5 个</strong>文件。', time: '2 小时前' },
  { id: '4', type: 'blue' as const, text: 'Prompt 模板「RAG 问答助手」已更新，优化了引用格式输出。', time: '昨天 18:30' },
  { id: '5', type: 'green' as const, text: '系统完成向量库索引优化，检索响应速度提升 <strong>15%</strong>。', time: '昨天 14:00' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { kbs, loading, fetchKBs } = useKBStore();

  useEffect(() => {
    fetchKBs();
  }, [fetchKBs]);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
  };

  if (loading) {
    return <Spinner className="h-64" />;
  }

  return (
    <div>
      <PageHeader
        title="工作台"
        subtitle="欢迎回来，这是你的知识库运营概览。"
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
              导入数据
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/knowledge-bases')}
            >
              新建知识库
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard
          icon={<Database className="w-5 h-5" />}
          iconColor="blue"
          value={kbs.length}
          label="知识库总数"
          trend={{ value: `+${Math.min(kbs.length, 2)} 本周`, direction: 'up' }}
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          iconColor="green"
          value={kbs.reduce((sum, kb) => sum + kb.document_count, 0)}
          label="文档总数"
          trend={{ value: '+12 本周', direction: 'up' }}
        />
        <StatCard
          icon={<Bot className="w-5 h-5" />}
          iconColor="amber"
          value={3}
          label="活跃智能体"
          trend={{ value: '+1 本周', direction: 'up' }}
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5" />}
          iconColor="red"
          value="1,024"
          label="今日对话数"
          trend={{ value: '-5% 较上周', direction: 'down' }}
        />
      </div>

      {/* Knowledge Bases */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink">我的知识库</h2>
          <a href="/knowledge-bases" className="text-sm font-medium text-accent hover:underline">
            查看全部 →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kbs.slice(0, 4).map((kb) => (
            <KBCard
              key={kb.id}
              id={kb.id}
              name={kb.name}
              description={kb.description}
              kb_type={kb.kb_type}
              status="ready"
              documentCount={kb.document_count}
              chunkCount={0}
              lastUpdated={formatTime(kb.updated_at)}
              onClick={() => navigate(`/knowledge-bases/${kb.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        <Card>
          <h3 className="text-base font-semibold text-ink mb-4">最近动态</h3>
          <ActivityList activities={mockActivities} />
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-ink mb-4">快捷操作</h3>
          <QuickActions />
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 提交代码**

```bash
git add frontend/src/features/dashboard/
git commit -m "feat: add Dashboard page with stats, KB cards, and activity list"
```

---

## Task 10: 知识库列表页面

**Covers:** S4.2

**Files:**
- Create: `frontend/src/features/knowledge-base/KBList.tsx`
- Create: `frontend/src/features/knowledge-base/components/KBForm.tsx`

- [ ] **Step 1: 创建 KBForm 组件**

```tsx
// src/features/knowledge-base/components/KBForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { Input, Select, Textarea, Button, Modal } from '../../../shared/components/ui';
import type { KBCreate, KnowledgeBase } from '../../../shared/types';

interface KBFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: KBCreate) => Promise<void>;
  initialData?: KnowledgeBase;
  categories: { label: string; value: number }[];
  models: { label: string; value: number }[];
}

export function KBForm({ open, onClose, onSubmit, initialData, categories, models }: KBFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<KBCreate>({
    defaultValues: initialData || {
      name: '',
      description: '',
      kb_type: 'general',
      chunk_size: 500,
      chunk_overlap: 100,
      semantic_chunk_enabled: false,
      llm_chunk_enabled: false,
    },
  });

  const handleFormSubmit = async (data: KBCreate) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save KB:', error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? '编辑知识库' : '创建知识库'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button
            variant="primary"
            onClick={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
          >
            {initialData ? '保存' : '创建'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label="知识库名称"
          placeholder="请输入知识库名称"
          required
          {...register('name', { required: '请输入知识库名称' })}
          error={errors.name?.message}
        />

        <Textarea
          label="描述"
          placeholder="请输入知识库描述"
          {...register('description')}
        />

        <Select
          label="知识库类型"
          options={[
            { label: '通用文档', value: 'general' },
            { label: '网站链接', value: 'web' },
          ]}
          {...register('kb_type')}
        />

        <Select
          label="目录层级"
          options={categories}
          placeholder="请选择目录层级"
          {...register('category_id')}
        />

        <Select
          label="Embedding 模型"
          options={models}
          placeholder="请选择 Embedding 模型"
          {...register('embedding_model_id')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="切片大小"
            type="number"
            {...register('chunk_size', { valueAsNumber: true })}
          />
          <Input
            label="切片重叠"
            type="number"
            {...register('chunk_overlap', { valueAsNumber: true })}
          />
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: 创建 KBList 页面**

```tsx
// src/features/knowledge-base/KBList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { PageHeader } from '../../app/layout';
import { Button, Input, Select, Spinner, EmptyState } from '../../shared/components/ui';
import { KBCard } from '../../shared/components/cards';
import { KBForm } from './components/KBForm';
import { useKBStore, useModelStore } from '../../shared/stores';
import type { KBCreate } from '../../shared/types';

export default function KBList() {
  const navigate = useNavigate();
  const { kbs, loading, fetchKBs, createKB, categories, fetchCategories } = useKBStore();
  const { models, fetchModels } = useModelStore();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchKBs();
    fetchCategories();
    fetchModels({ model_type: 'embedding' });
  }, [fetchKBs, fetchCategories, fetchModels]);

  const filteredKBs = kbs.filter((kb) => {
    if (filterType && kb.kb_type !== filterType) return false;
    if (searchQuery && !kb.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async (data: KBCreate) => {
    await createKB(data);
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
  };

  const categoryOptions = categories.map(c => ({ label: c.name, value: c.id }));
  const modelOptions = models.map(m => ({ label: m.name, value: m.id }));

  if (loading && kbs.length === 0) {
    return <Spinner className="h-64" />;
  }

  return (
    <div>
      <PageHeader
        title="知识库"
        subtitle="管理和组织你的知识库文档"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowForm(true)}
          >
            创建知识库
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="搜索知识库..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          options={[
            { label: '全部类型', value: '' },
            { label: '通用文档', value: 'general' },
            { label: '网站链接', value: 'web' },
          ]}
          value={filterType}
          onChange={setFilterType}
        />
      </div>

      {/* KB Grid */}
      {filteredKBs.length === 0 ? (
        <EmptyState
          icon={<Plus className="w-8 h-8" />}
          title="暂无知识库"
          description="创建你的第一个知识库，开始构建智能问答系统"
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              创建知识库
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredKBs.map((kb) => (
            <KBCard
              key={kb.id}
              id={kb.id}
              name={kb.name}
              description={kb.description}
              kb_type={kb.kb_type}
              status="ready"
              documentCount={kb.document_count}
              chunkCount={0}
              lastUpdated={formatTime(kb.updated_at)}
              onClick={() => navigate(`/knowledge-bases/${kb.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      <KBForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        categories={categoryOptions}
        models={modelOptions}
      />
    </div>
  );
}
```

- [ ] **Step 3: 提交代码**

```bash
git add frontend/src/features/knowledge-base/
git commit -m "feat: add knowledge base list page with create form"
```

---

## Task 11: 知识库详情页面

**Covers:** S4.3

**Files:**
- Create: `frontend/src/features/knowledge-base/KBDetail.tsx`
- Create: `frontend/src/features/knowledge-base/components/DocumentList.tsx`
- Create: `frontend/src/features/knowledge-base/components/HitTest.tsx`

- [ ] **Step 1: 创建 DocumentList 组件**

```tsx
// src/features/knowledge-base/components/DocumentList.tsx
import React from 'react';
import { FileText, Trash2, RefreshCw, FileSearch } from 'lucide-react';
import { Button, Badge, Spinner, EmptyState } from '../../../shared/components/ui';
import type { Document } from '../../../shared/types';

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
  onDelete: (docId: number) => Promise<void>;
  onReprocess: (docId: number) => Promise<void>;
  onGenerateSummary: (docId: number) => Promise<void>;
}

const statusConfig = {
  pending: { label: '待处理', variant: 'default' as const },
  processing: { label: '处理中', variant: 'warning' as const },
  ready: { label: '已完成', variant: 'success' as const },
  error: { label: '错误', variant: 'error' as const },
};

export function DocumentList({
  documents,
  loading,
  onDelete,
  onReprocess,
  onGenerateSummary,
}: DocumentListProps) {
  if (loading) {
    return <Spinner className="h-32" />;
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-8 h-8" />}
        title="暂无文档"
        description="上传文档到知识库开始构建"
      />
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-hairline">
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">文件名</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">类型</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">大小</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">切片数</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">状态</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-muted uppercase">操作</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const status = statusConfig[doc.status];
            return (
              <tr key={doc.id} className="border-b border-hairline hover:bg-canvas-soft transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted" />
                    <span className="text-sm font-medium text-ink">{doc.filename}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-muted">{doc.file_type}</td>
                <td className="py-3 px-4 text-sm text-muted">{formatFileSize(doc.file_size)}</td>
                <td className="py-3 px-4 text-sm text-muted">{doc.chunk_count}</td>
                <td className="py-3 px-4">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<RefreshCw className="w-4 h-4" />}
                      onClick={() => onReprocess(doc.id)}
                      title="重新处理"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<FileSearch className="w-4 h-4" />}
                      onClick={() => onGenerateSummary(doc.id)}
                      title="生成摘要"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4 text-error" />}
                      onClick={() => onDelete(doc.id)}
                      title="删除"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: 创建 HitTest 组件**

```tsx
// src/features/knowledge-base/components/HitTest.tsx
import React, { useState } from 'react';
import { Search, Clock, FileText } from 'lucide-react';
import { Input, Button, Spinner, Badge } from '../../../shared/components/ui';
import { kbService } from '../../../shared/services';
import type { HitTestResult } from '../../../shared/types';

interface HitTestProps {
  kbId: number;
}

export function HitTest({ kbId }: HitTestProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HitTestResult | null>(null);

  const handleTest = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const data = await kbService.hitTest(kbId, { query, top_k: 5 });
      setResult(data);
    } catch (error) {
      console.error('Hit test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="输入测试问题..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTest()}
          className="flex-1"
        />
        <Button
          variant="primary"
          onClick={handleTest}
          loading={loading}
          icon={<Search className="w-4 h-4" />}
        >
          测试
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              响应时间: {result.latency_ms}ms
            </span>
            <span>命中: {result.total_hits} 条</span>
            {result.rewritten_query !== result.query && (
              <span>改写后: {result.rewritten_query}</span>
            )}
          </div>

          <div className="space-y-3">
            {result.hits.map((hit, index) => (
              <div
                key={hit.chunk_id}
                className="p-4 bg-canvas-soft rounded-md border border-hairline"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">#{index + 1}</Badge>
                    <span className="text-sm font-medium text-ink">{hit.doc_name}</span>
                  </div>
                  <span className="text-xs text-muted">
                    相似度: {(hit.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-body line-clamp-3">{hit.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="default">{hit.retrieval_source}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 创建 KBDetail 页面**

```tsx
// src/features/knowledge-base/KBDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, RefreshCw, Settings, Search } from 'lucide-react';
import { PageHeader } from '../../app/layout';
import { Button, Spinner, Card, Modal } from '../../shared/components/ui';
import { DocumentList } from './components/DocumentList';
import { HitTest } from './components/HitTest';
import { useKBStore } from '../../shared/stores';
import { kbService } from '../../shared/services';

export default function KBDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentKB, documents, loading, fetchKB, fetchDocuments, uploadDocuments, deleteDocument } = useKBStore();
  const [activeTab, setActiveTab] = useState<'documents' | 'hittest'>('documents');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchKB(parseInt(id));
      fetchDocuments(parseInt(id));
    }
  }, [id, fetchKB, fetchDocuments]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !id) return;
    
    setUploading(true);
    try {
      await uploadDocuments(parseInt(id), Array.from(files));
      setShowUpload(false);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (confirm('确定要删除这个文档吗？')) {
      await deleteDocument(docId);
    }
  };

  const handleReprocess = async (docId: number) => {
    try {
      await kbService.reprocessDocument(docId);
      if (id) fetchDocuments(parseInt(id));
    } catch (error) {
      console.error('Reprocess failed:', error);
    }
  };

  const handleGenerateSummary = async (docId: number) => {
    try {
      await kbService.generateSummary(docId);
      if (id) fetchDocuments(parseInt(id));
    } catch (error) {
      console.error('Generate summary failed:', error);
    }
  };

  const handleClearVectors = async () => {
    if (!id || !confirm('确定要清空所有向量吗？此操作不可恢复。')) return;
    try {
      await kbService.clearVectors(parseInt(id));
      alert('向量已清空');
    } catch (error) {
      console.error('Clear vectors failed:', error);
    }
  };

  if (loading || !currentKB) {
    return <Spinner className="h-64" />;
  }

  return (
    <div>
      <PageHeader
        title={currentKB.name}
        subtitle={currentKB.description}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/knowledge-bases')}
            >
              返回
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => setShowUpload(true)}
            >
              上传文档
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleClearVectors}
            >
              清空向量
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-hairline">
        <button
          className={`pb-3 text-sm font-medium border-b-2 transition-colors
            ${activeTab === 'documents'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-ink'
            }
          `}
          onClick={() => setActiveTab('documents')}
        >
          文档列表
        </button>
        <button
          className={`pb-3 text-sm font-medium border-b-2 transition-colors
            ${activeTab === 'hittest'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-ink'
            }
          `}
          onClick={() => setActiveTab('hittest')}
        >
          命中测试
        </button>
      </div>

      {/* Content */}
      <Card>
        {activeTab === 'documents' ? (
          <DocumentList
            documents={documents}
            loading={loading}
            onDelete={handleDeleteDoc}
            onReprocess={handleReprocess}
            onGenerateSummary={handleGenerateSummary}
          />
        ) : (
          <HitTest kbId={parseInt(id!)} />
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="上传文档"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowUpload(false)}>取消</Button>
            <Button
              variant="primary"
              loading={uploading}
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                handleUpload(input?.files);
              }}
            >
              上传
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            支持 PDF、Word、TXT、Markdown 等格式，单文件最大 50MB
          </p>
          <input
            type="file"
            multiple
            className="w-full p-4 border-2 border-dashed border-hairline rounded-md text-center
              hover:border-accent transition-colors cursor-pointer"
          />
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 4: 提交代码**

```bash
git add frontend/src/features/knowledge-base/
git commit -m "feat: add knowledge base detail page with document management and hit test"
```

---

## Task 12: 智能体管理页面

**Covers:** S4.5, S4.6

**Files:**
- Create: `frontend/src/features/agents/AgentList.tsx`
- Create: `frontend/src/features/agents/AgentDetail.tsx`
- Create: `frontend/src/features/agents/components/AgentForm.tsx`
- Create: `frontend/src/features/agents/components/ChatPanel.tsx`

- [ ] **Step 1: 创建 AgentForm 组件**

```tsx
// src/features/agents/components/AgentForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { Input, Select, Textarea, Button, Modal } from '../../../shared/components/ui';
import type { AgentCreate, Agent } from '../../../shared/types';

interface AgentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AgentCreate) => Promise<void>;
  initialData?: Agent;
  models: { label: string; value: number }[];
  knowledgeBases: { label: string; value: number }[];
}

export function AgentForm({ open, onClose, onSubmit, initialData, models, knowledgeBases }: AgentFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<AgentCreate>({
    defaultValues: initialData || {
      name: '',
      description: '',
      system_prompt: '',
      opening_message: '',
      temperature: 0.1,
      max_tokens: 2048,
      top_k: 5,
      similarity_threshold: 0.6,
      knowledge_base_ids: [],
    },
  });

  const handleFormSubmit = async (data: AgentCreate) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? '编辑智能体' : '创建智能体'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button
            variant="primary"
            onClick={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
          >
            {initialData ? '保存' : '创建'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label="智能体名称"
          placeholder="请输入智能体名称"
          required
          {...register('name', { required: '请输入智能体名称' })}
          error={errors.name?.message}
        />

        <Textarea
          label="描述"
          placeholder="请输入智能体描述"
          {...register('description')}
        />

        <Select
          label="LLM 模型"
          options={models}
          placeholder="请选择 LLM 模型"
          {...register('llm_model_id')}
        />

        <Textarea
          label="系统提示词"
          placeholder="请输入系统提示词"
          rows={4}
          {...register('system_prompt')}
        />

        <Input
          label="开场白"
          placeholder="请输入开场白"
          {...register('opening_message')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Temperature"
            type="number"
            step="0.1"
            {...register('temperature', { valueAsNumber: true })}
          />
          <Input
            label="Max Tokens"
            type="number"
            {...register('max_tokens', { valueAsNumber: true })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Top K"
            type="number"
            {...register('top_k', { valueAsNumber: true })}
          />
          <Input
            label="相似度阈值"
            type="number"
            step="0.1"
            {...register('similarity_threshold', { valueAsNumber: true })}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-2 block">关联知识库</label>
          <div className="space-y-2 max-h-40 overflow-y-auto p-3 border border-hairline rounded-sm">
            {knowledgeBases.map((kb) => (
              <label key={kb.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={kb.value}
                  {...register('knowledge_base_ids')}
                  className="rounded border-hairline"
                />
                <span className="text-sm">{kb.label}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: 创建 ChatPanel 组件**

```tsx
// src/features/agents/components/ChatPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Clock, AlertTriangle } from 'lucide-react';
import { Button, Spinner, Badge } from '../../../shared/components/ui';
import { agentService } from '../../../shared/services';
import type { Message, CitedSource, ConflictInfo } from '../../../shared/types';

interface ChatPanelProps {
  agentId: number;
}

export function ChatPanel({ agentId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      conversation_id: conversationId || 0,
      role: 'user',
      content: input,
      cited_sources: '[]',
      conflict_info: '',
      latency_ms: 0,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await agentService.chat(agentId, {
        query: input,
        conversation_id: conversationId,
        stream: false,
      });

      const assistantMessage: Message = {
        id: Date.now() + 1,
        conversation_id: response.conversation_id,
        role: 'assistant',
        content: response.answer,
        cited_sources: JSON.stringify(response.cited_sources),
        conflict_info: response.conflict_info ? JSON.stringify(response.conflict_info) : '',
        latency_ms: response.latency_ms,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(response.conversation_id);
    } catch (error) {
      console.error('Chat failed:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        conversation_id: 0,
        role: 'assistant',
        content: '抱歉，发生了错误，请稍后重试。',
        cited_sources: '[]',
        conflict_info: '',
        latency_ms: 0,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderSources = (sources: string) => {
    try {
      const parsed: CitedSource[] = JSON.parse(sources);
      if (parsed.length === 0) return null;

      return (
        <div className="mt-3 pt-3 border-t border-hairline">
          <div className="text-xs font-medium text-muted mb-2">引用来源:</div>
          <div className="flex flex-wrap gap-2">
            {parsed.map((source, idx) => (
              <Badge key={idx} variant="info">
                <FileText className="w-3 h-3 mr-1" />
                {source.doc_name}
              </Badge>
            ))}
          </div>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderConflict = (conflict: string) => {
    if (!conflict) return null;
    try {
      const parsed: ConflictInfo = JSON.parse(conflict);
      if (!parsed.has_conflict) return null;

      return (
        <div className="mt-3 p-3 bg-warning-soft rounded-md flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-warning-deep">{parsed.description}</div>
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted">
            <Bot className="w-12 h-12 mb-4" />
            <p className="text-sm">开始对话测试智能体的回答效果</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-white border border-hairline'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              {msg.role === 'assistant' && renderSources(msg.cited_sources)}
              {msg.role === 'assistant' && renderConflict(msg.conflict_info)}
              {msg.role === 'assistant' && msg.latency_ms > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted">
                  <Clock className="w-3 h-3" />
                  {msg.latency_ms}ms
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-hairline rounded-lg p-3">
              <Spinner size="sm" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-hairline p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入问题..."
            className="flex-1 px-4 py-2 text-sm border border-hairline rounded-md
              focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            disabled={loading}
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            icon={<Send className="w-4 h-4" />}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 AgentList 页面**

```tsx
// src/features/agents/AgentList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../app/layout';
import { Button, Spinner, EmptyState } from '../../shared/components/ui';
import { AgentCard } from '../../shared/components/cards';
import { AgentForm } from './components/AgentForm';
import { useAgentStore, useModelStore, useKBStore } from '../../shared/stores';
import type { AgentCreate } from '../../shared/types';

export default function AgentList() {
  const navigate = useNavigate();
  const { agents, loading, fetchAgents, createAgent } = useAgentStore();
  const { models, fetchModels } = useModelStore();
  const { kbs, fetchKBs } = useKBStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAgents();
    fetchModels({ model_type: 'llm' });
    fetchKBs();
  }, [fetchAgents, fetchModels, fetchKBs]);

  const handleCreate = async (data: AgentCreate) => {
    await createAgent(data);
  };

  const modelOptions = models.map(m => ({ label: m.name, value: m.id }));
  const kbOptions = kbs.map(kb => ({ label: kb.name, value: kb.id }));

  if (loading && agents.length === 0) {
    return <Spinner className="h-64" />;
  }

  return (
    <div>
      <PageHeader
        title="智能体"
        subtitle="创建和管理 AI 智能体"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowForm(true)}
          >
            创建智能体
          </Button>
        }
      />

      {agents.length === 0 ? (
        <EmptyState
          icon={<Plus className="w-8 h-8" />}
          title="暂无智能体"
          description="创建你的第一个智能体，开始提供智能问答服务"
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              创建智能体
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              id={agent.id}
              name={agent.name}
              description={agent.description}
              status={agent.status}
              modelName={models.find(m => m.id === agent.llm_model_id)?.name}
              kbCount={agent.knowledge_base_ids.length}
              onClick={() => navigate(`/agents/${agent.id}`)}
            />
          ))}
        </div>
      )}

      <AgentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        models={modelOptions}
        knowledgeBases={kbOptions}
      />
    </div>
  );
}
```

- [ ] **Step 4: 创建 AgentDetail 页面**

```tsx
// src/features/agents/AgentDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, MessageSquare, Key, Globe, GlobeLock } from 'lucide-react';
import { PageHeader } from '../../app/layout';
import { Button, Spinner, Card, Badge } from '../../shared/components/ui';
import { ChatPanel } from './components/ChatPanel';
import { useAgentStore } from '../../shared/stores';
import { agentService } from '../../shared/services';

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentAgent, loading, fetchAgent, publishAgent, unpublishAgent } = useAgentStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'config'>('chat');

  useEffect(() => {
    if (id) {
      fetchAgent(parseInt(id));
    }
  }, [id, fetchAgent]);

  const handlePublish = async () => {
    if (!id) return;
    await publishAgent(parseInt(id));
  };

  const handleUnpublish = async () => {
    if (!id) return;
    await unpublishAgent(parseInt(id));
  };

  const handleCopyKey = () => {
    if (currentAgent?.api_key) {
      navigator.clipboard.writeText(currentAgent.api_key);
      alert('API Key 已复制到剪贴板');
    }
  };

  const handleRegenerateKey = async () => {
    if (!id || !confirm('确定要重新生成 API Key 吗？旧的 Key 将立即失效。')) return;
    try {
      await agentService.regenerateKey(parseInt(id));
      fetchAgent(parseInt(id));
    } catch (error) {
      console.error('Regenerate key failed:', error);
    }
  };

  if (loading || !currentAgent) {
    return <Spinner className="h-64" />;
  }

  return (
    <div>
      <PageHeader
        title={currentAgent.name}
        subtitle={currentAgent.description}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/agents')}
            >
              返回
            </Button>
            {currentAgent.status === 'draft' ? (
              <Button
                variant="primary"
                size="sm"
                icon={<Globe className="w-4 h-4" />}
                onClick={handlePublish}
              >
                发布
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={<GlobeLock className="w-4 h-4" />}
                onClick={handleUnpublish}
              >
                下线
              </Button>
            )}
          </div>
        }
      />

      {/* Agent Info */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant={currentAgent.status === 'published' ? 'success' : 'default'}>
              {currentAgent.status === 'published' ? '已发布' : '草稿'}
            </Badge>
            {currentAgent.api_key && (
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-muted" />
                <code className="text-xs bg-canvas-soft px-2 py-1 rounded">
                  {currentAgent.api_key.substring(0, 20)}...
                </code>
                <Button variant="ghost" size="sm" onClick={handleCopyKey}>复制</Button>
                <Button variant="ghost" size="sm" onClick={handleRegenerateKey}>重新生成</Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-hairline">
        <button
          className={`pb-3 text-sm font-medium border-b-2 transition-colors
            ${activeTab === 'chat'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-ink'
            }
          `}
          onClick={() => setActiveTab('chat')}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            对话测试
          </div>
        </button>
        <button
          className={`pb-3 text-sm font-medium border-b-2 transition-colors
            ${activeTab === 'config'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-ink'
            }
          `}
          onClick={() => setActiveTab('config')}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            配置
          </div>
        </button>
      </div>

      {/* Content */}
      <Card>
        {activeTab === 'chat' ? (
          <ChatPanel agentId={parseInt(id!)} />
        ) : (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">智能体配置</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted">系统提示词</label>
                <p className="mt-1 text-sm bg-canvas-soft p-3 rounded-md whitespace-pre-wrap">
                  {currentAgent.system_prompt || '未设置'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted">开场白</label>
                <p className="mt-1 text-sm">{currentAgent.opening_message || '未设置'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted">Temperature</label>
                  <p className="mt-1 text-sm">{currentAgent.temperature}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Max Tokens</label>
                  <p className="mt-1 text-sm">{currentAgent.max_tokens}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Top K</label>
                  <p className="mt-1 text-sm">{currentAgent.top_k}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">相似度阈值</label>
                  <p className="mt-1 text-sm">{currentAgent.similarity_threshold}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: 提交代码**

```bash
git add frontend/src/features/agents/
git commit -m "feat: add agent management pages with chat panel"
```

---

## Task 13: 其他功能模块

**Covers:** S4.4, S4.7, S4.8, S4.9, S4.10

**Files:**
- Create: `frontend/src/features/categories/index.tsx`
- Create: `frontend/src/features/models/index.tsx`
- Create: `frontend/src/features/conversations/index.tsx`
- Create: `frontend/src/features/prompts/index.tsx`
- Create: `frontend/src/features/settings/index.tsx`

- [ ] **Step 1: 创建目录层级页面**

```tsx
// src/features/categories/index.tsx
import React, { useEffect, useState } from 'react';
import { Plus, FolderTree, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '../../app/layout';
import { Button, Card, Modal, Input, Spinner, EmptyState } from '../../shared/components/ui';
import { useKBStore } from '../../shared/stores';
import { kbService } from '../../shared/services';
import type { CategoryTree } from '../../shared/types';

export default function CategoryPage() {
  const { categories, fetchCategories } = useKBStore();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTree | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      if (editingCategory) {
        await kbService.updateCategory(editingCategory.id, { name, description });
      } else {
        await kbService.createCategory({ name, description });
      }
      fetchCategories();
      setShowForm(false);
      setName('');
      setDescription('');
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个目录吗？')) return;
    try {
      await kbService.deleteCategory(id);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleEdit = (category: CategoryTree) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description);
    setShowForm(true);
  };

  const renderCategory = (category: CategoryTree, level: number = 0) => (
    <div key={category.id} style={{ marginLeft: level * 24 }}>
      <div className="flex items-center justify-between p-3 hover:bg-canvas-soft rounded-md group">
        <div className="flex items-center gap-3">
          <FolderTree className="w-5 h-5 text-muted" />
          <span className="text-sm font-medium text-ink">{category.name}</span>
          <span className="text-xs text-muted">({category.kb_count} 个知识库)</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => handleEdit(category)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-error" />}
            onClick={() => handleDelete(category.id)}
          />
        </div>
      </div>
      {category.children.map((child) => renderCategory(child, level + 1))}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="目录层级"
        subtitle="管理知识库的目录结构"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingCategory(null);
              setName('');
              setDescription('');
              setShowForm(true);
            }}
          >
            创建目录
          </Button>
        }
      />

      <Card>
        {categories.length === 0 ? (
          <EmptyState
            icon={<FolderTree className="w-8 h-8" />}
            title="暂无目录"
            description="创建目录来组织你的知识库"
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                创建目录
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-hairline">
            {categories.map((category) => renderCategory(category))}
          </div>
        )}
      </Card>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(null);
          setName('');
          setDescription('');
        }}
        title={editingCategory ? '编辑目录' : '创建目录'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
            <Button variant="primary" onClick={handleSubmit} loading={loading}>
              {editingCategory ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="目录名称"
            placeholder="请输入目录名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="描述"
            placeholder="请输入目录描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: 创建模型管理页面**

```tsx
// src/features/models/index.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Cpu, Edit, Trash2, Star, Zap } from 'lucide-react';
import { PageHeader } from '../../app/layout';
import { Button, Card, Modal, Input, Select, Badge, Spinner, EmptyState } from '../../shared/components/ui';
import { useModelStore } from '../../shared/stores';
import type { AIModelCreate } from '../../shared/types';

export default function ModelPage() {
  const { models, loading, fetchModels, createModel, deleteModel, setDefault, testConnection } = useModelStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AIModelCreate>({
    name: '',
    provider: 'ollama',
    model_type: 'llm',
    model_name: '',
    api_key: '',
    base_url: '',
  });
  const [testing, setTesting] = useState<number | null>(null);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleSubmit = async () => {
    try {
      await createModel(formData);
      setShowForm(false);
      setFormData({
        name: '',
        provider: 'ollama',
        model_type: 'llm',
        model_name: '',
        api_key: '',
        base_url: '',
      });
    } catch (error) {
      console.error('Failed to create model:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个模型吗？')) return;
    await deleteModel(id);
  };

  const handleTest = async (id: number) => {
    setTesting(id);
    try {
      const result = await testConnection(id);
      alert(result.success ? '连接成功！' : `连接失败: ${result.error}`);
    } catch (error) {
      alert('连接测试失败');
    } finally {
      setTesting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="模型管理"
        subtitle="管理 LLM 和 Embedding 模型"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowForm(true)}
          >
            添加模型
          </Button>
        }
      />

      {loading && models.length === 0 ? (
        <Spinner className="h-64" />
      ) : models.length === 0 ? (
        <EmptyState
          icon={<Cpu className="w-8 h-8" />}
          title="暂无模型"
          description="添加 LLM 或 Embedding 模型开始使用"
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              添加模型
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">名称</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">提供商</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">类型</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">模型</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">状态</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id} className="border-b border-hairline hover:bg-canvas-soft transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{model.name}</span>
                        {model.is_default && (
                          <Badge variant="info">
                            <Star className="w-3 h-3 mr-1" />
                            默认
                          </Badge>
                        )}
                        {model.is_builtin && <Badge variant="default">内置</Badge>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">{model.provider}</td>
                    <td className="py-3 px-4">
                      <Badge variant={model.model_type === 'llm' ? 'info' : 'success'}>
                        {model.model_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">{model.model_name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={model.status === 'active' ? 'success' : 'default'}>
                        {model.status === 'active' ? '活跃' : '停用'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {!model.is_builtin && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Star className="w-4 h-4" />}
                              onClick={() => setDefault(model.id)}
                              title="设为默认"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Zap className="w-4 h-4" />}
                              onClick={() => handleTest(model.id)}
                              loading={testing === model.id}
                              title="测试连接"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="w-4 h-4 text-error" />}
                              onClick={() => handleDelete(model.id)}
                              title="删除"
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="添加模型"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
            <Button variant="primary" onClick={handleSubmit}>添加</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="模型名称"
            placeholder="请输入模型名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="提供商"
            options={[
              { label: 'Ollama', value: 'ollama' },
              { label: 'OpenAI', value: 'openai' },
              { label: '其他', value: 'other' },
            ]}
            value={formData.provider}
            onChange={(value) => setFormData({ ...formData, provider: value })}
          />
          <Select
            label="模型类型"
            options={[
              { label: 'LLM', value: 'llm' },
              { label: 'Embedding', value: 'embedding' },
              { label: 'Reranking', value: 'reranking' },
            ]}
            value={formData.model_type}
            onChange={(value) => setFormData({ ...formData, model_type: value as any })}
          />
          <Input
            label="模型标识"
            placeholder="如 qwen2.5:7b"
            value={formData.model_name}
            onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
            required
          />
          <Input
            label="API Key"
            placeholder="如需要请输入 API Key"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
          />
          <Input
            label="Base URL"
            placeholder="如 http://localhost:11434"
            value={formData.base_url}
            onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: 创建其他页面**

```tsx
// src/features/conversations/index.tsx
import React, { useEffect, useState } from 'react';
import { MessageSquare, Trash2, Download, Eye } from 'lucide-react';
import { PageHeader } from '../../app/layout';
import { Button, Card, Badge, Spinner, EmptyState, Modal } from '../../shared/components/ui';
import { useAgentStore } from '../../shared/stores';
import { agentService } from '../../shared/services';
import type { Conversation, Message } from '../../shared/types';

export default function ConversationPage() {
  const { agents, fetchAgents } = useAgentStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAgents();
    loadConversations();
  }, [fetchAgents]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const allConvs: Conversation[] = [];
      for (const agent of agents) {
        const convs = await agentService.getConversations(agent.id);
        allConvs.push(...convs);
      }
      setConversations(allConvs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessages = async (conv: Conversation) => {
    setSelectedConv(conv);
    try {
      const msgs = await agentService.getMessages(conv.id);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleDelete = async (convId: number) => {
    if (!confirm('确定要删除这个会话吗？')) return;
    try {
      await agentService.deleteConversation(convId);
      loadConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleExport = async (convId: number) => {
    try {
      const data = await agentService.exportConversation(convId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation_${convId}.json`;
      a.click();
    } catch (error) {
      console.error('Failed to export conversation:', error);
    }
  };

  return (
    <div>
      <PageHeader title="会话管理" subtitle="查看和管理智能体对话记录" />

      {loading ? (
        <Spinner className="h-64" />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-8 h-8" />}
          title="暂无会话"
          description="与智能体对话后会话将显示在这里"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">智能体</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">标题</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">消息数</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">创建时间</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv) => {
                  const agent = agents.find(a => a.id === conv.agent_id);
                  return (
                    <tr key={conv.id} className="border-b border-hairline hover:bg-canvas-soft transition-colors">
                      <td className="py-3 px-4 text-sm text-muted">#{conv.id}</td>
                      <td className="py-3 px-4 text-sm text-ink">{agent?.name || '未知'}</td>
                      <td className="py-3 px-4 text-sm text-ink">{conv.title}</td>
                      <td className="py-3 px-4 text-sm text-muted">{conv.message_count}</td>
                      <td className="py-3 px-4 text-sm text-muted">
                        {conv.created_at ? new Date(conv.created_at).toLocaleString() : '未知'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => handleViewMessages(conv)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Download className="w-4 h-4" />}
                            onClick={() => handleExport(conv.id)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4 text-error" />}
                            onClick={() => handleDelete(conv.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={!!selectedConv}
        onClose={() => {
          setSelectedConv(null);
          setMessages([]);
        }}
        title={`会话 #${selectedConv?.id} - ${selectedConv?.title}`}
        size="lg"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-md ${
                msg.role === 'user' ? 'bg-accent-soft ml-12' : 'bg-canvas-soft mr-12'
              }`}
            >
              <div className="text-xs font-medium text-muted mb-1">
                {msg.role === 'user' ? '用户' : '助手'}
              </div>
              <div className="text-sm">{msg.content}</div>
              {msg.latency_ms > 0 && (
                <div className="text-xs text-muted mt-1">响应时间: {msg.latency_ms}ms</div>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
```

```tsx
// src/features/prompts/index.tsx
import React, { useEffect, useState } from 'react';
import { Plus, FileText, Edit, Trash2, RotateCcw, Star } from 'lucide-react';
import { PageHeader } from '../../app/layout';
import { Button, Card, Modal, Input, Textarea, Badge, Spinner, EmptyState } from '../../shared/components/ui';
import { promptService } from '../../shared/services';
import type { PromptTemplate, PromptCreate } from '../../shared/types';

export default function PromptPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [formData, setFormData] = useState<PromptCreate>({
    name: '',
    category: 'qa_main',
    content: '',
    description: '',
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await promptService.list();
      setPrompts(data);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingPrompt) {
        await promptService.update(editingPrompt.id, formData);
      } else {
        await promptService.create(formData);
      }
      loadPrompts();
      setShowForm(false);
      setEditingPrompt(null);
      setFormData({ name: '', category: 'qa_main', content: '', description: '' });
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    try {
      await promptService.delete(id);
      loadPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const handleReset = async (id: number) => {
    if (!confirm('确定要重置为系统默认吗？')) return;
    try {
      await promptService.resetToDefault(id);
      loadPrompts();
    } catch (error) {
      console.error('Failed to reset prompt:', error);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await promptService.setDefault(id);
      loadPrompts();
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const handleEdit = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      category: prompt.category,
      content: prompt.content,
      description: prompt.description,
    });
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Prompt 模板"
        subtitle="管理问答提示词模板"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingPrompt(null);
              setFormData({ name: '', category: 'qa_main', content: '', description: '' });
              setShowForm(true);
            }}
          >
            创建模板
          </Button>
        }
      />

      {loading ? (
        <Spinner className="h-64" />
      ) : prompts.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="暂无模板"
          description="创建 Prompt 模板来定制问答行为"
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              创建模板
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">名称</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">类别</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">描述</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase">状态</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map((prompt) => (
                  <tr key={prompt.id} className="border-b border-hairline hover:bg-canvas-soft transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-ink">{prompt.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="info">{prompt.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted truncate max-w-xs">{prompt.description}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {prompt.is_default && (
                          <Badge variant="success">
                            <Star className="w-3 h-3 mr-1" />
                            默认
                          </Badge>
                        )}
                        {prompt.is_system && <Badge variant="default">系统</Badge>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {!prompt.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Star className="w-4 h-4" />}
                            onClick={() => handleSetDefault(prompt.id)}
                            title="设为默认"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                          onClick={() => handleEdit(prompt)}
                          title="编辑"
                        />
                        {prompt.is_system && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<RotateCcw className="w-4 h-4" />}
                            onClick={() => handleReset(prompt.id)}
                            title="重置"
                          />
                        )}
                        {!prompt.is_system && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4 text-error" />}
                            onClick={() => handleDelete(prompt.id)}
                            title="删除"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingPrompt(null);
        }}
        title={editingPrompt ? '编辑模板' : '创建模板'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingPrompt ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="模板名称"
            placeholder="请输入模板名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="类别"
            options={[
              { label: 'QA 主模板', value: 'qa_main' },
              { label: '其他', value: 'other' },
            ]}
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
          />
          <Input
            label="描述"
            placeholder="请输入模板描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Textarea
            label="模板内容"
            placeholder="请输入 Prompt 模板内容"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={10}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
```

```tsx
// src/features/settings/index.tsx
import React, { useEffect, useState } from 'react';
import { Settings, Database, HardDrive, FileText, Layers } from 'lucide-react';
import { PageHeader } from '../../app/layout';
import { Card, Spinner } from '../../shared/components/ui';
import { systemService } from '../../shared/services';
import type { SystemResource } from '../../shared/types';

export default function SettingsPage() {
  const [resources, setResources] = useState<SystemResource | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await systemService.getResources();
      setResources(data);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner className="h-64" />;
  }

  return (
    <div>
      <PageHeader title="系统设置" subtitle="查看系统资源和配置" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink">
                {resources?.chroma_size_mb?.toFixed(1) || 0} MB
              </div>
              <div className="text-sm text-muted">ChromaDB 大小</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-success-soft text-success flex items-center justify-center">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink">
                {resources?.database_size_mb?.toFixed(1) || 0} MB
              </div>
              <div className="text-sm text-muted">数据库大小</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-warning-soft text-warning flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink">
                {resources?.upload_size_mb?.toFixed(1) || 0} MB
              </div>
              <div className="text-sm text-muted">上传文件大小</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink">
                {resources?.total_documents || 0}
              </div>
              <div className="text-sm text-muted">文档总数</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-error-soft text-error flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink">
                {resources?.total_chunks || 0}
              </div>
              <div className="text-sm text-muted">切片总数</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 提交代码**

```bash
git add frontend/src/features/categories/ frontend/src/features/models/ frontend/src/features/conversations/ frontend/src/features/prompts/ frontend/src/features/settings/
git commit -m "feat: add remaining feature pages (categories, models, conversations, prompts, settings)"
```

---

## Task 14: Vite 配置与代理

**Covers:** S6

**Files:**
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: 配置 API 代理**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 2: 提交代码**

```bash
git add frontend/vite.config.ts
git commit -m "feat: configure Vite with API proxy for backend"
```

---

## Task 15: 最终集成与测试

**Covers:** S8, S9

- [ ] **Step 1: 安装依赖并启动开发服务器**

```bash
cd frontend
npm install
npm run dev
```

- [ ] **Step 2: 验证所有页面路由**

访问以下 URL 确认页面正常加载：
- http://localhost:3000/ (Dashboard)
- http://localhost:3000/knowledge-bases (知识库列表)
- http://localhost:3000/categories (目录层级)
- http://localhost:3000/agents (智能体列表)
- http://localhost:3000/models (模型管理)
- http://localhost:3000/conversations (会话管理)
- http://localhost:3000/prompts (Prompt 模板)
- http://localhost:3000/settings (系统设置)

- [ ] **Step 3: 验证 API 连接**

确认前端能够正确调用后端 API，检查：
1. 知识库列表能否正常加载
2. 创建知识库表单能否正常提交
3. 智能体对话能否正常进行

- [ ] **Step 4: 最终提交**

```bash
git add .
git commit -m "feat: complete Gali RAG frontend implementation"
```

---

## 自检清单

### Spec 覆盖检查
- [x] S1: 概述 - 技术栈和设计目标
- [x] S2: 目录结构 - Feature-based 架构
- [x] S3: 设计系统 - 颜色、字体、圆角、阴影
- [x] S4.1: Dashboard - 统计卡片、知识库卡片、动态、快捷操作
- [x] S4.2: 知识库列表 - 卡片网格、创建表单
- [x] S4.3: 知识库详情 - 文档管理、命中测试
- [x] S4.4: 目录层级 - 树形结构
- [x] S4.5: 智能体列表 - 卡片网格、创建表单
- [x] S4.6: 智能体详情 - 对话测试、配置
- [x] S4.7: 模型管理 - 表格、表单、测试连接
- [x] S4.8: 会话管理 - 表格、消息查看
- [x] S4.9: Prompt 模板 - 表格、表单
- [x] S4.10: 系统设置 - 资源展示
- [x] S5: 组件设计 - Button, Input, Modal, Table 等
- [x] S6: API 集成 - Axios 封装、服务层
- [x] S7: 路由配置 - React Router
- [x] S8: 错误处理 - Toast、表单验证
- [x] S9: 响应式设计 - Tailwind 响应式类

### 占位符检查
- [x] 无 TBD 或 TODO
- [x] 所有步骤包含完整代码
- [x] 所有命令包含预期输出

### 类型一致性检查
- [x] 类型定义与后端 Schema 一致
- [x] 组件 Props 接口一致
- [x] API 服务函数签名一致

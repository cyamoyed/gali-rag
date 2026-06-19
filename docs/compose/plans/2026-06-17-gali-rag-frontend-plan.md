# Gali RAG 前端工程实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 Gali RAG 知识库系统的完整前端界面，包含对话问答、知识库管理、智能体管理、模型管理和系统设置五大功能模块。

**Architecture:** 单页应用（SPA），使用 React Router 路由，Semi Design 组件库，axios 封装 API 请求，SSE 实现流式对话。

**Tech Stack:** React 18, TypeScript, Vite, Semi Design, React Router, axios

---

## 项目结构

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   ├── client.ts
│   │   ├── knowledgeBase.ts
│   │   ├── agent.ts
│   │   ├── chat.ts
│   │   ├── model.ts
│   │   ├── category.ts
│   │   └── system.ts
│   ├── components/
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
│   ├── pages/
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
│   ├── hooks/
│   │   ├── useChat.ts
│   │   └── useSSE.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── index.ts
└── public/
```

---

### Task 1: 项目初始化

**Covers:** S1

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`

- [ ] **Step 1: 初始化 Vite 项目**

```bash
cd /Users/fupeijun/Projects/gali-rag-2
npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: 安装依赖**

```bash
cd frontend
npm install @douyinfe/semi-ui @douyinfe/semi-icons react-router-dom axios
npm install -D @types/node
```

- [ ] **Step 3: 配置 vite.config.ts**

```typescript
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

- [ ] **Step 4: 配置 tsconfig.json**

在 `tsconfig.json` 中添加路径别名：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 5: 创建基础 App.tsx**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 6: 验证项目启动**

```bash
npm run dev
```

Expected: 项目在 http://localhost:3000 启动成功

---

### Task 2: TypeScript 类型定义

**Covers:** S1

**Files:**
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: 定义所有 API 类型**

```typescript
// 知识库
export interface KnowledgeBase {
  id: number
  name: string
  description: string
  category_id: number | null
  kb_type: 'general' | 'web'
  embedding_model_id: number | null
  web_config: string
  chunk_size: number
  chunk_overlap: number
  semantic_chunk_enabled: boolean
  llm_chunk_enabled: boolean
  chroma_collection: string
  document_count: number
  created_at: string | null
  updated_at: string | null
}

// 文档
export interface Document {
  id: number
  kb_id: number
  filename: string
  file_type: string
  file_size: number
  chunk_count: number
  status: string
  summary: string
  error_message: string
  created_at: string | null
  updated_at: string | null
}

// 目录层级
export interface Category {
  id: number
  name: string
  parent_id: number | null
  description: string
  sort_order: number
  created_at: string | null
}

export interface CategoryTree extends Category {
  children: CategoryTree[]
  kb_count: number
}

// 智能体
export interface Agent {
  id: number
  name: string
  description: string
  avatar: string
  llm_model_id: number | null
  system_prompt: string
  opening_message: string
  suggested_questions: string
  temperature: number
  max_tokens: number
  top_k: number
  similarity_threshold: number
  api_key: string
  status: string
  knowledge_base_ids: number[]
  created_at: string | null
  updated_at: string | null
}

// AI 模型
export interface AIModel {
  id: number
  name: string
  provider: string
  model_type: 'llm' | 'embedding' | 'reranking' | 'speech' | 'vision'
  model_name: string
  api_key: string
  base_url: string
  config: string
  is_builtin: boolean
  is_default: boolean
  status: string
  created_at: string | null
  updated_at: string | null
}

// 会话
export interface Conversation {
  id: number
  agent_id: number | null
  kb_id: number | null
  title: string
  message_count: number
  created_at: string | null
  updated_at: string | null
}

// 消息
export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant'
  content: string
  cited_sources: string
  conflict_info: string
  latency_ms: number
  created_at: string | null
}

// 引用来源
export interface CitedSource {
  chunk_id: number
  doc_id: number
  doc_name: string
  content: string
  score: number
}

// 冲突信息
export interface ConflictInfo {
  has_conflict: boolean
  description: string
  involved_chunks: number[]
}

// Prompt 模板
export interface Prompt {
  id: number
  name: string
  category: string
  content: string
  description: string
  is_system: boolean
  is_default: boolean
  created_at: string | null
  updated_at: string | null
}

// 系统资源
export interface SystemResource {
  chroma_size_mb: number
  database_size_mb: number
  upload_size_mb: number
  total_documents: number
  total_chunks: number
}

// LLM 配置
export interface LLMConfig {
  provider: string
  api_key: string
  base_url: string
  model: string
  temperature: number
  max_context_tokens: number
}

// 检索配置
export interface RetrievalConfig {
  top_k: number
  bm25_top_n: number
  vector_top_n: number
  similarity_threshold: number
}
```

- [ ] **Step 2: 验证类型定义**

```bash
npx tsc --noEmit
```

Expected: 无类型错误

---

### Task 3: API 客户端层

**Covers:** S1

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/knowledgeBase.ts`
- Create: `frontend/src/api/category.ts`
- Create: `frontend/src/api/agent.ts`
- Create: `frontend/src/api/chat.ts`
- Create: `frontend/src/api/model.ts`
- Create: `frontend/src/api/system.ts`

- [ ] **Step 1: 创建 axios 实例**

```typescript
// frontend/src/api/client.ts
import axios from 'axios'

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export default client
```

- [ ] **Step 2: 创建知识库 API**

```typescript
// frontend/src/api/knowledgeBase.ts
import client from './client'
import type { KnowledgeBase, Document } from '@/types'

export const knowledgeBaseApi = {
  list: (categoryId?: number) =>
    client.get<any, KnowledgeBase[]>('/knowledge-bases', { params: { category_id: categoryId } }),

  get: (id: number) =>
    client.get<any, KnowledgeBase>(`/knowledge-bases/${id}`),

  create: (data: Partial<KnowledgeBase>) =>
    client.post<any, KnowledgeBase>('/knowledge-bases', data),

  update: (id: number, data: Partial<KnowledgeBase>) =>
    client.put<any, KnowledgeBase>(`/knowledge-bases/${id}`, data),

  delete: (id: number) =>
    client.delete(`/knowledge-bases/${id}`),

  uploadDocuments: (id: number, files: File[]) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return client.post(`/knowledge-bases/${id}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  listDocuments: (id: number) =>
    client.get<any, Document[]>(`/knowledge-bases/${id}/documents`),

  deleteDocument: (docId: number) =>
    client.delete(`/documents/${docId}`),

  reprocessDocument: (docId: number) =>
    client.post(`/documents/${docId}/reprocess`),

  updateChunkConfig: (id: number, config: any) =>
    client.put(`/knowledge-bases/${id}/chunk-config`, config),

  cleanVectors: (id: number) =>
    client.post(`/knowledge-bases/${id}/clean-vectors`),

  clearVectors: (id: number) =>
    client.post(`/knowledge-bases/${id}/clear-vectors`),
}
```

- [ ] **Step 3: 创建目录层级 API**

```typescript
// frontend/src/api/category.ts
import client from './client'
import type { Category, CategoryTree } from '@/types'

export const categoryApi = {
  list: (parentId?: number) =>
    client.get<any, Category[]>('/categories', { params: { parent_id: parentId } }),

  getTree: () =>
    client.get<any, CategoryTree[]>('/categories/tree'),

  get: (id: number) =>
    client.get<any, Category>(`/categories/${id}`),

  create: (data: Partial<Category>) =>
    client.post<any, Category>('/categories', data),

  update: (id: number, data: Partial<Category>) =>
    client.put<any, Category>(`/categories/${id}`, data),

  delete: (id: number) =>
    client.delete(`/categories/${id}`),
}
```

- [ ] **Step 4: 创建智能体 API**

```typescript
// frontend/src/api/agent.ts
import client from './client'
import type { Agent, Conversation } from '@/types'

export const agentApi = {
  list: (status?: string) =>
    client.get<any, Agent[]>('/agents', { params: { status } }),

  get: (id: number) =>
    client.get<any, Agent>(`/agents/${id}`),

  create: (data: Partial<Agent>) =>
    client.post<any, Agent>('/agents', data),

  update: (id: number, data: Partial<Agent>) =>
    client.put<any, Agent>(`/agents/${id}`, data),

  delete: (id: number) =>
    client.delete(`/agents/${id}`),

  publish: (id: number) =>
    client.post(`/agents/${id}/publish`),

  unpublish: (id: number) =>
    client.post(`/agents/${id}/unpublish`),

  regenerateKey: (id: number) =>
    client.post(`/agents/${id}/regenerate-key`),

  listConversations: (id: number) =>
    client.get<any, Conversation[]>(`/agents/${id}/conversations`),
}
```

- [ ] **Step 5: 创建对话 API**

```typescript
// frontend/src/api/chat.ts
import client from './client'
import type { Conversation, Message } from '@/types'

export const chatApi = {
  createConversation: (agentId: number, title?: string) =>
    client.post<any, Conversation>('/conversations', null, {
      params: { agent_id: agentId, title: title || '新对话' },
    }),

  listConversations: (agentId?: number) =>
    client.get<any, Conversation[]>('/conversations', { params: { agent_id: agentId } }),

  getMessages: (convId: number) =>
    client.get<any, Message[]>(`/conversations/${convId}/messages`),

  deleteConversation: (convId: number) =>
    client.delete(`/conversations/${convId}`),

  exportConversation: (convId: number) =>
    client.get(`/conversations/${convId}/export`),
}
```

- [ ] **Step 6: 创建模型 API**

```typescript
// frontend/src/api/model.ts
import client from './client'
import type { AIModel } from '@/types'

export const modelApi = {
  list: (modelType?: string) =>
    client.get<any, AIModel[]>('/models', { params: { model_type: modelType } }),

  get: (id: number) =>
    client.get<any, AIModel>(`/models/${id}`),

  create: (data: Partial<AIModel>) =>
    client.post<any, AIModel>('/models', data),

  update: (id: number, data: Partial<AIModel>) =>
    client.put<any, AIModel>(`/models/${id}`, data),

  delete: (id: number) =>
    client.delete(`/models/${id}`),

  setDefault: (id: number) =>
    client.post(`/models/${id}/set-default`),

  testConnection: (id: number) =>
    client.post(`/models/${id}/test`),
}
```

- [ ] **Step 7: 创建系统 API**

```typescript
// frontend/src/api/system.ts
import client from './client'
import type { LLMConfig, RetrievalConfig, SystemResource } from '@/types'

export const systemApi = {
  getLLMConfig: () =>
    client.get<any, { data: LLMConfig }>('/config/llm'),

  updateLLMConfig: (config: LLMConfig) =>
    client.put('/config/llm', config),

  getRetrievalConfig: () =>
    client.get<any, { data: RetrievalConfig }>('/config/retrieval'),

  updateRetrievalConfig: (config: RetrievalConfig) =>
    client.put('/config/retrieval', config),

  getResources: () =>
    client.get<any, SystemResource>('/resources'),
}
```

- [ ] **Step 8: 验证 API 层**

```bash
npx tsc --noEmit
```

Expected: 无类型错误

---

### Task 4: 布局组件

**Covers:** S2, S4

**Files:**
- Create: `frontend/src/components/Layout/Sidebar.tsx`
- Create: `frontend/src/components/Layout/Header.tsx`
- Create: `frontend/src/components/Layout/index.tsx`

- [ ] **Step 1: 创建 Sidebar 组件**

```tsx
// frontend/src/components/Layout/Sidebar.tsx
import { useNavigate, useLocation } from 'react-router-dom'
import { Nav } from '@douyinfe/semi-ui'
import { IconComment, IconFolder, IconSetting, IconServer } from '@douyinfe/semi-icons'

const menuItems = [
  { itemKey: '/chat', text: '对话问答', icon: <IconComment /> },
  { itemKey: '/knowledge-bases', text: '知识库', icon: <IconFolder /> },
  { itemKey: '/agents', text: '智能体', icon: <IconSetting /> },
  { itemKey: '/models', text: '模型管理', icon: <IconServer /> },
  { itemKey: '/settings', text: '系统设置', icon: <IconSetting /> },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = menuItems.find(item =>
    location.pathname.startsWith(item.itemKey)
  )?.itemKey || '/chat'

  return (
    <Nav
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={({ itemKey }) => navigate(itemKey as string)}
      header={{
        logo: <div style={{ width: 32, height: 32, background: '#0070f3', borderRadius: 8 }} />,
        text: 'Gali RAG',
      }}
      style={{ height: '100%' }}
    />
  )
}
```

- [ ] **Step 2: 创建 Header 组件**

```tsx
// frontend/src/components/Layout/Header.tsx
import { Layout } from '@douyinfe/semi-ui'

export default function Header() {
  return (
    <Layout.Header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 24px',
      background: '#fff',
      borderBottom: '1px solid #ebebeb',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>管理员</span>
      </div>
    </Layout.Header>
  )
}
```

- [ ] **Step 3: 创建 Layout 组件**

```tsx
// frontend/src/components/Layout/index.tsx
import { Layout } from '@douyinfe/semi-ui'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout() {
  return (
    <Layout style={{ height: '100vh' }}>
      <Layout.Sider style={{ width: 220, background: '#fff' }}>
        <Sidebar />
      </Layout.Sider>
      <Layout>
        <Header />
        <Layout.Content style={{ padding: 24, background: '#fafafa', overflow: 'auto' }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
```

- [ ] **Step 4: 验证布局**

在 App.tsx 中使用布局，启动项目验证显示正常。

---

### Task 5: 对话问答页

**Covers:** S3.1

**Files:**
- Create: `frontend/src/pages/Chat/index.tsx`
- Create: `frontend/src/components/Chat/ChatWindow.tsx`
- Create: `frontend/src/components/Chat/MessageBubble.tsx`
- Create: `frontend/src/components/Chat/SourceCard.tsx`
- Create: `frontend/src/hooks/useSSE.ts`

- [ ] **Step 1: 创建 SSE Hook**

```typescript
// frontend/src/hooks/useSSE.ts
import { useState, useCallback, useRef } from 'react'

interface SSEOptions {
  onToken?: (token: string) => void
  onSources?: (sources: any[]) => void
  onConflict?: (conflict: any) => void
  onLatency?: (latency: number) => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export function useSSE() {
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const stream = useCallback((url: string, body: any, options: SSEOptions) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setIsStreaming(true)

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortRef.current.signal,
    }).then(async (response) => {
      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            switch (data.type) {
              case 'token':
                options.onToken?.(data.content)
                break
              case 'sources':
                options.onSources?.(data.cited_sources)
                break
              case 'conflict':
                options.onConflict?.(data.conflict_info)
                break
              case 'latency':
                options.onLatency?.(data.latency_ms)
                break
              case 'end':
                options.onEnd?.()
                break
              case 'error':
                options.onError?.(data.content)
                break
            }
          } catch {}
        }
      }
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        options.onError?.(err.message)
      }
    }).finally(() => {
      setIsStreaming(false)
    })
  }, [])

  const abort = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return { stream, abort, isStreaming }
}
```

- [ ] **Step 2: 创建 MessageBubble 组件**

```tsx
// frontend/src/components/Chat/MessageBubble.tsx
import { Tag } from '@douyinfe/semi-ui'

interface Props {
  role: 'user' | 'assistant'
  content: string
  sources?: any[]
  latency?: number
}

export default function MessageBubble({ role, content, sources, latency }: Props) {
  const isUser = role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16,
    }}>
      <div style={{
        maxWidth: '70%',
        padding: '12px 16px',
        borderRadius: 12,
        background: isUser ? '#0070f3' : '#fff',
        color: isUser ? '#fff' : '#171717',
        border: isUser ? 'none' : '1px solid #ebebeb',
      }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
        {!isUser && latency && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
            响应时间: {latency}ms
          </div>
        )}
        {!isUser && sources && sources.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Tag size="small">引用 {sources.length} 个片段</Tag>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 创建 SourceCard 组件**

```tsx
// frontend/src/components/Chat/SourceCard.tsx
import { Card, Tag } from '@douyinfe/semi-ui'

interface Props {
  source: {
    doc_name: string
    content: string
    score: number
  }
}

export default function SourceCard({ source }: Props) {
  return (
    <Card style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 500, fontSize: 13 }}>{source.doc_name}</span>
        <Tag size="small" color="blue">{(source.score * 100).toFixed(1)}%</Tag>
      </div>
      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
        {source.content.slice(0, 200)}...
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: 创建 ChatWindow 组件**

```tsx
// frontend/src/components/Chat/ChatWindow.tsx
import { useState, useRef, useEffect } from 'react'
import { Input, Button, Spin } from '@douyinfe/semi-ui'
import { IconSend } from '@douyinfe/semi-icons'
import MessageBubble from './MessageBubble'
import SourceCard from './SourceCard'
import { useSSE } from '@/hooks/useSSE'

interface Props {
  agentId: number
  conversationId?: number
}

export default function ChatWindow({ agentId, conversationId }: Props) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sources, setSources] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { stream, isStreaming } = useSSE()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    let assistantContent = ''
    const assistantMessage = { role: 'assistant', content: '', sources: [], latency: 0 }
    setMessages(prev => [...prev, assistantMessage])

    stream(`/api/v1/agents/${agentId}/chat`, {
      query: input,
      conversation_id: conversationId,
      stream: true,
    }, {
      onToken: (token) => {
        assistantContent += token
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: assistantContent,
          }
          return newMessages
        })
      },
      onSources: (src) => {
        setSources(src)
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            sources: src,
          }
          return newMessages
        })
      },
      onLatency: (latency) => {
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            latency,
          }
          return newMessages
        })
      },
    })
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} {...msg} />
          ))}
          {isStreaming && <Spin size="small" />}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ padding: 16, borderTop: '1px solid #ebebeb', background: '#fff' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              value={input}
              onChange={setInput}
              placeholder="输入问题..."
              onPressEnter={handleSend}
              disabled={isStreaming}
            />
            <Button
              type="primary"
              icon={<IconSend />}
              onClick={handleSend}
              loading={isStreaming}
            />
          </div>
        </div>
      </div>
      {sources.length > 0 && (
        <div style={{ width: 300, borderLeft: '1px solid #ebebeb', padding: 16, overflow: 'auto' }}>
          <h4 style={{ marginBottom: 12 }}>引用来源</h4>
          {sources.map((src, i) => (
            <SourceCard key={i} source={src} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: 创建对话问答页面**

```tsx
// frontend/src/pages/Chat/index.tsx
import { useState, useEffect } from 'react'
import { Select, List, Button, Empty } from '@douyinfe/semi-ui'
import { IconPlus } from '@douyinfe/semi-icons'
import ChatWindow from '@/components/Chat/ChatWindow'
import { agentApi } from '@/api/agent'
import { chatApi } from '@/api/chat'
import type { Agent, Conversation } from '@/types'

export default function ChatPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<number | undefined>()

  useEffect(() => {
    agentApi.list('published').then(setAgents)
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      agentApi.listConversations(selectedAgent).then(setConversations)
    }
  }, [selectedAgent])

  const handleNewConversation = async () => {
    if (!selectedAgent) return
    const conv = await chatApi.createConversation(selectedAgent)
    setConversations(prev => [conv, ...prev])
    setSelectedConv(conv.id)
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#fff', borderRadius: 8 }}>
      <div style={{ width: 280, borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #ebebeb' }}>
          <Select
            placeholder="选择智能体"
            value={selectedAgent}
            onChange={setSelectedAgent}
            style={{ width: '100%' }}
            optionList={agents.map(a => ({ label: a.name, value: a.id }))}
          />
        </div>
        <div style={{ padding: 8 }}>
          <Button
            icon={<IconPlus />}
            block
            onClick={handleNewConversation}
            disabled={!selectedAgent}
          >
            新建对话
          </Button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <List
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: selectedConv === conv.id ? '#f0f7ff' : 'transparent',
                }}
                onClick={() => setSelectedConv(conv.id)}
              >
                <div style={{ fontSize: 14 }}>{conv.title}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  {conv.message_count} 条消息
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {selectedAgent ? (
          <ChatWindow agentId={selectedAgent} conversationId={selectedConv} />
        ) : (
          <Empty description="请选择一个智能体开始对话" style={{ marginTop: 200 }} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: 验证对话功能**

启动项目，选择智能体，发送消息，验证流式输出正常。

---

### Task 6: 知识库列表页

**Covers:** S3.2

**Files:**
- Create: `frontend/src/pages/KnowledgeBase/List.tsx`
- Create: `frontend/src/components/FileTree/FolderTree.tsx`

- [ ] **Step 1: 创建 FolderTree 组件**

```tsx
// frontend/src/components/FileTree/FolderTree.tsx
import { useState, useEffect } from 'react'
import { Tree, Button, Modal, Form, Input } from '@douyinfe/semi-ui'
import { IconFolder, IconPlus } from '@douyinfe/semi-icons'
import { categoryApi } from '@/api/category'
import type { CategoryTree } from '@/types'

interface Props {
  selectedId: number | null
  onSelect: (id: number | null) => void
}

export default function FolderTree({ selectedId, onSelect }: Props) {
  const [tree, setTree] = useState<CategoryTree[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form] = Form.useForm()

  const loadTree = () => {
    categoryApi.getTree().then(setTree)
  }

  useEffect(loadTree, [])

  const convertToTreeData = (nodes: CategoryTree[]): any[] =>
    nodes.map(node => ({
      key: node.id,
      label: node.name,
      icon: <IconFolder />,
      children: node.children ? convertToTreeData(node.children) : [],
    }))

  const handleCreate = async (values: any) => {
    await categoryApi.create({
      name: values.name,
      parent_id: selectedId,
    })
    setShowModal(false)
    form.reset()
    loadTree()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
        <span style={{ fontWeight: 500 }}>文件夹</span>
        <Button
          size="small"
          icon={<IconPlus />}
          onClick={() => setShowModal(true)}
        />
      </div>
      <Tree
        treeData={[{ key: 0, label: '全部', children: convertToTreeData(tree) }]}
        selectedKeys={selectedId ? [selectedId] : [0]}
        onSelect={({ selectedKeys }) => onSelect(selectedKeys[0] as number || null)}
      />
      <Modal
        title="新建文件夹"
        visible={showModal}
        onCancel={() => setShowModal(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onSubmit={handleCreate}>
          <Form.Field name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="请输入文件夹名称" />
          </Form.Field>
        </Form>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: 创建知识库列表页面**

```tsx
// frontend/src/pages/KnowledgeBase/List.tsx
import { useState, useEffect } from 'react'
import { Card, Button, Modal, Form, Input, Select, Tag, Empty } from '@douyinfe/semi-ui'
import { IconPlus, IconSearch } from '@douyinfe/semi-icons'
import { useNavigate } from 'react-router-dom'
import FolderTree from '@/components/FileTree/FolderTree'
import { knowledgeBaseApi } from '@/api/knowledgeBase'
import { modelApi } from '@/api/model'
import type { KnowledgeBase, AIModel } from '@/types'

export default function KnowledgeBaseList() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [embeddingModels, setEmbeddingModels] = useState<AIModel[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form] = Form.useForm()

  const loadKBs = () => {
    knowledgeBaseApi.list(selectedCategory || undefined).then(setKnowledgeBases)
  }

  useEffect(loadKBs, [selectedCategory])

  useEffect(() => {
    modelApi.list('embedding').then(setEmbeddingModels)
  }, [])

  const handleCreate = async (values: any) => {
    await knowledgeBaseApi.create({
      ...values,
      category_id: selectedCategory,
    })
    setShowModal(false)
    form.reset()
    loadKBs()
  }

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ width: 240, background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #ebebeb' }}>
        <FolderTree selectedId={selectedCategory} onSelect={setSelectedCategory} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Input prefix={<IconSearch />} placeholder="搜索知识库..." style={{ width: 300 }} />
          <Button type="primary" icon={<IconPlus />} onClick={() => setShowModal(true)}>
            新建知识库
          </Button>
        </div>
        {knowledgeBases.length === 0 ? (
          <Empty description="暂无知识库" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {knowledgeBases.map(kb => (
              <Card
                key={kb.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/knowledge-bases/${kb.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{kb.name}</span>
                  <Tag color="blue">{kb.document_count} 篇</Tag>
                </div>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
                  {kb.description || '暂无描述'}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {kb.chunk_size} 字/切片 · {kb.chunk_overlap} 字重叠
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Modal
        title="新建知识库"
        visible={showModal}
        onCancel={() => setShowModal(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onSubmit={handleCreate}>
          <Form.Field name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="请输入知识库名称" />
          </Form.Field>
          <Form.Field name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" />
          </Form.Field>
          <Form.Field name="embedding_model_id" label="Embedding 模型">
            <Select
              placeholder="选择模型"
              optionList={embeddingModels.map(m => ({ label: m.name, value: m.id }))}
            />
          </Form.Field>
        </Form>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 3: 验证知识库列表**

启动项目，验证文件夹树和知识库卡片显示正常。

---

### Task 7: 知识库详情页

**Covers:** S3.3

**Files:**
- Create: `frontend/src/pages/KnowledgeBase/Detail.tsx`

- [ ] **Step 1: 创建知识库详情页面**

```tsx
// frontend/src/pages/KnowledgeBase/Detail.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Tabs, Card, Table, Button, Upload, Form, InputNumber, Switch, Input, Tag } from '@douyinfe/semi-ui'
import { IconUpload, IconDelete, IconRefresh } from '@douyinfe/semi-icons'
import { knowledgeBaseApi } from '@/api/knowledgeBase'
import type { KnowledgeBase, Document } from '@/types'

export default function KnowledgeBaseDetail() {
  const { id } = useParams<{ id: string }>()
  const kbId = Number(id)
  const [kb, setKB] = useState<KnowledgeBase | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeTab, setActiveTab] = useState('documents')

  useEffect(() => {
    knowledgeBaseApi.get(kbId).then(setKB)
    knowledgeBaseApi.listDocuments(kbId).then(setDocuments)
  }, [kbId])

  const handleUpload = async (files: File[]) => {
    await knowledgeBaseApi.uploadDocuments(kbId, files)
    knowledgeBaseApi.listDocuments(kbId).then(setDocuments)
  }

  const handleDeleteDoc = async (docId: number) => {
    await knowledgeBaseApi.deleteDocument(docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  const handleReprocess = async (docId: number) => {
    await knowledgeBaseApi.reprocessDocument(docId)
    knowledgeBaseApi.listDocuments(kbId).then(setDocuments)
  }

  const docColumns = [
    { title: '文件名', dataIndex: 'filename' },
    { title: '类型', dataIndex: 'file_type' },
    { title: '切片数', dataIndex: 'chunk_count' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'blue'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '操作',
      render: (_: any, record: Document) => (
        <>
          <Button size="small" icon={<IconRefresh />} onClick={() => handleReprocess(record.id)}>
            重新处理
          </Button>
          <Button size="small" type="danger" icon={<IconDelete />} onClick={() => handleDeleteDoc(record.id)}>
            删除
          </Button>
        </>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2>{kb?.name}</h2>
        <p style={{ color: '#666' }}>{kb?.description}</p>
      </Card>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="文档管理" itemKey="documents">
            <Upload action="" accept=".pdf,.doc,.docx,.txt,.md" showUploadList={false}>
              <Button icon={<IconUpload />}>上传文档</Button>
            </Upload>
            <Table columns={docColumns} dataSource={documents} style={{ marginTop: 16 }} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="切片配置" itemKey="chunk">
            <Form style={{ maxWidth: 400 }}>
              <Form.Field name="chunk_size" label="切片大小">
                <InputNumber min={100} max={2000} />
              </Form.Field>
              <Form.Field name="chunk_overlap" label="重叠字数">
                <InputNumber min={0} max={500} />
              </Form.Field>
              <Form.Field name="semantic_chunk_enabled" label="语义切片">
                <Switch />
              </Form.Field>
              <Form.Field name="llm_chunk_enabled" label="LLM 切片">
                <Switch />
              </Form.Field>
              <Button type="primary">保存配置</Button>
            </Form>
          </Tabs.TabPane>
          <Tabs.TabPane tab="命中测试" itemKey="test">
            <p>命中测试功能请使用「对话问答」页面</p>
          </Tabs.TabPane>
          <Tabs.TabPane tab="基础设置" itemKey="settings">
            <Form style={{ maxWidth: 400 }}>
              <Form.Field name="name" label="名称">
                <Input />
              </Form.Field>
              <Form.Field name="description" label="描述">
                <Input.TextArea />
              </Form.Field>
              <Button type="primary">保存设置</Button>
            </Form>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: 验证知识库详情**

点击知识库卡片，验证详情页显示和标签页切换正常。

---

### Task 8: 智能体列表页

**Covers:** S3.4

**Files:**
- Create: `frontend/src/pages/Agent/List.tsx`

- [ ] **Step 1: 创建智能体列表页面**

```tsx
// frontend/src/pages/Agent/List.tsx
import { useState, useEffect } from 'react'
import { Card, Button, Modal, Form, Input, Select, Tag } from '@douyinfe/semi-ui'
import { IconPlus } from '@douyinfe/semi-icons'
import { useNavigate } from 'react-router-dom'
import { agentApi } from '@/api/agent'
import { modelApi } from '@/api/model'
import { knowledgeBaseApi } from '@/api/knowledgeBase'
import type { Agent, AIModel, KnowledgeBase } from '@/types'

export default function AgentList() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [kbs, setKBs] = useState<KnowledgeBase[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    agentApi.list().then(setAgents)
    modelApi.list('llm').then(setModels)
    knowledgeBaseApi.list().then(setKBs)
  }, [])

  const handleCreate = async (values: any) => {
    await agentApi.create(values)
    setShowModal(false)
    form.reset()
    agentApi.list().then(setAgents)
  }

  const handlePublish = async (agentId: number) => {
    await agentApi.publish(agentId)
    agentApi.list().then(setAgents)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>智能体管理</h2>
        <Button type="primary" icon={<IconPlus />} onClick={() => setShowModal(true)}>
          新建智能体
        </Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {agents.map(agent => (
          <Card key={agent.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/agents/${agent.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>{agent.name}</span>
              <Tag color={agent.status === 'published' ? 'green' : 'grey'}>
                {agent.status === 'published' ? '已发布' : '草稿'}
              </Tag>
            </div>
            <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
              {agent.description || '暂无描述'}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              关联 {agent.knowledge_base_ids.length} 个知识库
            </div>
            {agent.status !== 'published' && (
              <Button size="small" type="primary" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); handlePublish(agent.id) }}>
                发布
              </Button>
            )}
          </Card>
        ))}
      </div>
      <Modal title="新建智能体" visible={showModal} onCancel={() => setShowModal(false)} onOk={() => form.submit()}>
        <Form form={form} onSubmit={handleCreate}>
          <Form.Field name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="请输入智能体名称" />
          </Form.Field>
          <Form.Field name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" />
          </Form.Field>
          <Form.Field name="llm_model_id" label="对话模型">
            <Select placeholder="选择模型" optionList={models.map(m => ({ label: m.name, value: m.id }))} />
          </Form.Field>
          <Form.Field name="knowledge_base_ids" label="关联知识库">
            <Select placeholder="选择知识库" multiple optionList={kbs.map(kb => ({ label: kb.name, value: kb.id }))} />
          </Form.Field>
        </Form>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: 验证智能体列表**

验证智能体卡片显示、新建和发布功能正常。

---

### Task 9: 智能体详情页

**Covers:** S3.5

**Files:**
- Create: `frontend/src/pages/Agent/Detail.tsx`

- [ ] **Step 1: 创建智能体详情页面**

```tsx
// frontend/src/pages/Agent/Detail.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Form, Input, Select, Slider, Button, Tag } from '@douyinfe/semi-ui'
import ChatWindow from '@/components/Chat/ChatWindow'
import { agentApi } from '@/api/agent'
import { modelApi } from '@/api/model'
import { knowledgeBaseApi } from '@/api/knowledgeBase'
import type { Agent, AIModel, KnowledgeBase } from '@/types'

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>()
  const agentId = Number(id)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [models, setModels] = useState<AIModel[]>([])
  const [kbs, setKBs] = useState<KnowledgeBase[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    agentApi.get(agentId).then(setAgent)
    modelApi.list('llm').then(setModels)
    knowledgeBaseApi.list().then(setKBs)
  }, [agentId])

  useEffect(() => {
    if (agent) {
      form.setValues(agent)
    }
  }, [agent])

  const handleSave = async (values: any) => {
    await agentApi.update(agentId, values)
    agentApi.get(agentId).then(setAgent)
  }

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="基本信息">
          <Form form={form} onSubmit={handleSave} layout="vertical">
            <Form.Field name="name" label="名称" rules={[{ required: true }]}>
              <Input />
            </Form.Field>
            <Form.Field name="description" label="描述">
              <Input.TextArea />
            </Form.Field>
            <Form.Field name="llm_model_id" label="对话模型">
              <Select optionList={models.map(m => ({ label: m.name, value: m.id }))} />
            </Form.Field>
            <Form.Field name="knowledge_base_ids" label="关联知识库">
              <Select multiple optionList={kbs.map(kb => ({ label: kb.name, value: kb.id }))} />
            </Form.Field>
            <Form.Field name="temperature" label="温度">
              <Slider min={0} max={2} step={0.1} />
            </Form.Field>
            <Form.Field name="max_tokens" label="最大 Token">
              <Input type="number" />
            </Form.Field>
            <Form.Field name="system_prompt" label="系统提示词">
              <Input.TextArea rows={4} />
            </Form.Field>
            <Form.Field name="opening_message" label="开场白">
              <Input.TextArea rows={2} />
            </Form.Field>
            <Button type="primary" htmlType="submit">保存配置</Button>
          </Form>
        </Card>
        <Card title="API 信息">
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#666' }}>状态：</span>
            <Tag color={agent?.status === 'published' ? 'green' : 'grey'}>
              {agent?.status === 'published' ? '已发布' : '草稿'}
            </Tag>
          </div>
          <div>
            <span style={{ color: '#666' }}>API Key：</span>
            <code style={{ fontSize: 12 }}>{agent?.api_key || '未发布'}</code>
          </div>
        </Card>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #ebebeb' }}>
        <ChatWindow agentId={agentId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证智能体详情**

点击智能体卡片，验证配置面板和预览对话功能正常。

---

### Task 10: 模型管理页

**Covers:** S3.6

**Files:**
- Create: `frontend/src/pages/Model/index.tsx`

- [ ] **Step 1: 创建模型管理页面**

```tsx
// frontend/src/pages/Model/index.tsx
import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag } from '@douyinfe/semi-ui'
import { IconPlus, IconDelete, IconSetting } from '@douyinfe/semi-icons'
import { modelApi } from '@/api/model'
import type { AIModel } from '@/types'

export default function ModelPage() {
  const [models, setModels] = useState<AIModel[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form] = Form.useForm()

  const loadModels = () => {
    modelApi.list().then(setModels)
  }

  useEffect(loadModels, [])

  const handleCreate = async (values: any) => {
    await modelApi.create(values)
    setShowModal(false)
    form.reset()
    loadModels()
  }

  const handleDelete = async (id: number) => {
    await modelApi.delete(id)
    loadModels()
  }

  const handleSetDefault = async (id: number) => {
    await modelApi.setDefault(id)
    loadModels()
  }

  const handleTest = async (id: number) => {
    await modelApi.testConnection(id)
  }

  const columns = [
    { title: '名称', dataIndex: 'name' },
    { title: '提供商', dataIndex: 'provider' },
    {
      title: '类型',
      dataIndex: 'model_type',
      render: (type: string) => (
        <Tag color={type === 'llm' ? 'blue' : type === 'embedding' ? 'green' : 'orange'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    { title: '模型', dataIndex: 'model_name' },
    {
      title: '状态',
      render: (_: any, record: AIModel) => (
        <>
          {record.is_default && <Tag color="blue">默认</Tag>}
          {record.is_builtin && <Tag color="grey">内置</Tag>}
        </>
      ),
    },
    {
      title: '操作',
      render: (_: any, record: AIModel) => (
        <>
          {!record.is_default && (
            <Button size="small" onClick={() => handleSetDefault(record.id)}>设为默认</Button>
          )}
          <Button size="small" onClick={() => handleTest(record.id)}>测试</Button>
          {!record.is_builtin && (
            <Button size="small" type="danger" icon={<IconDelete />} onClick={() => handleDelete(record.id)} />
          )}
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>模型管理</h2>
        <Button type="primary" icon={<IconPlus />} onClick={() => setShowModal(true)}>
          添加模型
        </Button>
      </div>
      <Table columns={columns} dataSource={models} />
      <Modal title="添加模型" visible={showModal} onCancel={() => setShowModal(false)} onOk={() => form.submit()}>
        <Form form={form} onSubmit={handleCreate}>
          <Form.Field name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="模型显示名称" />
          </Form.Field>
          <Form.Field name="provider" label="提供商" rules={[{ required: true }]}>
            <Select placeholder="选择提供商" optionList={[
              { label: 'OpenAI', value: 'openai' },
              { label: 'Ollama', value: 'ollama' },
              { label: '其他', value: 'other' },
            ]} />
          </Form.Field>
          <Form.Field name="model_type" label="类型" rules={[{ required: true }]}>
            <Select placeholder="选择类型" optionList={[
              { label: 'LLM', value: 'llm' },
              { label: 'Embedding', value: 'embedding' },
              { label: 'Reranking', value: 'reranking' },
            ]} />
          </Form.Field>
          <Form.Field name="model_name" label="模型名称" rules={[{ required: true }]}>
            <Input placeholder="如 gpt-4o, llama3" />
          </Form.Field>
          <Form.Field name="api_key" label="API Key">
            <Input.Password placeholder="API Key（可选）" />
          </Form.Field>
          <Form.Field name="base_url" label="Base URL">
            <Input placeholder="API 地址（可选）" />
          </Form.Field>
        </Form>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: 验证模型管理**

验证模型列表、添加、删除、测试连接功能正常。

---

### Task 11: 系统设置页

**Covers:** S3.7

**Files:**
- Create: `frontend/src/pages/Settings/index.tsx`

- [ ] **Step 1: 创建系统设置页面**

```tsx
// frontend/src/pages/Settings/index.tsx
import { useState, useEffect } from 'react'
import { Card, Form, Input, Select, InputNumber, Button, Descriptions } from '@douyinfe/semi-ui'
import { systemApi } from '@/api/system'
import type { LLMConfig, RetrievalConfig, SystemResource } from '@/types'

export default function SettingsPage() {
  const [llmConfig, setLLMConfig] = useState<LLMConfig | null>(null)
  const [retrievalConfig, setRetrievalConfig] = useState<RetrievalConfig | null>(null)
  const [resources, setResources] = useState<SystemResource | null>(null)
  const [llmForm] = Form.useForm()
  const [retrievalForm] = Form.useForm()

  useEffect(() => {
    systemApi.getLLMConfig().then(res => {
      setLLMConfig(res.data)
      llmForm.setValues(res.data)
    })
    systemApi.getRetrievalConfig().then(res => {
      setRetrievalConfig(res.data)
      retrievalForm.setValues(res.data)
    })
    systemApi.getResources().then(setResources)
  }, [])

  const handleSaveLLM = async (values: any) => {
    await systemApi.updateLLMConfig(values)
  }

  const handleSaveRetrieval = async (values: any) => {
    await systemApi.updateRetrievalConfig(values)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="大模型配置">
        <Form form={llmForm} onSubmit={handleSaveLLM} layout="vertical" style={{ maxWidth: 500 }}>
          <Form.Field name="provider" label="提供商">
            <Select optionList={[
              { label: 'OpenAI', value: 'openai' },
              { label: 'Ollama', value: 'ollama' },
            ]} />
          </Form.Field>
          <Form.Field name="api_key" label="API Key">
            <Input.Password />
          </Form.Field>
          <Form.Field name="base_url" label="Base URL">
            <Input />
          </Form.Field>
          <Form.Field name="model" label="模型">
            <Input />
          </Form.Field>
          <Form.Field name="temperature" label="温度">
            <InputNumber min={0} max={2} step={0.1} />
          </Form.Field>
          <Form.Field name="max_context_tokens" label="最大上下文 Token">
            <InputNumber min={1024} max={131072} />
          </Form.Field>
          <Button type="primary" htmlType="submit">保存</Button>
        </Form>
      </Card>

      <Card title="检索参数配置">
        <Form form={retrievalForm} onSubmit={handleSaveRetrieval} layout="vertical" style={{ maxWidth: 500 }}>
          <Form.Field name="top_k" label="返回片段数 (Top K)">
            <InputNumber min={1} max={50} />
          </Form.Field>
          <Form.Field name="bm25_top_n" label="BM25 检索数">
            <InputNumber min={1} max={50} />
          </Form.Field>
          <Form.Field name="vector_top_n" label="向量检索数">
            <InputNumber min={1} max={50} />
          </Form.Field>
          <Form.Field name="similarity_threshold" label="相似度阈值">
            <InputNumber min={0} max={1} step={0.1} />
          </Form.Field>
          <Button type="primary" htmlType="submit">保存</Button>
        </Form>
      </Card>

      <Card title="系统资源">
        {resources && (
          <Descriptions>
            <Descriptions.Item itemKey="向量库大小">{resources.chroma_size_mb.toFixed(2)} MB</Descriptions.Item>
            <Descriptions.Item itemKey="数据库大小">{resources.database_size_mb.toFixed(2)} MB</Descriptions.Item>
            <Descriptions.Item itemKey="上传文件大小">{resources.upload_size_mb.toFixed(2)} MB</Descriptions.Item>
            <Descriptions.Item itemKey="文档总数">{resources.total_documents}</Descriptions.Item>
            <Descriptions.Item itemKey="切片总数">{resources.total_chunks}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: 验证系统设置**

验证配置加载、保存和资源显示正常。

---

### Task 12: 路由配置

**Covers:** S1, S2

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 配置完整路由**

```tsx
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/Layout'
import ChatPage from '@/pages/Chat'
import KnowledgeBaseList from '@/pages/KnowledgeBase/List'
import KnowledgeBaseDetail from '@/pages/KnowledgeBase/Detail'
import AgentList from '@/pages/Agent/List'
import AgentDetail from '@/pages/Agent/Detail'
import ModelPage from '@/pages/Model'
import SettingsPage from '@/pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="knowledge-bases" element={<KnowledgeBaseList />} />
          <Route path="knowledge-bases/:id" element={<KnowledgeBaseDetail />} />
          <Route path="agents" element={<AgentList />} />
          <Route path="agents/:id" element={<AgentDetail />} />
          <Route path="models" element={<ModelPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 2: 验证路由**

验证所有页面路由切换正常。

---

### Task 13: 最终验证

**Covers:** S1-S7

- [ ] **Step 1: 类型检查**

```bash
cd /Users/fupeijun/Projects/gali-rag-2/frontend
npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 2: 构建验证**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 3: 功能验证**

启动后端和前端，逐一验证：
1. 对话问答：选择智能体、发送消息、流式输出
2. 知识库：文件夹树、创建知识库、上传文档
3. 智能体：创建、配置、发布、对话预览
4. 模型管理：添加、测试、设为默认
5. 系统设置：LLM配置、检索参数、资源监控

---

## 自检清单

**规格覆盖:**
- [S1] 概述 → Task 1, 2, 3, 12
- [S2] 导航结构 → Task 4, 12
- [S3.1] 对话问答页 → Task 5
- [S3.2] 知识库列表页 → Task 6
- [S3.3] 知识库详情页 → Task 7
- [S3.4] 智能体列表页 → Task 8
- [S3.5] 智能体详情页 → Task 9
- [S3.6] 模型管理页 → Task 10
- [S3.7] 系统设置页 → Task 11
- [S4] 设计规范 → Task 4
- [S5] 项目结构 → Task 1
- [S6] 错误处理 → Task 3 (API 拦截器)
- [S7] 响应式设计 → Task 4

**类型一致性:**
- 所有 API 类型定义在 `types/index.ts`
- 所有 API 函数使用统一的类型
- 组件 Props 使用正确的类型

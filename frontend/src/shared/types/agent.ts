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
  source?: 'test' | 'qa';
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
  source?: string;
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

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
  chroma_collection: string;
  document_count: number;
  chunk_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface KBCreate {
  name: string;
  description?: string;
  category_id: number | null;
  kb_type: 'general' | 'web';
  embedding_model_id: number | null;
  web_config?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  semantic_chunk_enabled?: boolean;
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
}


export interface Document {
  id: number;
  kb_id: number;
  filename: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
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
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
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

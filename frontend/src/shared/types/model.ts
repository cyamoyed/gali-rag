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
  model_type?: 'llm' | 'embedding' | 'reranking' | 'speech' | 'vision';
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
  preset_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PromptCreate {
  name: string;
  category: string;
  content: string;
  description?: string;
  is_default?: boolean;
  preset_id?: number;
}

export interface PromptUpdate {
  name?: string;
  content?: string;
  description?: string;
  is_default?: boolean;
}

export interface PromptPreset {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  is_active: boolean;
  templates: PromptTemplate[];
  created_at: string | null;
  updated_at: string | null;
}

export interface PresetBrief {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PresetTemplateItem {
  name: string;
  category: string;
  content: string;
  description?: string;
}

export interface PresetCreate {
  name: string;
  description?: string;
  templates: PresetTemplateItem[];
}

export interface SystemResource {
  chroma_size_mb: number;
  database_size_mb: number;
  upload_size_mb: number;
  total_documents: number;
  total_chunks: number;
}

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


# ==================== AI Model ====================

class AIModelCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    provider: str = Field(..., min_length=1, max_length=64)
    model_type: str = Field(..., pattern="^(llm|embedding|reranking|speech|vision)$")
    model_name: str = Field(..., min_length=1, max_length=128)
    api_key: str = ""
    base_url: str = ""
    config: str = "{}"


class AIModelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    provider: Optional[str] = None
    model_type: Optional[str] = Field(None, pattern="^(llm|embedding|reranking|speech|vision)$")
    model_name: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    config: Optional[str] = None
    status: Optional[str] = None


class AIModelResponse(BaseModel):
    id: int
    name: str
    provider: str
    model_type: str
    model_name: str
    api_key: str = ""
    base_url: str
    config: str
    is_builtin: bool
    is_default: bool
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== Knowledge Base Category ====================

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    parent_id: Optional[int] = None
    description: str = ""
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    parent_id: Optional[int] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]
    description: str
    sort_order: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CategoryTreeResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]
    description: str
    sort_order: int
    children: List["CategoryTreeResponse"] = []
    kb_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ==================== Knowledge Base ====================

class KBCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    description: str = ""
    category_id: Optional[int] = None
    kb_type: str = Field(default="general", pattern="^(general|web)$")
    embedding_model_id: Optional[int] = None
    web_config: str = "{}"
    chunk_size: int = Field(default=500, ge=100, le=2000)
    chunk_overlap: int = Field(default=100, ge=0, le=500)
    semantic_chunk_enabled: bool = False


class KBUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    description: Optional[str] = None
    category_id: Optional[int] = None
    embedding_model_id: Optional[int] = None
    web_config: Optional[str] = None
    chunk_size: Optional[int] = Field(None, ge=100, le=2000)
    chunk_overlap: Optional[int] = Field(None, ge=0, le=500)
    semantic_chunk_enabled: Optional[bool] = None


class KBResponse(BaseModel):
    id: int
    name: str
    description: str
    category_id: Optional[int] = None
    kb_type: str = "general"
    embedding_model_id: Optional[int] = None
    web_config: str = "{}"
    chunk_size: int
    chunk_overlap: int
    semantic_chunk_enabled: bool
    chroma_collection: str
    document_count: int = 0
    chunk_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(BaseModel):
    id: int
    kb_id: int
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    status: str
    summary: str
    error_message: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ChunkConfig(BaseModel):
    chunk_size: int = Field(default=500, ge=100, le=2000)
    chunk_overlap: int = Field(default=100, ge=0, le=500)
    semantic_chunk_enabled: bool = False


# ==================== Agent ====================

class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    description: str = ""
    avatar: str = ""
    llm_model_id: Optional[int] = None
    system_prompt: str = ""
    preset_id: Optional[int] = None
    opening_message: str = ""
    suggested_questions: str = "[]"
    temperature: float = Field(default=0.1, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=64, le=32768)
    top_k: int = Field(default=5, ge=1, le=50)
    similarity_threshold: float = Field(default=0.6, ge=0.0, le=1.0)
    knowledge_base_ids: List[int] = []


class AgentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    description: Optional[str] = None
    avatar: Optional[str] = None
    llm_model_id: Optional[int] = None
    system_prompt: Optional[str] = None
    preset_id: Optional[int] = None
    opening_message: Optional[str] = None
    suggested_questions: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=64, le=32768)
    top_k: Optional[int] = Field(None, ge=1, le=50)
    similarity_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    knowledge_base_ids: Optional[List[int]] = None


class AgentResponse(BaseModel):
    id: int
    name: str
    description: str
    avatar: str
    llm_model_id: Optional[int]
    system_prompt: str
    preset_id: Optional[int] = None
    opening_message: str
    suggested_questions: str
    temperature: float
    max_tokens: int
    top_k: int
    similarity_threshold: float
    api_key: str
    status: str
    knowledge_base_ids: List[int] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== Chat ====================

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4096)
    conversation_id: Optional[int] = None
    stream: bool = True
    source: str = Field(default="test", pattern="^(test|qa)$")


class CitedSource(BaseModel):
    chunk_id: int
    doc_id: int
    doc_name: str
    content: str
    score: float


class ConflictInfo(BaseModel):
    has_conflict: bool = False
    description: str = ""
    involved_chunks: List[int] = []


class ChatResponse(BaseModel):
    answer: str
    conversation_id: int
    cited_sources: List[CitedSource] = []
    conflict_info: Optional[ConflictInfo] = None
    latency_ms: int = 0


# ==================== Prompt Preset ====================

class PresetTemplateItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    category: str = Field(..., min_length=1, max_length=64)
    content: str = Field(..., min_length=1)
    description: str = ""


class PresetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    description: str = ""
    templates: List[PresetTemplateItem]


class PresetResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = ""
    is_system: bool
    is_active: bool
    templates: List["PromptResponse"] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PresetBrief(BaseModel):
    id: int
    name: str
    description: Optional[str] = ""
    is_system: bool
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== Prompt ====================

class PromptCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    category: str = Field(..., min_length=1, max_length=64)
    content: str = Field(..., min_length=1)
    description: str = ""
    is_default: bool = False
    preset_id: Optional[int] = None


class PromptUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    content: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    is_default: Optional[bool] = None


class PromptResponse(BaseModel):
    id: int
    name: str
    category: str
    content: str
    description: Optional[str] = ""
    is_system: bool
    is_default: bool
    preset_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== Conversation ====================

class ConversationResponse(BaseModel):
    id: int
    agent_id: int
    title: str
    source: str = "test"
    message_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    cited_sources: str
    conflict_info: str
    latency_ms: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== System Config ====================

class SystemResourceResponse(BaseModel):
    chroma_size_mb: float
    database_size_mb: float
    upload_size_mb: float
    total_documents: int
    total_chunks: int


class ApiResponse(BaseModel):
    code: int = 200
    message: str = "success"
    data: Optional[dict] = None


class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    page_size: int
    total_pages: int

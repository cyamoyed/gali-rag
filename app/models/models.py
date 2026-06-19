from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index,
    Table, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    provider = Column(String(64), nullable=False)
    model_type = Column(String(32), nullable=False, index=True)
    model_name = Column(String(128), nullable=False)
    api_key = Column(String(512), default="")
    base_url = Column(String(512), default="")
    config = Column(Text, default="{}")
    is_builtin = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False, index=True)
    status = Column(String(16), default="active", index=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    __table_args__ = (
        Index("ix_model_type_default", "model_type", "is_default"),
    )


class KnowledgeBaseCategory(Base):
    __tablename__ = "kb_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    parent_id = Column(Integer, ForeignKey("kb_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    description = Column(Text, default="")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    parent = relationship("KnowledgeBaseCategory", remote_side=[id], backref="children")


agent_knowledge_bases = Table(
    "agent_knowledge_bases",
    Base.metadata,
    Column("agent_id", Integer, ForeignKey("agents.id", ondelete="CASCADE"), primary_key=True),
    Column("knowledge_base_id", Integer, ForeignKey("knowledge_bases.id", ondelete="CASCADE"), primary_key=True),
)


class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False, index=True)
    description = Column(Text, default="")
    category_id = Column(Integer, ForeignKey("kb_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    kb_type = Column(String(16), default="general", index=True)
    embedding_model_id = Column(Integer, ForeignKey("ai_models.id", ondelete="SET NULL"), nullable=True)
    web_config = Column(Text, default="{}")
    chunk_size = Column(Integer, default=500)
    chunk_overlap = Column(Integer, default=100)
    semantic_chunk_enabled = Column(Boolean, default=False)
    chroma_collection = Column(String(128), nullable=False, unique=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    category = relationship("KnowledgeBaseCategory", backref="knowledge_bases")
    embedding_model = relationship("AIModel", foreign_keys=[embedding_model_id])
    documents = relationship("Document", back_populates="knowledge_base", cascade="all, delete-orphan")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False, index=True)
    description = Column(Text, default="")
    avatar = Column(String(512), default="")
    llm_model_id = Column(Integer, ForeignKey("ai_models.id", ondelete="SET NULL"), nullable=True)
    system_prompt = Column(Text, default="")
    preset_id = Column(Integer, ForeignKey("prompt_presets.id", ondelete="SET NULL"), nullable=True)
    opening_message = Column(Text, default="")
    suggested_questions = Column(Text, default="[]")
    temperature = Column(Float, default=0.1)
    max_tokens = Column(Integer, default=2048)
    top_k = Column(Integer, default=5)
    similarity_threshold = Column(Float, default=0.6)
    api_key = Column(String(128), default="", unique=True)
    status = Column(String(16), default="draft", index=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    llm_model = relationship("AIModel", foreign_keys=[llm_model_id])
    prompt_preset = relationship("PromptPreset", foreign_keys=[preset_id])
    knowledge_bases = relationship("KnowledgeBase", secondary=agent_knowledge_bases, backref="agents")
    conversations = relationship("Conversation", back_populates="agent", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    kb_id = Column(Integer, ForeignKey("knowledge_bases.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(256), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(16), nullable=False)
    file_size = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    status = Column(String(32), default="pending", index=True)
    summary = Column(Text, default="")
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    knowledge_base = relationship("KnowledgeBase", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_doc_kb_status", "kb_id", "status"),
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    doc_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    document = relationship("Document", back_populates="chunks")

    __table_args__ = (
        Index("ix_chunk_doc_index", "doc_id", "chunk_index"),
    )


class PromptPreset(Base):
    __tablename__ = "prompt_presets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False, unique=True, index=True)
    description = Column(Text, default="")
    is_system = Column(Boolean, default=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    templates = relationship("PromptTemplate", back_populates="preset", cascade="all, delete-orphan")


class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)
    content = Column(Text, nullable=False)
    description = Column(Text, default="")
    is_system = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)
    preset_id = Column(Integer, ForeignKey("prompt_presets.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    preset = relationship("PromptPreset", back_populates="templates")

    __table_args__ = (
        Index("ix_prompt_category_default", "category", "is_default"),
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(256), default="新对话")
    source = Column(String(16), default="test", index=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    agent = relationship("Agent", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_conv_agent_source", "agent_id", "source"),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(16), nullable=False)
    content = Column(Text, nullable=False)
    cited_sources = Column(Text, default="[]")
    conflict_info = Column(Text, default="")
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    conversation = relationship("Conversation", back_populates="messages")

    __table_args__ = (
        Index("ix_msg_conv_created", "conversation_id", "created_at"),
    )


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(128), nullable=False, unique=True, index=True)
    value = Column(Text, nullable=False)
    description = Column(Text, default="")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

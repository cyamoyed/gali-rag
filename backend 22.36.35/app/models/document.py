from sqlalchemy import Column, String, BigInteger, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base, TimestampMixin
import uuid


class Document(Base, TimestampMixin):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kb_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_bases.id", ondelete="CASCADE"))
    title = Column(String(500), nullable=False)
    file_path = Column(String(1000))
    file_type = Column(String(50))
    file_size = Column(BigInteger)
    status = Column(String(20), default="draft")
    version = Column(Integer, default=1)
    metadata_json = Column(JSONB, default={})
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))


class DocVersion(Base):
    __tablename__ = "doc_versions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doc_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"))
    version_num = Column(Integer, nullable=False)
    file_path = Column(String(1000))

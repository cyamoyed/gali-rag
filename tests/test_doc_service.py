import os
import pytest
from unittest.mock import patch, MagicMock, PropertyMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.models import Document, DocumentChunk, KnowledgeBase
from app.services.doc_service import DocumentService


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def service():
    return DocumentService()


@pytest.fixture
def sample_kb(db_session):
    kb = KnowledgeBase(
        name="Test KB",
        description="Test",
        kb_type="general",
        chunk_size=500,
        chunk_overlap=100,
        semantic_chunk_enabled=False,
        chroma_collection="test_collection",
    )
    db_session.add(kb)
    db_session.commit()
    db_session.refresh(kb)
    return kb


@pytest.fixture
def sample_doc(db_session, sample_kb):
    doc = Document(
        kb_id=sample_kb.id,
        filename="test.txt",
        file_path="/tmp/test.txt",
        file_type="txt",
        file_size=100,
        status="pending",
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)
    return doc


class TestCreateRecord:
    def test_creates_document_record(self, db_session, sample_kb, service):
        doc = service.create_record(db_session, sample_kb.id, "test.txt", "/tmp/test.txt", 100)
        assert doc.id is not None
        assert doc.filename == "test.txt"
        assert doc.status == "pending"
        assert doc.kb_id == sample_kb.id


class TestSaveUpload:
    def test_save_creates_file(self, tmp_path, service):
        with patch('app.services.doc_service.settings') as mock_settings:
            mock_settings.UPLOAD_DIR = str(tmp_path)
            path = service.save_upload(b"test content", "test.txt")
            assert os.path.exists(path)
            assert path.endswith(".txt")

    def test_save_unique_filenames(self, tmp_path, service):
        with patch('app.services.doc_service.settings') as mock_settings:
            mock_settings.UPLOAD_DIR = str(tmp_path)
            path1 = service.save_upload(b"content1", "test.txt")
            path2 = service.save_upload(b"content2", "test.txt")
            assert path1 != path2


class TestProcessDocument:
    def test_document_not_found_raises(self, db_session, service):
        with pytest.raises(ValueError, match="文档不存在"):
            service.process_document(db_session, 99999)

    def test_kb_not_found_raises(self, db_session, service, sample_doc):
        doc = sample_doc
        doc.kb_id = 99999
        db_session.commit()
        with pytest.raises(ValueError, match="知识库不存在"):
            service.process_document(db_session, doc.id)

    def test_empty_document_content_fails(self, db_session, service, sample_doc, tmp_path):
        empty_file = tmp_path / "empty.txt"
        empty_file.write_text("")
        sample_doc.file_path = str(empty_file)
        db_session.commit()

        with patch.object(service, '_get_embedding_client'):
            result = service.process_document(db_session, sample_doc.id)
            assert "error" in result

        db_session.refresh(sample_doc)
        assert sample_doc.status == "failed"

    def test_successful_processing(self, db_session, service, sample_doc, tmp_path):
        content_file = tmp_path / "content.txt"
        content_file.write_text("This is a test document with enough content to be split into chunks. " * 20)
        sample_doc.file_path = str(content_file)
        db_session.commit()

        mock_emb_client = MagicMock()
        mock_emb_client.embed.return_value = [[0.1] * 10] * 5

        with patch.object(service, '_get_embedding_client', return_value=mock_emb_client), \
             patch('app.services.doc_service.vector_store') as mock_vs, \
             patch('app.services.doc_service.bm25_cache'):
            mock_vs.add_documents.return_value = 5
            result = service.process_document(db_session, sample_doc.id)

        db_session.refresh(sample_doc)
        assert sample_doc.status == "completed"
        assert result["status"] == "completed"
        assert result["chunk_count"] > 0

    def test_failure_sets_failed_status(self, db_session, service, sample_doc, tmp_path):
        content_file = tmp_path / "content.txt"
        content_file.write_text("Some content here for testing purposes.")
        sample_doc.file_path = str(content_file)
        db_session.commit()

        with patch('app.services.doc_service.parse_document', side_effect=Exception("parse error")):
            result = service.process_document(db_session, sample_doc.id)

        db_session.refresh(sample_doc)
        assert sample_doc.status == "failed"
        assert "parse error" in sample_doc.error_message


class TestDeleteDocument:
    def test_delete_existing(self, db_session, service, sample_doc):
        with patch('app.services.doc_service.vector_store') as mock_vs, \
             patch('app.services.doc_service.bm25_cache'), \
             patch('os.path.exists', return_value=False):
            result = service.delete_document(db_session, sample_doc.id)
            assert result is True

    def test_delete_nonexistent(self, db_session, service):
        result = service.delete_document(db_session, 99999)
        assert result is False

    def test_delete_processing_doc_raises(self, db_session, service, sample_doc):
        sample_doc.status = "processing"
        db_session.commit()
        with pytest.raises(ValueError, match="正在处理中"):
            service.delete_document(db_session, sample_doc.id)


class TestReprocessDocument:
    def test_reprocess_nonexistent_raises(self, db_session, service):
        with pytest.raises(ValueError, match="文档不存在"):
            service.reprocess_document(db_session, 99999)

    def test_reprocess_processing_doc_raises(self, db_session, service, sample_doc):
        sample_doc.status = "processing"
        db_session.commit()
        with pytest.raises(ValueError, match="正在处理中"):
            service.reprocess_document(db_session, sample_doc.id)

    def test_reprocess_missing_file_raises(self, db_session, service, sample_doc):
        sample_doc.file_path = "/nonexistent/path.txt"
        db_session.commit()
        with pytest.raises(ValueError, match="文件已丢失"):
            service.reprocess_document(db_session, sample_doc.id)


class TestCleanOrphanVectors:
    def test_clean_with_orphans(self, db_session, service, sample_kb):
        with patch('app.services.doc_service.vector_store') as mock_vs, \
             patch('app.services.doc_service.bm25_cache'):
            mock_vs.clean_orphan_chunks.return_value = 5
            count = service.clean_orphan_vectors(db_session, sample_kb.id)
            assert count == 5

    def test_clean_nonexistent_kb(self, db_session, service):
        count = service.clean_orphan_vectors(db_session, 99999)
        assert count == 0

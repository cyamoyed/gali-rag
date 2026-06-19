import os
import tempfile
import pytest
from app.utils.document_parser import (
    parse_document, parse_pdf, parse_docx, parse_markdown, parse_txt,
    clean_text, validate_file, get_file_type, PARSERS,
)


class TestValidateFile:
    def test_valid_pdf_extension(self):
        assert validate_file("test.pdf") is True

    def test_valid_docx_extension(self):
        assert validate_file("test.docx") is True

    def test_valid_md_extension(self):
        assert validate_file("test.md") is True

    def test_valid_txt_extension(self):
        assert validate_file("test.txt") is True

    def test_unsupported_extension(self):
        assert validate_file("test.exe") is False
        assert validate_file("test.jpg") is False
        assert validate_file("test.xlsx") is False

    def test_case_insensitive_extension(self):
        assert validate_file("test.PDF") is True
        assert validate_file("test.TXT") is True

    def test_pdf_magic_bytes_valid(self):
        assert validate_file("test.pdf", b"%PDF-1.4 some content") is True

    def test_pdf_magic_bytes_invalid(self):
        assert validate_file("test.pdf", b"NOT_PDF content") is False

    def test_docx_magic_bytes_valid(self):
        assert validate_file("test.docx", b"PK\x03\x04rest of file") is True

    def test_docx_magic_bytes_invalid(self):
        assert validate_file("test.docx", b"NOT_ZIP content") is False

    def test_empty_content_returns_false(self):
        assert validate_file("test.pdf", b"") is False
        assert validate_file("test.txt", b"") is False

    def test_short_content_skips_magic_check(self):
        assert validate_file("test.pdf", b"ab") is True
        assert validate_file("test.txt", b"ab") is True

    def test_txt_no_magic_check(self):
        assert validate_file("test.txt", b"anything at all") is True

    def test_md_no_magic_check(self):
        assert validate_file("test.md", b"# anything at all") is True

    def test_none_content_returns_true(self):
        assert validate_file("test.pdf", None) is True


class TestGetFileType:
    def test_pdf(self):
        assert get_file_type("doc.pdf") == "pdf"

    def test_docx(self):
        assert get_file_type("doc.docx") == "docx"

    def test_markdown(self):
        assert get_file_type("doc.md") == "markdown"

    def test_txt(self):
        assert get_file_type("doc.txt") == "txt"

    def test_unknown(self):
        assert get_file_type("doc.xyz") == "unknown"


class TestCleanText:
    def test_merge_multiple_newlines(self):
        text = "hello\n\n\n\n\nworld"
        assert clean_text(text) == "hello\n\nworld"

    def test_merge_multiple_spaces(self):
        text = "hello     world"
        assert clean_text(text) == "hello world"

    def test_remove_control_characters(self):
        text = "hello\x00\x01\x02world"
        assert clean_text(text) == "helloworld"

    def test_preserve_newlines_and_tabs(self):
        text = "hello\nworld\ttab"
        result = clean_text(text)
        assert "\n" in result
        assert "\t" in result

    def test_strip_whitespace(self):
        text = "  hello world  "
        assert clean_text(text) == "hello world"

    def test_empty_string(self):
        assert clean_text("") == ""

    def test_only_whitespace(self):
        assert clean_text("   \n\n  ") == ""


class TestParseTxt:
    def test_basic_txt(self, tmp_path):
        f = tmp_path / "test.txt"
        f.write_text("Hello, World!", encoding="utf-8")
        result = parse_txt(str(f))
        assert result == "Hello, World!"

    def test_empty_txt(self, tmp_path):
        f = tmp_path / "empty.txt"
        f.write_text("", encoding="utf-8")
        result = parse_txt(str(f))
        assert result == ""

    def test_multiline_txt(self, tmp_path):
        f = tmp_path / "multi.txt"
        f.write_text("line1\nline2\nline3", encoding="utf-8")
        result = parse_txt(str(f))
        assert "line1" in result
        assert "line3" in result

    def test_gbk_encoding_fallback(self, tmp_path):
        f = tmp_path / "gbk.txt"
        f.write_bytes("你好世界".encode("gbk"))
        result = parse_txt(str(f))
        assert "你好" in result


class TestParseMarkdown:
    def test_basic_markdown(self, tmp_path):
        f = tmp_path / "test.md"
        f.write_text("# Title\n\nParagraph text", encoding="utf-8")
        result = parse_markdown(str(f))
        assert "Title" in result
        assert "Paragraph text" in result

    def test_markdown_strips_html(self, tmp_path):
        f = tmp_path / "test.md"
        f.write_text("**bold** and *italic*", encoding="utf-8")
        result = parse_markdown(str(f))
        assert "<" not in result
        assert "bold" in result
        assert "italic" in result


class TestParseDocument:
    def test_unsupported_format(self, tmp_path):
        f = tmp_path / "test.xyz"
        f.write_text("content")
        with pytest.raises(ValueError, match="不支持的文件格式"):
            parse_document(str(f))

    def test_txt_document(self, tmp_path):
        f = tmp_path / "doc.txt"
        f.write_text("test content", encoding="utf-8")
        result = parse_document(str(f))
        assert result == "test content"


class TestParsersRegistry:
    def test_all_expected_extensions_registered(self):
        expected = {".pdf", ".docx", ".md", ".txt"}
        assert set(PARSERS.keys()) == expected

    def test_all_parsers_are_callable(self):
        for ext, parser in PARSERS.items():
            assert callable(parser), f"Parser for {ext} is not callable"

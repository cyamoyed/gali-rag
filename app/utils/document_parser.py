"""文档解析模块。

支持解析 PDF、DOCX、Markdown、TXT 四种格式。
提供文件类型校验（含魔数校验）、文本清洗和编码自动检测功能。
"""
import os
import re
from pathlib import Path
from pypdf import PdfReader
from docx import Document as DocxDocument
import markdown


def parse_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    return "\n\n".join(pages)


def parse_docx(file_path: str) -> str:
    doc = DocxDocument(file_path)
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def parse_markdown(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    html = markdown.markdown(content)
    text = re.sub(r"<[^>]+>", "", html)
    return text.strip()


def parse_txt(file_path: str) -> str:
    for encoding in ("utf-8", "gbk", "gb2312", "latin-1"):
        try:
            with open(file_path, "r", encoding=encoding) as f:
                return f.read().strip()
        except (UnicodeDecodeError, LookupError):
            continue
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        return f.read().strip()


PARSERS = {
    ".pdf": parse_pdf,
    ".docx": parse_docx,
    ".md": parse_markdown,
    ".txt": parse_txt,
}


def parse_document(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    parser = PARSERS.get(ext)
    if not parser:
        raise ValueError(f"不支持的文件格式: {ext}")
    return parser(file_path)


def clean_text(text: str) -> str:
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
    return text.strip()


def get_file_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    mapping = {".pdf": "pdf", ".docx": "docx", ".md": "markdown", ".txt": "txt"}
    return mapping.get(ext, "unknown")


def validate_file(filename: str, content: bytes = None) -> bool:
    ext = Path(filename).suffix.lower()
    if ext not in PARSERS:
        return False
    if content is not None:
        if len(content) == 0:
            return False
        if len(content) >= 4:
            if ext == ".pdf" and not content[:4] == b"%PDF":
                return False
            if ext == ".docx" and not content[:4] == b"PK\x03\x04":
                return False
    return True

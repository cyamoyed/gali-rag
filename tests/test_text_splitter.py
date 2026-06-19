import pytest
from app.utils.text_splitter import split_text, fixed_length_split, semantic_split, _split_by_paragraphs, merge_short_chunks


class TestSplitText:
    def test_empty_text(self):
        assert split_text("") == []
        assert split_text("   ") == []
        assert split_text(None) == []

    def test_short_text_single_chunk(self):
        text = "Hello World"
        chunks = split_text(text, chunk_size=500)
        assert len(chunks) == 1
        assert chunks[0] == "Hello World"

    def test_long_text_multiple_chunks(self):
        text = "This is a sentence. " * 200
        chunks = split_text(text, chunk_size=500, chunk_overlap=50)
        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk) <= 600

    def test_chunk_overlap_respected(self):
        text = "A" * 1000
        chunks = split_text(text, chunk_size=500, chunk_overlap=100)
        if len(chunks) > 1:
            overlap_start = chunks[1][:100]
            assert overlap_start in chunks[0]

    def test_chunk_size_clamped_minimum(self):
        text = "Hello World"
        chunks = split_text(text, chunk_size=10)
        assert len(chunks) >= 1

    def test_chunk_size_clamped_maximum(self):
        text = "A" * 20000
        chunks = split_text(text, chunk_size=50000)
        assert len(chunks) >= 1

    def test_overlap_clamped_to_less_than_size(self):
        text = "A" * 1000
        chunks = split_text(text, chunk_size=500, chunk_overlap=600)
        assert len(chunks) >= 1

    def test_zero_overlap(self):
        text = "This is sentence one. This is sentence two. This is sentence three. " * 20
        chunks = split_text(text, chunk_size=500, chunk_overlap=0)
        assert len(chunks) >= 2


class TestFixedLengthSplit:
    def test_chinese_text_split(self):
        text = "这是第一句。这是第二句。这是第三句。" * 50
        chunks = fixed_length_split(text, chunk_size=200, chunk_overlap=50)
        assert len(chunks) > 1

    def test_english_text_split(self):
        text = "This is sentence one. This is sentence two. " * 50
        chunks = fixed_length_split(text, chunk_size=200, chunk_overlap=50)
        assert len(chunks) > 1

    def test_newline_separators(self):
        text = "paragraph one is long enough\n\nparagraph two is also long\n\nparagraph three is long too"
        chunks = fixed_length_split(text, chunk_size=30, chunk_overlap=0)
        assert len(chunks) >= 2


class TestSemanticSplit:
    def test_markdown_headers(self):
        text = "# Title 1\nContent 1\n\n## Title 2\nContent 2\n\n### Title 3\nContent 3"
        chunks = semantic_split(text, chunk_size=500, chunk_overlap=100)
        assert len(chunks) >= 1

    def test_no_headers_falls_back(self):
        text = "Just some plain text without any markdown headers at all."
        chunks = semantic_split(text, chunk_size=500, chunk_overlap=100)
        assert len(chunks) >= 1

    def test_large_section_gets_sub_split(self):
        text = "# Big Section\n" + "A" * 2000
        chunks = semantic_split(text, chunk_size=500, chunk_overlap=100)
        assert len(chunks) > 1

    def test_semantic_mode_via_split_text(self):
        text = "# Header\nContent here\n\n## Second\nMore content"
        chunks = split_text(text, chunk_size=500, chunk_overlap=100, semantic=True)
        assert len(chunks) >= 1


class TestSplitByParagraphs:
    def test_double_newline_split(self):
        text = "para1\n\npara2\n\npara3"
        result = _split_by_paragraphs(text)
        assert len(result) == 3

    def test_single_paragraph(self):
        text = "just one paragraph"
        result = _split_by_paragraphs(text)
        assert len(result) >= 1

    def test_sentence_fallback(self):
        text = "Sentence one。Sentence two。Sentence three。"
        result = _split_by_paragraphs(text)
        assert len(result) >= 1


class TestMergeShortChunks:
    def test_single_chunk_unchanged(self):
        result = merge_short_chunks(["hello world"], 500)
        assert result == ["hello world"]

    def test_empty_list(self):
        result = merge_short_chunks([], 500)
        assert result == []

    def test_short_chunk_merged_with_next(self):
        chunks = ["short", "B" * 300]
        result = merge_short_chunks(chunks, 500)
        assert len(result) == 1
        assert "short" in result[0]

    def test_short_chunk_merged_with_prev(self):
        chunks = ["A" * 300, "short"]
        result = merge_short_chunks(chunks, 500)
        assert len(result) == 1
        assert "short" in result[0]

    def test_all_large_chunks_unchanged(self):
        chunks = ["A" * 200, "B" * 200, "C" * 200]
        result = merge_short_chunks(chunks, 500)
        assert len(result) == 3

    def test_respects_chunk_size_limit(self):
        chunks = ["A" * 400, "short", "B" * 400]
        result = merge_short_chunks(chunks, 500)
        assert len(result) >= 2

    def test_sequential_short_chunks(self):
        chunks = ["ab", "cd", "ef", "G" * 300]
        result = merge_short_chunks(chunks, 500)
        assert len(result) < len(chunks)

    def test_semantic_mode_uses_merge(self):
        text = "# Title\nShort\n\n## Section 2\n" + "B" * 300
        chunks = split_text(text, chunk_size=500, chunk_overlap=100, semantic=True)
        for chunk in chunks:
            assert len(chunk) > 0

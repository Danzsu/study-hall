"""Format detection and extraction factory."""
from pathlib import Path
from pipeline.extractors.base import ExtractedDocument

class ExtractorFactory:
    _EXT_MAP = {
        ".pdf": "pdf", ".docx": "docx", ".pptx": "pptx", ".ppt": "pptx",
        ".txt": "text", ".md": "text",
        ".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image",
    }

    @staticmethod
    def detect(path: Path) -> str:
        ext = path.suffix.lower()
        if ext in ExtractorFactory._EXT_MAP:
            return ExtractorFactory._EXT_MAP[ext]
        with open(path, "rb") as f:
            header = f.read(8)
        if header.startswith(b"%PDF"):
            return "pdf"
        if header.startswith(b"PK\x03\x04"):
            return "pptx"
        raise ValueError(f"Unsupported format: {path.name}")

    @staticmethod
    def extract(path: Path, images_dir: Path | None = None) -> ExtractedDocument:
        fmt = ExtractorFactory.detect(path)
        if fmt == "pdf":
            from pipeline.extractors.pdf import extract_pdf
            return extract_pdf(path, images_dir)
        elif fmt == "docx":
            from pipeline.extractors.docx import extract_docx
            return extract_docx(path, images_dir)
        elif fmt == "pptx":
            from pipeline.extractors.pptx import extract_pptx
            return extract_pptx(path, images_dir)
        elif fmt == "text":
            from pipeline.extractors.text import extract_text
            return extract_text(path)
        elif fmt == "image":
            from pipeline.extractors.image import extract_image
            return extract_image(path)
        raise ValueError(f"No extractor for format: {fmt}")

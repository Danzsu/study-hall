"""Core dataclasses for the extraction pipeline."""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class Section:
    index: int
    title: str
    level: int          # 1=chapter, 2=section, 3=subsection
    text: str
    notes: str = ""     # PPTX speaker notes or empty
    page_start: int = 0
    page_end: int = 0


@dataclass
class ExtractedImage:
    id: str             # "img-p03-02"
    page: int
    fmt: str            # "png" | "jpg"
    b64: str            # base64-encoded image data
    width: int
    height: int
    quality_score: float | None = None   # filled by ImageEvaluator
    caption: str | None = None


@dataclass
class ExtractedDocument:
    slug: str
    source_path: str
    fmt: str            # "pdf" | "docx" | "pptx" | "text" | "image"
    sections: list[Section] = field(default_factory=list)
    images: list[ExtractedImage] = field(default_factory=list)
    raw_text: str = ""
    metadata: dict = field(default_factory=dict)
    is_scanned: bool = False   # True if text < 200 chars but images exist

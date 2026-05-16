"""PDF extractor using pymupdf4llm for text and fitz for images."""
from __future__ import annotations
import base64
import re
from pathlib import Path
import fitz  # PyMuPDF
import pymupdf4llm
from pipeline.extractors.base import ExtractedDocument, ExtractedImage, Section


def extract_pdf(path: Path, images_dir: Path | None = None) -> ExtractedDocument:
    slug = path.stem
    md_text = pymupdf4llm.to_markdown(str(path))
    sections = _split_into_sections(md_text)
    images = _extract_images(path)

    is_scanned = len(md_text.strip()) < 200 and len(images) > 0

    doc = fitz.open(str(path))
    metadata = {
        "title": doc.metadata.get("title", "") or slug,
        "author": doc.metadata.get("author", ""),
        "page_count": doc.page_count,
    }
    doc.close()

    return ExtractedDocument(
        slug=slug,
        source_path=str(path),
        fmt="pdf",
        sections=sections,
        images=images,
        raw_text=md_text,
        metadata=metadata,
        is_scanned=is_scanned,
    )


def _split_into_sections(md_text: str) -> list[Section]:
    """Split markdown text into sections based on headers."""
    lines = md_text.split("\n")
    sections = []
    current_title = "Introduction"
    current_level = 1
    current_lines = []
    index = 0

    for line in lines:
        h_match = re.match(r'^(#{1,3})\s+(.+)', line)
        if h_match:
            if current_lines:
                sections.append(Section(
                    index=index,
                    title=current_title,
                    level=current_level,
                    text="\n".join(current_lines).strip(),
                ))
                index += 1
            current_level = len(h_match.group(1))
            current_title = h_match.group(2).strip()
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        sections.append(Section(
            index=index,
            title=current_title,
            level=current_level,
            text="\n".join(current_lines).strip(),
        ))

    if not sections:
        sections.append(Section(index=0, title="Content", level=1, text=md_text.strip()))

    return sections


def _extract_images(path: Path) -> list[ExtractedImage]:
    """Extract embedded images from PDF pages."""
    doc = fitz.open(str(path))
    images = []
    img_counter: dict[int, int] = {}

    for page_num in range(doc.page_count):
        page = doc[page_num]
        img_list = page.get_images(full=True)

        for img_info in img_list:
            xref = img_info[0]
            img_counter[page_num] = img_counter.get(page_num, 0) + 1
            img_idx = img_counter[page_num]

            try:
                base_image = doc.extract_image(xref)
                img_bytes = base_image["image"]
                img_ext = base_image["ext"]
                width = base_image.get("width", 0)
                height = base_image.get("height", 0)

                if width < 60 or height < 60:
                    continue

                b64 = base64.b64encode(img_bytes).decode("utf-8")
                images.append(ExtractedImage(
                    id=f"img-p{page_num+1:02d}-{img_idx:02d}",
                    page=page_num,
                    fmt=img_ext if img_ext in ("png", "jpg", "jpeg") else "png",
                    b64=b64,
                    width=width,
                    height=height,
                ))
            except Exception:
                continue

    doc.close()
    return images

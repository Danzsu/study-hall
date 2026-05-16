"""DOCX extractor using mammoth."""
from __future__ import annotations
import base64
import re
from pathlib import Path
import mammoth
from pipeline.extractors.base import ExtractedDocument, ExtractedImage, Section


def extract_docx(path: Path, images_dir: Path | None = None) -> ExtractedDocument:
    slug = path.stem
    images: list[ExtractedImage] = []
    img_counter = [0]

    def convert_image(image):
        img_counter[0] += 1
        try:
            with image.open() as f:
                img_bytes = f.read()
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            content_type = image.content_type or "image/png"
            fmt = "jpg" if "jpeg" in content_type else "png"
            images.append(ExtractedImage(
                id=f"img-d{img_counter[0]:02d}",
                page=0,
                fmt=fmt,
                b64=b64,
                width=0,
                height=0,
            ))
        except Exception:
            pass
        return {"src": f"img-d{img_counter[0]:02d}"}

    with open(path, "rb") as f:
        result = mammoth.convert_to_markdown(f, convert_image=mammoth.images.img_element(convert_image))

    md_text = result.value
    sections = _split_into_sections(md_text)

    return ExtractedDocument(
        slug=slug,
        source_path=str(path),
        fmt="docx",
        sections=sections,
        images=images,
        raw_text=md_text,
        metadata={"title": slug},
    )


def _split_into_sections(md_text: str) -> list[Section]:
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
                    index=index, title=current_title, level=current_level,
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
            index=index, title=current_title, level=current_level,
            text="\n".join(current_lines).strip(),
        ))

    if not sections:
        sections.append(Section(index=0, title="Content", level=1, text=md_text.strip()))

    return sections

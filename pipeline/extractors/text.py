"""TXT and MD extractor."""
from __future__ import annotations
import re
from pathlib import Path
import chardet
from pipeline.extractors.base import ExtractedDocument, Section


def extract_text(path: Path, images_dir: Path | None = None) -> ExtractedDocument:
    slug = path.stem
    raw_bytes = path.read_bytes()
    detected = chardet.detect(raw_bytes)
    encoding = detected.get("encoding") or "utf-8"
    try:
        text = raw_bytes.decode(encoding)
    except (UnicodeDecodeError, LookupError):
        text = raw_bytes.decode("utf-8", errors="replace")

    sections = _split_into_sections(text)

    return ExtractedDocument(
        slug=slug,
        source_path=str(path),
        fmt="text",
        sections=sections,
        raw_text=text,
        metadata={"title": slug, "encoding": encoding},
    )


def _split_into_sections(text: str) -> list[Section]:
    lines = text.split("\n")
    sections: list[Section] = []
    current_title = "Content"
    current_level = 1
    current_lines: list[str] = []
    index = 0

    for line in lines:
        h_match = re.match(r'^(#{1,3})\s+(.+)', line)
        if h_match:
            if current_lines:
                body = "\n".join(current_lines).strip()
                if body:
                    sections.append(Section(
                        index=index, title=current_title, level=current_level, text=body,
                    ))
                    index += 1
            current_level = len(h_match.group(1))
            current_title = h_match.group(2).strip()
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        body = "\n".join(current_lines).strip()
        if body:
            sections.append(Section(index=index, title=current_title, level=current_level, text=body))

    if not sections:
        sections.append(Section(index=0, title="Content", level=1, text=text.strip()))

    return sections

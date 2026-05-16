"""Direct image input extractor (PNG/JPG)."""
from __future__ import annotations
import base64
from pathlib import Path
from PIL import Image
from pipeline.extractors.base import ExtractedDocument, ExtractedImage, Section


def extract_image(path: Path, images_dir: Path | None = None) -> ExtractedDocument:
    slug = path.stem
    img = Image.open(path)
    w, h = img.size
    fmt = img.format.lower() if img.format else path.suffix.lstrip(".").lower()
    if fmt not in ("png", "jpg", "jpeg"):
        fmt = "png"

    b64 = base64.b64encode(path.read_bytes()).decode("utf-8")

    image = ExtractedImage(
        id="img-direct-01",
        page=0,
        fmt=fmt,
        b64=b64,
        width=w,
        height=h,
    )

    section = Section(
        index=0,
        title=slug,
        level=1,
        text="",
    )

    return ExtractedDocument(
        slug=slug,
        source_path=str(path),
        fmt="image",
        sections=[section],
        images=[image],
        raw_text="",
        metadata={"title": slug, "width": w, "height": h},
    )

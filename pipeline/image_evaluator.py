"""Image quality evaluator using Gemini Flash Lite vision."""
from __future__ import annotations
import asyncio
import base64
import io
from dataclasses import dataclass
from typing import Literal
from PIL import Image
from pipeline.extractors.base import ExtractedImage
from pipeline.config import GEMINI_FLASH_LITE


@dataclass
class ImageDecision:
    action: Literal["include", "skip"]
    reason: str = ""
    score: float = 0.0
    caption: str | None = None


EVAL_PROMPT = """Rate this image for inclusion in study notes. Return JSON only:
{"score": 0.0, "caption": null}

Scoring guide:
- 1.0 = clear diagram, flowchart, or chart with strong educational value
- 0.7 = annotated photo, labeled figure, or useful illustration
- 0.4 = decorative photo, background image, or low information content
- 0.1 = logo, icon, or purely decorative element

caption: one short sentence describing what the image shows, or null if score < 0.4"""


async def evaluate(img: ExtractedImage) -> ImageDecision:
    """Evaluate a single image. Returns ImageDecision."""
    # Fast heuristic reject — skip tiny images without LLM call
    if img.width > 0 and img.height > 0:
        if img.width < 60 or img.height < 60:
            return ImageDecision(action="skip", reason="too_small")

    # Resize very large images to keep API cost low
    resized_b64 = _maybe_resize(img.b64, img.fmt, max_side=1200)

    from pipeline.gemini_client import vision
    try:
        result = await vision(resized_b64, EVAL_PROMPT, mime_type=f"image/{img.fmt}", model=GEMINI_FLASH_LITE)
        score = float(result.get("score", 0.0))
        caption = result.get("caption")
    except Exception as e:
        print(f"  ImageEvaluator error for {img.id}: {e}")
        return ImageDecision(action="skip", reason="eval_error", score=0.0)

    if score >= 0.55:
        return ImageDecision(action="include", score=score, caption=caption)
    return ImageDecision(action="skip", reason="low_quality", score=score)


async def evaluate_batch(images: list[ExtractedImage], concurrency: int = 5) -> dict[str, ImageDecision]:
    """Evaluate multiple images concurrently. Returns {img.id: ImageDecision}."""
    semaphore = asyncio.Semaphore(concurrency)

    async def _eval_one(img: ExtractedImage) -> tuple[str, ImageDecision]:
        async with semaphore:
            decision = await evaluate(img)
            return img.id, decision

    results = await asyncio.gather(*[_eval_one(img) for img in images])
    return dict(results)


def _maybe_resize(b64: str, fmt: str, max_side: int = 1200) -> str:
    """Resize image if either dimension exceeds max_side. Returns base64."""
    try:
        img_bytes = base64.b64decode(b64)
        img = Image.open(io.BytesIO(img_bytes))
        w, h = img.size
        if w <= max_side and h <= max_side:
            return b64
        ratio = min(max_side / w, max_side / h)
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)
        out = io.BytesIO()
        save_fmt = "JPEG" if fmt in ("jpg", "jpeg") else "PNG"
        img.save(out, format=save_fmt)
        return base64.b64encode(out.getvalue()).decode("utf-8")
    except Exception:
        return b64

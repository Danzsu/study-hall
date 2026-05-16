"""Parallel section MDX generation using Gemini Flash."""
from __future__ import annotations
import asyncio
import json
import re
from dataclasses import dataclass
from pathlib import Path
from pydantic import BaseModel, Field, ValidationError
from pipeline.extractors.base import Section, ExtractedImage, ExtractedDocument
from pipeline.gemini_client import text as gemini_text, json_call as gemini_json
from pipeline.config import GEMINI_FLASH, GEMINI_FLASH_LITE


# ── Output schemas ──────────────────────────────────────────────────────────

class SectionMDX(BaseModel):
    """Pydantic schema for validating LLM section output."""
    key_concepts: list[str] = Field(default_factory=list, min_length=1, max_length=8)
    explanation: str = Field(min_length=50)
    examples: str = ""
    summary: str = Field(min_length=20, max_length=600)

    model_config = {"extra": "ignore"}


@dataclass
class SectionResult:
    index: int
    title: str
    mdx: str
    quality_score: int = 0
    warning: str = ""


# ── Generation config ───────────────────────────────────────────────────────

@dataclass
class GenConfig:
    subject_name: str
    language: str = "hu"       # "hu" | "en"
    depth: str = "exam"        # "overview" | "exam" | "detailed"
    include_images: bool = True


# ── Prompts ─────────────────────────────────────────────────────────────────

SECTION_SYSTEM = """You are a university professor writing structured study notes.
Write in clear, student-friendly language. Be specific — use concrete examples.
Always respond in the language of the source material unless instructed otherwise.
Return ONLY valid JSON, no markdown fences."""

SECTION_PROMPT = """Generate study notes for the following section.

Section title: {title}
Subject: {subject_name}
Source content:
{text}

{image_descriptions}

Return a JSON object with exactly these fields:
{{
  "key_concepts": ["concept 1", "concept 2", ...],  // 3-8 bullet points
  "explanation": "2-4 paragraphs of explanation with markdown formatting (**, ##, -, $LaTeX$)",
  "examples": "concrete examples or empty string if none",
  "summary": "2-3 sentence takeaway"
}}"""

REFLECTION_PROMPT = """Review this study notes JSON and fix issues.
Issues to fix: {issues}

Original JSON:
{original}

Source content (for accuracy check):
{source_excerpt}

Return corrected JSON with the same structure."""

RUBRIC_PROMPT = """Score this study notes section (0-100):
- 40pts: All required fields present and non-empty (key_concepts ≥1, explanation ≥50 chars, summary ≥20 chars)
- 30pts: Factually accurate to source material
- 30pts: Clear, student-friendly language (not generic AI text)

Return JSON: {{"score": 0-100, "issues": ["issue 1", "issue 2"]}}

Source excerpt:
{source_excerpt}

MDX section JSON:
{mdx_json}"""


# ── Image helpers ────────────────────────────────────────────────────────────

def _image_descriptions(images: list[ExtractedImage]) -> str:
    if not images:
        return ""
    lines = ["Included images (describe these in the explanation if relevant):"]
    for img in images:
        desc = img.caption or f"Image {img.id} ({img.width}x{img.height}px)"
        lines.append(f"- {desc}")
    return "\n".join(lines)


def _images_mdx_block(images: list[ExtractedImage]) -> str:
    if not images:
        return ""
    lines = []
    for img in images:
        alt = img.caption or f"Diagram {img.id}"
        lines.append(f'<StudyImage src="{img.id}" alt="{alt}" />')
    return "\n".join(lines)


# ── Section generator ────────────────────────────────────────────────────────

async def _generate_section_json(section: Section, images: list[ExtractedImage], config: GenConfig) -> dict:
    prompt = SECTION_PROMPT.format(
        title=section.title,
        subject_name=config.subject_name,
        text=section.text[:4000],
        image_descriptions=_image_descriptions(images),
    )
    return await gemini_json(prompt, system=SECTION_SYSTEM, model=GEMINI_FLASH)


async def _validate_section(raw: dict, source_excerpt: str) -> tuple[bool, list[str], int]:
    prompt = RUBRIC_PROMPT.format(
        source_excerpt=source_excerpt[:800],
        mdx_json=json.dumps(raw, ensure_ascii=False)[:1500],
    )
    result = await gemini_json(prompt, model=GEMINI_FLASH_LITE)
    score = int(result.get("score", 0))
    issues = result.get("issues", [])
    return score >= 70, issues, score


async def _reflect_section(raw: dict, issues: list[str], source_excerpt: str) -> dict:
    prompt = REFLECTION_PROMPT.format(
        issues="; ".join(issues),
        original=json.dumps(raw, ensure_ascii=False)[:2000],
        source_excerpt=source_excerpt[:800],
    )
    return await gemini_json(prompt, system=SECTION_SYSTEM, model=GEMINI_FLASH)


def _build_mdx(section: Section, data: dict, images: list[ExtractedImage], config: GenConfig) -> str:
    """Assemble final MDX from validated section data."""
    key_concepts_md = "\n".join(f"- {c}" for c in (data.get("key_concepts") or []))
    images_block = _images_mdx_block(images) if config.include_images else ""
    examples = data.get("examples", "").strip()
    summary = data.get("summary", "").strip()
    explanation = data.get("explanation", "").strip()

    parts = [
        f"## {section.title}",
        "",
        "### Alapfogalmak" if config.language == "hu" else "### Key Concepts",
        key_concepts_md,
        "",
        "### Magyarázat" if config.language == "hu" else "### Explanation",
        explanation,
    ]

    if images_block:
        parts += ["", images_block]

    if examples:
        parts += [
            "",
            "### Példák" if config.language == "hu" else "### Examples",
            examples,
        ]

    parts += [
        "",
        "### Összefoglalás" if config.language == "hu" else "### Summary",
        summary,
    ]

    return "\n".join(parts)


async def generate_section(
    section: Section,
    images: list[ExtractedImage],
    config: GenConfig,
    job_id: str | None = None,
) -> SectionResult:
    """Generate MDX for one section with optional reflection retry."""
    raw = await _generate_section_json(section, images, config)

    # Validate via Pydantic
    try:
        validated = SectionMDX(**raw)
        data = validated.model_dump()
    except ValidationError:
        data = raw  # proceed with raw if schema fails

    # Reflection: score and retry once if < 70
    ok, issues, score = await _validate_section(data, section.text[:800])
    warning = ""
    if not ok:
        try:
            refined = await _reflect_section(data, issues, section.text[:800])
            _, _, score2 = await _validate_section(refined, section.text[:800])
            if score2 >= score:
                data = refined
                score = score2
            else:
                warning = f"Low quality after reflection (score={score})"
        except Exception as e:
            warning = f"Reflection failed: {e}"

    mdx = _build_mdx(section, data, images, config)

    if job_id:
        from pipeline.job_status import advance_section
        advance_section(job_id)

    return SectionResult(
        index=section.index,
        title=section.title,
        mdx=mdx,
        quality_score=score,
        warning=warning,
    )


# ── Batch runner ─────────────────────────────────────────────────────────────

async def generate_all_sections(
    doc: ExtractedDocument,
    config: GenConfig,
    image_decisions: dict[str, str] | None = None,
    job_id: str | None = None,
    concurrency: int = 5,
) -> list[SectionResult]:
    """Generate MDX for all sections in parallel.

    image_decisions: {img_id: "include"|"skip"} from ImageEvaluator
    Returns list sorted by section.index.
    """
    semaphore = asyncio.Semaphore(concurrency)
    if image_decisions is None:
        image_decisions = {}

    async def worker(section: Section) -> SectionResult:
        async with semaphore:
            included_images = [
                img for img in doc.images
                if img.page in range(section.page_start, section.page_end + 1)
                and image_decisions.get(img.id) == "include"
            ] if doc.images else []
            return await generate_section(section, included_images, config, job_id)

    results = await asyncio.gather(*[worker(s) for s in doc.sections], return_exceptions=True)

    # Filter exceptions and log warnings
    clean: list[SectionResult] = []
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            print(f"  Section {i} failed: {r}")
            clean.append(SectionResult(
                index=doc.sections[i].index,
                title=doc.sections[i].title,
                mdx=f"## {doc.sections[i].title}\n\n*(Generation failed)*",
                warning=str(r),
            ))
        else:
            clean.append(r)

    return sorted(clean, key=lambda r: r.index)


def assemble_full_mdx(results: list[SectionResult]) -> str:
    """Join all section MDX outputs into one document."""
    return "\n\n---\n\n".join(r.mdx for r in results)

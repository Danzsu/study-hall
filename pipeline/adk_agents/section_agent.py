from __future__ import annotations

import asyncio
import json
import re
import uuid
from typing import Any

import google.genai.types as genai_types
from google.adk.agents import LlmAgent, LoopAgent
from google.adk.agents.callback_context import CallbackContext
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from pipeline.config import GEMINI_FLASH, GEMINI_FLASH_LITE
from pipeline.extractors.base import ExtractedDocument, ExtractedImage, Section
from pipeline.section_pipeline import (
    REFLECTION_PROMPT,
    RUBRIC_PROMPT,
    SECTION_SYSTEM,
    GenConfig,
    SectionResult,
    _build_mdx,
    _image_descriptions,
)


# ── ADK agent definitions ────────────────────────────────────────────────────

section_generator = LlmAgent(
    name="section_generator",
    model=GEMINI_FLASH,
    instruction=SECTION_SYSTEM,
    output_key="section_json",
)

def _scorer_after_callback(callback_context: CallbackContext) -> None:
    """Exit the LoopAgent early when section quality is already acceptable."""
    raw = callback_context.state.get("score_result", "")
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-z]*\n?", "", cleaned).rstrip("```").strip()
        data = json.loads(cleaned)
        if int(data.get("score", 0)) >= 70:
            callback_context.actions.escalate = True
    except Exception:
        pass


section_scorer = LlmAgent(
    name="section_scorer",
    model=GEMINI_FLASH_LITE,
    instruction=RUBRIC_PROMPT,
    output_key="score_result",
    after_agent_callback=_scorer_after_callback,
)

section_reflector = LlmAgent(
    name="section_reflector",
    model=GEMINI_FLASH,
    instruction=SECTION_SYSTEM,
    output_key="section_json",
)

section_loop = LoopAgent(
    name="section_loop",
    sub_agents=[section_generator, section_scorer, section_reflector],
    max_iterations=2,
)


# ── Module-level runner (one service shared across all sessions) ─────────────

_session_service = InMemorySessionService()
_runner = Runner(session_service=_session_service)


# ── Per-section ADK runner ───────────────────────────────────────────────────

async def _run_section_adk(
    section: Section,
    images: list[ExtractedImage],
    config: GenConfig,
    semaphore: asyncio.Semaphore,
    job_id: str | None,
) -> SectionResult:
    async with semaphore:
        session_id = str(uuid.uuid4())
        user_id = "pipeline"

        image_desc = _image_descriptions(images) if config.include_images else ""

        # Encode section context in the initial user message so the generator
        # receives structured input without requiring custom ADK state injection.
        user_message_text = (
            f"Generate study notes for the following section.\n\n"
            f"Section title: {section.title}\n"
            f"Subject: {config.subject_name}\n"
            f"Source content:\n{section.text[:4000]}\n"
            f"\n{image_desc}\n\n"
            "Return a JSON object with exactly these fields:\n"
            "{\n"
            '  "key_concepts": ["concept 1", "concept 2", ...],\n'
            '  "explanation": "2-4 paragraphs with markdown formatting",\n'
            '  "examples": "concrete examples or empty string",\n'
            '  "summary": "2-3 sentence takeaway"\n'
            "}"
        )

        await _session_service.create_session(
            app_name=section_loop.name,
            user_id=user_id,
            session_id=session_id,
        )

        message = genai_types.Content(
            parts=[genai_types.Part(text=user_message_text)],
            role="user",
        )

        try:
            response_text: str | None = None
            async for event in _runner.run_async(
                agent=section_loop,
                user_id=user_id,
                session_id=session_id,
                new_message=message,
            ):
                if event.is_final_response():
                    response_text = event.content.parts[0].text
                    break

            # Prefer the stored section_json from state over the final event text;
            # the LoopAgent's last sub-agent (reflector) may have overwritten it.
            session = await _session_service.get_session(
                app_name=section_loop.name,
                user_id=user_id,
                session_id=session_id,
            )
            state_json: str = session.state.get("section_json") or response_text or ""

            cleaned = state_json.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```[a-z]*\n?", "", cleaned).rstrip("```").strip()
            data: dict[str, Any] = json.loads(cleaned)

            # Recover score from state so we can populate SectionResult.quality_score.
            score = 0
            raw_score = session.state.get("score_result", "")
            if raw_score:
                try:
                    score_data = json.loads(raw_score.strip())
                    score = int(score_data.get("score", 0))
                except Exception:
                    pass

            mdx = _build_mdx(section, data, images, config)

            if job_id:
                from pipeline.job_status import advance_section
                advance_section(job_id)

            return SectionResult(
                index=section.index,
                title=section.title,
                mdx=mdx,
                quality_score=score,
            )

        except Exception as exc:
            return SectionResult(
                index=section.index,
                title=section.title,
                mdx=f"## {section.title}\n\n*(Generation failed)*",
                warning=str(exc),
            )


# ── Public API (drop-in for generate_all_sections) ───────────────────────────

async def generate_all_sections_adk(
    doc: ExtractedDocument,
    config: GenConfig,
    image_decisions: dict[str, str] | None = None,
    job_id: str | None = None,
    concurrency: int = 5,
) -> list[SectionResult]:
    if image_decisions is None:
        image_decisions = {}

    semaphore = asyncio.Semaphore(concurrency)

    def _included_images(section: Section) -> list[ExtractedImage]:
        if not doc.images:
            return []
        page_range = range(section.page_start, section.page_end + 1)
        return [
            img for img in doc.images
            if img.page in page_range and image_decisions.get(img.id) == "include"
        ]

    tasks = [
        _run_section_adk(section, _included_images(section), config, semaphore, job_id)
        for section in doc.sections
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    clean: list[SectionResult] = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"  Section {i} failed: {result}")
            clean.append(SectionResult(
                index=doc.sections[i].index,
                title=doc.sections[i].title,
                mdx=f"## {doc.sections[i].title}\n\n*(Generation failed)*",
                warning=str(result),
            ))
        else:
            clean.append(result)  # type: ignore[arg-type]

    return sorted(clean, key=lambda r: r.index)

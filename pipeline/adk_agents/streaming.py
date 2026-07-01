"""Streaming-aware ADK pipeline runner.

Wraps ``generate_all_sections_adk`` so callers can receive live section
progress via an async generator instead of waiting for the full batch.
"""
from __future__ import annotations

import asyncio
from typing import AsyncIterator

from pipeline.adk_agents.section_agent import _run_section_adk, SectionResult
from pipeline.extractors.base import ExtractedDocument, ExtractedImage, Section
from pipeline.section_pipeline import GenConfig


async def stream_sections(
    doc: ExtractedDocument,
    config: GenConfig,
    image_decisions: dict[str, str] | None = None,
    job_id: str | None = None,
    concurrency: int = 5,
) -> AsyncIterator[SectionResult]:
    """Yield each SectionResult as soon as it completes (order may vary).

    Identical inputs to ``generate_all_sections_adk`` but yields results
    incrementally rather than returning a sorted list at the end.
    """
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

    queue: asyncio.Queue[SectionResult | BaseException] = asyncio.Queue()

    async def _worker(section: Section) -> None:
        result = await _run_section_adk(
            section, _included_images(section), config, semaphore, job_id
        )
        await queue.put(result)

    tasks = [asyncio.create_task(_worker(s)) for s in doc.sections]
    total = len(tasks)
    received = 0

    while received < total:
        item = await queue.get()
        received += 1
        if isinstance(item, BaseException):
            continue
        yield item

    await asyncio.gather(*tasks, return_exceptions=True)

"""Optional pre-generation agent: extract structured learning requirements from free text.

Not yet wired into orchestrator.run(); a follow-up can add a --requirements <file>
arg that feeds the result into GenConfig / the quiz prompt.
"""
from __future__ import annotations
from pipeline import gemini_client
from pipeline.config import GEMINI_FLASH_LITE
from pipeline.prompts_loader import load_prompt

_SYSTEM = load_prompt("system_requirements_agent")


async def extract_requirements(text: str) -> dict:
    result = await gemini_client.json_call(text, system=_SYSTEM, model=GEMINI_FLASH_LITE)
    return result if isinstance(result, dict) else {}

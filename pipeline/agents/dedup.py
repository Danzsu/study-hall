"""Deduplication agent: flags NEW_QUESTIONS that duplicate EXISTING_QUESTIONS."""
from __future__ import annotations
import json
from pipeline import gemini_client
from pipeline.config import GEMINI_FLASH_LITE
from pipeline.prompts_loader import load_prompt
from pipeline.agents.quiz_schema import build_new_question_refs

_SYSTEM = load_prompt("system_dedup_agent")


async def find_duplicates(new_questions: list[dict], existing_questions: list[dict]) -> list[dict]:
    if not new_questions or not existing_questions:
        return []
    user = (
        "NEW_QUESTIONS:\n" + json.dumps(build_new_question_refs(new_questions), ensure_ascii=False)
        + "\n\nEXISTING_QUESTIONS:\n" + json.dumps(existing_questions, ensure_ascii=False)
    )
    result = await gemini_client.json_call(user, system=_SYSTEM, model=GEMINI_FLASH_LITE)
    return result if isinstance(result, list) else []

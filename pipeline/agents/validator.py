"""Answer-validation agent: verifies quiz answers against source chunks (+ optional web)."""
from __future__ import annotations
import json
from pipeline import gemini_client
from pipeline.config import GEMINI_FLASH
from pipeline.prompts_loader import load_prompt
from pipeline.agents.quiz_schema import to_prompt_shape, apply_validation

_SYSTEM = load_prompt("system_validator_agent")


def build_source_chunks(sections) -> list[dict]:
    return [
        {"chunk_id": f"chunk_{s.index}", "text": (s.title + "\n" + s.text).strip()}
        for s in sections if (s.text or "").strip()
    ]


async def validate_answers(questions: list[dict], source_chunks: list[dict],
                           web_results: list[dict] | None = None) -> list[dict]:
    if not questions:
        return questions
    user = (
        "SOURCE_CHUNKS:\n" + json.dumps(source_chunks, ensure_ascii=False)
        + "\n\nWEB_RESULTS:\n" + json.dumps(web_results or [], ensure_ascii=False)
        + "\n\nQUESTIONS:\n" + json.dumps([to_prompt_shape(q) for q in questions], ensure_ascii=False)
    )
    result = await gemini_client.json_call(user, system=_SYSTEM, model=GEMINI_FLASH)
    if not isinstance(result, list):
        return questions
    by_id = {str(r.get("ID")): r for r in result if isinstance(r, dict)}
    out = []
    for q in questions:
        r = by_id.get(str(q.get("id")))
        v = r.get("validation") if isinstance(r, dict) else None
        out.append(apply_validation(q, v) if isinstance(v, dict) else q)
    return out

"""Pydantic models for all Study Hall content types.

Used by agents to validate LLM output before saving to JSON.
Extra fields are silently ignored; wrong types are coerced where possible.
"""
from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator, ValidationError


class _Base(BaseModel):
    model_config = {"extra": "ignore", "populate_by_name": True}


# ── Questions ─────────────────────────────────────────────────────────────────

class MCQQuestion(_Base):
    id: str = ""
    type: Literal["mcq"] = "mcq"
    question: str
    options: list[str] = Field(default_factory=list)
    correct: int = 0
    explanation: str = ""
    section: str = "General"
    difficulty: str = "medium"

    @field_validator("correct", mode="before")
    @classmethod
    def coerce_int(cls, v: Any) -> int:
        try:
            return int(v)
        except (ValueError, TypeError):
            return 0

    @field_validator("difficulty", mode="before")
    @classmethod
    def normalize_difficulty(cls, v: Any) -> str:
        s = str(v).lower().strip()
        return s if s in ("easy", "medium", "hard") else "medium"


class MultiQuestion(_Base):
    id: str = ""
    type: Literal["multi"] = "multi"
    question: str
    options: list[str] = Field(default_factory=list)
    correct: list[int] = Field(default_factory=list)
    explanation: str = ""
    section: str = "General"
    difficulty: str = "medium"

    @field_validator("correct", mode="before")
    @classmethod
    def coerce_list(cls, v: Any) -> list[int]:
        if isinstance(v, list):
            return [int(x) for x in v]
        if isinstance(v, (int, float)):
            return [int(v)]
        if isinstance(v, str):
            return [int(x.strip()) for x in v.split(",") if x.strip()]
        return []

    @field_validator("difficulty", mode="before")
    @classmethod
    def normalize_difficulty(cls, v: Any) -> str:
        s = str(v).lower().strip()
        return s if s in ("easy", "medium", "hard") else "medium"


class WrittenQuestion(_Base):
    id: str = ""
    type: Literal["written"] = "written"
    question: str
    model_answer: str = ""
    key_points: list[str] = Field(default_factory=list)
    section: str = "General"
    difficulty: str = "hard"


# ── Flashcard ─────────────────────────────────────────────────────────────────

class Flashcard(_Base):
    id: str = ""
    question: str
    answer: str
    explanation: str = ""
    tags: list[str] = Field(default_factory=list)


# ── Glossary ──────────────────────────────────────────────────────────────────

class GlossaryTerm(_Base):
    id: str = ""
    term: str
    definition: str
    category: str = "General"


# ── Active Recall ─────────────────────────────────────────────────────────────

class ActiveRecallItem(_Base):
    question: str
    answer: str


# ── Helpers ───────────────────────────────────────────────────────────────────

_QUESTION_MODELS = {
    "mcq": MCQQuestion,
    "multi": MultiQuestion,
    "written": WrittenQuestion,
}


def _normalize_question_payload(raw: dict, q_type: str) -> dict:
    payload = dict(raw)
    payload["question"] = payload.get("question") or payload.get("q") or ""
    if q_type == "written":
        payload["model_answer"] = payload.get("model_answer") or payload.get("model_answer_text") or payload.get("ideal") or payload.get("answer") or ""
        payload["key_points"] = payload.get("key_points") or payload.get("keywords") or payload.get("keyPoints") or []
    else:
        payload["options"] = payload.get("options") or payload.get("opts") or []
        if "correct" not in payload and "answer" in payload:
            payload["correct"] = payload["answer"]
        payload["explanation"] = payload.get("explanation") or payload.get("explain") or ""
    return payload


def parse_question(raw: dict, idx: int, existing_count: int) -> dict | None:
    """Validate a raw question dict via Pydantic. Returns None on failure."""
    q_type = str(raw.get("type", "mcq")).lower().strip()
    model_cls = _QUESTION_MODELS.get(q_type)
    if model_cls is None:
        print(f"  Skipping unknown question type '{q_type}' at index {idx}")
        return None
    try:
        obj = model_cls(**_normalize_question_payload(raw, q_type))
        d = obj.model_dump()
        d["id"] = f"q{existing_count + idx + 1}"
        return d
    except ValidationError as e:
        print(f"  Skipping question {idx} ({q_type}): {e.error_count()} error(s)")
        return None


def _normalize_flashcard_payload(raw: dict) -> dict:
    payload = dict(raw)
    payload["question"] = payload.get("question") or payload.get("front") or payload.get("term") or payload.get("full") or ""
    payload["answer"] = payload.get("answer") or payload.get("back") or payload.get("definition") or payload.get("def") or ""
    return payload


def parse_flashcard(raw: dict, idx: int, existing_count: int) -> dict | None:
    """Validate a raw flashcard dict. Returns None on failure."""
    try:
        obj = Flashcard(**_normalize_flashcard_payload(raw))
        d = obj.model_dump()
        d["id"] = f"fc{existing_count + idx + 1}"
        return d
    except ValidationError as e:
        print(f"  Skipping flashcard {idx}: {e.error_count()} error(s)")
        return None


def _normalize_glossary_payload(raw: dict) -> dict:
    payload = dict(raw)
    payload["term"] = payload.get("term") or payload.get("full") or payload.get("front") or ""
    payload["definition"] = payload.get("definition") or payload.get("def") or payload.get("back") or ""
    payload["category"] = payload.get("category") or payload.get("section") or "General"
    return payload


def parse_glossary_term(raw: dict, idx: int, existing_count: int) -> dict | None:
    """Validate a raw glossary term dict. Returns None on failure."""
    try:
        obj = GlossaryTerm(**_normalize_glossary_payload(raw))
        d = obj.model_dump()
        d["id"] = f"g{existing_count + idx + 1}"
        return d
    except ValidationError as e:
        print(f"  Skipping glossary term {idx}: {e.error_count()} error(s)")
        return None

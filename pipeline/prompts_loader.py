"""Load prompt templates from repo-root/prompts/*.txt (shared with the Node side)."""
from __future__ import annotations
from functools import lru_cache
from pathlib import Path

_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


@lru_cache(maxsize=None)
def load_prompt(name: str) -> str:
    fname = name if name.endswith(".txt") else f"{name}.txt"
    path = _PROMPTS_DIR / fname
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8")

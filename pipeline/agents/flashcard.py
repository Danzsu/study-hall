"""Flashcard agent: generates Q&A flashcard pairs."""
import json
from pathlib import Path
from pipeline.groq_client import chat_with_fallback, parse_json_response
from pipeline.models import parse_flashcard

FLASHCARD_PROMPT = """Create 8-15 flashcards from the following study content.

Rules:
- Question: concise, tests ONE concept (1-2 sentences max)
- Answer: 1-2 sentence direct answer — what you'd write on an exam
- Explanation: 2-3 sentences with context, "why", or example
- Tags: 1-3 category labels (e.g. ["ML Concepts", "Theory"])

Return JSON object with key "flashcards":
{{
  "flashcards": [
    {{
      "question": "What does tf.data.Dataset.prefetch() do?",
      "answer": "Schedules future batch preparation asynchronously to eliminate GPU idle time.",
      "explanation": "Prefetch runs data preprocessing for batch N+1 while the model trains on batch N. Use tf.data.AUTOTUNE to let TensorFlow choose the optimal buffer size.",
      "tags": ["TF Ecosystem", "Performance"]
    }}
  ]
}}

Content:
---
{content}
---

Return ONLY valid JSON."""


def generate_flashcards(content: str, existing_count: int = 0) -> list:
    """Generate and validate flashcards from content."""
    raw = chat_with_fallback(
        messages=[{"role": "user", "content": FLASHCARD_PROMPT.format(content=content[:7000])}],
        max_tokens=2500,
        temperature=0.3,
        json_mode=True,
        prefer_fast=True,
    )

    try:
        data = parse_json_response(raw)
        raw_list = data.get("flashcards", data) if isinstance(data, dict) else data
        if not isinstance(raw_list, list):
            return []
        cards = [
            c for i, item in enumerate(raw_list)
            if (c := parse_flashcard(item, i, existing_count)) is not None
        ]
        return cards
    except Exception as e:
        print(f"  Warning: Could not parse flashcards JSON: {e}")
        return []


def save_flashcards(cards: list, output_dir: Path) -> Path:
    """Save flashcards JSON, merging with existing."""
    out_path = output_dir / "flashcards.json"
    existing = []
    if out_path.exists():
        try:
            existing = json.loads(out_path.read_text(encoding="utf-8"))
        except Exception:
            existing = []
    merged = existing + cards
    out_path.write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")
    return out_path

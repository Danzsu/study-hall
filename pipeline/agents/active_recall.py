"""Active Recall agent: generates learning objectives and self-check Q&A pairs."""
from pipeline.groq_client import chat_with_fallback, parse_json_response
from pipeline.models import ActiveRecallItem

LESSON_META_PROMPT = """Analyze these study notes and generate two things in one response.

1. LEARNING OBJECTIVES (3-5 items)
   - Start with an action verb: explain, describe, compare, apply, calculate, identify
   - Specific and testable — what a student can do after studying this lesson
   - Example: "Explain the bias-variance tradeoff and its implications for model selection"

2. ACTIVE RECALL QUESTIONS (3-5 Q&A pairs)
   - Questions that test the most important concepts
   - Not trivial — require synthesis, not just recall
   - Answers: 2-4 sentences, exam-quality

Return JSON:
{{
  "learning_objectives": [
    "Explain the bias-variance tradeoff and its implications for model selection",
    "Describe L1 vs L2 regularization and when to prefer each"
  ],
  "active_recall": [
    {{
      "question": "What is the bias-variance tradeoff and why does it matter?",
      "answer": "The bias-variance tradeoff describes the tension between fitting training data and generalizing to new data. High bias causes underfitting, high variance causes overfitting. Total error = bias² + variance + irreducible noise."
    }}
  ]
}}

Study notes:
---
{content}
---

Return ONLY valid JSON."""


def generate_lesson_meta(notes_body: str) -> dict:
    """
    Generate learning objectives and active recall Q&A from notes body.
    Returns {"learning_objectives": [...], "active_recall": [{"question": ..., "answer": ...}]}
    """
    raw = chat_with_fallback(
        messages=[{"role": "user", "content": LESSON_META_PROMPT.format(content=notes_body[:5000])}],
        max_tokens=1500,
        temperature=0.3,
        json_mode=True,
        prefer_fast=True,
    )
    try:
        data = parse_json_response(raw)
        if not isinstance(data, dict):
            return {"learning_objectives": [], "active_recall": []}

        objectives = [str(lo) for lo in data.get("learning_objectives", [])][:5]

        recall_items = []
        for raw_item in data.get("active_recall", [])[:5]:
            try:
                item = ActiveRecallItem(**raw_item)
                recall_items.append(item.model_dump())
            except Exception:
                pass

        return {"learning_objectives": objectives, "active_recall": recall_items}
    except Exception as e:
        print(f"  Warning: Could not parse lesson meta JSON: {e}")
        return {"learning_objectives": [], "active_recall": []}

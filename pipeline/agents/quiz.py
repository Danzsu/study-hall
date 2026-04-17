"""Quiz agent: generates MCQ, multi-select, and written questions."""
import json
from pathlib import Path
from pipeline.groq_client import chat_with_fallback, parse_json_response
from pipeline.models import parse_question

QUIZ_SYSTEM = """You are a university exam question writer.
Generate high-quality, exam-style questions that test genuine understanding — not just memorization.
Questions should be:
- Specific and unambiguous
- Plausible distractors for MCQ (wrong answers should seem reasonable)
- Written questions that require synthesis, not just recall"""

QUIZ_PROMPT = """Generate exam questions from the following study content.

Generate:
- 5-8 multiple choice questions (type "mcq") with 4 options, one correct
- 2-3 multi-select questions (type "multi") where multiple answers are correct — state "pick N" in the question
- 2-3 written/essay questions (type "written") requiring explanation and synthesis

Return a JSON object with key "questions" containing an array. Each question:

MCQ format:
{{
  "type": "mcq",
  "question": "Question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Why this answer is correct and why others are wrong.",
  "section": "Section name from content",
  "difficulty": "easy|medium|hard"
}}

Multi-select format:
{{
  "type": "multi",
  "question": "Question text? (pick 3)",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": [0, 2, 3],
  "explanation": "Why these answers are correct.",
  "section": "Section name",
  "difficulty": "medium|hard"
}}

Written format:
{{
  "type": "written",
  "question": "Explain/describe/analyze question?",
  "model_answer": "A comprehensive 3-5 sentence model answer.",
  "key_points": ["point1", "point2", "point3"],
  "section": "Section name",
  "difficulty": "hard"
}}

Content:
---
{content}
---

Subject: {subject_name}

Return ONLY valid JSON with key "questions"."""


def generate_questions(content: str, subject_name: str, existing_count: int = 0) -> list:
    """Generate and validate questions from content. Returns list of question dicts."""
    raw = chat_with_fallback(
        messages=[
            {"role": "system", "content": QUIZ_SYSTEM},
            {"role": "user", "content": QUIZ_PROMPT.format(
                content=content[:8000],
                subject_name=subject_name,
            )},
        ],
        max_tokens=3500,
        temperature=0.4,
        json_mode=True,
    )

    try:
        data = parse_json_response(raw)
        raw_list = data.get("questions", data) if isinstance(data, dict) else data
        if not isinstance(raw_list, list):
            return []
        questions = [
            q for i, item in enumerate(raw_list)
            if (q := parse_question(item, i, existing_count)) is not None
        ]
        return questions
    except Exception as e:
        print(f"  Warning: Could not parse questions JSON: {e}")
        print(f"  Raw response preview: {raw[:200]}")
        return []


def save_questions(questions: list, output_dir: Path) -> Path:
    """Save questions JSON, merging with existing."""
    out_path = output_dir / "questions.json"
    existing = []
    if out_path.exists():
        try:
            existing = json.loads(out_path.read_text(encoding="utf-8"))
        except Exception:
            existing = []

    merged = existing + questions
    out_path.write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")
    return out_path

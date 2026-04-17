"""Glossary agent: extracts key terms and definitions."""
import json
from pathlib import Path
from pipeline.groq_client import chat_with_fallback, parse_json_response
from pipeline.models import parse_glossary_term

GLOSSARY_PROMPT = """Extract key technical terms and definitions from the following content.

Rules:
- Extract 10-25 important terms that a student should know
- Definition: 2-3 sentences — precise but accessible
- Category: assign to a meaningful category (e.g. "ML Concepts", "GCP Core", "TF Ecosystem", "Privacy", "Math")
- Prioritize terms a student would need to define on an exam

Return JSON object with key "terms":
{{
  "terms": [
    {{
      "term": "Dropout",
      "definition": "A regularization technique that randomly sets a fraction of neurons to zero during each training step. This prevents co-adaptation between neurons and forces the network to learn more robust, distributed representations.",
      "category": "ML Concepts"
    }}
  ]
}}

Content:
---
{content}
---

Return ONLY valid JSON."""


def generate_glossary(content: str, existing_count: int = 0) -> list:
    """Generate and validate glossary terms from content."""
    raw = chat_with_fallback(
        messages=[{"role": "user", "content": GLOSSARY_PROMPT.format(content=content[:7000])}],
        max_tokens=2500,
        temperature=0.2,
        json_mode=True,
        prefer_fast=True,
    )

    try:
        data = parse_json_response(raw)
        raw_list = data.get("terms", data) if isinstance(data, dict) else data
        if not isinstance(raw_list, list):
            return []
        terms = [
            t for i, item in enumerate(raw_list)
            if (t := parse_glossary_term(item, i, existing_count)) is not None
        ]
        return terms
    except Exception as e:
        print(f"  Warning: Could not parse glossary JSON: {e}")
        return []


def save_glossary(terms: list, output_dir: Path) -> Path:
    """Save glossary JSON, merging with existing (deduplicates by term name)."""
    out_path = output_dir / "glossary.json"
    existing = []
    if out_path.exists():
        try:
            existing = json.loads(out_path.read_text(encoding="utf-8"))
        except Exception:
            existing = []

    existing_lower = {t["term"].lower() for t in existing}
    new_terms = [t for t in terms if t["term"].lower() not in existing_lower]
    merged = existing + new_terms
    out_path.write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")
    return out_path

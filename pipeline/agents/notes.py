"""Notes agent: generates humanized MDX study notes with LaTeX math."""
import re
from pathlib import Path
from pipeline.groq_client import chat_with_fallback
from pipeline.agents.active_recall import generate_lesson_meta


NOTES_SYSTEM = """You are a knowledgeable university professor writing study notes for your students.
Your writing style is:
- Clear, engaging, and slightly conversational — like a professor explaining in office hours
- NOT generic AI text — use specific examples, analogies, and "why it matters" context
- Well-structured with headers, bullet points, and emphasis
- Mathematically precise when needed (use LaTeX)
- Include tables for comparisons
- End each major section with a brief "Key Takeaway" callout"""

NOTES_PROMPT = """Create comprehensive study notes from the following lecture content.

IMPORTANT: Write as a knowledgeable professor — humanized, specific, with real examples.

Format requirements:
- Use ## for main sections, ### for subsections
- Bullet lists for enumeration: use -
- Bold key terms: **term**
- Inline LaTeX for formulas: $formula$
- Block LaTeX for important equations: $$formula$$
- Code blocks for code examples: ```python ... ```
- Tables for comparisons: | Col | Col | --- | --- |
- Callouts: > **Key Takeaway:** ...

Source material (raw lecture content):
---
{content}
---

Subject: {subject_name}
Target audience: University students preparing for exams

Write the study notes body ONLY — no frontmatter, no markdown fences around the entire output."""


def _yaml_str(s: str) -> str:
    """Single-quote a string for YAML — only ' needs escaping (as '')."""
    return "'" + s.replace("'", "''") + "'"


def estimate_read_time(text: str) -> int:
    """Estimate reading time in minutes (avg 200 words/min)."""
    words = len(text.split())
    return max(1, round(words / 200))


def _build_frontmatter(
    title: str,
    lesson_num: int,
    section: str,
    read_time: int,
    source_file: str,
    learning_objectives: list[str],
    active_recall: list[dict],
) -> str:
    lo_block = ""
    if learning_objectives:
        lo_lines = "\n".join(f"  - {_yaml_str(lo)}" for lo in learning_objectives)
        lo_block = f"learningObjectives:\n{lo_lines}\n"

    ar_block = ""
    if active_recall:
        ar_lines = "\n".join(
            f"  - question: {_yaml_str(q['question'])}\n    answer: {_yaml_str(q['answer'])}"
            for q in active_recall
        )
        ar_block = f"activeRecall:\n{ar_lines}\n"

    return (
        f"---\n"
        f"title: {_yaml_str(title)}\n"
        f"lesson: {lesson_num}\n"
        f"section: {_yaml_str(section)}\n"
        f"readTime: {read_time}\n"
        f"{lo_block}"
        f"{ar_block}"
        f"sources:\n"
        f"  - type: 'pdf'\n"
        f"    title: {_yaml_str(source_file)}\n"
        f"---\n\n"
    )


def generate_notes(
    content: str,
    subject_name: str,
    lesson_num: int,
    source_file: str,
    section: str = "General",
    title: str | None = None,
) -> str:
    """Generate MDX notes from raw text content. Returns full MDX string."""
    body = chat_with_fallback(
        messages=[
            {"role": "system", "content": NOTES_SYSTEM},
            {"role": "user", "content": NOTES_PROMPT.format(
                content=content[:9000],
                subject_name=subject_name,
            )},
        ],
        max_tokens=2500,
        temperature=0.35,
        json_mode=False,
    )

    if not title:
        match = re.search(r'^## (.+)$', body, re.MULTILINE)
        title = match.group(1) if match else f"Lesson {lesson_num}"

    read_time = estimate_read_time(body)

    print("  Generating learning objectives + active recall...")
    meta = generate_lesson_meta(body)

    frontmatter = _build_frontmatter(
        title=title,
        lesson_num=lesson_num,
        section=section,
        read_time=read_time,
        source_file=source_file,
        learning_objectives=meta["learning_objectives"],
        active_recall=meta["active_recall"],
    )
    return frontmatter + body


def save_notes(mdx_content: str, output_dir: Path, lesson_num: int) -> Path:
    """Save MDX notes to the notes directory."""
    notes_dir = output_dir / "notes"
    notes_dir.mkdir(parents=True, exist_ok=True)

    match = re.search(r'^title: [\'"](.+?)[\'"]', mdx_content, re.MULTILINE)
    raw_title = match.group(1) if match else f"lesson-{lesson_num}"
    slug = re.sub(r'[^a-z0-9]+', '-', raw_title.lower()).strip('-')[:40]

    out_path = notes_dir / f"{lesson_num:02d}-{slug}.mdx"
    out_path.write_text(mdx_content, encoding="utf-8")
    return out_path

#!/usr/bin/env python3
"""
Study Hall — Content Processing Pipeline

Usage:
  python pipeline/process.py path/to/file.pdf --subject my-subject
  python pipeline/process.py slides.pptx --subject stats --name "Statistics" --section "Week 1"
  python pipeline/process.py file.pdf --subject ml --only quiz
  python pipeline/process.py --test --subject demo   (dry-run with built-in sample text)
"""
import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from pipeline.config import CONTENT_DIR, GROQ_API_KEY, OPENROUTER_API_KEY
from pipeline.agents.ingest import ingest
from pipeline.agents.notes import generate_notes, save_notes
from pipeline.agents.quiz import generate_questions, save_questions
from pipeline.agents.flashcard import generate_flashcards, save_flashcards
from pipeline.agents.glossary import generate_glossary, save_glossary

SAMPLE_TEXT = """
Machine Learning Fundamentals

Supervised Learning maps inputs to outputs using labeled training examples.
Common algorithms: linear regression, decision trees, SVMs, neural networks.

The bias-variance tradeoff: High bias (underfitting) = model too simple.
High variance (overfitting) = model memorizes noise.
Total error = bias^2 + variance + irreducible noise.

Regularization techniques:
- L1 (Lasso): penalizes absolute weights, produces sparse models
- L2 (Ridge): penalizes squared weights, shrinks all weights
- Dropout: randomly zeros neurons during training

Cross-validation: split data into k folds, train on k-1, validate on 1.
Average score gives reliable generalization estimate.

Feature Engineering: using domain knowledge to create informative features.
Often more impactful than model choice.
"""


# ── Console helpers ───────────────────────────────────────────────────────────

def step(msg: str) -> None:
    print("\n" + "─" * 50)
    print("  " + msg)
    print("─" * 50)


def ok(msg: str) -> None:
    print("  ✓ " + msg)


def warn(msg: str) -> None:
    print("  ⚠ " + msg)


# ── Subject helpers ───────────────────────────────────────────────────────────

def ensure_subject(slug: str, name: str, description: str, section: str = "General") -> Path:
    """Create subject directory, add to subjects.json, create/update meta.json."""
    subject_dir = CONTENT_DIR / slug
    subject_dir.mkdir(parents=True, exist_ok=True)

    desc = description or f"Study materials for {name}"

    # ── subjects.json ──────────────────────────────────────────────────────────
    subjects_file = CONTENT_DIR / "subjects.json"
    subjects: list = []
    if subjects_file.exists():
        try:
            subjects = json.loads(subjects_file.read_text(encoding="utf-8"))
        except Exception:
            subjects = []

    if not any(s["slug"] == slug for s in subjects):
        subjects.append({
            "slug": slug,
            "name": name,
            "description": desc,
            "color": "#E07355",
            "icon": "book",
            "questionCount": 0,
            "lessonCount": 0,
            "flashcardCount": 0,
            "glossaryCount": 0,
        })
        subjects_file.write_text(json.dumps(subjects, indent=2, ensure_ascii=False), encoding="utf-8")
        ok("Created new subject: " + name + " (" + slug + ")")
    else:
        ok("Found existing subject: " + name)

    # ── meta.json ──────────────────────────────────────────────────────────────
    meta_file = subject_dir / "meta.json"
    if meta_file.exists():
        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            if section not in meta.get("sections", []):
                meta.setdefault("sections", []).append(section)
                meta_file.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
                ok("Added section '" + section + "' to meta.json")
        except Exception:
            pass
    else:
        meta = {
            "slug": slug,
            "name": name,
            "description": desc,
            "color": "#E07355",
            "icon": "book",
            "sections": [section],
        }
        meta_file.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
        ok("Created meta.json")

    return subject_dir


def update_subject_counts(slug: str, subject_dir: Path) -> None:
    """Recount and persist subject stats in subjects.json."""
    subjects_file = CONTENT_DIR / "subjects.json"
    if not subjects_file.exists():
        return
    try:
        subjects = json.loads(subjects_file.read_text(encoding="utf-8"))
    except Exception:
        return

    for s in subjects:
        if s["slug"] != slug:
            continue
        s["questionCount"] = _count_json(subject_dir / "questions.json")
        s["flashcardCount"] = _count_json(subject_dir / "flashcards.json")
        s["glossaryCount"] = _count_json(subject_dir / "glossary.json")
        notes_dir = subject_dir / "notes"
        s["lessonCount"] = len(list(notes_dir.glob("*.mdx"))) if notes_dir.exists() else 0

    subjects_file.write_text(json.dumps(subjects, indent=2, ensure_ascii=False), encoding="utf-8")


def _count_json(path: Path) -> int:
    try:
        return len(json.loads(path.read_text(encoding="utf-8")))
    except Exception:
        return 0


# ── Per-agent runner helpers ──────────────────────────────────────────────────

def run_notes(content: str, subject_dir: Path, name: str, source_file: str, section: str) -> None:
    step("Generating study notes")
    notes_dir = subject_dir / "notes"
    lesson_num = len(list(notes_dir.glob("*.mdx"))) + 1 if notes_dir.exists() else 1
    try:
        mdx = generate_notes(content, name, lesson_num, source_file, section)
        out = save_notes(mdx, subject_dir, lesson_num)
        ok("Saved: " + str(out.relative_to(ROOT)))
    except Exception as exc:
        warn("Notes generation failed: " + str(exc))


_MSG_GENERATED = "Generated "


def run_quiz(content: str, subject_dir: Path, name: str) -> None:
    step("Generating quiz questions")
    existing = _count_json(subject_dir / "questions.json")
    try:
        questions = generate_questions(content, name, existing)
        out = save_questions(questions, subject_dir)
        ok(_MSG_GENERATED + str(len(questions)) + " questions → " + str(out.relative_to(ROOT)))
    except Exception as exc:
        warn("Quiz generation failed: " + str(exc))


def run_flashcards(content: str, subject_dir: Path) -> None:
    step("Generating flashcards")
    existing = _count_json(subject_dir / "flashcards.json")
    try:
        cards = generate_flashcards(content, existing)
        out = save_flashcards(cards, subject_dir)
        ok(_MSG_GENERATED + str(len(cards)) + " flashcards → " + str(out.relative_to(ROOT)))
    except Exception as exc:
        warn("Flashcard generation failed: " + str(exc))


def run_glossary(content: str, subject_dir: Path) -> None:
    step("Generating glossary")
    existing = _count_json(subject_dir / "glossary.json")
    try:
        terms = generate_glossary(content, existing)
        out = save_glossary(terms, subject_dir)
        ok(_MSG_GENERATED + str(len(terms)) + " terms → " + str(out.relative_to(ROOT)))
    except Exception as exc:
        warn("Glossary generation failed: " + str(exc))


# ── Agent dispatcher ─────────────────────────────────────────────────────────

def _dispatch_agents(
    only: str | None,
    content: str,
    subject_dir: Path,
    name: str,
    source_file: str,
    section: str,
) -> None:
    """Run the selected agents (or all of them when only=None)."""
    run_all = only is None
    if run_all or only == "notes":
        run_notes(content, subject_dir, name, source_file, section)
    if run_all or only == "quiz":
        run_quiz(content, subject_dir, name)
    if run_all or only == "flashcards":
        run_flashcards(content, subject_dir)
    if run_all or only == "glossary":
        run_glossary(content, subject_dir)


# ── CLI ───────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Study Hall content pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python pipeline/process.py lecture.pdf --subject machine-learning\n"
            "  python pipeline/process.py slides.pptx --subject stats --name 'Statistics'\n"
            "  python pipeline/process.py lecture.pdf --subject ml --only quiz\n"
            "  python pipeline/process.py --test --subject demo\n"
        ),
    )
    p.add_argument("input_file", nargs="?", help="Path to PDF or PPTX file")
    p.add_argument("--subject", required=True, help="Subject slug (kebab-case)")
    p.add_argument("--name", help="Subject display name (derived from slug if omitted)")
    p.add_argument("--description", default="", help="Subject description")
    p.add_argument("--section", default="General", help="Section/chapter name for these notes")
    p.add_argument("--only", choices=["notes", "quiz", "flashcards", "glossary"],
                   help="Run only one specific agent")
    p.add_argument("--test", action="store_true",
                   help="Dry-run with built-in sample text (no file needed)")
    return p


def main() -> None:
    args = build_parser().parse_args()

    if not args.test and not args.input_file:
        build_parser().error("input_file is required unless --test is used")

    if not GROQ_API_KEY and not OPENROUTER_API_KEY:
        print("\n❌ ERROR: No API key found.")
        print("   Add GROQ_API_KEY to .env.local (copy from .env.local.example)")
        sys.exit(1)

    slug = args.subject
    name = args.name or slug.replace("-", " ").title()

    print("\n📚 Study Hall Pipeline")
    print("   Subject : " + name + " (" + slug + ")")
    print("   Mode    : " + ("TEST (sample text)" if args.test else str(args.input_file)))
    if args.only:
        print("   Running : " + args.only + " only")
    print()

    subject_dir = ensure_subject(slug, name, args.description, args.section)
    content, source_file = _load_content(args, subject_dir)

    if len(content.strip()) < 100:
        warn("Very little content extracted. Check that the file contains readable text.")

    t_start = time.time()
    _dispatch_agents(args.only, content, subject_dir, name, source_file, args.section)

    update_subject_counts(slug, subject_dir)

    elapsed = time.time() - t_start
    print("\n" + "═" * 50)
    print("  ✅ Done in " + f"{elapsed:.1f}s")
    print("\n  Next steps:")
    print("    git add content/" + slug)
    print("    git commit -m 'Add " + name + " content'")
    print("    git push   → Vercel auto-deploys")
    print("═" * 50 + "\n")


def _load_content(args: argparse.Namespace, subject_dir: Path | None = None) -> tuple[str, str]:
    """Return (content_text, source_filename). Saves images to subject_dir/images/ if provided."""
    if args.test:
        content = SAMPLE_TEXT.strip()
        ok("Using sample text (" + str(len(content)) + " chars)")
        return content, "sample-text.txt"

    step("Ingesting document")
    file_path = Path(args.input_file)
    if not file_path.exists():
        print("\n❌ ERROR: File not found: " + str(file_path))
        sys.exit(1)

    images_dir = (subject_dir / "images") if subject_dir else None
    doc = ingest(file_path, images_dir=images_dir)
    content = doc["full_text"]
    ok("Extracted " + f"{len(content):,}" + " characters from " + str(len(doc["pages"])) + " pages")

    image_count = len(doc.get("image_paths", []))
    if image_count:
        ok("Saved " + str(image_count) + " images → " + str(images_dir.relative_to(ROOT)))

    return content, file_path.name


if __name__ == "__main__":
    main()

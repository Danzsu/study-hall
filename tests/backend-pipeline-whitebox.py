#!/usr/bin/env python3

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import fitz
from pptx import Presentation
from pptx.util import Inches

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pipeline.agents.ingest import extract_pdf, extract_pptx
from pipeline.models import parse_flashcard, parse_glossary_term, parse_question


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def build_sample_pdf(pdf_path: Path) -> None:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_textbox(
        fitz.Rect(72, 72, 520, 240),
        "Access control keeps systems safe.\n\nWhat is the main goal of least privilege?\nProtect resources by limiting permissions.",
    )
    doc.save(pdf_path)
    doc.close()


def build_sample_pptx(pptx_path: Path) -> None:
    prs = Presentation()
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    textbox = slide.shapes.add_textbox(Inches(1), Inches(1), Inches(7), Inches(3))
    frame = textbox.text_frame
    frame.text = "Threat Modeling"
    p = frame.add_paragraph()
    p.text = "Which assets need protection before deployment?"
    prs.save(pptx_path)


def check_ingest_shape() -> None:
    tmp_path = Path(__file__).resolve().parent / "_backend_pipeline_tmp"
    shutil.rmtree(tmp_path, ignore_errors=True)
    tmp_path.mkdir(parents=True, exist_ok=True)

    try:
        pdf_path = tmp_path / "sample.pdf"
        pptx_path = tmp_path / "sample.pptx"

        build_sample_pdf(pdf_path)
        build_sample_pptx(pptx_path)

        pdf_data = extract_pdf(pdf_path)
        ppt_data = extract_pptx(pptx_path)

        assert_true(pdf_data["source_file"] == "sample.pdf", "PDF source file should be preserved")
        assert_true(pdf_data["source_type"] == "pdf", "PDF source type should be pdf")
        assert_true(isinstance(pdf_data["pages"], list) and len(pdf_data["pages"]) == 1, "PDF pages should contain one page record")
        assert_true("What is the main goal" in pdf_data["full_text"], "PDF full text should contain extracted question text")
        assert_true(pdf_data["pages"][0]["page"] == 1, "PDF page numbering should start at 1")

        assert_true(ppt_data["source_file"] == "sample.pptx", "PPTX source file should be preserved")
        assert_true(ppt_data["source_type"] == "pptx", "PPTX source type should be pptx")
        assert_true(isinstance(ppt_data["pages"], list) and len(ppt_data["pages"]) == 1, "PPTX slides should contain one slide record")
        assert_true("Which assets need protection" in ppt_data["full_text"], "PPTX full text should contain extracted slide text")
        assert_true(ppt_data["pages"][0]["slide"] == 1, "PPTX slide numbering should start at 1")
    finally:
        shutil.rmtree(tmp_path, ignore_errors=True)


def check_generator_contracts() -> None:
    mcq = parse_question(
        {
            "type": "mcq",
            "question": "What is access control?",
            "options": ["Limit access", "Share everything", "Delete backups", "Disable login"],
            "correct": 0,
            "explanation": "It limits access to resources.",
            "section": "Access control",
            "difficulty": "easy",
        },
        0,
        0,
    )
    assert_true(mcq is not None, "MCQ should parse")
    assert_true(mcq["question"] == "What is access control?", "MCQ question should survive parsing")
    assert_true(mcq["correct"] == 0, "MCQ correct answer should survive parsing")

    written = parse_question(
        {
            "type": "written",
            "q": "Explain why threat modeling matters.",
            "ideal": "It identifies likely attacks before deployment.",
            "keywords": ["threats", "assets", "defenses"],
            "section": "Threat modeling",
            "difficulty": "hard",
        },
        1,
        0,
    )
    assert_true(written is not None, "Written question should parse")
    assert_true(written["question"] == "Explain why threat modeling matters.", "Written question alias should normalize")
    assert_true(written["model_answer"] == "It identifies likely attacks before deployment.", "Written model answer should normalize from ideal")
    assert_true(written["key_points"] == ["threats", "assets", "defenses"], "Written key points should normalize from keywords")

    flashcard = parse_flashcard(
        {
            "front": "What is a sample flashcard?",
            "back": "A compact review item.",
            "section": "Review",
            "abbr": "FC",
        },
        0,
        0,
    )
    assert_true(flashcard is not None, "Flashcard should parse")
    assert_true(flashcard["question"] == "What is a sample flashcard?", "Flashcard front should normalize to question")
    assert_true(flashcard["answer"] == "A compact review item.", "Flashcard back should normalize to answer")

    glossary = parse_glossary_term(
        {
            "full": "Least privilege",
            "def": "Grant only the permissions needed.",
            "category": "Access control",
        },
        0,
        0,
    )
    assert_true(glossary is not None, "Glossary term should parse")
    assert_true(glossary["term"] == "Least privilege", "Glossary term alias should normalize")
    assert_true(glossary["definition"] == "Grant only the permissions needed.", "Glossary definition alias should normalize")
    assert_true(glossary["category"] == "Access control", "Glossary category should survive normalization")


def main() -> None:
    check_ingest_shape()
    check_generator_contracts()
    print("Backend pipeline whitebox passed.")


if __name__ == "__main__":
    main()

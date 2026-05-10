# Backend Test Review

Scope: backend extraction/generation pipeline contracts in `pipeline/` and `scripts/`, with new smoke/whitebox coverage in `tests/`.

## Result

No blocking backend pipeline issue remains. I did find and close a compatibility gap in the question parser.

## Fixed During Review

### Medium
- **File:** `pipeline/models.py:115-179`
- **Issue:** The Python parser only accepted canonical field names for generated payloads. That made it brittle against common generator aliases such as `q`, `ideal`, `keywords`, `front`, `back`, and `def`.
- **Fix:** Added small normalization helpers so `parse_question`, `parse_flashcard`, and `parse_glossary_term` accept those aliases before Pydantic validation.

## Added Coverage

### Smoke
- **File:** `tests/backend-pipeline-smoke.js`
- **Covers:** chunking/source metadata shape plus fallback question, flashcard, and glossary generation compatibility on synthetic source text.

### Whitebox
- **File:** `tests/backend-pipeline-whitebox.py`
- **Covers:** PDF/PPTX ingestion metadata shape and the Python parser contracts for canonical and alias generator outputs.

## Verification

- `node tests/backend-pipeline-smoke.js` passed.
- `python tests/backend-pipeline-whitebox.py` passed.
- `npm.cmd run lint` passed.

# Test Validation Review

Scope: `tests/`, the route handlers under `app/api/`, and the shared content helpers in `lib/` and `scripts/` that the existing tests exercise indirectly.

## Current snapshot

The repo already has four lightweight test entry points:

- `tests/blackbox-smoke.js`
- `tests/whitebox-content.js`
- `tests/backend-pipeline-smoke.js`
- `tests/backend-pipeline-whitebox.py`

They cover the happy-path shape of the current `it_biztonsag` content, a few live API routes, and the backend generation pipeline. That is good baseline coverage, but it is still mostly smoke-level and mostly centered on one subject.

## Main gaps to watch

- Only one subject slug is exercised in depth.
- Negative API cases are thin, especially for `search` and `validate-answer`.
- Route coverage is narrow: the main page routes are only checked for HTML presence, not meaningful content or rendering state.
- Helper coverage is indirect; several shared functions in `lib/content.js` and `scripts/*` are not unit-tested at the boundary level.
- The backend pipeline checks synthetic happy paths, but not malformed, empty, or partially missing source shapes.

## Validation checklist

### Blackbox coverage

- [ ] `GET /api/health` returns JSON, `status=ok`, and a sane subject count.
- [ ] `GET /api/search` works with a real probe term from content and returns at least one result.
- [ ] `GET /api/search` rejects queries shorter than 2 chars.
- [ ] `GET /api/search` rejects unknown subjects.
- [ ] `GET /api/search` rejects invalid `type` values and accepts aliases like `note` and `question`.
- [ ] `POST /api/validate-answer` rejects an empty body with a stable 400 JSON error.
- [ ] `POST /api/validate-answer` accepts a valid written-answer payload and returns the documented response shape.
- [ ] `POST /api/validate-answer` rejects malformed JSON cleanly.
- [ ] `POST /api/validate-answer` rejects overlong payloads and overlong fields with 413.
- [ ] `GET /api/notes/[slug]` returns a lesson list for a real subject.
- [ ] `GET /api/notes/[slug]/[lesson]` returns note content for a real lesson and 404 for a missing one.
- [ ] Main pages return HTML and do not regress on route presence:
  - `/`
  - `/subject/[slug]`
  - `/study/[slug]`
  - `/search/[slug]`
  - `/onboarding`
  - `/glossary/[slug]`
- [ ] At least one second subject slug is smoke-tested so the suite is not single-subject only.

### Whitebox coverage

- [ ] `tests/whitebox-content.js` keeps subject counts aligned with `content/subjects.json`.
- [ ] `normalizeQuestion` is covered for `mcq`, `multi`, and `written` payload aliases.
- [ ] `normalizeFlashcard` is covered for `front/back` plus alias fields such as `question/answer`.
- [ ] `normalizeGlossary` is covered for `term/definition` plus alias fields such as `full/def`.
- [ ] `getNotesLessons()` is covered for both `lessons.json` and MDX frontmatter fallback mode.
- [ ] `getNoteContent()` is covered for active recall extraction and missing-file 404 behavior.
- [ ] `searchContent()` is covered for all supported result types:
  - notes
  - questions
  - glossary
  - flashcards
- [ ] `getSubjectSummary()` is covered so count derivation cannot drift from the raw content.
- [ ] A subject-agnostic fixture or loop checks that the same invariants hold for every subject entry, not only `it_biztonsag`.

### Unit coverage

- [ ] Add direct tests for `lib/content.js` normalization helpers and search ranking rules.
- [ ] Add direct tests for `app/api/search/route.js` query parsing and type normalization.
- [ ] Add direct tests for `app/api/validate-answer/route.js` payload normalization, size limits, and fallback response shape.
- [ ] Add direct tests for `pipeline/models.py` parser aliases and invalid input handling.
- [ ] Add direct tests for `scripts/document-chunker.js` and `scripts/source-intelligence.js` edge cases:
  - empty text
  - repeated headings
  - question-like lines that should stay `notes-review`
  - figure/table/equation markers
- [ ] Add direct tests for content validation scripts so schema drift is caught before route smoke fails.

## Validation commands

Use these commands in order when validating a test change:

```bash
node tests/whitebox-content.js
node tests/backend-pipeline-smoke.js
python tests/backend-pipeline-whitebox.py
```

For live route checks, start the dev server first, then run:

```bash
node tests/blackbox-smoke.js --base-url http://127.0.0.1:3000
node scripts/check-backend.js --base-url http://127.0.0.1:3000
```

For a fuller local sweep:

```bash
npm run test:smoke
npm run test:pipeline
npm run validate:content
npm run check:backend
npm run lint
npm run build
```

## Risk notes

- Single-subject coverage can hide content drift in other subjects.
- Smoke tests can pass even when response bodies are only barely valid, so negative-path tests matter.
- Live route checks depend on the dev server state and can look green while cached content or stale assets are wrong.
- `validate-answer` has external provider fallback behavior, so tests should separate shape validation from provider availability.
- Pipeline tests that only use synthetic source text may miss extraction regressions on real PDFs and PPTX files.
- Search can appear healthy if one probe term still works while other content types or aliases are broken.

## Done when

- [ ] The smoke suite covers happy path and at least one negative case for each public API.
- [ ] The whitebox suite exercises the shared normalization helpers directly.
- [ ] The pipeline suite catches malformed input and alias drift.
- [ ] The checklist above is either implemented or explicitly deferred with a reason.

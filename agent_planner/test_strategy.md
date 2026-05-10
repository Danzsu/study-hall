# Test Strategy

## Purpose

This document defines the test strategy for the current Study Hall repo.
It is aligned to the existing scripts, entrypoints, `PLAN.md`, and `agent_planner/task_board.md`.
It does not change runtime code and does not modify any existing tests.

## What the repo currently treats as stable

- `package.json` already exposes the main test entrypoints:
  - `npm run test:whitebox`
  - `npm run test:blackbox`
  - `npm run test:smoke`
  - `npm run test:pipeline`
- Existing test files already split the space into:
  - `tests/whitebox-content.js`
  - `tests/blackbox-smoke.js`
  - `tests/backend-pipeline-smoke.js`
  - `tests/backend-pipeline-whitebox.py`
- Main backend entrypoints:
  - `app/api/health/route.js`
  - `app/api/search/route.js`
  - `app/api/validate-answer/route.js`
  - content route families under `app/api/{subjects,notes,questions,flashcards,glossary}/...`
- Main frontend entrypoints:
  - `app/page.jsx`
  - `app/layout.jsx`
  - subject/content pages under `app/subject`, `app/study`, `app/quiz`, `app/written`, `app/review`, `app/flashcards`, `app/glossary`, `app/search`, `app/onboarding`, `app/settings`, `app/pomodoro`, `app/exam`, `app/wrong-answers`
- Core content contract lives in:
  - `lib/content.js`
  - `content/subjects.json`
  - `content/<slug>/notes/lessons.json`
  - `content/<slug>/questions.json`
  - `content/<slug>/flashcards.json`
  - `content/<slug>/glossary.json`

## Strategy goals

1. Detect broken content shape before it reaches the UI.
2. Detect broken route contracts before deploy.
3. Keep the backend pipeline honest about sectioning, coverage, and fallback generation.
4. Give the frontend a cheap smoke signal for the main routes and page shell behavior.
5. Make content contract failures loud when counts, slugs, or normalized shapes drift.

## Layer model

The repo should be tested in five layers, from cheapest to broadest:

1. Content contract checks
2. Whitebox helper checks
3. API route checks
4. Backend pipeline checks
5. Blackbox / frontend smoke

The existing scripts already cover most of this. The strategy is to preserve that shape and expand it in the right direction, not to replace it.

## Blackbox

### Goal

Treat the app like a user would: start the dev server, hit real URLs, and verify that the HTML and JSON responses are present and coherent.

### Scope

Use `tests/blackbox-smoke.js` as the canonical live probe.

Current coverage to keep:

- `/api/health`
- `/api/search`
- `/api/validate-answer` with empty payload
- `/`
- `/subject/it_biztonsag`
- `/study/it_biztonsag`
- `/search/it_biztonsag`
- `/onboarding`
- `/glossary/it_biztonsag`

### What it should catch

- Dev server starts but routes 404.
- HTML shell breaks and returns non-HTML.
- API response stops being JSON.
- Search or health returns empty or malformed payloads.
- Validate-answer stops rejecting empty input with a 400.

### Pass criteria

- All requested routes respond.
- JSON endpoints return parseable objects/arrays.
- Page routes return HTML.
- Search result shape includes `type`, `subject`, `slug`, `title`, `snippet`, and `url`.

### Notes

Blackbox should stay lightweight.
It is not the place to validate every content item.
It is the place to prove that the app is reachable and that the main user journeys have not collapsed.

## Whitebox

### Goal

Validate repo-internal helper contracts directly from the source tree, without relying on a live server.

### Scope

Use `tests/whitebox-content.js` as the main content whitebox gate.

Current checks to preserve:

- Subject index counts match generated content counts.
- Question normalization still accepts aliases like `q`, `opts`, `ideal`, `explain`.
- Flashcard normalization still accepts legacy aliases like `question`, `answer`, `abbr`.
- Glossary normalization still accepts legacy aliases like `full`, `def`.
- Lesson shape still exposes `slug`, `title`, `section`, `time`, `sources`, and `activeRecall`.
- Source intelligence helpers still emit:
  - assessment blocks
  - learning signals
  - visual references
  - routing text for test/quiz generation

### Whitebox focus areas

1. `scripts/content-utils`
   - Normalize legacy and canonical content shapes.
   - Keep IDs, sections, and aliases stable.
2. `scripts/source-intelligence`
   - Preserve detection of question-like text, definitions, examples, and figures.
3. `lib/content.js`
   - Keep loader outputs consistent for subjects, questions, flashcards, glossary, and notes.
4. Content counts
   - Keep `subjects.json` and per-subject counts aligned.

### Pass criteria

- Every normalized sample returns the expected canonical shape.
- Legacy aliases still map to canonical fields.
- Counts remain consistent between subject summary and on-disk content.

## Unit

### Goal

Cover small, deterministic behaviors that are cheap to run and easy to reason about.

### Recommended unit targets

These should stay narrow and mostly pure:

- `lib/content.js`
  - search scoring
  - search type normalization
  - note/lesson parsing fallback paths
  - section aggregation
- `app/api/search/route.js`
  - query parsing
  - subject filtering
  - type normalization
  - validation errors for invalid `q`, `subject`, and `type`
- `app/api/validate-answer/route.js`
  - payload normalization
  - rubric normalization
  - score clamping
  - timeout/fallback decision logic
- `scripts/content-utils`
  - question, flashcard, glossary canonicalization
- `scripts/document-chunker`
  - block splitting and chunk metadata
- `scripts/local-generators`
  - fallback content generation shape

### Unit test principles

- Test one behavior per assertion cluster.
- Prefer direct inputs and direct outputs.
- Avoid network calls.
- Avoid full file-system integration unless the file itself is a loader.
- Keep unit tests deterministic across local and CI runs.

### What unit tests should protect

- Search should still sort and filter the same way.
- Validate-answer should still reject bad input with stable status codes.
- Content normalization should not silently erase useful legacy fields.
- Fallback generation should still produce at least the minimum number of items.

## Backend pipeline

### Goal

Protect the ingest and generation pipeline, not just the final content files.

### Existing pipeline coverage

- `npm run test:pipeline`
  - `tests/backend-pipeline-smoke.js`
  - `tests/backend-pipeline-whitebox.py`

### What the pipeline layer should cover

1. Extraction contracts
   - PDF and PPTX ingest should preserve source file names, page/slide numbering, and extracted text.
2. Generator contracts
   - Questions, flashcards, glossary, and notes should still normalize into canonical structures.
3. Chunking contracts
   - Question-heavy text should become practice-oriented chunks.
   - Definitions, examples, and concept signals should survive chunking.
4. Sectioning contracts
   - Section continuity should be explicit.
   - A section should not fragment just because a new file starts.
5. Coverage contracts
   - Plan-level coverage signals should stay aligned with generated learning items.

### Pipeline risks this layer should catch

- A new source format breaks ingest.
- A chunking change produces shallow or duplicate assessment items.
- The generator emits a shape the UI no longer understands.
- Section names drift and stop matching the canonical list.

### Pass criteria

- Synthetic PDF and PPTX inputs still extract successfully.
- Generated fallback items still normalize.
- The pipeline still emits the learning signals expected by the downstream content contract.

## API route

### Goal

Treat each route as a contract boundary, not as an implementation detail.

### Routes to explicitly cover

1. `GET /api/health`
   - Returns an object with `status`, `subjects`, `timestamp`, and `env.groq`.
   - If content loading fails, the route should degrade cleanly instead of crashing.
2. `GET /api/search`
   - Reject `q` shorter than 2 chars.
   - Reject unknown subjects.
   - Reject invalid `type` values.
   - Allow `note` / `question` aliases to normalize to canonical types.
   - Return bounded results with stable fields.
3. `POST /api/validate-answer`
   - Reject invalid or empty JSON bodies with 400.
   - Clamp score to 0-100.
   - Preserve response shape across provider success and local fallback.
4. `GET /api/subjects`
   - Return subject summary objects with counts and section totals.
5. `GET /api/subjects/[slug]`
   - Return 404 for unknown subjects.
   - Return canonical summary for known subjects.
6. `GET /api/questions/[slug]`
   - Respect `section` and `type` filters.
   - Preserve canonical and legacy question keys.
7. `GET /api/flashcards/[slug]`
8. `GET /api/glossary/[slug]`
9. `GET /api/notes/[slug]`
10. `GET /api/notes/[slug]/[lesson]`

### Route test style

- Prefer direct route invocation where feasible.
- Assert on status codes first, payload shape second.
- Use real content fixtures from the repo when the contract depends on real counts or section names.

### Route invariants

- Search hits should be bounded and sorted.
- Health should remain fast and non-fatal.
- Content endpoints should never return half-normalized objects.
- Not-found paths should fail explicitly.

## Frontend smoke

### Goal

Prove that the user-facing pages render the shell, do not crash, and preserve the expected route structure.

### Existing smoke coverage

The blackbox smoke already exercises the main page routes, but the frontend strategy should keep the following pages in the smoke set:

- `/`
- `/subject/it_biztonsag`
- `/study/it_biztonsag`
- `/quiz/it_biztonsag`
- `/written/it_biztonsag`
- `/review/it_biztonsag`
- `/flashcards/it_biztonsag`
- `/glossary/it_biztonsag`
- `/search/it_biztonsag`
- `/onboarding`
- `/settings`
- `/pomodoro`
- `/wrong-answers/it_biztonsag`
- `/exam/it_biztonsag`

### What to check

- HTML exists and is not an error page.
- Route shell does not redirect unexpectedly.
- The page is reachable with the current onboarding state model.
- The page can mount against the existing `RouteShell` and store state.

### Suggested smoke assertions

- The home page contains the expected app shell.
- Subject pages render a subject-specific route.
- Study pages can load a lesson or at least the route shell.
- Search and glossary pages remain reachable as standalone pages.

### Do not overreach

Frontend smoke should not try to verify every visual pixel.
That belongs in a separate UI visual test layer if the repo ever adds one.
Here the goal is route availability and mount safety.

## Content contract

### Goal

Guard the shape of the repository content itself, because almost every backend and frontend path depends on it.

### Canonical content rules

1. `subjects.json`
   - Every subject needs `slug`, `name`, `description`, `color`, `icon`.
   - Count fields should match derived content.
2. `questions.json`
   - Questions must normalize to `id`, `type`, `section`, `question`, and answer metadata.
   - Written items must preserve model answer / keywords equivalents.
3. `flashcards.json`
   - Cards must normalize to `id`, `front`, `back`, `section`, and `type`.
4. `glossary.json`
   - Terms must normalize to `id`, `term`, `definition`, `category`, `section`, and aliases.
5. `notes/lessons.json` or MDX notes
   - Lessons need stable `slug`, `title`, `lesson`, `section`, `time`, `sources`, and `activeRecall`.

### Contract checks to keep

- Subject summary counts match the underlying files.
- Every subject referenced by a route exists in `subjects.json`.
- Every section used by questions is represented consistently across notes, flashcards, and glossary.
- Legacy aliases still resolve to canonical fields so content migration does not break readers.
- Active recall and sources stay present on notes pages.

### Why this matters here

The task board currently emphasizes coverage-aware generation, plan tightening, and duplicate/thin-item detection.
That means content contract testing is not just about syntax.
It is about making sure concepts, objectives, and generated items stay aligned over time.

## Recommended execution order

1. Content contract
2. Whitebox
3. Unit
4. Backend pipeline
5. API route
6. Frontend smoke
7. Blackbox live smoke

This order keeps the cheapest failures closest to the source.
If content shape is broken, do not spend time on route smoke until the contract is fixed.

## When to run what

- After content generation or normalization work:
  - content contract
  - whitebox
  - backend pipeline
- After API route changes:
  - unit
  - API route checks
  - blackbox smoke
- After frontend route or shell changes:
  - frontend smoke
  - blackbox smoke
- Before deploy:
  - full smoke pass
  - pipeline pass
  - health/search/validate-answer route checks

## Ownership boundaries

- If a failure is about file shape, start in content contract or whitebox.
- If a failure is about a status code or response payload, start in API route checks.
- If a failure is about extraction or generation, start in backend pipeline.
- If a failure is about routes or app availability, start in frontend smoke or blackbox.

## Out of scope for this strategy

- Rewriting the runtime app architecture.
- Replacing the current test scripts with a new framework.
- Adding visual snapshot tooling.
- Adding browser automation beyond simple smoke unless the repo explicitly chooses that next.

## Final rule

Do not let any new content or backend change skip the relevant layer.
The repo is small enough that the right test should be obvious.
The strategy is to keep those checks cheap, explicit, and close to the contract they defend.

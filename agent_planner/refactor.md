# Refactor Review

Scope: backend-focused review of `scripts/`, `pipeline/`, `tests/`, `app/api/`, and the planning/docs surface in `agent_planner/` and `documentation/`.

## Short verdict

The repo is functional, but the backend still has two parallel implementation paths that solve the same domain problems in different ways:

- JS scripts own content generation, normalization, and content-plan validation.
- Python pipeline agents own another generation path with separate ingestion, prompt, and parse logic.

That split is the main source of drift risk. The next refactor should reduce duplicate responsibility before adding more features.

## P0

### 1. Make one canonical content contract

Affected files:
- `scripts/content-utils.js`
- `scripts/normalize-content.js`
- `scripts/generate-questions.js`
- `scripts/generate-extras.js`
- `scripts/content-plan.js`
- `lib/content.js`
- `pipeline/models.py`
- `tests/backend-pipeline-smoke.js`
- `tests/backend-pipeline-whitebox.py`

Why this matters:
- The same entities are normalized in multiple places with slightly different alias sets.
- Questions, flashcards, and glossary entries all accept mixed names such as `q/question`, `ideal/model_answer`, `front/back/term/full`, and `def/definition`.
- That is useful for compatibility, but it also hides shape drift and makes bugs show up late.

Concrete recommendation:
- Define one canonical schema for each entity type and treat aliases only as boundary adapters.
- Keep alias tolerance in the ingestion/parsing layer, not throughout search, validation, or route code.
- Make the canonical field names visible in docs and in the generated content contract, then keep everything else as compatibility-only behavior.

What to avoid:
- Do not let `lib/content.js`, `app/api/*`, and the Python models each invent their own preferred shape.
- Do not let test fixtures normalize different shapes in different ways.

### 2. Pick one source-extraction boundary

Affected files:
- `scripts/source-intelligence.js`
- `scripts/document-chunker.js`
- `scripts/generate-notes.js`
- `scripts/generate-questions.js`
- `scripts/content-plan.js`
- `pipeline/agents/ingest.py`
- `pipeline/process.py`

Why this matters:
- `scripts/source-intelligence.js` already handles PDF/DOCX/MD/MDX/TXT and writes source manifests with assessment and visual metadata.
- `pipeline/agents/ingest.py` is a separate ingestion path for PDF/PPTX with its own image extraction and page/slide shape.
- `scripts/generate-questions.js` and `scripts/generate-extras.js` then re-scan source or note text for section and question routing.

Concrete recommendation:
- Make the JS source-intelligence path the canonical extraction/manifests path for content generation, or explicitly demote Python to a compatibility layer.
- Move routing hints, assessment detection, and visual references into the extraction manifest once, then let downstream generators consume that manifest instead of re-detecting the same cues.
- If Python stays, keep it focused on one job instead of mirroring the whole pipeline.

What to avoid:
- Do not keep two independent extraction stories if they both write content artifacts.
- Do not let chunking and routing rules live partly in extraction and partly in each generator.

### 3. Split `lib/content.js`

Affected files:
- `lib/content.js`
- `app/api/search/route.js`
- `app/api/health/route.js`
- `app/api/subjects/route.js`
- `app/api/subjects/[slug]/route.js`
- `app/api/notes/[slug]/route.js`
- `app/api/notes/[slug]/[lesson]/route.js`
- `app/api/questions/[slug]/route.js`
- `app/api/flashcards/[slug]/route.js`
- `app/api/glossary/[slug]/route.js`

Why this matters:
- `lib/content.js` is doing too much at once: JSON loading, note/frontmatter parsing, content normalization, search scoring, subject summaries, and cache management.
- The API routes depend on it as a general-purpose backend service layer, which makes the file a single point of coupling.

Concrete recommendation:
- Split it into smaller units such as loaders, normalizers, search, and note parsing.
- Keep route handlers thin and let them call a small service boundary instead of a kitchen-sink helper module.

## P1

### 4. De-duplicate orchestration

Affected files:
- `scripts/generate-all.js`
- `scripts/build-content-plan.js`
- `scripts/validate-content.js`
- `scripts/normalize-content.js`
- `pipeline/process.py`

Why this matters:
- JS and Python both act like top-level content runners.
- The JS path orchestrates plan -> notes -> questions -> extras -> diagrams -> normalize -> validate.
- The Python path orchestrates ingest -> notes -> quiz -> flashcards -> glossary.

Concrete recommendation:
- Keep one primary orchestration story for production content generation.
- Make the other path clearly legacy or clearly scoped to a narrower job.
- Do not let two top-level runners disagree on order, persistence, or retry behavior.

### 5. Make assessment routing explicit

Affected files:
- `scripts/generate-questions.js`
- `scripts/generate-extras.js`
- `scripts/source-intelligence.js`
- `scripts/document-chunker.js`
- `scripts/content-plan.js`

Why this matters:
- The question generator currently decides, on its own, whether a block is lesson content or test content.
- The extras generator separately re-splits MDX notes and extracts sections.
- That means the lesson/test boundary is being inferred more than once.

Concrete recommendation:
- Move the lesson/test decision into the extraction manifest or a dedicated routing field.
- Let generators read the routing hint instead of re-deriving it from source text.
- Keep question-like blocks, section headings, and visual references in one upstream contract.

### 6. Standardize API response helpers

Affected files:
- `app/api/search/route.js`
- `app/api/health/route.js`
- `app/api/subjects/route.js`
- `app/api/subjects/[slug]/route.js`
- `app/api/notes/[slug]/route.js`
- `app/api/notes/[slug]/[lesson]/route.js`
- `app/api/questions/[slug]/route.js`
- `app/api/flashcards/[slug]/route.js`
- `app/api/glossary/[slug]/route.js`
- `app/api/validate-answer/route.js`

Why this matters:
- Most routes return raw `Response.json(...)` objects with slightly different error shapes.
- `validate-answer` already has a richer contract with provider, fallback, rubric, and array normalization.

Concrete recommendation:
- Introduce a shared JSON helper layer so success/error responses are consistent.
- Keep route code focused on lookup, validation, and delegation.
- Preserve the `validate-answer` shape, but stop duplicating ad hoc JSON behavior across the simpler routes.

### 7. Tighten test boundaries

Affected files:
- `tests/backend-pipeline-smoke.js`
- `tests/backend-pipeline-whitebox.py`
- `tests/blackbox-smoke.js`
- `tests/whitebox-content.js`

Why this matters:
- The current tests are useful, but they mostly validate each runtime on its own terms.
- That leaves a gap around cross-runtime contract parity.

Concrete recommendation:
- Keep JS smoke focused on chunking, local fallback generation, and content shape.
- Keep Python whitebox focused on ingest and parser contracts.
- Add a cross-runtime contract fixture that exercises the same canonical question, flashcard, glossary, and extraction manifest shapes in both stacks.

## P2

### 8. Clean up search normalization

Affected files:
- `app/api/search/route.js`
- `lib/content.js`

Why this matters:
- The search route normalizes query type aliases.
- `lib/content.js` also normalizes search types and entity shapes.

Concrete recommendation:
- After the canonical schema is fixed, keep search as a query layer only.
- Move entity normalization out of the search path so ranking code does less work and has fewer shape assumptions.

### 9. Finish JS-only cleanup

Affected files:
- repository-wide
- `agent_planner/REVIEW.md`
- `documentation/PROJECT_MAP.md`

Why this matters:
- There are no `.ts` or `.tsx` source files in the current tree.
- The remaining TypeScript-era residue is mostly conceptual: dual naming conventions, alias-heavy contracts, and mixed docs/examples.

Concrete recommendation:
- Treat the repo as JS-only unless you explicitly reintroduce TypeScript.
- Remove leftover naming drift in docs and helpers where it does not buy real compatibility.
- Keep compatibility adapters at the boundary, not in the core model.

## Suggested order

1. Canonical content contract.
2. Single source-extraction boundary.
3. `lib/content.js` split.
4. API response helper layer.
5. Orchestration cleanup.
6. Assessment routing hints.
7. Test contract hardening.

## Notes on docs structure

The repository does not currently have a `docs/plans/` directory. The active planning and review docs live in `agent_planner/` and `documentation/`, so keep backend refactor notes there until the docs layout changes.


# Pipeline Architecture (post-consolidation)

This is the authoritative map of how content is generated after the
Node/Python/ADK consolidation. Goal: **one live pipeline, one question
generator, no dangling dependencies.**

## Invocation path

```
Admin upload (src/screens/Admin/GenerationPanel.jsx)
        │  POST file + config
        ▼
app/api/upload/generate-pipeline/route.js
        │  spawn: python -m pipeline.orchestrator --subject --name --input <file>
        │         --job-id --depth --language --diagram-mode [--no-images] [--validate-answers]
        ▼
pipeline/orchestrator.py  (the ONLY live pipeline)
  1. extract            ExtractorFactory (pdf/docx/pptx/txt/md/png)
  2. evaluate images    image_evaluator.py            (Gemini vision)
  3. sections           section_pipeline.py           (Gemini, asyncio)
  4. diagrams           diagram_pipeline.py           (Mermaid/Excalidraw/Imagen)
  5. assemble           → content/{slug}/notes/generated.mdx
  6. extras:
       questions        → subprocess: node scripts/generate-questions.js
                            <slug> <difficulty> --input <file> --source-kind test
                            (writes content/{slug}/questions.json — single source of truth)
       flashcards       pipeline/agents/flashcard.py  (Groq)  → flashcards.json
       glossary         pipeline/agents/glossary.py   (Groq)  → glossary.json
  7. [opt-in] validate  pipeline/agents/validator.py  (Gemini) — --validate-answers / VALIDATE_ANSWERS=1
        │                 reads questions.json, verifies answers vs source chunks,
        │                 writes back `validation` + `supervised` fields
        ▼
storage/jobs/{jobId}.json  ← progress; streamed to the UI via /api/jobs/[jobId]/stream (SSE)
```

Live SSE progress is served by `app/api/jobs/[jobId]/stream/route.js`.

## Provider matrix

| Stage | Module | Provider |
|---|---|---|
| Sections / notes | `pipeline/section_pipeline.py` → `gemini_client.py` | Gemini |
| Image eval / diagrams | `pipeline/image_evaluator.py`, `diagram_pipeline.py` | Gemini (+ Imagen) |
| **Questions** | `scripts/generate-questions.js` → `scripts/llm-service.js` | Google AI → Groq → OpenRouter |
| Flashcards / glossary | `pipeline/agents/{flashcard,glossary}.py` → `groq_client.py` | Groq → OpenRouter |
| Answer validation (opt-in) | `pipeline/agents/validator.py`, `dedup.py` → `gemini_client.py` | Gemini |

## Roles

- **Python `pipeline/orchestrator.py`** — the single live pipeline (spawned by the web).
- **Node `scripts/generate-questions.js`** — canonical question generator; invoked by the
  orchestrator via `--input`, and runnable standalone (legacy directory-scan path preserved).
- **Node `generate-notes.js` / `generate-extras.js` / `generate-all.js`** — CLI/legacy tools,
  not used by the web.
- **`pipeline/adk_agents/`** — EXPERIMENTAL, parked, unused; needs `requirements-experimental.txt`.

## Prompt wiring

`prompts/*.txt` are loaded from Python via `pipeline/prompts_loader.py`:
- `system_validator_agent.txt` → `pipeline/agents/validator.py`
- `system_dedup_agent.txt` → `pipeline/agents/dedup.py`
- `system_requirements_agent.txt` → `pipeline/agents/requirements.py` (optional pre-step, not yet wired into `run()`)

The `pipeline/agents/quiz_schema.py` adapter maps the study-hall `questions.json` shape
(7 types) to/from the validator/dedup prompt shape.

## Known follow-ups (not done)

- Flashcards/glossary still exist in both Node (`generate-extras.js`) and Python
  (`pipeline/agents/`) — the live path uses Python; a future decision can unify them.
- Wire `find_duplicates` as a non-destructive `dedup-report.json` pass.
- Wire the requirements agent into `GenConfig` via a `--requirements <file>` arg.
- Optional `job_status` `pct_map` entries for `generating_quiz` / `validating_answers`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev               # Start Next.js dev server at localhost:3000
npm run build             # Production build
npm run lint              # ESLint

# Testing (test:smoke and test:blackbox require a running dev server)
npm run test:all          # Full suite: unit + whitebox + pipeline + lint
npm run test:unit         # Unit tests only
npm run test:smoke        # Whitebox + blackbox (needs live server)
npm run test:whitebox     # Validate content/*.json structure and plan contracts
npm run test:blackbox     # Hit live API routes and validate response shapes
npm run test:pipeline     # Node backend + Python ingest pipeline tests

# Content generation
npm run plan:content      # Build plan.json (run before generate)
npm run generate:content  # Full pipeline: notes → questions → flashcards → glossary
npm run validate:content  # Quality checks after generation
npm run check:backend     # Smoke test backend readiness before deploy

# Per-subject generation (direct)
node scripts/generate-all.js <slug>   # e.g. node scripts/generate-all.js it_biztonsag

# Python pipeline (advanced: image extraction, Pydantic validation)
python pipeline/process.py source.pdf --subject <slug> --name "Subject Name"
```

**Environment setup:**
```bash
cp .env.example .env.local
# Set GROQ_API_KEY=gsk_... (required) and optionally OPENROUTER_API_KEY
```

## Architecture

**Study Hall** is an AI-powered learning platform that transforms uploaded PDFs/DOCXs into structured study materials (notes, quizzes, flashcards, glossary) and serves them through an interactive Next.js frontend.

### Data Flow

**Live pipeline (what the web runs).** The admin upload route `app/api/upload/generate-pipeline/route.js` spawns the Python orchestrator:

```
upload → python -m pipeline.orchestrator
  extract → image-eval → sections (section_pipeline.py, Gemini) → diagrams
          → assemble content/{slug}/notes/generated.mdx
          → questions:   delegated to `node scripts/generate-questions.js` (single source of truth)
          → flashcards+glossary: pipeline/agents/ (Groq)
          → [opt-in] answer validation (pipeline/agents/validator.py, --validate-answers)
```

**Node `scripts/` roles.** `generate-questions.js` is the **canonical** question generator — invoked by the orchestrator (via `--input <file>`) and runnable standalone as CLI. `generate-notes.js` / `generate-extras.js` / `generate-all.js` are **CLI/legacy** convenience tools, not used by the web.

**Experimental.** `pipeline/adk_agents/` is a parked Google ADK re-implementation of section generation — nothing in the live path imports it; it needs `pipeline/requirements-experimental.txt`. See its README.

All generated content is committed to git. There is no runtime database — `lib/content.js` reads from the `content/` directory with an in-memory cache. See `docs/pipeline-architecture.md` for the full invocation map and provider matrix.

### Frontend State

The frontend uses a **custom hash-based router** — Next.js routing is only used to deliver the shell. Navigation within the app changes `location.hash`, managed by `src/store.jsx` (singleton with a listeners pattern). Page-level components live in `src/screens/`.

All user progress (scores, streaks, wrong answers) is stored in **localStorage only** — there are no user accounts.

### API Routes (`app/api/`)

| Route | Purpose |
|---|---|
| `/api/health` | Health check |
| `/api/subjects` | Subject list and metadata |
| `/api/questions/[slug]` | Quiz questions for a subject |
| `/api/flashcards/[slug]` | Flashcard deck |
| `/api/glossary/[slug]` | Glossary terms |
| `/api/notes/[slug]/[lesson]` | MDX lesson content |
| `/api/search` | Global search |
| `/api/validate-answer` | LLM-graded written answer evaluation |

### LLM Integration

**Provider matrix (post-consolidation):**
- **Sections/notes** — `pipeline/section_pipeline.py` via `pipeline/gemini_client.py` (Google AI Studio / Gemini).
- **Questions** — `scripts/generate-questions.js` via `scripts/llm-service.js` (Google AI primary, Groq → OpenRouter fallback). The orchestrator delegates to this script; there is **no** Python quiz generator (`pipeline/agents/quiz.py` is a retired stub).
- **Flashcards/glossary** — `pipeline/agents/` via `pipeline/groq_client.py` (Groq → OpenRouter fallback).
- **Answer validation (opt-in)** — `pipeline/agents/validator.py` + `dedup.py` via `gemini_client`, using prompts in `prompts/system_validator_agent.txt` / `system_dedup_agent.txt`, loaded by `pipeline/prompts_loader.py`.

**Runtime answer validation** (`/api/validate-answer`) tries Groq, then OpenRouter free models, then falls back to local keyword matching. Returns score, rubric-based feedback, and model answer.

**Runtime answer validation** (`/api/validate-answer`) tries Groq, then OpenRouter free models, then falls back to local keyword matching. Returns score, rubric-based feedback, and model answer.

### Key Files

- `src/store.jsx` — Global state: hash router, theme, accent color, pomodoro state
- `lib/content.js` — Filesystem content loader (the read-path for all API routes)
- `src/theme.js` — Color palettes for light/dark mode and 6 accent colors
- `scripts/note-prompts.js` — All LLM prompt templates for notes generation
- `pipeline/models.py` — Pydantic schemas that all generated JSON must satisfy
- `content/subjects.json` — Subject registry; updated by each generation run

### Content Structure

Each subject lives under `content/{slug}/`:
- `meta.json` — Name, color, icon, section list
- `notes/lessons.json` + `notes/*.mdx` — Lesson metadata and MDX content
- `questions.json` — MCQ, multi-select, and written questions with rubrics
- `flashcards.json` — Term/definition pairs
- `glossary.json` — Terms with definitions and aliases
- `plan.json` — Pre-generation concept map
- `quality-report.json` — Post-generation quality metrics

### Tech Stack

- **Framework:** Next.js 14 (App Router, JavaScript — migrated from TypeScript)
- **Styling:** Tailwind CSS with custom palette (coral, blue, green, gold, red, purple) and fonts (DM Sans, Lora, JetBrains Mono)
- **Notes rendering:** `next-mdx-remote` + KaTeX for LaTeX math
- **Document parsing:** `pdf-parse` (PDF), `mammoth` (DOCX)
- **LLM providers:** Groq (primary free tier), OpenRouter (fallback free tier)
- **Python deps:** See `pipeline/requirements.txt` (Pydantic, groq, requests)

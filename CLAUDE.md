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

```
storage/subjects/{slug}/sources/
  lesson_sources/  →  scripts/generate-notes.js  →  content/{slug}/notes/*.mdx
  test_sources/    →  scripts/generate-questions.js → content/{slug}/questions.json
                   →  scripts/generate-extras.js  →  content/{slug}/flashcards.json + glossary.json
```

All generated content is committed to git. There is no runtime database — `lib/content.js` reads from the `content/` directory with an in-memory cache.

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

**Generation scripts** (Node) use the Groq SDK directly with `llama-3.3-70b-versatile` as the primary model. `scripts/llm-rate-limit.js` enforces delays to stay within Groq's free-tier limits (70s default between calls).

**Python pipeline** (`pipeline/`) uses `pipeline/groq_client.py` which wraps Groq with retry + exponential backoff and falls back to OpenRouter (Gemma-4-26b → Nemotron) on failure. All pipeline output is validated against Pydantic models in `pipeline/models.py`.

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

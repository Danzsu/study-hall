# Pipeline Plan

Design or explain the AI note-generation pipeline for a subject.

## How to use
`/pipeline-plan <slug>` — Show the pipeline plan for a specific subject  
`/pipeline-plan` — Show the general pipeline architecture

## Pipeline architecture

### Input
- `storage/subjects/<slug>/sources/lesson_sources/*.pdf|docx` — lecture slides/notes
- `storage/subjects/<slug>/sources/test_sources/*.pdf|docx|md` — past exam papers

### Processing stages
1. **Extract** — PDF/DOCX → raw text (pdf-parse, mammoth)
2. **Chunk** — Split into 800–1200 token segments at natural boundaries (headings, paragraphs)
   - Never split mid-sentence or mid-formula
   - Each chunk tagged with: source file, page range, section title
3. **Generate per-chunk** (Groq llama-3.3-70b-versatile, parallel):
   - Notes: structured MDX with headers, bullet points, code blocks, KaTeX formulas
   - Key concepts per chunk: 3–7 terms with definitions
4. **Assemble** — Merge per-chunk outputs into lesson files
   - Deduplicate overlapping concepts
   - Write `content/<slug>/notes/<lesson>.mdx`
5. **Generate Q&A** from assembled notes:
   - MCQ questions (4 options, single correct, section tagged)
   - Written questions with model answers and key points
   - Write `content/<slug>/questions.json`
6. **Generate flashcards** from key concepts → `content/<slug>/flashcards.json`
7. **Generate glossary** from key concepts → `content/<slug>/glossary.json`

### Why chunking?
LLMs hallucinate on very long documents. 800–1200 token chunks allow:
- High accuracy per chunk
- Parallel processing (faster)
- Clear traceability back to source

### API choice
- Groq (llama-3.3-70b-versatile) — free tier, fast, good enough for structured generation
- Fallback: claude-haiku-4-5 via Anthropic API for complex formulas/diagrams

## What I will do when invoked
1. Check what source files exist in `storage/subjects/<slug>/sources/`
2. Show the processing plan (which files, estimated chunks, estimated tokens)
3. Ask for confirmation before starting
4. Run the pipeline with progress logging

# Backend Agentic Architecture

Status: draft, with Batch 1 partially implemented on 2026-04-20

Scope: the content-generation backend only. This note proposes a more sophisticated agentic note / test / quiz pipeline without changing runtime code.

## Implementation note 2026-04-20

Batch 1 started turning this architecture into code:
- source intelligence now extracts learning signals and writes richer manifests
- chunking now exposes learning intent and concept/definition/example/question signals
- the content plan now includes structured concepts, objectives, coverage matrix, and extraction quality
- question generation can consume the coverage matrix and attach/infer `conceptIds`
- weak lesson questions are preserved as review metadata, while stronger control/quiz/exam/self-check blocks route to questions

Next implementation target: validation gates for concept coverage, visual reference preservation, duplicate/thin question detection, and written-question rubrics.

Referenced repo surfaces:
- `README.md`
- `PLAN.md`
- `Agentic_improve.md`
- `agent_planner/backend_extraction_plan.md`
- `scripts/document-chunker.js`
- `scripts/source-intelligence.js`
- `scripts/generate-notes.js`
- `scripts/generate-questions.js`
- `scripts/generate-extras.js`
- `scripts/content-plan.js`
- `scripts/llm-rate-limit.js`
- `scripts/generate-all.js`
- `scripts/note-prompts.js`
- `pipeline/agents/*.py`

## What the repo already has

The current backend is already more than a simple prompt runner:
- source ingestion can extract text from PDF, DOCX, MD, MDX, and TXT
- `document-chunker.js` already detects headings, questions, figures, tables, equations, and code-like blocks
- `source-intelligence.js` already writes a manifest with assessment blocks, visual references, and extracted assets
- `content-plan.js` builds a reusable plan with source summaries, concept inventory, objectives, and provider budget snapshot
- `generate-notes.js`, `generate-questions.js`, and `generate-extras.js` already share plan context
- `llm-rate-limit.js` already enforces provider delays, hourly caps, retries, and retry-after handling
- the Python `pipeline/agents` package already mirrors the main content families: ingest, notes, quiz, flashcard, glossary, active recall

So the next step is not "add more agents" in the abstract. The next step is to make the current flow more explicit, multi-pass, and routing-aware.

## Target shape

The backend should behave like a small production content studio:

1. Ingest and index source material
2. Classify what parts are lecture content, assessment content, and visual content
3. Build a shared subject plan with stable concepts and objectives
4. Generate notes in multiple passes
5. Generate quiz / written items from the same coverage map
6. Generate flashcards and glossary entries from the stable concept inventory
7. Validate the outputs with cheap structural checks before finalizing the subject package

The end result should feel closer to:
- MagicSchool-style "teacher workflow" for structured content production
- Notability-style retention of the source's visual context and annotations
- Gimkit-style assessment variety, pacing, and game-like retrieval practice

## Core design principles

### 1. Source-first, not prompt-first

Every generation step should be driven by extracted source structure:
- heading tree
- chunk boundaries
- figure/table/equation references
- explicit question blocks
- source metadata and asset manifest

Prompts should consume this structure, not infer everything from raw text.

### 2. One canonical plan, many consumers

`content-plan.js` should remain the single shared planning artifact.
It should feed:
- note generation
- question routing
- flashcard and glossary selection
- written-answer rubric creation
- validation / quality reporting

### 3. Multi-pass beats one-shot generation

Each artifact family should have at least two passes:
- planning pass: decide scope, sections, and coverage
- generation pass: write the final artifact
- polish / validation pass: dedupe, merge, and check coverage

### 4. Free-tier aware orchestration

The pipeline should assume:
- some providers are unavailable
- requests can hit 429s
- the preferred model may change mid-run
- the run may need to degrade gracefully to local fallback

The orchestration layer should choose the cheapest viable next step, not insist on a single provider.

## Proposed backend stages

### Stage 0. Ingest and manifest

Goal: extract as much source truth as possible before generation starts.

Current starting points:
- `scripts/source-intelligence.js`
- `scripts/document-chunker.js`
- `pipeline/agents/ingest.py`

Needed behavior:
- normalize every source into a common manifest
- preserve source kind: lesson, test, mixed, appendix
- preserve page / slide / section references where possible
- retain images and figures as stable assets, not just as cues in text
- detect explicit question-like blocks and route them to assessment generation

The manifest should be the durable contract for downstream steps. If a source has images, the manifest should say where they landed. If a source has explicit exam questions, that should be tagged before note generation starts.

### Stage 1. Source intelligence and routing

This is the first real agentic layer.

The router should classify chunks into at least these buckets:
- note-worthy explanation
- assessment source
- visual source
- reference-only source
- hybrid source

Recommended routing signals:
- assessment cues: question, quiz, exercise, practice, self-check, exam, ZH, control question
- visual cues: figure, diagram, schema, chart, table, slide, image, screenshot, equation
- note cues: definition, explanation, principle, example, comparison, takeaway

This should not be a binary lesson/test split. Many pages are hybrid, and the router should preserve that nuance.

### Stage 2. Better chunking

`document-chunker.js` should evolve from "split by size plus headings" into "split by semantic and pedagogic boundaries".

Concrete chunking goals:
- keep headings together with the paragraph that introduces them
- avoid splitting definitions away from their examples
- avoid splitting figure captions away from the figure context
- treat equation-heavy sections as atomic where possible
- isolate question blocks so they can be routed cleanly
- maintain overlap only where it helps continuity, not as a blanket rule

Chunk metadata should include:
- stable chunk id
- source file
- heading path
- chunk type
- route hint
- visual candidates
- assessment candidates
- confidence score

Suggested chunk types:
- `exposition`
- `example`
- `figure-context`
- `assessment`
- `reference`
- `hybrid`

This is the place to stop thinking in terms of "N characters" and start thinking in terms of "what should the student learn from this block?".

### Stage 3. Shared plan and coverage matrix

`content-plan.js` should be the central contract and should evolve into a richer subject graph.

The plan should track:
- canonical concepts
- concept aliases
- learning objectives
- coverage matrix by artifact family
- source map
- figure / asset inventory
- assessment routing hints
- written-question rubric hints
- provider budget snapshot

Minimum practical coverage matrix:
- notes: concept explanation coverage
- questions: recall and discrimination coverage
- written: synthesis / explanation coverage
- flashcards: fast recall coverage
- glossary: term-definition coverage

This makes it possible to say not just "we generated 30 questions", but "we covered the 12 highest-value concepts in at least two different retrieval formats."

### Stage 4. Notes generation as a three-pass workflow

`scripts/generate-notes.js` is currently the best place to introduce a richer note workflow.

Recommended passes:

1. Outline pass
   - decide lesson boundaries
   - produce section order
   - list concepts already covered
   - identify where figures, tables, and equations should appear

2. Chunk drafting pass
   - generate each chunk from the semantic chunk plus plan context
   - preserve source-grounded details
   - keep figures as explicit placeholders or extracted references
   - avoid re-explaining earlier concepts

3. Continuity / humanizer pass
   - merge duplicate headings
   - remove repeated definitions
   - smooth transitions between chunk outputs
   - check that references and credits remain present

Important note: the current prompt already asks for humanized MDX and figure handling. The architecture improvement is to make that behavior explicit as passes instead of hoping one large prompt does everything.

### Stage 5. Assessment routing and question generation

`scripts/generate-questions.js` should become routing-aware instead of purely source-text-driven.

Recommended routing hierarchy:

1. If a source block is explicitly assessment-like, preserve it as assessment source.
2. If a block is lesson content but contains embedded self-checks, route those questions separately.
3. If a block is conceptual exposition, generate fresh questions from the objectives and coverage matrix.

Question generation should use a common schema with:
- question type
- section id
- concept ids
- difficulty
- source provenance
- explanation or model answer
- distractor rationale for MCQ / multi
- rubric for written items

The quiz generator should deliberately mix:
- MCQ for recognition and single-best-answer practice
- multi-select for discriminating near-miss concepts
- written questions for synthesis and explanation

The routing rule should be:
- preserve explicit questions when they exist
- generate new questions when coverage is missing
- never let a nice lesson chunk steal the identity of an explicit test block

### Stage 6. Flashcards and glossary as retrieval products

`scripts/generate-extras.js` should be concept-driven, not merely note-driven.

Better behavior:
- flashcards should map to canonical concepts and aliases
- glossary should prefer stable terms with source-grounded definitions
- both artifacts should avoid duplicating the same concept in slightly different words
- both artifacts should use section or category tags from the shared plan

This is where the system can become more Gimkit-like:
- short, fast retrieval items
- category clustering
- repeated exposure with varied surface form
- low-friction recall practice

### Stage 7. Figure and image retention

The repo already has the right direction here, but the architecture should make it stricter.

What should be retained:
- extracted embedded images
- figure references in text
- slide/image captions
- source-relative asset paths
- a manifest entry that points from chunk -> figure -> source origin

What should happen downstream:
- notes should include figure placeholders if the figure itself is missing
- notes should preserve where a figure belongs, not just mention that a figure existed
- quiz generation should be able to ask about a figure if the source made it pedagogically important
- validation should detect when a source had visual references but the final note lost them

Notability-style inspiration:
- the source artifact stays legible as a learning object, not just as text
- visuals should feel anchored to the same page or slide context
- assets should be easy to trace back to the original source

### Stage 8. Rate-limit aware orchestration

`llm-rate-limit.js` already tracks per-provider delay and hourly budgets. The next architecture step is to use that information before a run begins and between passes.

Recommended orchestration policy:
- snapshot provider budgets at the start of the run
- choose provider order by budget health, not by a hardcoded preference alone
- reserve the best provider for the highest-value steps
- degrade lower-value enrichment steps earlier
- switch to local fallback before the run gets stuck deep in retries

Suggested priority order for a subject run:
1. plan generation
2. note outline and first-pass drafting
3. explicit assessment preservation
4. written rubric generation
5. question generation
6. flashcards
7. glossary
8. polish / continuity

If the budget snapshot is poor, the system should still complete the run with smaller but coherent outputs.

## Inspiration mapping

### MagicSchool-style workflow

What to borrow:
- teacher-oriented generation stages
- output families with different pedagogic purposes
- structured rubrics for writing tasks
- quick iteration from the same source pack

How that maps here:
- one source set becomes notes, quizzes, written prompts, flashcards, and glossary entries
- the plan object acts like the "teacher brief"
- the generated outputs should read like classroom-ready material, not a single monolithic summary

### Notability-style workflow

What to borrow:
- source fidelity
- visual context preservation
- page / slide anchoring
- the feeling that the note is attached to the original artifact

How that maps here:
- manifests keep source provenance
- figure retention is first-class
- notes explain visuals instead of flattening them away

### Gimkit-style workflow

What to borrow:
- retrieval practice variety
- fast-turnover question formats
- category-based playfulness
- repeated exposure with slightly different surface forms

How that maps here:
- multi-select, MCQ, and written questions come from the same concept map
- flashcards and glossary are not afterthoughts
- question routing should favor high-value concepts first

## Suggested artifact contract

The backend should converge on a small set of durable artifacts per subject:

- `plan.json`
- `quality-report.json`
- `notes/lessons.json`
- `notes/*.mdx`
- `questions.json`
- `flashcards.json`
- `glossary.json`
- `source-manifests/*.json`
- `asset-manifests/*.json`

The important bit is not the exact filename. The important bit is that each artifact family has a known role and a known upstream owner.

## Recommended implementation order

1. Tighten the source manifest and routing hints
2. Upgrade chunk metadata and chunk types
3. Expand the content plan into concepts, objectives, and coverage
4. Add a note outline pass and continuity pass
5. Add assessment routing and concept-linked question generation
6. Add figure/image retention checks to validation
7. Make provider budget snapshots drive orchestration order
8. Keep flashcards and glossary aligned with the same concept inventory

## Success criteria

The backend is in good shape when:
- explicit exam questions remain identifiable after ingestion
- lesson notes preserve figures and their context
- quiz items are traceable to concept coverage
- written questions have usable rubrics
- flashcards and glossary do not drift away from the notes
- a low-budget provider situation still produces a coherent package
- the generated outputs feel like a real study workflow, not a pile of independent LLM artifacts

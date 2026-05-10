# Backend Task Board

Last updated: 2026-04-20
Scope: Agentic AI backend sprint for the university note-taking and learning platform.

## Current Snapshot

- Shared content plan, quality report, provider-aware rate limiting, and backend smoke checks are already in place.
- `app/api/validate-answer` now clamps payloads, normalizes rubrics, and keeps remote/local response shapes stable.
- `app/api/health` and `app/api/search` are live and usable for smoke validation.
- The main remaining work is quality: chunking continuity, source extraction, coverage-aware generation, and better note/test/quiz alignment.

## Done

- Shared plan + quality report pipeline.
- Provider-aware rate limiting and run budgeting.
- Backend smoke check script and live route probes.
- Written-answer API hardening with rubric support and fallback parity.
- Source intelligence now emits learning signals, routed assessment metadata, visual references, and manifests.
- Chunking now emits learning intent plus concept/definition/example/question signals.
- `it_biztonsag` content plan rebuilt with structured concepts, objectives, coverage matrix, and extraction quality.

## In Progress

- Coverage-aware generation for notes, quiz, flashcards, glossary, and written questions.
- Plan schema tightening so concepts, objectives, and source references stay aligned across generators.
- Validation gates for concept coverage, visual reference preservation, and duplicate/thin assessment items.

## Next

- Add explicit concept coverage checks to content validation.
- Improve written-grading rubrics so scoring targets the same key points as generation.
- Keep the run-level provider budget policy explicit in the generation flow.
- Expand smoke checks to catch duplicate, thin, or missing content earlier.
- Bridge Python PDF/PPTX image extraction into the JS generator path or add a JS-side PPTX adapter.

## Risks

- Plan schema can grow too fast and make fallback paths brittle.
- Chunking errors can ripple into weak notes, shallow questions, and duplicate glossary entries.
- Free-tier provider limits can push runs toward fallback too late unless budget choice is explicit.
- Coverage checks can give false confidence if concept extraction is noisy or too shallow.

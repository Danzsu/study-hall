## Current status update

- Already landed: shared content plan, quality report, provider-aware rate limiting, `scripts/check-backend.js`, `app/api/health`, and `vercel.json` timeout for `validate-answer`.
- Also landed: written-answer runtime hardening with payload/field guards, optional rubric support, and a stable remote/local response shape.
- Live validation: backend smoke-check passes against `localhost:3000`.
- Still open: make the shared plan more structured, add stronger coverage/rubric metadata, and keep the run-level budget policy explicit.
- Next: structured plan schema, continuity-aware notes generation, quiz coverage matrix, and rubric-based written grading.

# Agentic AI workflow improvement notes

## Context

This note is based on the current repo state, especially:
- `scripts/generate-all.js`
- `scripts/content-plan.js`
- `scripts/validate-content.js`
- `scripts/llm-rate-limit.js`
- `scripts/check-backend.js`
- `app/api/validate-answer/route.js`
- `app/api/search/route.js`
- `app/api/health/route.js`
- `vercel.json`

The repo already has a useful backend foundation:
- a shared content plan is generated before content output
- validation writes a quality report
- provider-aware rate limiting exists for Groq/OpenRouter CLI runs
- written-answer evaluation has remote + local fallback
- deploy timeout is already set for `validate-answer`
- a backend smoke check script exists for local validation and optional live probes

So the next step is not a rewrite. The next step is to make the agentic workflow more explicit, more schema-driven, and safer under free-tier and serverless constraints.

## Current backend shape

### What is already working

- `generate-all.js` runs a clear pipeline: plan -> notes -> questions -> extras -> diagrams -> normalize -> validate
- `content-plan.js` builds a reusable plan and quality targets
- `generate-notes.js`, `generate-questions.js`, and `generate-extras.js` already read plan context
- `llm-rate-limit.js` enforces provider delays, per-hour caps, and 429 retry-after handling
- `validate-answer` has Groq + OpenRouter providers and a local fallback
- `vercel.json` gives the written-answer route a higher runtime budget
- `scripts/check-backend.js` can validate generated content and probe live health/search routes when a base URL is provided

### What is still loose

- the shared plan is still heuristic and text-heavy, not a strict contract
- notes, quiz, written, flashcard, and glossary generation still depend on separate prompt logic
- there is no explicit coverage matrix linking objectives to question generation
- written-answer grading still relies on a prompt and a fallback, not a formal rubric object
- provider rate limiting exists, but there is no orchestration-level budget policy across the whole run
- runtime safety checks are present, but request size limits and content guards are still thin

## Concrete improvements to implement next

### 1. Make the content plan a real contract

**Goal:** give every generator the same structured input, not just a summary string.

**Add to the plan schema:**
- `concepts`: canonical concept list with stable ids
- `objectives`: learning objectives tied to concepts
- `coverageMatrix`: which concepts must be covered by notes, quiz, written, flashcards, glossary
- `rubrics`: per-written-question grading hints
- `sourceMap`: source file, section, and optional page/slide references
- `priorityTerms`: the terms that must appear in extras and glossary
- `skipHints`: what to avoid repeating or overexplaining
- `fallbackPolicy`: when to use local fallback vs remote retry

**Implementation shape:**
- keep the current `plan.json`, but extend it instead of introducing a separate parallel artifact
- update `validate-content.js` to fail or warn on missing required plan fields
- keep the plan compact enough that it can be passed into prompts without ballooning token usage

**Why this matters:**
- notes, questions, and extras stop drifting apart
- validation can reason about coverage instead of only counts
- fallback behavior becomes a choice, not an accident

### 2. Turn notes generation into a continuity pass, not just chunk rendering

**Current repo reality:** `generate-notes.js` already chunks source material and uses a shared plan summary.

**Next step:**
- build the lesson outline first
- pass each chunk the lesson id, section id, and a short "already covered" list
- after chunk generation, run a continuity pass that merges duplicate headings, repeated definitions, and overlapping intro paragraphs

**Concrete prompt rules:**
- each chunk must state what part of the outline it covers
- each chunk must avoid reintroducing concepts that were already explained in earlier chunks
- the final note should preserve source-grounded facts and tone consistency across chunks

**Verifier checks to add:**
- duplicate heading detection
- repeated definition detection
- missing references / credits section detection
- empty or too-short lesson body detection

### 3. Add a quiz coverage matrix

**Current repo reality:** `generate-questions.js` has a strong prompt, but coverage is still mostly implicit.

**Next step:**
- generate questions from objectives, not just from raw source text
- tag each generated question with concept ids
- track whether every key concept is covered by at least one question
- keep the remote/local output schema identical so fallback does not change the shape

**Practical rules:**
- at least one question per high-priority concept
- written questions must map to at least one objective
- multi-select items should not reuse the same distractor pattern too often
- explanations should be long enough to explain why wrong options are wrong

**Verifier checks to add:**
- duplicate question detection
- trivial distractor detection
- missing explanation detection
- concept coverage shortfall detection

### 4. Formalize written-test grading

**Current repo reality:** `app/api/validate-answer/route.js` already takes `question`, `model_answer`, `key_points`, and `user_answer`, then falls back locally if remote providers fail.

**Next step:**
make each written question carry a small rubric object:

```json
{
  "question": "...",
  "model_answer": "...",
  "key_points": ["...", "..."],
  "rubric": {
    "must_have": ["..."],
    "nice_to_have": ["..."],
    "common_mistakes": ["..."],
    "score_bands": {
      "0-39": "..."
    }
  }
}
```

**Why this is worth it:**
- remote grading gets a stable target
- the local fallback can score against the same structure
- future prompt changes are easier to review

**Runtime guardrails for `validate-answer`:**
- clamp request fields before sending them to the model
- reject absurdly large payloads early
- keep the prompt deterministic and compact
- keep the fallback output shape identical to provider output

### 5. Move from provider rate limiting to run-level budget policy

**Current repo reality:** `llm-rate-limit.js` already supports delay, hourly caps, and retry-after.

**Next step:**
- use the provider budget snapshot before a subject run starts
- prefer local fallback earlier when a provider is exhausted, instead of waiting deep into the run
- surface the chosen provider order in the generation log
- keep the current env knobs:
  - `GROQ_REQUEST_DELAY_MS`
  - `OPENROUTER_REQUEST_DELAY_MS`
  - `GROQ_MAX_REQUESTS_PER_HOUR`
  - `OPENROUTER_MAX_REQUESTS_PER_HOUR`
  - `LLM_MAX_RETRIES`
  - `LLM_RETRY_SAFETY_MS`
  - `LLM_DISABLE_RATE_LIMIT`

**Concrete orchestration rule:**
- if budget snapshot says the preferred provider is unavailable, skip to the next provider or local fallback immediately
- if the current run is large, keep remote work for the highest-value steps and let lower-value steps fall back sooner

### 6. Tighten deploy/runtime safety

**Already done:**
- `vercel.json` sets `validate-answer` to a 30s function budget
- `/api/health` exists
- `scripts/check-backend.js` can probe generated content and live routes

**Still worth doing next:**
- add a small payload size guard to `validate-answer`
- add a stricter failure mode when `question` or `user_answer` is missing or too long
- keep `/api/health` returning useful counts and env flags, but do not let it become expensive
- keep `searchContent` linear for now, but treat it as a future indexing candidate if content volume grows

**Why this matters:**
- serverless timeouts are easier to control
- oversized written-answer requests are less likely to blow up latency or cost
- health and smoke checks stay cheap enough to run before deploy

## Suggested implementation order

1. Extend `content-plan.js` with structured `concepts`, `objectives`, and `coverageMatrix`
2. Update `generate-notes.js` to consume lesson outline + continuity hints
3. Update `generate-questions.js` to emit concept tags and coverage metadata
4. Add `rubric` support to written questions and teach `validate-answer` to accept it
5. Expand `validate-content.js` and `check-backend.js` to verify the new structure
6. Keep the deploy/runtime guardrails in place with `vercel.json` and request clamping

## File-level guidance

### Generators

- `scripts/generate-notes.js`
- `scripts/generate-questions.js`
- `scripts/generate-extras.js`
- `scripts/local-generators.js`

### Planning and validation

- `scripts/content-plan.js`
- `scripts/validate-content.js`
- `scripts/check-backend.js`
- `scripts/llm-rate-limit.js`

### Runtime

- `app/api/validate-answer/route.js`
- `app/api/search/route.js`
- `app/api/health/route.js`
- `vercel.json`

## Risks to keep in view

### 1. Too much schema too early

If the plan schema gets too rigid too fast, the local fallback paths will become brittle. Keep the required shape small and add optional fields for richer metadata.

### 2. Budget control without overengineering

The current rate-limit layer is good enough for now. A full scheduler would be overkill unless content volume or provider cost clearly justifies it.

### 3. False confidence from heuristic coverage

Coverage checks are helpful, but they can still be fooled by noisy concept extraction. Keep the verifier source-grounded and conservative.

### 4. Serverless timeouts

Long prompts, large model answers, and multi-provider retries can all hit runtime limits. That is why the timeout setting, input clamping, and fallback consistency matter together.

## Bottom line

The best next improvement is not "more agents". It is a better contract between the existing steps:
- a structured plan
- coverage-aware generation
- rubric-based written grading
- provider-aware budget policy
- cheap but real smoke checks

That is the path that fits this repo right now without adding new dependencies or fragile automation.


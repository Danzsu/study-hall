# Frontend Task Board

Last updated: 2026-04-19
Scope: frontend 100% completion coordination.

## Current Snapshot

- Study boundary parser fixes are implemented in `src/screens/Study.jsx`.
- Blackbox smoke now covers Home, Subject, Study, Search, Onboarding, and Glossary routes.
- Verification gate is green: `npm run lint`, `npm run build`, `npm run test:smoke`, expanded live blackbox smoke, and backend smoke passed.
- Hegel review is closed; the only noted highlight color edge-case has been fixed.
- Root docs remain untouched for this sync.

## Operating Rules

- All planning, sprint, review, and task-management notes go under `agent_planner/`.
- Root docs are reference material only during this coordination pass. Do not move, delete, or copy root docs.
- Each implementation batch should be small enough to review in one pass.
- Every coding batch ends with status update, reviewer check, and test/build gate.
- Current source of truth for operational work: this file plus `agent_planner/frontend_iteration_status.md`.

## Roles

| Role | Owner | Focus | Output |
| --- | --- | --- | --- |
| PM / Coordinator | Main agent or delegated PM subagent | Sprint order, task slicing, DoD, risk control | `agent_planner/task_board.md` |
| Planner | Turing | Continuously inspect plans, backlog drift, structure/refactor opportunities | `agent_planner/refactor.md`, board recommendations |
| Backend / Agentic improver | Pascal | Study parser/content contract, API/render boundary, backend-backed frontend reliability | Code changes + planner notes |
| Test agent | Hegel | Blackbox and whitebox coverage for changed flows | `tests/`, `agent_planner/test_review.md` |
| Reviewer | Gibbs or available reviewer | Review just-implemented batches, spot regressions and polish gaps | `agent_planner/frontend_review.md` |
| Main frontend agent | Main agent | Implement frontend batches and coordinate verification | Code + final status |

## Board

| Status | Task | Owner | Priority | Notes |
| --- | --- | --- | --- | --- |
| Done | Glossary cluster view + concept map + targeted flash behavior | Main + reviewer | P1 | Keep regression checks around topic open/search state. |
| Done | Written feedback, Quiz results, Onboarding subject icon polish | Main + reviewer | P1 | Treat as stable unless tests or visual review find drift. |
| Done | Smoke test harness for frontend-adjacent flows | Hegel | P1 | `npm run test:smoke` is available. |
| Done | Study parser/render boundary hardening | Pascal + main | P0 | Parser fixes landed in `src/screens/Study.jsx`; keep regression watch during review. |
| Done | Expanded blackbox route smoke | Hegel | P1 | Covers Home, Subject, Study, Search, Onboarding, and Glossary routes. |
| Done | Hegel implementation/test review | Hegel | P1 | Review closed; highlight alpha edge-case fixed in `src/screens/Study.jsx`. |
| Active | Final visual parity smoke for Home / Subject / Study / Search / Onboarding | Main + reviewer | P1 | Automated smoke is green; finish human visual/flow check. |
| Active | Shared UI primitive audit, minimal extraction only where duplication is harmful | Turing + main | P1 | Avoid broad refactor unless it reduces immediate drift. |
| Done | Search routing/highlight and onboarding route smoke | Hegel + reviewer | P1 | Covered by expanded blackbox route smoke; keep only visual/UX review open if needed. |
| Ready | Remaining minor polish: Review, WrongAnswers, Settings, Pomodoro, ExamSim | Main | P2 | Only after P0/P1 are green. |
| Watch | Root/planner doc drift | Turing | P1 | Root docs stay in place; update only if main explicitly asks. |

## Definition Of Done

### Per Feature Batch

- The changed route has a clear acceptance check.
- No new visual drift on adjacent routes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run test:smoke` passes when a user-facing route or API contract changes.
- Planner/review doc under `agent_planner/` is updated.

### Frontend 100% DoD

- Home, Subject, Study, Search, Onboarding, Glossary, Quiz, Written, Flashcard, Review, WrongAnswers, Pomodoro, Settings, and ExamSim all pass a desktop and mobile smoke pass.
- Study content rendering has stable handling for supported callout, recall, math, highlight, tooltip/source, and fallback cases.
- No known mojibake/copy corruption remains in user-facing source files.
- No open P0/P1 item remains in `agent_planner/frontend_iteration_status.md`.
- `npm run lint`, `npm run build`, `npm run test:smoke`, and backend smoke check are green.

## Next 3 Iterations

### Iteration 1 - Stabilize Study Boundary

Status: Done.

Goal: close the last high-risk frontend area before broad polish.

Tasks:
- Done: Pascal/main boundary pass led to Study parser fixes in `src/screens/Study.jsx`.
- Done: Hegel expanded blackbox smoke for Home, Subject, Study, Search, Onboarding, and Glossary.
- Done: Hegel review closeout for the latest implementation/test batch.
- Done: Review edge-case fixed with `transparentTone()` in `src/screens/Study.jsx`.

Exit criteria:
- Done: Study route parser/render fixes are implemented.
- Done: `npm run lint`, `npm run build`, `npm run test:smoke`, and backend smoke are green.
- Done: Hegel review result is recorded in `agent_planner/frontend_review.md` and `agent_planner/test_review.md`.

### Iteration 2 - Core Flow Parity Freeze

Status: Active next.

Goal: verify the central learning loop end to end now that automated route smoke is green.

Tasks:
- Main: run and fix final Home -> Subject -> Study -> Quiz/Flashcard/Written visual and navigation polish.
- Turing: compare actual code state against `agent_planner/frontend_iteration_status.md` and flag stale tasks.
- Hegel: keep the expanded route smoke stable.
- Reviewer: check no route/state drift after fixes.

Exit criteria:
- Core study flow is visually and functionally stable on top of green automated smoke.
- No P1 flow/parity item remains.

### Iteration 3 - Final Polish And Closure

Goal: close the remaining low-risk screens and freeze docs.

Tasks:
- Main: minor polish for Review, WrongAnswers, Settings, Pomodoro, ExamSim only if observed.
- Hegel: run full smoke suite and capture failures as concrete tickets.
- Turing: update task board and mark stale planner items closed or superseded.
- Reviewer: final acceptance review for frontend 100%.

Exit criteria:
- No open P0/P1/P2 frontend task remains except explicitly deferred wishlist.
- Final status docs under `agent_planner/` match the code state.

## Recommended Delegations

### Turing

1. Keep `agent_planner/task_board.md` and `agent_planner/frontend_iteration_status.md` aligned after each batch.
2. Reconcile Iteration 1 completion against `agent_planner/frontend_iteration_status.md` without touching root docs.
3. Do a narrow shared UI primitive audit: list exact components/screens first, no code unless delegated.

### Pascal

1. Stand by for future Study/content edge-case findings.
2. Avoid broad content schema work unless the main agent explicitly opens a new batch.

### Hegel

1. Maintain `tests/blackbox-smoke.js` and `tests/whitebox-content.js`.
2. Keep the expanded route smoke stable.
3. Keep `agent_planner/test_review.md` aligned with the latest green `lint/build/test:smoke/backend smoke` gate.

### Main Agent

1. Move to Iteration 2 visual parity fixes.
2. Keep root docs untouched unless the user explicitly asks for root status sync.
3. After each implementation: run lint/build/smoke, ask reviewer to inspect, then update this board.

## Current Risks

- Study parser fixes are merged and reviewed, but rich-content visual regressions still need human smoke in Iteration 2.
- Broad shared UI refactor could create layout regressions if mixed with feature polish.
- Planner docs can drift because older root and copied plan sections contain historical status.
- Tests currently cover smoke-level confidence, not pixel-perfect visual parity.

## Immediate Next Command For Main Agent

Move to Iteration 2:
- Start visual parity freeze for Home -> Subject -> Study -> Quiz/Flashcard/Written.
- Keep the expanded automated smoke as the release gate.
- Keep root docs untouched unless explicitly requested.

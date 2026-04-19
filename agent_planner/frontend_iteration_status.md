# Frontend Iteration Status

Forras: `frontend_plan.md`, `agent_planner/frontend_completion_plan.md`, `agent_planner/task_board.md`, es a jelenlegi kodallapot.

## Rovid osszkep

A frontend nagy feature-hianyai lezarva vannak: Glossary cluster/map/flash, Written feedback, Quiz results, Flashcard feedback, Home/Subject/Study P1 parity, es Study inline highlight/tooltip.

Iteration 1 is lezart: a Study parser / render boundary batch kod, review, build es smoke oldalon zold.

## Tenyegesen hatra

### P1
- Final visual parity freeze: Home, Subject, Study, Search, Onboarding.
- Kozos UI primitive audit csak ott, ahol valodi driftet vagy karos duplikaciot szuntet meg.
- Search es onboarding flow UX review, hogy ne maradjon route/state drift.

### P2
- Review, WrongAnswers, Settings, Pomodoro, ExamSim finom polish.
- Tipografiai / spacing egységesites ott, ahol meg kis drift maradt.
- Glossary csak regression check szinten maradt nyitva.

## Lezart batch-ek

1. **Glossary expansion**
   - Concept clusters kesz.
   - Concept map kesz.
   - Flash session modok keszek.

2. **Study parser / render boundary**
   - `<H>` inline highlight kesz.
   - `<T>` tooltip kesz.
   - `==text=={color}` highlight syntax kesz.
   - Ismeretlen custom tag fallback kesz.
   - Notes payload normalizalas kesz.
   - Hegel review edge-case javitva: `transparentTone()` kezeli a hex es non-hex highlight szineket.

3. **Smoke coverage**
   - `tests/blackbox-smoke.js` mar API + Home + Subject + Study + Search + Onboarding + Glossary routeokat ellenoriz.
   - Note payload contract smoke is van az elso lesson slug alapjan.

## Kovetkezo aktiv batch

### Batch: Core Visual Parity Freeze

- **Cel:** a fo tanulasi utvonal vegso vizualis / navigacios ellenorzese.
- **Scope:** Home, Subject, Study, Search, Onboarding, majd Quiz/Flashcard/Written regresszio smoke.
- **Nem fer bele:** nagy shared primitive refactor vagy uj feature.
- **Kockazat:** kozepes.
- **Safe now?** Igen.

## Verification

Legutolso zold kapuk:
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test:smoke`
- `node tests/blackbox-smoke.js --base-url http://localhost:3000`
- `npm.cmd run check:backend -- --subject it_biztonsag --base-url http://localhost:3000`

## Subagent szerepek

- **Huygens:** `agent_planner/task_board.md` PM board sync.
- **Turing:** status / drift / refactor monitoring.
- **Pascal:** Study/content edge-case support, ha ujabb parser hiba jon.
- **Hegel:** smoke/test regression, blackbox + whitebox kapuk.
- **Main agent:** Iteration 2 visual parity fixes es verifikacio.

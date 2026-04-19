## Status snapshot

### Completed
- Frontend P0 mojibake/copy fixes are done in the current worktree.
- Quiz / Written / Glossary UX expansions are implemented.
- Study parser/render boundary hardening is implemented and reviewed.
- Expanded blackbox smoke covers API plus Home, Subject, Study, Search, Onboarding, and Glossary routes.
- Backend smoke-check is extended and passes on localhost:3000.
- `vercel.json` now sets the `validate-answer` timeout budget.

### In progress
- Written-answer runtime hardening: payload guards, rubric acceptance, and response-shape normalization.
- Schema normalization, `lib/content.js` splitting, and search/content contract hardening.
- Remaining content-model cleanup beyond the Study render boundary.

### Next
- Finish the canonical schema / verifier work in a backend batch.
- Keep the planner delegated: main agent for P0 copy/UI, backend improver for schema/search/parser work.

# Improvement & Error Log

_Forras: jelenlegi worktree, `PLAN.md`, `REVIEW.md`, `Agentic_improve.md`, `frontend_plan.md`, `documentation/*`, valamint a friss modositasok a `Quiz`, `Written`, `Glossary`, `package.json` es backend smoke-check kornyeken._

## Rogvid allapotkep

A mostani diff foleg 3 iranyt erint:
1. frontend UX finomitas a `Quiz`, `Written`, `Glossary` kepernyokon,
2. backend smoke-check es deploy-elokeszites,
3. agentikus/content terv dokumentacios frissitese.

Ez jo irany, de a repo meg mindig hordoz par strukturális kockazatot: encoding/copy hibak, content schema drift, es a keresesi/content betoltesi logika tul sokat vallal egy helyen.

## Prioritasos hibak

| Prioritas | Hiba | Sulyossag | Erintett fajlok | Suggested owner | Safe to implement now |
|---|---|---:|---|---|---|
| P0 | UTF-8 / mojibake jellegu copy hibak latszanak a UI szovegekben | Medium | `src/screens/Quiz.jsx`, `src/screens/Written.jsx`, `src/screens/Glossary.jsx`, reszben `scripts/README.md` es dokumentumok | main/frontend | Yes |
| P0 | Rejtett BOM / file-encoding zaj kerult a `Quiz` es `Written` forrasok elejere | Low | `src/screens/Quiz.jsx`, `src/screens/Written.jsx` | main/frontend | Yes |
| P1 | A kereses tovabbra is linearis, minden subjectet bejar, es a relevancia/alias kezeles meg laza | Medium | `lib/content.js`, `app/api/search/route.js` | backend improver | Conditionally yes |
| P1 | A content schema normalizalas tobb helyen szetszort, emiatt alias drift es kesobbi regresszio kockazat van | High | `lib/content.js`, `app/api/*`, `scripts/generate-*.js`, `scripts/content-plan.js` | backend improver | No, csak koordinalt refaktorral |
| P1 | A Study/MDX custom parser alap hardeningje kesz, de uj content szintaxisoknal tovabbi fixture/review kell | Medium | `src/screens/Study.jsx`, `scripts/note-prompts.js`, `content/*/notes/*.mdx` | main/frontend + backend improver | Yes, kis batchben |

## Prioritasos fejlesztesi otletek

| Prioritas | Fejlesztesi otlet | Miert hasznos | Erintett fajlok | Suggested owner | Safe to implement now |
|---|---|---|---|---|---|
| P0 | Kozos frontend UI primitive-ek kinyerese a Quiz/Written/Glossary kepernyokbol | csokkenti a design driftet es a duplikalt inline stilusokat | `src/screens/Quiz.jsx`, `src/screens/Written.jsx`, `src/screens/Glossary.jsx`, `src/shell.jsx`, `src/theme.js` | main/frontend | Yes |
| P0 | Backend smoke-check futtatasa deploy elott / CI-ben | gyorsan elkapja a health/search/content regressziokat | `package.json`, `scripts/check-backend.js`, `scripts/README.md`, `vercel.json` | backend improver + reviewer | Yes |
| P1 | `lib/content.js` szetbontasa loader / normalizer / search reteggekre | konnyebb karbantartas, kevesebb rejtett mellekhatas | `lib/content.js`, `app/api/*` | backend improver | Conditionally yes |
| P1 | Canonical question/glossary/flashcard schema bevezetese | csokkenti az alias-eredetu hibakat es a silent fallbackeket | `scripts/generate-*.js`, `lib/content.js`, `app/api/*` | backend improver | No, nagyobb batch kell |
| P1 | Tanulasi elmenyen belli review actionok egységesítése | jobb visszacsatolas: quiz -> review -> wrong answers | `src/screens/Quiz.jsx`, `src/screens/Written.jsx`, `src/screens/WrongAnswers.jsx` | main/frontend | Yes |
| P2 | Search index / cache reteg elokeszitese | gyorsabb kereses es stabilabb relevancia nagy contentnel | `lib/content.js`, `app/api/search/route.js`, `scripts/generate-all.js` | backend improver | Conditionally yes |

## Konkret ellenorzesi pontok a kovetkezo korre

- A `Written` valaszertekelesben a fallback es az AI-valasz ugyanarra a response shape-re alljon be.
- A `Quiz` eredmenykeppernyon a question breakdown es a wrong-answer mentes ne torjon tobbkerdeses vagy multi-select eseteknel.
- A `Glossary` flash session modos valasztó maradjon determinisztikus a kivalasztott mod szerint.
- A `check:backend` script legyen tenylegesen hasznalva deploy elott, kulonben konnyen csak dokumentacio marad.
- A content pipeline es a frontend ne kulon nyelvet beszeljen a section / question / glossary mezokben.

## Rogvid owner-mapping

- `main/frontend`: UI, copy, layout, interaction, screen-level polish.
- `backend improver`: content schema, loaders, search, API contract, pipeline.
- `reviewer`: smoke-check, release guard, regreszios lista, review pass.

## Delegacio most

- `main agent`: a P0 mojibake/copy hibak javitasa a `src/screens/Written.jsx`, `src/screens/Quiz.jsx`, `src/screens/Glossary.jsx` fajlokban. Ezeket ebben a korben nem szerkesztem.
- `backend improver`: a `lib/content.js` bontasa, schema normalizalas, es a search/content contract keményites kulon batchben.
- `schema agent` vagy `main agent`: a content-plan concepts/objectives/coverage matrix refaktor, mert ez mar atfogo schema-valtozas.
- `most biztonsagos`: a backend smoke-check erosites, a deploy readiness ellenorzes, es a planner frissites a delegaciokkal.

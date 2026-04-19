## Frissites - 2026-04-19

### Kesz allapot
- Frontend P0 mojibake/copy javitasok keszen vannak.
- Quiz / Written / Glossary UX bovitesek keszen vannak.
- Backend smoke-check bovitve lett, es a localhost:3000 live check atmegy.
- `vercel.json` timeout be lett allitva a `validate-answer` route-hoz.

### Folyamatban
- Canonical schema, `lib/content.js` bontas, search/index es Study parser hardening.

### Next
- A maradek backend/content batch: schema + coverage + verifier.
- A maradek frontend: csak ami tenyleg meg nyitott a P1/P4-bol.

# Improvement Cycles

## Ciklus 1 - 2026-04-19

### Kész állapot
- A fő termékirány már stabil a `PLAN.md` alapján: Next.js frontend, fájl-alapú content, Groq/OpenRouter AI pipeline, nincs DB/auth.
- A backend/content oldalon megvan az első működő generálási lánc: `generate-notes.js`, `generate-questions.js`, `generate-extras.js`, `generate-all.js`, `validate-content.js`.
- A tartalmi terv és ellenőrzés már külön artefaktokban is él a `Agentic_improve.md` szerint: `plan.json`, `quality-report.json`, plan/validator npm script-ek.
- A frontend fókuszterv tiszta: Home, Subject, Study, Written, Quiz, Flashcard, Glossary, Search, plus a kisebb polish képernyők.
- A dokumentációs térkép megvan (`HOW_TO_USE.md`, `PROJECT_MAP.md`), így a következő körökben nem kell újra kitalálni a repo szerkezetét.

### Maradék, priorizált backlog
1. Tartalmi contract rendezése: schema drift, aliasok, egységes loader/serializer logika.
2. `lib/content.js` szétbontása kisebb, jól nevezett modulokra, cache-szel és egységes error mintával.
3. Study oldal parserének stabilizálása: MDX/callout/active recall/source disclaimer egységes kezelése.
4. Frontend design parity a P1/P2 képernyőkön: Home, Subject, Study, Written, Quiz Results, Flashcard.
5. Keresés és API réteg megbízhatósága: `search`, `validate-answer`, `health`, közös response shape.
6. Pipeline regressziók csökkentése: coverage, rubric, verifier/repair irány továbbépítése.

### Valószínű hibák / regressziók, amiket ellenőrizni kell
- `validate-answer` üres inputnál ne 500-at adjon, hanem 400-at.
- Score érték legyen mindig 0-100 között.
- A Study oldal markdown/callout/active recall blokkja ne törje meg a renderelést új szintaxisnál.
- A section-ek ne szóródjanak szét külön névvariánsokra a generálás során.
- A keresés ne legyen túl lassú vagy félrevezetően hiányos nagyobb content esetén.
- A frontend képernyők ne csússzanak el a design referencia után, főleg Home és Subject oldalon.

### Következő 3 implementációs batch
1. Batch A - tartalmi schema és backend rendbetétele: canonical shape, loader/serializer tisztítás, `content.js` bontás.
2. Batch B - Study/notes élmény stabilizálása: parser refactor, callout + active recall + disclaimer egységesítés.
3. Batch C - látható frontend parity: Home, Subject, Written, Quiz Results, Flashcard vizuális egyezés.

### Owners
| Terület | Felelős |
|---|---|
| Main / frontend | `src/screens/*`, `src/shell.jsx`, `app/globals.css` |
| Backend improver | `lib/content.js`, `app/api/*`, `scripts/*`, `pipeline/*` |
| Reviewer | `PLAN.md`, `REVIEW.md`, `Agentic_improve.md`, regressziólista és release-check |

### Rövid döntési szabály
- Ha a hiba a tartalom szerkezetét vagy generálását érinti, előbb backend/content batch.
- Ha a hiba a tanulási élményt vagy layoutot érinti, előbb frontend parity batch.
- Ha a hiba nem reprodukálható tisztán, előbb reviewer pass: schema, coverage, response shape, edge case check.


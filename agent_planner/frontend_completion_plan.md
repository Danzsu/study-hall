# Frontend Completion Plan

PM/Planner szemleletu, iterativ roadmap a frontend 100%-os befejezesehez.
Scope: `frontend_plan.md`, jelenlegi worktree allapot, reviewk, es a mar kesz UX bovitesegek.

## Allapotkep

### Done
- Frontend P0 mojibake/copy hibak javitva a `Written`, `Quiz`, `Glossary` screeneken.
- `Written` test feedback, `Quiz` results, es `Glossary` flash-session / concept cluster UX kesz.
- `Glossary` concept map nezet kesz, map-node es teljes map flash gyakorlasi lehetoseggel.
- `Home`, `Subject`, `Study`, es `Flashcard` nagyobb frontend_plan parity elemei a kodban mar bent vannak; a maradek inkabb hardening/polish.
- Backend smoke-check bovitve, localhost:3000 live check passolt.
- `validate-answer` runtime hardening es `vercel.json` timeout kapu bent van.
- `frontend_review.md` alapjan a Glossary cluster open/search viselkedes javitva, blokkolo review issue nincs.
- `tests/blackbox-smoke.js` subject-filter assertion szigoritva, `npm run test:smoke` zold.

### In progress
- Study parser / content contract tovabbi hardeningje nyitott.
- Shared UI primitive es cross-screen polish vegso pass nyitott.
- A jelenlegi UI primitive-k szorasat meg kell fogni, hogy a maradek screenek ne toljanak tovabbi driftet.

### Next
- Zard le a Study parser/render edge-case batch-et.
- Tedd stabilabba a screenek kozotti navigacios mintakat.
- Folytasd a review/test kapukat minden kisebb frontend batch utan.

### Later
- Finomabb vizualis polish ott, ahol mar csak kis erosites kell.
- Kisebb kozpontositott UI primitive refaktor, ha a maradek drift meg mindig szetszorja a stilust.
- Extra search ergonomia, csak ha a core flow mar 100%-osan stabil.

## Celu struktra a frontend befejezeshez

### Batch elv
1. Egy batch = 1-3 screen vagy 1 kozos UI minta.
2. Minden batch vegen legyen lint/build + manual smoke + review update.
3. Ne keverd a content schema refaktort a tiszta UI lezarral, ha elkerulheto.

### Definition of Done
- A screen megfelel a jelenlegi tervnek vagy tudatosan frissitett design-dontesnek.
- Nincs visual regression a szomszedos flowkban.
- `npm run lint` es `npm run build` zold.
- Relevant manual smoke lefutott a valtoztatott route-on.
- A planner doc frissitve van, es a statuszok nincsenek elmaradva.

## Screenenkenti checklist

### 1. Home
**Status:** Next

Checklist:
- Hero CTA-k, subject row actionok, es add-subject belso flow legyen konzisztens.
- A subject cardok state-jei ne csuszasanak el kisebb viewporton.
- A quick entry pontok ugyanazokat a navigacios mintakat hasznaljak, mint a Subject screen.

Acceptance criteria:
- A dashboardrol 1 kattintassal elerheto a Study / Quiz / Flashcards / Subject flow.
- Nincs tulcsordulo text vagy rosszul toro layout mobilon.
- A hero es a lista kozott a vizualis hierarchy ertekelhetoen stabil.

### 2. Subject
**Status:** In progress

Checklist:
- Hero/progress/modes layout legyen vegig konzisztens.
- Mode kartyak belso spacingje, ikonboxa, es arrow affordance-a legyen egysges.
- Learning path / sections sorrendje ne utkozzon a study entry pontokkal.

Acceptance criteria:
- A subject nyitohely a study flow fo hubjakent mukodik.
- A mode actionok egyertelmuen szetvalasztjak a tanulas, gyakorlás, es attekintes utat.

### 3. Study
**Status:** In progress

Checklist:
- Callout, active recall, source disclaimer, math, es inline highlight viselkedes stabilizalasa.
- MDX/render parser csak tamogatott blokkokat engedjen at, ne legyen csendes torzitas.
- Sidebar, progress, es lesson switching ne torje meg a content olvasasi flowt.

Acceptance criteria:
- Ugyanaz a tartalom minden tamogatott blokktipuson konzisztensen jelenik meg.
- Parser hiba eseten ertelmes fallback vagy hibatabla jelenik meg.
- Nincs rejtett drift a content es a renderelt UI kozott.

### 4. Quiz
**Status:** Done, majd minor polish only

Checklist:
- Maradjon zart a jelenlegi results flow.
- Csak akkor nyulj hozza, ha uj regression vagy UI drift jelenik meg.

Acceptance criteria:
- Score / breakdown / retry flow stabil.
- Nincs visszacsuszas a jelenlegi UX boviteseiben.

### 5. Written
**Status:** Done, majd minor polish only

Checklist:
- A feedback, annotacio, es ertekelesi flow maradjon stabil.
- Csak content/schema valtozas miatt legyen ujraerintve.

Acceptance criteria:
- A submitted answer feedback olvashato, koherens, es nem torik mobilon.

### 6. Glossary
**Status:** Done, majd minor polish only

Checklist:
- Concept clusters, flash-session, topic open state, es keresesi viselkedes maradjon egysges.
- Ne legyen ujra bevezetve a korabbi open/search state bug.

Acceptance criteria:
- A cluster open action mindig ertelmes topic/list view-ba visz.
- A flash session es a topic view kozotti atmenet egyertelmu.

### 7. Flashcard
**Status:** Later

Checklist:
- Ghost stack, overlay, es transition polish ellenorzese.
- Ha kell, csak kis UI primitive refaktorral javitsd.

Acceptance criteria:
- A card flip / result feedback nem jar layout ugrassal.

### 8. Review
**Status:** Later

Checklist:
- Topic/chip state, answer reveal, es navigation ergonomia ellenorzese.
- Csak akkor erinti a batch-et, ha kozos UI mintat is tisztitani kell.

Acceptance criteria:
- A review flow gyors, olvashato, es nem keveredik a quiz/written patternokkal.

### 9. WrongAnswers
**Status:** Later

Checklist:
- Session results es retry cselekvesek koherensek legyenek.
- A fontos visszateresek ugyanolyan affordance-t kapjanak, mint mas tanulasi flowk.

Acceptance criteria:
- A hibas valaszokbol visszateres a tanulasi utba egyertelmu.

### 10. Search
**Status:** In progress

Checklist:
- Result routing, highlight, es subject-szintu entry pontok legyenek megbizhatoak.
- A content search maradjon API-alapu, ne legyen UI-kozeli duplikacio.

Acceptance criteria:
- A keresesi eredmeny egy kattintassal a megfelelo screenre visz.
- Nem latszik stale vagy ellentmondasos subject mapping.

### 11. Onboarding
**Status:** Next

Checklist:
- A first-run flow ne szakadjon szet kisebb state valtasoknal.
- A subject setup ne uzkoddjon a Home / Settings utvonalakkal.

Acceptance criteria:
- A user at tud menni a setup-on megszakitas nelkul.

### 12. Settings
**Status:** Later

Checklist:
- Toggles, rows, es secondary navigation egységesitese.
- Csak akkor nyulj hozza, ha a kozos UI primitive-ket is atemeljuk.

Acceptance criteria:
- A beallitasok koherensen illeszkednek a shellhez.

### 13. Pomodoro
**Status:** Later

Checklist:
- Timer shell, controls, es settings dialog maradjon stabil.
- Ne keruljon be uj vizualis minta csak emiatt a screen miatt.

Acceptance criteria:
- A timer, pause/resume, reset, es settings flow tiszta es egyszeru.

### 14. ExamSim
**Status:** Later

Checklist:
- Configurator, session, written/mc question states, es results flow vegigellenorzese.
- Csak a common primitive-ekkel egyutt refaktorald.

Acceptance criteria:
- A simulator egy teljes futast tud vegigvinni regresszio nelkul.

## Prioritized next batches

### Batch 1 - Home + Subject parity
**Celpont:** a fo entry pointok es a subject hub lezarasa.

Mi tartozik bele:
- Home hero, subject rows, add-subject CTA koherencia.
- Subject hero, modes, es section ordering polish.

Risk:
- Kozepes. Sok user latja, de a valtozasok tisztan UI jelleguek.

Safe now?
- Igen, ha nem nyulsz a content schema-hoz.

### Batch 2 - Study hardening
**Celpont:** a legfontosabb user-facing tartalom olvasasi utvonal stabilizalasa.

Mi tartozik bele:
- Callout / recall / math / disclaimer render.
- Parser es render boundary tisztazasa.

Risk:
- Kozepes-magas. A study flow a legkenyebb felulet.

Safe now?
- Igen, de kis szeletekben, fixture-alapu ellenorzessel.

### Batch 3 - Search + onboarding + shared primitives
**Celpont:** a keresesi es belptetesi utak, plusz a kozos UI minta csokkentese.

Mi tartozik bele:
- Search routing/highlight megbizhatosag.
- Onboarding finish flow.
- A leggyakoribb button/card/pill primitive-ek kinyerese.

Risk:
- Kozepes. Ha tul nagyot raksz egybe, gyorsan szetszorodik.

Safe now?
- Igen, de csak akkor, ha a Batch 1-2 mar nem aktivan mozgatja ugyanazokat a komponenseket.

## Review es test kapuk

### Minden batch utan
- `npm run lint`
- `npm run build`
- manual smoke a valtoztatott route-on
- planner dokumentum frissites

### Ha Study/Markdown parser erintett
- fixture-alapu render check
- legalabb egy complex lesson smoke
- math + callout + active recall vizsgalat

### Ha Home/Subject erintett
- desktop es mobil screenshot ellenorzes
- navigation smoke a fo CTA-kon

### Ha Search/Glossary erintett
- query preserve / clear viselkedes check
- topic/open state ellenorzes

## Subagent role mapping

### Main frontend agent
- UI batch-ek implementalasa.
- Screenenkenti polish es layout parity.
- Kicsi, gyors, lezart valtoztatasok.

### Backend improver
- Content schema, parser contract, API response shape, es validate-answer / search stabilitas.
- Minden olyan valtozas, ami a frontend render inputjat erinti.

### Reviewer
- Minden batch utan regresszio-kockazat, layout drift, es acceptance ellenorzes.
- Fontos, hogy a review csak a statuszt frissitse, ne uj refaktort inditson el.

### PM / Planner
- Prioritas, batch size, DoD, es dependent blokkok karbantartasa.
- Ha valami nagy refaktorba csuszna at, delegald kulon batch-re.

## Kockazatok

- A Home/Subject/Study egyszerre valo atpiszkalasa tul nagy feluletet nyitna.
- A parser refaktor content schema stabilitas nelkul hamis sikereket adhat.
- A kozos UI primitive-k nyerese csak akkor jon, ha tenyleg csokkenti a duplikaciot.
- A dokumentacio elore rohanhat a kodhoz kepest, ezert minden statusz legyen kodos allapotra kotve.

## Vegso irany

Ha a mostani allapotbol kell 100%-ra eljutni, akkor a legjobb sorrend:
1. Core visual parity freeze: Home + Subject + Study + Search + Onboarding.
2. Shared primitives csak a valoban driftet okozo duplikaciokra.
3. A maradt kis polish munka csak ezutan.

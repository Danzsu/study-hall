# Refactor Plan

_Alap: jelenlegi worktree, friss runtime hardening, es a mostani frontend UX bovitesek._

## Rogvid allapotkep

A friss valtozasok alapjan a `validate-answer` runtime hardening mar jobb allapotban van:
- payload / field guardok megvannak
- opcionális rubric elfogadas megvan
- response shape stabilabb
- `check-backend` bovitve van, es a localhost:3000 live check megy

Ez azt jelenti, hogy a refactor-nyomas most nem a written runtime-on van, hanem foleg:
1. content schema + loader normalizacio,
2. Study MDX / custom parser stabilizacio,
3. search / API kozos seged- es response-minta,
4. frontend kozos UI primitive-ek kinyerese.

## Projekt struktura - best practice alapjan

_Inference: az alabb javasolt fa Next.js App Router + JS-only repo mintakbol jon, nem kulso dokumentaciobol. A cel, hogy az `app/` maradjon a route-layer, a `src/` a UI/domain layer, a `lib/` a shared backend/domain helper layer, a `scripts/` pedig a content/pipeline orchestration layer._

### Javasolt celstruktura

```text
study-hall/
  app/
    layout.jsx
    page.jsx
    globals.css
    api/
      health/route.js
      search/route.js
      validate-answer/route.js
      subjects/
      notes/
      questions/
      flashcards/
      glossary/
    study/[slug]/page.jsx
    quiz/[slug]/page.jsx
    written/[slug]/page.jsx
    flashcards/[slug]/page.jsx
    glossary/[slug]/page.jsx
    review/[slug]/page.jsx
    wrong-answers/[slug]/page.jsx
    search/[slug]/page.jsx
    subject/[slug]/page.jsx
    onboarding/page.jsx
    pomodoro/page.jsx
    settings/page.jsx
    exam/[slug]/page.jsx
  src/
    screens/
      Home.jsx
      Subject.jsx
      Study.jsx
      Quiz.jsx
      Written.jsx
      Flashcard.jsx
      Glossary.jsx
      Review.jsx
      WrongAnswers.jsx
      Search.jsx
      Settings.jsx
      Onboarding.jsx
      Pomodoro.jsx
      ExamSim.jsx
    components/
      ui/
      study/
      quiz/
      written/
      glossary/
      layout/
    store.jsx
    theme.js
    shell.jsx
    RouteShell.jsx
    mascot.jsx
    sounds.js
  lib/
    content.js
    schema.js
    normalize-content.js
    search.js
    summary.js
    loaders/
    api/
    validation/
  scripts/
    generate-all.js
    generate-notes.js
    generate-questions.js
    generate-extras.js
    generate-diagrams.js
    content-plan.js
    validate-content.js
    check-backend.js
    llm-rate-limit.js
    note-prompts.js
    normalize-content.js
    document-chunker.js
    content-utils.js
    pdf-text.js
    local-generators.js
  pipeline/
    agents/
    models.py
    config.py
    process.py
    groq_client.py
  content/
    subjects.json
    <subject>/
  storage/
    subjects/
      <subject>/
        sources/
  public/
    assets/
    sounds/
  documentation/
    HOW_TO_USE.md
    PROJECT_MAP.md
    IMPROVEMENT_CYCLES.md
  Agent_planner/
    improvement&error.md
    refactor.md
```

### Mit jelent ez gyakorlatban

- `app/` legyen a route- és API-layer, ne tartson domain logikát.
- `src/screens/` maradhat a page-level UI, de a nagyobb, ismétlődő vizuális részek menjenek `src/components/` alá.
- `lib/` legyen az egyetlen közös server/domain helper réteg.
- `scripts/` maradjon orchestration + pipeline, de a schema/normalization logika ne szóródjon szét több fájlba.
- `documentation/` csak olvasható állapotnapló és működési térkép legyen, ne rejtett tervezési logika.
- `Agent_planner/` maradjon a döntési és refactor backlog helye, ne váljon kódtárhellyé.

### Mi hiányzik most ehhez képest

- A `lib/` alatt még nincs külön schema / normalize / search bontás.
- A `src/components/` réteg hiányzik, ezért a `src/screens/` túl vastag.
- A `app/api/*` route-ok még túl sok közös mintát másolnak.
- A `documentation/` és `Agent_planner/` már jó irány, de a státuszoknak szigorúan követniük kell a worktree-t.

### Migrációs lépések

1. **Schema extraction**
   - Hozz létre `lib/schema.js` vagy `lib/normalize-content.js` réteget.
   - A loader / search / API route-ok innen kapják a kanonikus shape-et.

2. **Content service split**
   - Bontsd a `lib/content.js`-t `loaders`, `summary`, `search`, `validation` logikai egységekre.
   - A cache maradhat, de egy helyen legyen kezelve.

3. **UI primitive extraction**
   - A `src/screens/` közös pill/card/button/progress mintáit emeld ki `src/components/ui/` alá.
   - A feature-specifikus részek maradjanak a screen-ekben.

4. **Route/API cleanup**
   - A route-ok maradjanak vékonyak: input validáció + service call + response shape.
   - Közös `jsonOk/jsonError` segédek csak egy helyről jöjjenek.

5. **Pipeline contract tightening**
   - A `scripts/content-plan.js` és `scripts/validate-content.js` kapjon stabilabb schema-checkeket.
   - A generatorok csak a canonical schema-t használják.

6. **Docs sync**
   - Minden batch után a `PLAN.md`, `REVIEW.md`, `Agentic_improve.md`, `documentation/*` és `Agent_planner/*` kapjon status update-et.

### Kockazatok

- Ha a schema refactor egyszerre történik a frontend és backend UI refaktorral, túl nagy lesz a blast radius.
- Ha a `lib/content.js` bontás cache nélkül történik, a szerverless teljesítmény romolhat.
- Ha a `src/components/` kivágás túl korán indul, a screen-ek és a design tokenek között drift keletkezhet.
- Ha az API helper layer túl agresszíven egységesít, a kliens oldali response shape-ek megváltozhatnak.

### Most implementalhato-e?

- **P0/P1 backend strukturális refaktorok:** külön batch kell.
- **UI primitive extraction:** implementálható, de csak a már stabil UX screen-ekre.
- **Docs-only target structure update:** most azonnal használható, mert nem érinti a kódot.

## P0 refaktorok

### 1. Canonical content schema es normalizacios layer
- **Erintett fajlok:** `lib/content.js`, `app/api/questions/*`, `app/api/search/*`, `app/api/flashcards/*`, `app/api/glossary/*`, `scripts/generate-questions.js`, `scripts/generate-extras.js`, `scripts/note-prompts.js`, `scripts/content-plan.js`
- **Miért kell:** a mostani alias-kezelés (`q/question`, `ideal/idealAnswer`, `front/term`, stb.) továbbra is szetszort. Ez a legnagyobb schema-drift forras.
- **Javasolt megoldas:** kulon `lib/schema.js` vagy `lib/normalize-content.js`, kanonikus subject/question/flashcard/glossary shape, es a route-ok csak ezt hasznaljak.
- **Kockazat:** magas. Ha fele-fele modon megy, azonnal ujabb driftet gyart.
- **Most implementalhato?** Nem egyedul. Kulon backend batch kell, mert egyszerre erinti a generatorokat es az API-kat.

### 2. Study oldal markdown / MDX parser stabilizalasa
- **Erintett fajlok:** `src/screens/Study.jsx`, `scripts/note-prompts.js`, `content/*/notes/*.mdx`
- **Miért kell:** a custom renderer most is az egyik legkenyebb user-facing pont. A callout / active recall / source disclaimer logika ossze van mosva a sima markdown renderrel.
- **Javasolt megoldas:** explicit markdown-to-component transzform layer, tamogatott blokktipusokkal, plusz fixture-alapu render tesztek.
- **Kockazat:** magas. A study UX itt a legfontosabb, es egy rossz refactor egyszerre torhet contentet es renderelest.
- **Most implementalhato?** Kulon batch kell, eloszor parser + fixture coverage, utana rollout.

## P1 refaktorok

### 3. `lib/content.js` szetbontas kisebb service-ekre
- **Erintett fajlok:** `lib/content.js`, `app/api/*`
- **Miért kell:** a fajl most sok feladatot visz egyszerre: beolvasas, normalizalas, summary, search, cache, lesson metadata.
- **Javasolt megoldas:** `loaders`, `normalizers`, `search`, `summary` modulok. A route-ok maradjanak vekonyak.
- **Kockazat:** kozepes. A cache es a loader order kolcsonhatasok miatt figyelni kell.
- **Most implementalhato?** Igen, de csak backend batch-ben, mert a release-hez nem kell azonnal.

### 4. API response / error helper layer
- **Erintett fajlok:** `app/api/search/route.js`, `app/api/health/route.js`, `app/api/validate-answer/route.js`, `app/api/subjects/*`, `app/api/notes/*`, `app/api/questions/*`, `app/api/glossary/*`, `app/api/flashcards/*`
- **Miért kell:** a route-ok thin wrapper-ek, de nincs kozos `jsonOk/jsonError/notFound` minta. A validate-answer mar jobb, de a tobbi route meg szorasban van.
- **Javasolt megoldas:** kozos helper layer, egységes status / error shape, es ugyanaz a format minden route-on.
- **Kockazat:** kozepes. Ha rosszul vezetik be, a kliens oldali elvárasok elcsusznak.
- **Most implementalhato?** Igen, de egy külön API batch-ben, nem a frontendnel egyutt.

### 5. Search implementacio indexesitese vagy legalabb cache-elese
- **Erintett fajlok:** `lib/content.js`, `app/api/search/route.js`, `scripts/generate-all.js`
- **Miért kell:** jelenleg a search linearis. A mostani content volumen mellett meg oke, de a jovo refaktor-nyomasa itt latszik majd meg eloszor.
- **Javasolt megoldas:** subject-szintu lightweight index vagy build-time cache, minimalis tokenizalas, tiszta score layer.
- **Kockazat:** kozepes. A ranking valtozhat, ezert visszateszt kell.
- **Most implementalhato?** Igen, de csak ha a schema mar stabilabb. Most inkabb P1 batch.

### 6. Frontend kozos UI primitive-ek
- **Erintett fajlok:** `src/screens/Home.jsx`, `src/screens/Subject.jsx`, `src/screens/Study.jsx`, `src/screens/Written.jsx`, `src/screens/Quiz.jsx`, `src/screens/Glossary.jsx`, `src/shell.jsx`, `src/theme.js`
- **Miért kell:** a mostani UX bovitesekkel a duplikalt card/pill/button/progress mintak meg inkabb szaporodnak.
- **Javasolt megoldas:** kis, kozos primitive-ek: stat pill, section header, primary/ghost button, progress bar, bordered card.
- **Kockazat:** alacsony-közepes. A layout stabil, de a komponensek kinyerese sok helyen nyul bele.
- **Most implementalhato?** Igen, de inkabb kozepes prioritasu frontend batch-ben.

## P2 refaktorok

### 7. Study / notes inline highlight és tooltip parser
- **Erintett fajlok:** `src/screens/Study.jsx`, `scripts/note-prompts.js`, `content/*/notes/*.mdx`
- **Miért kell:** a jovo tartalmaknal a `H` / `T` jellegu inline elemek jol jonnek, de most meg nincs egységes parser feloldas.
- **Javasolt megoldas:** csak a canonical parser utan erdemes bevezetni, kulon transform szabalyokkal.
- **Kockazat:** kozepes, mert uj syntaxot nyit.
- **Most implementalhato?** Nem most. Batch-be tedd a study parser refactorral egyutt.

### 8. Content plan / verifier tovabbi strukturazasa
- **Erintett fajlok:** `scripts/content-plan.js`, `scripts/validate-content.js`, `scripts/generate-notes.js`, `scripts/generate-questions.js`, `scripts/generate-extras.js`
- **Miért kell:** a shared plan jo alap, de meg heuristikus. A coverage / rubric / objective mezok meg lehetnek erosebbek.
- **Javasolt megoldas:** concept inventory, coverage matrix, rubric metadata, es repair-loop jelzesek.
- **Kockazat:** kozepes, mert token- es folyamatnoveles.
- **Most implementalhato?** Igen, de csak a backend/content batch kovetkezo koraban.

## Ahol most nem kell refactor

- `app/api/validate-answer/route.js` - a runtime hardening mar megtortent, ez most inkabb karbantartasi allapotban van.
- `scripts/check-backend.js` - a smoke-check mar hasznos, itt csak tovabbi ellenorzesek adhatok hozza, nagy refactor nem indokolt.
- `src/screens/Quiz.jsx`, `src/screens/Written.jsx`, `src/screens/Glossary.jsx` - a friss UX boviteseik miatt most a functionally kész allapotot inkabb meg kell tartani, mint tovabb bontani.

## Javasolt sorrend

1. Canonical content schema es normalizacio.
2. Study parser / markdown transzform layer.
3. `lib/content.js` szetbontas.
4. API response helper layer.
5. Search index / cache refaktor.
6. UI primitive-ek kinyerese.

## Delegacio

- **Backend improver:** P0 schema + Study parser + `lib/content.js` bontas.
- **Main frontend:** UI primitive-ek, csak ha a jelenlegi UX layout mar stabil marad.
- **Reviewer:** minden batch utan smoke-check + response-shape ellenorzes.

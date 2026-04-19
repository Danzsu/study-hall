# Study Hall projekt-térkép

Rövid, gyakorlati áttekintés arról, hogy a repo fő részei mire valók, és hol érdemes elkezdeni a munkát.

## Gyors kép

A projekt egy Next.js-alapú tanulófelület.  
A felületet a `src/` és az `app/` együtt adja, a tananyagot a `content/` tárolja, a generálási és előállítási logika a `scripts/` és a `pipeline/` alatt él, a nyers források pedig a `storage/` mappában vannak.

## Könyvtárak

### `app/`
Next.js App Router réteg.

- `app/page.jsx`: belépő oldal.
- `app/layout.jsx`: globális layout.
- `app/globals.css`: globális stílusok és design tokenek.
- `app/api/`: szerver oldali API route-ok.
  - `health/`: health check endpoint.
  - `search/`: tartalomkeresés API.
  - `validate-answer/`: írásbeli válasz értékelése.
  - további `api/*` route-ok a subject, notes, quiz, glossary, flashcard és related data kiszolgálására.
- `app/<route>/[slug]/page.jsx`: route-shell oldalak a külön tanulási nézetekhez.

### `src/`
Frontend alkalmazáslogika és UI.

- `src/screens/`: a fő képernyők.
  - `Home.jsx`: főoldal / dashboard.
  - `Subject.jsx`: subject áttekintő oldal.
  - `Study.jsx`: jegyzetnéző, recall blokkokkal.
  - `Search.jsx`: keresőfelület.
  - további képernyők: quiz, written, flashcards, review, glossary, wrong answers, settings, stb.
- `src/shell.jsx`: globális app shell, navigáció, keresés ikon, chrome.
- `src/store.jsx`: navigációs és alkalmazásállapot segédek.
- `src/theme.js`: szín- és design tokenek.
- `src/RouteShell.jsx`: útvonalhoz kötött wrapper, breadcrumb és subject chrome.
- `src/mascot.jsx`, `src/sounds.js`: kisebb UI/élmény segédek.

### `lib/`
Közös szerver oldali helper réteg.

- `lib/content.js`: a tartalom betöltése, normalizálása, összefoglalása és keresése.
  - subject, question, flashcard, glossary, notes loader.
  - frontmatter és markdown/MDX feldolgozás.
  - search index jellegű logika.
  - subject summary helper.

### `scripts/`
Node-alapú tartalomgenerálási eszközök.

- `generate-all.js`: teljes pipeline futtatása.
- `generate-notes.js`: notes / MDX generálás.
- `generate-questions.js`: kérdésgenerálás.
- `generate-extras.js`: flashcard és glossary generálás.
- `generate-diagrams.js`: diagram / vizuális kiegészítők.
- `normalize-content.js`, `document-chunker.js`, `pdf-text.js`, `content-utils.js`: előfeldolgozó és normalizáló segédek.
- `local-generators.js`, `llm-rate-limit.js`, `load-env.js`: LLM-hívás és környezetkezelés.
- `note-prompts.js`: promptok és notes generálási szabályok.
- `scripts/README.md`: a pipeline használati leírása.

### `pipeline/`
Python oldali content/LLM feldolgozó réteg.

- `process.py`: feldolgozási belépő.
- `models.py`, `config.py`, `groq_client.py`: pipeline konfiguráció és kliensréteg.
- `agents/`: agent-specifikus komponensek.
- `requirements.txt`: Python függőségek.

Megjegyzés: a repo alapján itt párhuzamosan fut egy Node és egy Python pipeline is, ezért a tartalomséma és a promptlogika itt könnyen szétcsúszhat.

### `content/`
A kanonikus, generált tanulási tartalom.

- `content/subjects.json`: subject lista.
- `content/<subject>/notes/*.mdx`: jegyzetek.
- `content/<subject>/notes/lessons.json`: leckeindex.
- `content/<subject>/questions.json`: kérdések.
- `content/<subject>/flashcards.json`: kártyák.
- `content/<subject>/glossary.json`: fogalomtár.
- `content/<subject>/diagrams.json`: diagramok / ábrák.
- `content/<subject>/meta.json`: subject metaadatok.

### `storage/`
Nyers forrásanyagok és bemeneti fájlok.

- subjectenként rendezett források.
- tipikusan `sources/lesson_sources/` és `sources/test_sources/`.
- ide kerülnek a PDF, PPT, DOCX, MD és egyéb bejövő anyagok, amelyekből a pipeline dolgozik.

### `public/`
Statikus, böngészőből közvetlenül kiszolgált assetek.

- képek, ikonok, vizuális segédanyagok.
- olyan fájlok, amelyeket a UI közvetlenül hivatkozik.

### `frontend_claude_design/`
Design referencia és külön frontend anyagok.

- inspirációs / kísérleti frontend assets.
- jelenleg inkább vizuális és koncepcionális hivatkozási terület.

## Root config fájlok

### Fontos build és tool config

- `package.json`: npm script-ek, függőségek.
- `next.config.mjs`: Next.js konfiguráció.
- `tailwind.config.js`: Tailwind setup.
- `postcss.config.mjs`: PostCSS lánc.
- `jsconfig.json`: path aliasok és JS beállítások.
- `.eslintrc.json`: lint szabályok.
- `.gitignore`: git által ignorált fájlok.
- `.env`, `.env.example`, `.env.local.example`: környezeti változók mintái.

### Projekt-dokumentumok a gyökérben

- `README.md`: magas szintű repo leírás.
- `PLAN.md`: hosszabb távú fejlesztési terv.
- `REVIEW.md`: refaktor / review jellegű megjegyzések és kockázatok.
- `Agentic_improve.md`: agentikus fejlesztési ötletek és háttéranyag.
- `frontend_plan.md`: frontend fókuszú terv.

## Hol érdemes kezdeni

### Frontend munka
Kezdési pontok:

1. `src/screens/Home.jsx`
2. `src/screens/Subject.jsx`
3. `src/screens/Study.jsx`
4. `src/screens/Search.jsx`
5. `src/shell.jsx`, `src/theme.js`, `app/globals.css`

Ezek adják a fő user flow-t, a közös vizuális nyelvet és a legtöbb interakciót.

### Backend API munka
Kezdési pontok:

1. `lib/content.js`
2. `app/api/search/route.js`
3. `app/api/validate-answer/route.js`
4. `app/api/health/route.js`
5. a többi `app/api/*` route

Ha valami adat-kontraktus vagy response shape változik, először itt érdemes keresni.

### Content pipeline munka
Kezdési pontok:

1. `scripts/README.md`
2. `scripts/generate-all.js`
3. `scripts/generate-notes.js`
4. `scripts/generate-questions.js`
5. `scripts/generate-extras.js`
6. `storage/subjects/*/sources/`
7. `content/`

Ha új subjectet, új notes formátumot vagy új generálási lépést vezetnél be, ez a legfontosabb útvonal.

## Rövid munkamegosztási térkép

- UI és navigáció: `src/`
- route-ok és serverless API: `app/`
- tartalommodellek és keresés: `lib/content.js`
- tartalom előállítás: `scripts/` és `pipeline/`
- bejövő nyers anyagok: `storage/`
- kész, verziózott study content: `content/`
- statikus assetek: `public/`
- design referencia: `frontend_claude_design/`


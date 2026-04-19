# Study Hall használati útmutató

Ez a dokumentum azt foglalja össze, hogy mi a projekt célja, hogyan használható a felület, hogyan indul fejlesztésre, hogyan működik a tartalomgenerálás, és hol találhatók a fontos fájlok.

## Projekt célja

A Study Hall egy egyetemi tanulást támogató webalkalmazás. A célja, hogy egyetemi jegyzetekből és forrásanyagokból egy helyen lehessen:

- notes / tanulójegyzeteket olvasni
- quiz kérdéseket megoldani
- flashcardokat használni
- glossary / fogalomtárat böngészni
- review nézetben visszanézni a tananyagot
- written test feladatokat AI-val értékeltetni

A tartalom jelenleg fájlokban él a repóban, a generálás pedig lokális script-ekkel fut. Nincs klasszikus adatbázis-központú architektúra, ezért a projekt jól követhető és könnyen deployolható Vercelre.

## Felhasználói app flow

### 1. Főoldal

A kezdőoldalon subjecteket lehet kiválasztani. Itt jelennek meg:

- összegzett statok
- haladás
- napi/ heti aktivitás
- gyors belépési pontok a tanulási módokhoz

### 2. Subject oldal

A subject oldal a tárgy vezérlőpultja. Innen lehet elérni:

- Study
- Quiz
- Flashcards
- Written Test
- Wrong Answers
- Review
- Glossary
- Exam mód

Itt látszik a subject állapota, a szekciók és a haladás.

### 3. Study nézet

A tanulójegyzeteket MDX formában olvashatod. A nézet támogat:

- markdown szerkezetet
- képleteket
- callout blokkokat
- active recall kérdéseket a lecke végén
- forrásfigyelmeztetést / disclaimer blokkot

### 4. Quiz / Written / Flashcards / Review

Ezek a gyakorló nézetek a tartalom különböző feldolgozott formáit használják:

- Quiz: feleletválasztós és egyéb kérdések
- Written: kifejtős válaszok, AI értékeléssel
- Flashcards: gyors ismétlés
- Review: teljes kérdés-válasz áttekintés

### 5. Search

A kereső a subjecthez tartozó tartalomban keres:

- notes
- questions
- glossary
- flashcard tartalmak

## Fejlesztői setup

### 1. Függőségek telepítése

```bash
npm install
```

### 2. Környezeti változók beállítása

Hozz létre egy `.env.local` fájlt a gyökérben, és add meg a szükséges kulcsokat.

Minimum:

```env
GROQ_API_KEY=...
```

Opcionális fallback:

```env
OPENROUTER_API_KEY=...
```

### 3. Dev szerver indítása

```bash
npm run dev
```

Ez helyben elindítja a Next.js fejlesztői szervert.

## Fő npm parancsok

- `npm run dev` - fejlesztői szerver
- `npm run build` - production build
- `npm run start` - production szerver helyi futtatása
- `npm run lint` - ESLint ellenőrzés
- `npm run plan:content` - tartalomterv generálása
- `npm run validate:content` - tartalom validálása
- `npm run generate:content` - teljes content pipeline futtatása

## Tartalomgenerálási workflow

A projekt fő tartalma fájlokban készül és fájlokban is tárolódik.

### Tipikus út

1. A nyers forrásanyagok bekerülnek a `storage/subjects/<slug>/sources/` alá.
2. A pipeline elemzi a forrást.
3. A script-ek előállítják a kész anyagokat a `content/<subject>/` mappába.
4. A frontend ezt a `content/` réteget olvassa.

### Fő lépések

- terv készítése: `npm run plan:content`
- ellenőrzés: `npm run validate:content`
- generálás: `npm run generate:content`

### Kimeneti fájlok

Egy subjectnél tipikusan ezek jönnek létre:

- `content/<subject>/notes/*.mdx`
- `content/<subject>/notes/lessons.json`
- `content/<subject>/questions.json`
- `content/<subject>/flashcards.json`
- `content/<subject>/glossary.json`
- `content/<subject>/meta.json`
- `content/<subject>/diagrams.json`

## Env változók

### Kötelező

- `GROQ_API_KEY`

Ezt a written answer értékelés és bizonyos AI folyamatok használják.

### Opcionális

- `OPENROUTER_API_KEY`

Fallback modellkiszolgáláshoz használható, ha a Groq nem elérhető vagy tartalék kell.

### Megjegyzés

Az `.env.example` és `.env.local.example` mintafájlok segítenek a beállításban, de valós kulcsot ne commitolj.

## Deploy megjegyzések

- A projekt Vercelre van tervezve.
- A kész tartalom a repóban él, ezért a deploy a git állapotból épül.
- Nincs külön adatbázis, ezért a tartalom és az alkalmazás együtt deployolódik.
- A progress és bizonyos user-state adatok lokálisan tárolódnak, nem szerver oldalon.

## Tech stack

### Frontend

- Next.js 14
- React 18
- JavaScript
- Lucide React ikonok
- inline style alapú komponensek
- `app/globals.css` globális stílusok

### Tartalom és megjelenítés

- MDX
- KaTeX
- `remark-math`
- `rehype-katex`

### AI / generálás

- Groq API
- OpenRouter fallback
- Node.js script-alapú content pipeline

### Egyéb függőségek

- `mammoth` - DOCX feldolgozás
- `pdf-parse` - PDF feldolgozás

## Hol vannak a fájlok

### App és UI

- `app/` - route-ok, API-k, globális layout
- `src/screens/` - fő képernyők
- `src/shell.jsx` - app chrome
- `src/store.jsx` - app state és navigáció
- `src/theme.js` - theme tokenek

### Backend és tartalom

- `lib/content.js` - tartalom betöltés és normalizálás
- `app/api/` - backend route-ok
- `content/` - kész, verziózott tananyagtartalom
- `storage/` - nyers bemeneti anyagok

### Pipeline

- `scripts/` - content generáló Node script-ek
- `pipeline/` - Python pipeline komponensek

### Design és referencia

- `frontend_claude_design/` - vizuális referencia és ötletanyag

### Dokumentáció

- `documentation/PROJECT_MAP.md` - projektstruktúra térkép
- `documentation/HOW_TO_USE.md` - ez a használati útmutató
- `PLAN.md` - fejlesztési terv
- `REVIEW.md` - review/refactor megjegyzések
- `Agentic_improve.md` - agentikus fejlesztési ötletek
- `frontend_plan.md` - frontend fókuszú terv

## Gyakori hibák és troubleshooting

### 1. A dev szerver nem indul

Ellenőrizd:

- telepítve van-e az `npm install`
- fut-e már másik processz a porton
- helyes-e a Node.js verzió

### 2. Az AI értékelés nem működik

Ellenőrizd:

- van-e `GROQ_API_KEY`
- nem hiányzik-e a `.env.local`
- a kulcs érvényes-e

### 3. Nem jelenik meg tartalom a Study oldalon

Ellenőrizd:

- létezik-e a `content/<subject>/notes/` mappa
- van-e `lessons.json`
- jó-e a subject slug

### 4. Keresés nem ad vissza találatot

Ellenőrizd:

- legalább 2 karakteres-e a query
- van-e a subjecthez betöltött indexelt tartalom
- létezik-e a keresett kifejezés a notes/questions/glossary tartalomban

### 5. Generálás után nincs friss tartalom

Ellenőrizd:

- lefutott-e a teljes pipeline
- bekerültek-e az új fájlok a `content/` alá
- a frontend a megfelelő subject slugot olvassa-e

## Rövid ajánlott belépési sorrend

Ha most kezdesz dolgozni rajta:

1. Olvasd el a `documentation/PROJECT_MAP.md` fájlt.
2. Nézd át a `src/screens/Home.jsx`, `Subject.jsx`, `Study.jsx`, `Search.jsx` képernyőket.
3. Utána nézd meg a `lib/content.js` és `app/api/*` réteget.
4. Ha új anyagot akarsz felvinni, indíts a `scripts/README.md` és a `storage/` mappánál.


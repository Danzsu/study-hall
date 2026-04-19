# Study Hall — Project Plan

## Summary

**Study Hall** egy személyes tanulást segítő webalkalmazás, amely egyetemi PDF/PPT anyagokból automatikusan generál tanulási segédanyagokat: humanizált notes, quiz, flashcard, glosszárium, és írásbeli tesztek. A cél a hatékony aktív tanulás támogatása egy clean, modern felületen.

A tartalom JSON/MDX fájlokban él a projektben (git-ben tárolva), feldolgozás lokálisan fut egy Node.js CLI-vel, deploy Vercelen. Nincs adatbázis, nincs auth, nincs külön szerver — egyszerű, ingyenes, gyors.

---

## Stack

| Réteg | Technológia |
|---|---|
| Frontend | Next.js 14 · **JavaScript** · Inline styles · Lucide React |
| Tartalom | JSON + MDX fájlok a `content/` mappában (git-ben) |
| Math render | KaTeX (`rehype-katex` + `remark-math`) |
| AI pipeline | Node.js scripts — Groq `llama-3.3-70b-versatile` |
| Written Test AI | Groq API via Next.js serverless (`/api/validate-answer`) |
| Deploy | Vercel (free hobby tier) |
| Progress | localStorage (streak, wrong answers — nincs DB) |

**Ingyenes modellek:**
- Groq: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`
- OpenRouter backup: `google/gemma-4-26b-a4b-it:free`, `nvidia/nemotron-3-super-120b-a12b:free`

---

## Workflow

```
1. PDF anyag előkészítve
        │
        │  node scripts/generate-notes.js it_biztonsag
        ▼
2. content/it_biztonsag/ generálódik:
   ├── notes/01-lesson.mdx      (humanizált notes + LaTeX)
   ├── questions.json           (MCQ + írásbeli kérdések)
   ├── flashcards.json          (Q&A kártyapárok)
   └── glossary.json            (kulcsszavak + definíciók)
        │
        │  git add . && git commit -m "Add it_biztonsag content" && git push
        ▼
3. Vercel auto-deploy → studyhall.vercel.app frissül
```

---

## Funkciók (MVP)

### Study Hall főlap (`/`)
- Subject kártyák rácsa (szín, ikon, stat-ok)
- Streak tracker (localStorage)
- Dark / Light mode toggle

### Subject oldal (`/subject/[slug]`)
- Section + Size dropdown szűrők
- Mode kártyák rácsa:

| Mód | Leírás |
|---|---|
| 📖 Study | MDX notes + LaTeX math + képek + Active Recall |
| ▶ Quiz | MCQ + multi-select, scored, auto-advance |
| ✍ Written Test | Kifejtős kérdések, Groq LLM értékel a végén |
| ↩ Wrong Answers | localStorage-ból szűrt hibák + relatív dátum |
| 🃏 Flashcards | 3D flip, billentyűzet navigáció |
| 📖 Glossary | Kereső + kategória chip szűrők |
| ≡ Review | Összes Q+A + magyarázat böngészés |

### Written Test részletei
- Minden kérdésnél textarea a válaszhoz
- Teszt VÉGÉN egyszerre küld → Groq értékel
- AI feedback: score %, mit kapott jól, mi hiányzott, minta válasz

### Active Recall (notes végén)
- 3-5 quick önellenőrző kérdés minden lecke után
- Kártya reveal: kérdés → kattints → válasz

### Forrás Disclaimer
- Minden notes oldal alján automatikus blokk
- MDX frontmatter `sources` mezőből generálódik

---

## Szekcionálási logika (témakör-csoportosítás)

### Alapelv

**1 PPT/PDF forrás = 1 témakör (section).** Ha ugyanaz a témakör folytatódik a következő forrásban, az még mindig 1 témakör — nem hozunk létre új section-t csak azért, mert új fájl kezdődik.

Cél: **minél kevesebb, de tartalmilag koherens témakör**. Nem chunk-határok, nem fájlhatárok — hanem valódi tananyag-egységek szerint.

### Témakör-határok meghatározása

A generáló script-eknek (`generate-notes.js`, `generate-questions.js`, `generate-extras.js`) az LLM-et kell megkérni, hogy azonosítsa a logikai témakör-határokat az alábbi szabályok szerint:

| Szabály | Leírás |
|---------|---------|
| **Folytonosság** | Ha a következő PPT/fejezet az előző témát mélyíti, ugyanaz a section marad |
| **Új section** | Csak akkor nyit új section-t, ha teljesen új fogalomkör kezdődik |
| **Max section szám** | Egy tantárgyon belül maximum 6–10 section (nem 20-30 chunk) |
| **Section neve** | Rövid, tartalmi cím (nem "1. fejezet", hanem pl. "Titkosítási alapok") |
| **Sub-topic** | Egy section-on belül lehetnek al-témák (de ez a lectitle, nem új section) |

### Implementáció a generáló script-ekben

**`generate-notes.js`** — minden chunk generálásakor az LLM-nek átadandó kontextus:
```
"Az eddigi section-ök: [lista]. Csak akkor nyiss új section-t, ha teljesen
új témakör kezdődik. Ha az anyag az előző section folytatása, használd
ugyanazt a section nevet."
```

**`generate-questions.js`** — a kérdés `section` mezőjét a meglévő section listából kell választani, nem szabadon generálni:
```
"Lehetséges section-ök (csak ezeket használd): [meglévő lista]. Ne hozz
létre új section nevet."
```

**`generate-extras.js`** — flashcard és glossary `section`/`category` mezői szintén a rögzített section listából jönnek.

### Elvárt végeredmény (pl. IT Biztonság, 18 lecke)

```
❌ Rossz (túl granulált):
  section: "Szimmetrikus titkosítás - AES"
  section: "Szimmetrikus titkosítás - DES"
  section: "Szimmetrikus titkosítás - 3DES"

✅ Helyes (koherens):
  section: "Szimmetrikus titkosítás"   ← minden AES/DES/3DES kérdés ide kerül
```

### Kapcsolódó fájlok

- `scripts/generate-notes.js` — section tracking state hozzáadása (eddig generált section-ök átadása minden LLM hívásban)
- `scripts/generate-questions.js` — section lista lock: először `getSubjectSections(slug)` beolvasás, LLM csak abból választhat
- `scripts/generate-extras.js` — ugyanígy section lock
- `scripts/note-prompts.js` — prompt frissítés: section-folytonosság szabály explicit megjelenítése
- `lib/content.js` `getSubjectSections()` — már létezik, ezt kell input-ként átadni a script-eknek

---

## Tartalom Struktúra

```
content/
├── subjects.json
└── [subject-slug]/
    ├── meta.json
    ├── notes/
    │   ├── 01-intro.mdx
    │   └── 02-topic.mdx
    ├── questions.json
    ├── flashcards.json
    └── glossary.json
```

### MDX frontmatter formátum
```yaml
---
title: "Lecke neve"
lesson: 1
section: "Section neve"
sources:
  - type: "pdf"
    title: "Forrás neve"
    author: "Szerző"
    year: 2025
---
```

### questions.json formátum
```json
[
  {
    "id": "q1",
    "section": "Section neve",
    "q": "Kérdés szövege",
    "opts": ["A", "B", "C", "D"],
    "answer": 1,
    "explain": "Magyarázat"
  },
  {
    "id": "q2",
    "section": "Section neve",
    "q": "Kifejtős kérdés",
    "ideal": "Minta válasz az LLM számára",
    "keywords": ["kulcspont1", "kulcspont2"],
    "type": "written"
  }
]
```

---

## Design Rendszer

| Token | Light | Dark |
|---|---|---|
| Background | `#F5F2EE` | `#1A1A1A` |
| Surface (card) | `#FFFFFF` | `#242424` |
| Text | `#1A1A1A` | `#F0EDE8` |
| Accent | `#E07355` | `#E07355` |
| Border | `#E8E3DC` | `#333333` |
| Muted text | `#8A8A8A` | `#6B6B6B` |

Font: DM Sans + Lora · Icons: Lucide React · Math: KaTeX  
Összes szín a `src/theme.js` `C` objektumból és `useTheme()` hookból.

### Study Page Design

```text
┌──────────────────────────────────────────────────────┐
│ ← Back    Machine Learning                    🌙      │
│ ─── accent underline ──────────────────────────────── │
├─────────────────┬────────────────────────────────────┤
│  LESSONS        │  ⏱ Estimated time: 8 min           │
│                 │                                     │
│  ML Problem Fr. │  ## Learning Objectives             │
│  > Solution Ar. │  ...                                │
│                 │                                     │
│  7 of 14 (50%)  │  The **bias-variance tradeoff**     │
│  [███░░░░░]     │  ╔══════════════════════════════╗   │
│                 │  ║ Key Takeaway: ...            ║   │
│                 │  ╚══════════════════════════════╝   │
│                 │                                     │
│                 │  [Sources: Google PMLE Guide 2024]  │
│                 │  [← Prev]              [Next →]     │
└─────────────────┴────────────────────────────────────┘
```

---

## Megvalósítási Fázisok

### ✅ Fázis 0: Projekt setup (KÉSZ)
- [x] Next.js 14 + JavaScript (TS→JS migráció kész)
- [x] Tailwind → inline styles (`src/screens/`)
- [x] `src/theme.js` — design token rendszer (C, LIGHT, DARK)
- [x] `src/store.jsx` — useStore, useTheme, navigate
- [x] `src/shell.jsx` — TopBar, TabBar, Card, Btn

### ✅ Fázis 1: Alap layout + képernyők (KÉSZ)
- [x] Hash-routing SPA (`src/App.jsx`)
- [x] TopBar + TabBar navigáció
- [x] Összes screen alapkiépítve (`src/screens/*.jsx`)
- [x] `content/machine-learning/` minta tartalom

### ✅ Fázis 2: AI integráció + localStorage (KÉSZ)
- [x] `app/api/validate-answer/route.js` — Groq értékelés
- [x] Written.jsx — éles AI visszajelzés (score %, correct/missing)
- [x] Quiz.jsx — wrong answer timestamp mentés localStorage-ba
- [x] WrongAnswers.jsx — relatív dátum megjelenítés
- [x] Flashcard.jsx — subject neve megjelenik a progress bar felett

### 🔄 Fázis 3: Frontend design finomítás (folyamatban)

Részletes referencia: `frontend_plan.md` (design-to-code, 1:1 egyezés `frontend_claude_design/`-dal)

#### 🔴 P1 — Kritikus (legnagyobb vizuális különbség)

**Home (`src/screens/Home.jsx`)**
- [ ] Hero banner: h1 streak szöveg + subtitle + "Continue learning" + "Start pomodoro" CTA gombok
- [ ] SubjectRow expanded: "Open subject" (subject.color háttér) + "Flashcards" gombok hozzáadása
- [ ] SubjectRow meta: `{s.lessons} lessons` szöveg hozzáadása
- [ ] "Add a new subject" kártya (dashed border, plus ikon, navigate `/onboarding`)

**Subject (`src/screens/Subject.jsx`)**
- [ ] Hero h1 fontSize: 22px → 36px
- [ ] Progress circle: 64px → 110px
- [ ] Modes kártyák: horizontális rács layout (nem vertikális lista)

**Study (`src/screens/Study.jsx`)**
- [ ] `<Callout>` komponens (4 variáns: info/warning/tip/example, ikon + színes bal border)
- [ ] `<ActiveRecall>` komponens (kérdés → kattints → válasz reveal + 1-5 self-rating)
- [ ] `<SourceDisclaimer>` komponens (expandable lista, MDX frontmatter `sources` mezőből)

#### 🟠 P2 — Magas prioritás

**Written (`src/screens/Written.jsx`)**
- [ ] 2-oszlopos feedback layout: bal = student válasz annotálva, jobb = keyword checklist sidebar
- [ ] Mondat-szintű annotáció: helyes → zöld, hiányzó → piros aláhúzás
- [ ] "Evaluating..." mascot animáció AI hívás közben

**Quiz (`src/screens/Quiz.jsx`)**
- [ ] Eredmény oldal: grade letter arc (A/B/C/D/F, score % alapján, SVG körív)
- [ ] Section breakdown chart (helyes/helytelen arány szekciónként)
- [ ] Kérdéslista expand/collapse (chevron + A/B/C/D badge-ek, helyes kiemelve)

**Flashcard (`src/screens/Flashcard.jsx`)**
- [ ] Ghost stack effekt (2 kártya halvány árnyék mögötte)
- [ ] Result overlay flash (zöld/piros villanás swipe után)
- [ ] Topic pill: colored glow border (subject.color alapján)

#### 🟡 P3 — Nice-to-have

**Glossary (`src/screens/Glossary.jsx`)**
- [ ] Flash session módok: abbr-to-full, full-to-def, mixed
- [ ] Concept cluster nézet (kategória csoportok, kártya rács)
- [ ] Force-directed fogalomtérkép (d3.js vagy statikus SVG)

**Study — inline komponensek**
- [ ] `<H>` highlight komponens (sárga kiemelés inline szövegben)
- [ ] `<T>` tooltip komponens (hover → definíció popup)

#### 🟢 P4 — Polish (szinte kész)

- [ ] Review (`src/screens/Review.jsx`) — minor tweaks
- [ ] WrongAnswers (`src/screens/WrongAnswers.jsx`) — minor tweaks
- [ ] Onboarding (`src/screens/Onboarding.jsx`) — 5. lépés összefoglaló, layout
- [ ] Pomodoro (`src/screens/Pomodoro.jsx`) — kész
- [ ] Settings (`src/screens/Settings.jsx`) — profil szekció (avatar, név), streak display
- [ ] Search (`src/screens/Search.jsx`) — API bekötés (Phase 5-tel együtt)
- [ ] ExamSim (`src/screens/ExamSim.jsx`) — True/False `TfQuestion` komponens

**Globális hiányok:**
- [ ] `app/globals.css` — `@keyframes rfade`, `cardDrop`, `pulse` animációk

### ✅ Fázis 4: Backend tartalom pipeline (KÉSZ)
- [x] `scripts/generate-notes.js` — PDF/DOCX → MDX notes (Groq, `pdf-parse` + `mammoth`)
- [x] `scripts/generate-questions.js` — test sources → `questions.json` (MCQ + multi + written)
- [x] `scripts/generate-extras.js` — `flashcards.json` + `glossary.json`
- [x] `scripts/generate-diagrams.js` — Mermaid diagramok generálása (opcionális)
- [x] `scripts/generate-all.js` — Egy commandos teljes generálás
- [x] `lib/content.js` — Tartalomkezelő modul frissítve (lessons.json, active recall)
- [x] `scripts/README.md` — Használati útmutató
- [ ] `content/it_biztonsag/` — IT Biztonság tárgy generálása (futtatandó)
- [ ] `content/subjects.json` — IT Biztonság bejegyzés (automatikus)

### Fázis 5: Keresés

**Backend — `app/api/search/route.js` (új fájl)**

`GET /api/search?q=<szöveg>&subject=<slug>&type=notes|questions|glossary`

```
1. Input validálás: q minimum 2 karakter
2. Ha subject meg van adva → csak azt, különben összes (subjects.json-ból)
3. Párhuzamos keresés type szerint:
   - notes: getNotesLessons(slug) → title + section egyezés
   - questions: getQuestions(slug) → q mező egyezés
   - glossary: getGlossary(slug) → term + definition egyezés
4. Minden találat: { type, subject, slug, title, snippet, url }
5. Sorrend: exact match előre, majd abc
```

**Helper:** `searchContent(query, slugs, types)` függvény `lib/content.js`-ben

**Frontend:** `src/screens/Search.jsx` — már létező screen, csak az API bekötése kell

- [ ] `app/api/search/route.js` — keresés endpoint
- [ ] `lib/content.js` — `searchContent()` helper
- [ ] `src/screens/Search.jsx` — API bekötés (GET /api/search)

### Fázis 6: Deploy + Finalizálás

**B: `/api/health` endpoint (deploy előfeltétel)**

`GET /api/health` → `{ status: "ok", subjects: 2, timestamp: "...", env: { groq: true } }`

Logika: `getSubjects()` meghívás (hiba → "degraded"), `!!process.env.GROQ_API_KEY` check.

**Deploy teendők:**
- [ ] `app/api/health/route.js` — health check endpoint
- [ ] `vercel.json` — function timeout: `{ "functions": { "app/api/validate-answer/route.js": { "maxDuration": 30 } } }`
- [ ] Vercel Dashboard → Environment Variables: `GROQ_API_KEY`, `OPENROUTER_API_KEY`
- [ ] `vercel deploy --prod` vagy GitHub repo kapcsolás
- [ ] `/api/health` ellenőrzése deploy után
- [ ] README.md — pipeline használati útmutató

---

## Node.js Pipeline Tervezett Használata

```bash
# Notes generálása PDF/DOCX forrásokból
node scripts/generate-notes.js it_biztonsag

# Kérdések generálása test sources-ból
node scripts/generate-questions.js it_biztonsag

# Flashcard + Glossary generálás
node scripts/generate-extras.js it_biztonsag
```

Forrásanyagok helye: `storage/subjects/{slug}/sources/`  
Kimenet helye: `content/{slug}/`  
Utána: `git add . && git commit && git push` → Vercel auto-deploy.

---

## Ingyenes Tier Összefoglaló

| Szolgáltatás | Limit | Mire kell |
|---|---|---|
| Vercel hobby | 100GB bandwidth | Frontend hosting |
| Groq free | 14,400 req/nap | AI pipeline + Written Test |
| OpenRouter free | Model-függő | Backup LLM |
| GitHub | Unlimited public repos | Kód + content tárolás |
| **Összköltség** | **$0/hó** | ✅ |

---

### Fázis 7: Backend optimalizálás

**B3: In-memory cache `lib/content.js`-ben**

Probléma: minden API request `fs.readFileSync()` hívásokat végez újra. Megoldás: modulszintű `Map` cache — Vercel serverless container életciklusa alatt megmarad.

```js
// lib/content.js tetején
const _cache = new Map();
function cached(key, fn) {
  if (_cache.has(key)) return _cache.get(key);
  const val = fn();
  _cache.set(key, val);
  return val;
}
// Használat: return cached(`questions:${slug}`, () => { ...readFileSync... });
```

Érintett függvények: `getSubjects`, `getSubjectSummary`, `getQuestions`, `getFlashcards`, `getGlossary`, `getNotesLessons`

- [ ] `lib/content.js` — `cached()` helper + alkalmazása minden loader függvényre

**B4: `validate-answer` bugfixek**

Fájl: `app/api/validate-answer/route.js`

Jelenlegi hibák:
- Hiányzó input → 500-as hiba (nem 400)
- Score néha >100 vagy <0 jön vissza az LLM-től
- Nincs timeout guard (Vercel 30s limit)

Javítások:
```js
// 1. Input validálás
if (!question || !student_answer)
  return Response.json({ error: 'question és student_answer kötelező' }, { status: 400 });

// 2. Score clamp
score_pct = Math.min(100, Math.max(0, Math.round(score_pct)));

// 3. AbortSignal timeout Groq híváshoz
const controller = new AbortController();
setTimeout(() => controller.abort(), 25000);
```

- [ ] `app/api/validate-answer/route.js` — input validálás, score clamp, timeout

### Fázis 8: Google Drive integráció (MVP automation)

**Architektúra:** Vercel serverless-ben nem futhat hosszan tartó script. Ajánlott megközelítés: **GitHub Actions cron job**.

```
Google Drive (megosztott mappa)
  ↓ GitHub Action (cron: minden 30 perc)
  ↓ scripts/drive-sync.js — új fájlok észlelése (hash alapú diff)
  ↓ download → storage/subjects/{slug}/sources/
  ↓ node scripts/generate-all.js {slug}
  ↓ git add content/{slug}/ && git commit && git push
  ↓ Vercel auto-deploy
```

**Szükséges fájlok:**

| Fájl | Feladat |
|------|---------|
| `scripts/drive-sync.js` | Drive API lekérdezés + download (`googleapis` npm) |
| `scripts/check-new-files.js` | Hash-alapú változásdetekció (ne fusson ha nincs új fájl) |
| `.github/workflows/drive-sync.yml` | GitHub Action: schedule + Node setup + git push |

**GitHub Secrets:**
- `GOOGLE_DRIVE_FOLDER_ID` — a megosztott mappa ID-ja
- `GOOGLE_SERVICE_ACCOUNT_JSON` — Service Account credentials (Base64)
- `GROQ_API_KEY` — AI generáláshoz a Action futtatásakor

**Implementációs lépések:**
- [ ] Google Cloud Console: Service Account létrehozása, Drive API engedélyezése
- [ ] Service Account hozzáadása a Drive mappához (editor jog)
- [ ] `googleapis` npm csomag telepítése
- [ ] `scripts/drive-sync.js` megírása
- [ ] `.github/workflows/drive-sync.yml` megírása
- [ ] GitHub Secrets beállítása
- [ ] Teszt: Drive-ba feltölteni egy PDF-et → 30 percen belül megjelenik az oldalon

---

## Implementációs sorrend (backend)

```
1. Fázis 7/B4: validate-answer bugfix     ← 30 perc, bugfix
2. Fázis 7/B3: content caching            ← 30 perc, minden API gyorsabb
3. Fázis 6/B:  /api/health endpoint       ← 20 perc, deploy blocker
4. Fázis 5:    /api/search endpoint       ← 2-3 óra, Phase 5 lezárása
5. Fázis 6:    Vercel deploy              ← 1 óra, éles indítás
6. Fázis 8:    Google Drive automation    ← 4-6 óra, MVP automation
```

Párhuzamosan végezhető a frontend P1–P2 munkával.

---

## Deploy előtti ellenőrzési checklist

- [ ] `GET /api/health` → `{ status: "ok" }`
- [ ] `GET /api/search?q=titkosítás` → IT Biztonság találatok
- [ ] `POST /api/validate-answer` üres body → 400 (nem 500)
- [ ] `POST /api/validate-answer` helyes body → score 0–100 között
- [ ] Flashcard 606 kártya betölt IT Biztonság tárgyhoz
- [ ] Notes 18 lecke betölt IT Biztonság tárgyhoz
- [ ] Dark/light mode működik
- [ ] localStorage streak megmarad page reload után

---

## Jövőbeli Features (v2)

- Supabase adatbázis (ha több eszközön kellene progress)
- SM-2 spaced repetition algoritmus
- Auth (ha mások is használnák)
- Diagram generálás (SVG)

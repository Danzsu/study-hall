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
- [ ] Quiz.jsx — expandable kérdés sorok eredmény nézetben (chevron + A/B/C/D badge-ek)
- [ ] Settings.jsx — profil szekció (avatar, név, email), streak, sign out gomb
- [ ] ExamSim.jsx — True/False kérdéstípus (`TfQuestion` komponens)
- [ ] Study.jsx — `Callout` + `H` highlight komponensek, progress pill
- [ ] Home.jsx — streak banner, subject card grid (2 oszlop)
- [ ] Onboarding.jsx — 5. lépés (összefoglaló), layout átrendezés
- [ ] Glossary.jsx — overview dashboard, lista/kártya/quiz mód toggle

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

### Fázis 5: Keresés (nice-to-have)
- [ ] `src/screens/Search.jsx` — live keresés kérdések/terms/lessons között
- [ ] TopbarSearch widget (compact pill a TopBar-ban)
- [ ] `src/App.jsx` — `#search` hash routing

### Fázis 6: Deploy + Finalizálás
- [ ] Vercel deploy
- [ ] `GROQ_API_KEY` Vercel env var beállítás
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

## Jövőbeli Features (v2)

- Supabase adatbázis (ha több eszközön kellene progress)
- SM-2 spaced repetition algoritmus
- Auth (ha mások is használnák)
- Diagram generálás (SVG)

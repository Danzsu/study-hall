# Study Hall — Project Plan

## Summary

**Study Hall** egy személyes tanulást segítő webalkalmazás, amely egyetemi PDF/PPT anyagokból automatikusan generál tanulási segédanyagokat: humanizált notes, quiz, flashcard, glosszárium, és írásbeli tesztek. A cél a hatékony aktív tanulás támogatása egy clean, modern felületen.

A tartalom JSON/MDX fájlokban él a projektben (git-ben tárolva), feldolgozás lokálisan fut egy Python CLI-vel, deploy Vercelen. Nincs adatbázis, nincs auth, nincs külön szerver — egyszerű, ingyenes, gyors.

---

## Stack

| Réteg | Technológia |
|---|---|
| Frontend | Next.js 14 · TypeScript · Tailwind CSS · Lucide React |
| Tartalom | JSON + MDX fájlok a `content/` mappában (git-ben) |
| Math render | KaTeX (`rehype-katex` + `remark-math`) |
| AI pipeline | Python CLI — Groq `llama-3.3-70b-versatile` |
| Written Test AI | Groq API via Next.js serverless (`/api/validate-answer`) |
| Deploy | Vercel (free hobby tier) |
| Progress | localStorage (streak, wrong answers — nincs DB) |

**Ingyenes modellek:**
- Groq: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`
- OpenRouter backup: `google/gemma-4-26b-a4b-it:free`, `nvidia/nemotron-3-super-120b-a12b:free`

---

## Workflow

```
1. PDF/PPT anyag előkészítve
        │
        │  python pipeline/process.py anyag.pdf --subject targy-neve
        ▼
2. content/targy-neve/ generálódik:
   ├── notes/01-lesson.mdx      (humanizált notes + LaTeX)
   ├── questions.json           (MCQ + multi + written kérdések)
   ├── flashcards.json          (Q&A kártyapárok)
   └── glossary.json            (kulcsszavak + definíciók)
        │
        │  git add . && git commit -m "Add targy-neve content" && git push
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

| Mód | URL | Leírás |
|---|---|---|
| 📖 Study | `/study` | MDX notes + LaTeX math + képek + Active Recall |
| ▶ Quiz | `/quiz` | MCQ + multi-select, scored, auto-advance |
| ✍ Written Test | `/written` | Kifejtős kérdések, LLM értékel a végén |
| ↩ Wrong Answers | `/wrong-answers` | localStorage-ból szűrt hibák |
| 🃏 Flashcards | `/flashcards` | 3D flip, billentyűzet navigáció |
| 📖 Glossary | `/glossary` | Kereső + kategória chip szűrők |
| ≡ Review | `/review` | Összes Q+A + magyarázat böngészés |

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
- "Ez az anyag az alábbi forrásokból készült: ..."

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
    "type": "mcq",
    "question": "Kérdés szövege",
    "options": ["A", "B", "C", "D"],
    "correct": 1,
    "explanation": "Magyarázat",
    "section": "Section neve",
    "difficulty": "medium"
  },
  {
    "id": "q2",
    "type": "written",
    "question": "Kifejtős kérdés",
    "model_answer": "Minta válasz az LLM számára",
    "key_points": ["kulcspont1", "kulcspont2"],
    "section": "Section neve",
    "difficulty": "hard"
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

Font: Inter · Icons: Lucide React · Math: KaTeX

### Study Page Design (Referenciák alapján)

**Inspirációs oldalak:**

- [MLU-Explain](https://mlu-explain.github.io/) — kiemelés stílus (coral background text-highlight), serif + sans-serif mix, clean academic layout
- [Anthropic Claude 101](https://anthropic.skilljar.com/claude-101/383389) — bal oldali sidebar leckékkel, "Learning objectives" section, "Estimated time" megjelenítés, clean serif typography, ✓ completion indicators
- [BME VIK IIT](https://vaitkusm.github.io/genai-inverse-graphics-bme-vik-iit/) — felső sáv navigáció, logoelrendezés

**Study oldal konkrét specifikáció:**

```text
┌──────────────────────────────────────────────────────┐
│ ← Back    Machine Learning                    🌙      │
│ ─── accent underline ──────────────────────────────── │
├─────────────────┬────────────────────────────────────┤
│  LESSONS        │  ⏱ Estimated time: 8 min           │
│                 │                                     │
│  ML Problem Fr. │  ## Learning Objectives             │
│  > Solution Ar. │  By the end of this lesson you'll   │
│    TF Ecosystem │  be able to:                        │
│                 │  • Explain bias-variance tradeoff   │
│  7 of 14 (50%)  │  • Choose the right ML approach     │
│  [███░░░░░]     │  • Handle PII regulation changes    │
│                 │  ─────────────────────────────────  │
│                 │  The **bias-variance tradeoff**      │
│                 │  describes the tension between       │
│                 │  ╔══════════════════════════════╗   │
│                 │  ║ Key Takeaway: More complex   ║   │
│                 │  ║ ≠ always better              ║   │
│                 │  ╚══════════════════════════════╝   │
│                 │                                     │
│                 │  [Sources: Google PMLE Guide 2024]  │
│                 │  [← Prev]              [Next →]     │
└─────────────────┴────────────────────────────────────┘
```

**Implementációs részletek:**

- Sidebar: leckék csoportosítva section szerint, ✓ completion (localStorage), haladásjelző pill
- Content area: "Estimated time" + "Learning objectives" frontmatter-ből renderelve
- **MLU-explain highlight**: `==szöveg==` MDX-ben → coral background highlight `<mark>` tag
- Typography: `prose` class, serif-szerű `font-serif` headings, sans body
- Key Takeaway callout: `> **Key Takeaway:**` → styled blockquote accent border-rel
- Képek: MDX `![alt](path)` → lazy load, rounded, max-width, fullscreen click
- Progress tracker a sidebar alján: "X of Y lessons · Z%"

---

## Megvalósítási Fázisok

### ✅ Fázis 0: Projekt setup (KÉSZ)
- [x] package.json + tsconfig + tailwind + next config
- [x] globals.css design tokenekkel
- [x] .gitignore + .env.local.example

### 🔄 Fázis 1: Alap layout + homepage (folyamatban)
- [ ] app/layout.tsx + ThemeProvider
- [ ] components/layout/Header.tsx
- [ ] components/layout/ThemeToggle.tsx
- [ ] app/page.tsx — Study Hall főlap
- [ ] content/subjects.json + 1 sample subject

### Fázis 2: Study módok
- [ ] app/subject/[slug]/page.tsx — Subject oldal
- [ ] app/subject/[slug]/quiz/page.tsx
- [ ] app/subject/[slug]/flashcards/page.tsx
- [ ] app/subject/[slug]/glossary/page.tsx
- [ ] app/subject/[slug]/review/page.tsx
- [ ] app/subject/[slug]/wrong-answers/page.tsx

### Fázis 3: Written Test + AI
- [ ] app/subject/[slug]/written/page.tsx
- [ ] app/api/validate-answer/route.ts (Groq API)
- [ ] AIFeedback komponens

### Fázis 4: Notes / Study oldal
- [ ] app/subject/[slug]/study/page.tsx
- [ ] MDX setup: next-mdx-remote + rehype-katex + remark-math
- [ ] Active Recall komponens
- [ ] Forrás disclaimer komponens

### Fázis 5: localStorage + UX
- [ ] Streak tracking
- [ ] Wrong Answers gyűjtés (quiz + written)
- [ ] Quiz progress bar
- [ ] Keyboard navigation (Flashcard: Space/←/→)

### Fázis 6: Python Pipeline
- [ ] pipeline/process.py CLI (argparse)
- [ ] pipeline/agents/ingest.py (PyMuPDF + python-pptx)
- [ ] pipeline/agents/notes.py (MDX + LaTeX)
- [ ] pipeline/agents/quiz.py
- [ ] pipeline/agents/flashcard.py
- [ ] pipeline/agents/glossary.py
- [ ] pipeline/requirements.txt

### Fázis 7: Deploy + Finalizálás
- [ ] Vercel deploy (vercel.json ha kell)
- [ ] GROQ_API_KEY Vercel env var
- [ ] README.md frissítés (pipeline használat)

### Fázis 8: Google Drive Sync (v1.5)
- [ ] sync/sync_drive.py — lokális CLI
- [ ] Google OAuth2 token (.env.local-ban)
- [ ] Drive mappa → letölt → pipeline → git push

---

## Python Pipeline Használata

```bash
# Telepítés (egyszer)
pip install -r pipeline/requirements.txt

# Teljes feldolgozás
python pipeline/process.py path/to/file.pdf --subject subject-slug

# PPT is működik
python pipeline/process.py path/to/slides.pptx --subject subject-slug

# Csak egy módot frissít
python pipeline/process.py file.pdf --subject slug --only quiz
python pipeline/process.py file.pdf --subject slug --only notes
python pipeline/process.py file.pdf --subject slug --only flashcards

# Új subject létrehozása
python pipeline/process.py file.pdf --subject uj-targy --name "Tárgy Neve" --description "Leírás"
```

A pipeline a `content/[subject-slug]/` mappába ír. Utána `git push` → Vercel deploy.

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
- Notion import

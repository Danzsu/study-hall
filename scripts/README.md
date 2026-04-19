# Study Hall — Content Generation Pipeline

Automatikus tanulási anyag generátor PDF/DOCX forrásokból.

## 📋 Előfeltételek

1. **Node.js 18+** telepítve
2. **Groq API kulcs** (ingyenes: https://console.groq.com/keys)
3. **Forrásanyagok** a `storage/subjects/{slug}/sources/` mappában

## 🚀 Telepítés

```bash
# Csomagok telepítése
npm install

# Környezeti változó beállítása
# Windows:
setx GROQ_API_KEY "gsk_..."
# Linux/Mac:
export GROQ_API_KEY="gsk_..."
```

## 📁 Forrásanyagok elhelyezése

```
storage/
└── subjects/
    └── it_biztonsag/
        └── sources/
            ├── lesson_sources/    (PDF/DOCX jegyzetek → notes generálás)
            │   ├── 01-Intro.pdf
            │   ├── 02-Crypto.docx
            │   └── ...
            └── test_sources/      (PDF/DOCX/MD tesztek → questions generálás)
                ├── ZH_2024.pdf
                ├── control_questions.docx
                └── ...
```

## 🔧 Használat

### 1. Notes generálása (PDF/DOCX → MDX)

```bash
node scripts/generate-notes.js it_biztonsag
```

**Kimenet:**
- `content/it_biztonsag/notes/*.mdx` (lecke jegyzetek)
- `content/it_biztonsag/meta.json` (tárgy metaadatok)
- `content/it_biztonsag/notes/lessons.json` (leckék listája)

### 2. Kérdések generálása (test sources → questions.json)

```bash
node scripts/generate-questions.js it_biztonsag
```

**Kimenet:**
- `content/it_biztonsag/questions.json` (MCQ + multi-select + written)

### 3. Flashcardok + Glossary generálása

```bash
node scripts/generate-extras.js it_biztonsag
```

**Kimenet:**
- `content/it_biztonsag/flashcards.json`
- `content/it_biztonsag/glossary.json`
- `content/subjects.json` (frissítve)

### 4. Deploy

```bash
git add .
git commit -m "Add it_biztonsag content"
git push
# → Vercel auto-deploy
```

## 🎯 Egy commandos teljes generálás

```bash
node scripts/generate-all.js it_biztonsag
```

Ez egymás után futtatja mindhárom scriptet.

## 📊 Kimeneti struktúra

```
content/
├── subjects.json
└── it_biztonsag/
    ├── meta.json
    ├── notes/
    │   ├── 01-bevezetes.mdx
    │   ├── 02-kriptografia.mdx
    │   └── lessons.json
    ├── questions.json          (MCQ + written)
    ├── flashcards.json         (Q&A kártyák)
    └── glossary.json           (szakkifejezések)
```

## ⚙️ Konfiguráció

### Modellek (Groq)

| Script | Model |
|--------|-------|
| generate-notes | `llama-3.3-70b-versatile` |
| generate-questions | `llama-3.3-70b-versatile` |
| generate-extras | `llama-3.3-70b-versatile` |

### Chunk méretek

- Notes: 3800 karakter (400 overlap)
- Questions: 5000 karakter (500 overlap)

### Rate limiting

- 1500ms késleltetés chunkok között
- 1000ms késleltetés flashcard/glossary generálásnál

## 🛠️ Hibaelhárítás

### "GROQ_API_KEY nincs beállítva"

```bash
# Windows PowerShell:
$env:GROQ_API_KEY="gsk_..."
node scripts/...

# Vagy tartósan:
setx GROQ_API_KEY "gsk_..."
```

### "Nem található forrásfájl"

Ellenőrizd az elérési utat:
```
storage/subjects/it_biztonsag/sources/lesson_sources/
```

### JSON parse hiba

Néha a Groq nem valid JSON-t ad vissza. Ilyenkor:
1. Próbáld újra (másik seed)
2. Csökkentsd a chunk méretet
3. Egyszerűsítsd a promptot

## 📝 Formátumok

### MDX Frontmatter

```yaml
---
title: "Lecke neve"
lesson: 1
section: "Fejezet neve"
sources:
  - type: "pdf"
    title: "Forrás címe"
    year: 2025
---
```

### questions.json

```json
[
  {
    "id": "q1",
    "type": "mcq",
    "q": "Kérdés?",
    "opts": ["A", "B", "C", "D"],
    "correct": 0,
    "explain": "Magyarázat",
    "section": "Fejezet",
    "difficulty": "medium"
  },
  {
    "id": "q2",
    "type": "written",
    "q": "Kifejtős kérdés?",
    "ideal": "Minta válasz",
    "keywords": ["kulcsszó1", "kulcsszó2"],
    "section": "Fejezet",
    "difficulty": "hard"
  }
]
```

### flashcards.json

```json
[
  {
    "id": "f1",
    "front": "Fogalom neve",
    "back": "Definíció",
    "section": "Fejezet",
    "type": "definition"
  }
]
```

### glossary.json

```json
[
  {
    "id": "g1",
    "term": "Szakkifejezés",
    "definition": "Részletes definíció",
    "category": "Kategória",
    "aliases": ["szinonima"]
  }
]
```

## Advanced notes pipeline

The notes generator now uses structure-aware document chunking instead of plain character slicing.

What it tracks:
- heading and paragraph boundaries
- larger semantic chunks
- overlap from previous context
- visual candidates such as figures, diagrams, tables, equations, code, and architecture blocks
- artifact metadata for later diagram/image generation

Artifact output:

```bash
content/<slug>/notes/artifacts/<lesson>.json
```

Note generation profile:

```bash
$env:NOTE_LANGUAGE="hu"       # primary language
$env:NOTE_LANGUAGE="en"       # secondary language
$env:NOTE_DEPTH="exam-prep notes"
```

Remote note generation order:
- Groq `llama-3.3-70b-versatile`
- OpenRouter `google/gemma-4-26b-a4b-it:free`
- OpenRouter `google/gemma-4-31b-it:free`
- OpenRouter `nvidia/nemotron-3-super-120b-a12b:free`
- local fallback if remote generation fails

The notes prompt follows the `university-note-crafter` direction:
- source-grounded university notes
- Hungarian and English support
- LaTeX-first math
- figure/table/equation placeholders when extraction is not available
- explicit anti-slop humanizer pass
- References & Credits section

## Free-tier rate limit guard

All CLI LLM calls go through a shared provider-aware rate limiter.

Conservative defaults:
- `GROQ_REQUEST_DELAY_MS=70000`
- `OPENROUTER_REQUEST_DELAY_MS=30000`
- `LLM_MAX_RETRIES=2`
- `LLM_RETRY_SAFETY_MS=5000`

The guard also respects `retry-after` on 429 responses when the provider sends it.

You can tune the delays per run:

```bash
$env:GROQ_REQUEST_DELAY_MS="70000"
$env:OPENROUTER_REQUEST_DELAY_MS="30000"
node scripts/generate-all.js it_biztonsag
```

For free tiers, keep the defaults unless you have checked the current provider dashboard limits.

## 🆘 Support

Ha problémád van, nyiss egy issue-t a GitHubon vagy ellenőrizd a `DEBUG=1` környezeti változóval a részletes hibákat:

```bash
setx DEBUG 1
node scripts/generate-notes.js it_biztonsag
```

## Content plan and quality report

The pipeline now writes a shared content plan before generation and a quality report after the full run.

```bash
node scripts/build-content-plan.js it_biztonsag
node scripts/validate-content.js it_biztonsag
```

Generated files:

- `content/<slug>/plan.json`
- `content/<slug>/quality-report.json`

The plan is a shared planning artifact for notes, questions, flashcards, and glossary generation.
The quality report is a heuristic check for coverage, completeness, and basic schema health.

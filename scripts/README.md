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

## 🆘 Support

Ha problémád van, nyiss egy issue-t a GitHubon vagy ellenőrizd a `DEBUG=1` környezeti változóval a részletes hibákat:

```bash
setx DEBUG 1
node scripts/generate-notes.js it_biztonsag
```

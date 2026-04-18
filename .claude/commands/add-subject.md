# Add Subject

Scaffold a new subject in the content directory with all required JSON files.

## How to use
`/add-subject <slug> "<Display Name>" "<emoji>"`  
Example: `/add-subject matematika "Matematika" "📐"`

## What I will do
1. Create `content/<slug>/` directory
2. Create `content/<slug>/meta.json`:
   ```json
   { "slug": "<slug>", "name": "<name>", "emoji": "<emoji>", "color": "#E07355" }
   ```
3. Create empty `content/<slug>/questions.json`: `[]`
4. Create empty `content/<slug>/flashcards.json`: `[]`
5. Create empty `content/<slug>/glossary.json`: `[]`
6. Create `content/<slug>/notes/` directory
7. Add the subject to `content/subjects.json`
8. Also create matching `storage/subjects/<slug>/sources/lesson_sources/` and `storage/subjects/<slug>/sources/test_sources/` directories for pipeline input
9. Create `storage/subjects/<slug>/notes_ready/` and `storage/subjects/<slug>/tests_ready/` output directories

## Storage structure
```
storage/subjects/<slug>/
├── sources/
│   ├── lesson_sources/   ← put PDFs/DOCXs here for note generation
│   └── test_sources/     ← put past exam papers here for question generation
├── notes_ready/          ← pipeline outputs processed notes here
└── tests_ready/          ← pipeline outputs generated questions here
```

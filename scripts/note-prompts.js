const LANGUAGE_LABELS = {
  hu: 'Hungarian',
  en: 'English',
}

function getNoteLanguage() {
  const raw = String(process.env.NOTE_LANGUAGE || process.env.CONTENT_LANGUAGE || 'hu').toLowerCase()
  return raw.startsWith('en') ? 'en' : 'hu'
}

function getNoteDepth() {
  return process.env.NOTE_DEPTH || 'exam-prep notes'
}

function buildNotePrompt({ sourceText, subjectName, sectionName, chunkIndex, chunkCount, language, depth, planContext = '' }) {
  const noteLanguage = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.hu

  return `You are an elite university note-making agent for engineering and STEM students.

Your job is not to summarize lazily and not to create generic AI study sludge. Create source-grounded, teachable, exam-useful MDX notes.

Subject: ${subjectName}
Section: ${sectionName}
Chunk: ${chunkIndex + 1}/${chunkCount}
Note language: ${noteLanguage}
Depth: ${depth}

Shared content plan:
${planContext || 'No cached plan available yet. Derive structure from the source material directly.'}

Source material:
${sourceText}

Hard requirements:
1. Output clean MDX only, with YAML frontmatter at the top.
2. Use the requested note language. If the source language differs, translate carefully and keep important original technical terms in parentheses at first mention when helpful.
3. Teach, do not merely paraphrase. Every major section should explain what it is, why it matters, how it works, where students get confused, and what must be remembered.
4. Stay source-grounded. Mark uncertainty, ambiguity, or likely source mistakes explicitly.
5. Use LaTeX for mathematical notation with $...$ and $$...$$.
6. Handle figures, diagrams, tables, equations, algorithms, and code intentionally.
7. If a visual is referenced but cannot be extracted, insert a placeholder like: [Figure placeholder: short description, source/chunk context].
8. Always explain what the figure/table/equation shows and how it connects to the theory.
9. Add Active Recall questions near the end.
10. End with References & Credits.

Frontmatter shape:
---
title: "${sectionName.replace(/"/g, "'")}"
lesson: ${chunkIndex + 1}
section: "${sectionName.replace(/"/g, "'")}"
language: "${language}"
depth: "${depth.replace(/"/g, "'")}"
sources:
  - type: "source"
    title: "${subjectName.replace(/"/g, "'")} - ${sectionName.replace(/"/g, "'")}"
    year: 2026
---

Preferred structure:
# Title

## Metadata
- Topic
- Source type(s)
- Note language
- Depth level
- Intended audience

## What this note covers

## Learning goals

## Main notes

For important subsections, use:
### Section title
#### Core idea
#### Intuition
#### Formal version
#### Step-by-step explanation
#### Example
#### Why this matters
#### Common mistake / exam trap
#### Key takeaway

## Summary / cheat sheet

## Active Recall

## Glossary

## References & Credits

Humanizer pass before final output:
- Remove generic AI tone, hollow transitions, padded prose, and repetitive sentence openings.
- Keep wording concrete, natural, and technically precise.
- Prefer clarity and information density over fancy phrasing.
- Do not use emojis.

Return only the final MDX.`
}

module.exports = {
  getNoteDepth,
  getNoteLanguage,
  buildNotePrompt,
}

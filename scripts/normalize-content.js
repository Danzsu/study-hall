#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const {
  normalizeFlashcard,
  normalizeGlossary,
  normalizeQuestion,
  readJSON,
  titleFromSlug,
  updateSubjectsIndex,
  writeJSON,
} = require('./content-utils')

const CONTENT_ROOT = path.join(__dirname, '..', 'content')
const subjectSlug = process.argv[2]

if (!subjectSlug) {
  console.error('Usage: node scripts/normalize-content.js <subject-slug>')
  process.exit(1)
}

const subjectDir = path.join(CONTENT_ROOT, subjectSlug)
const notesDir = path.join(subjectDir, 'notes')
if (!fs.existsSync(subjectDir)) {
  console.error(`Subject content folder not found: ${subjectDir}`)
  process.exit(1)
}

const questionsPath = path.join(subjectDir, 'questions.json')
const flashcardsPath = path.join(subjectDir, 'flashcards.json')
const glossaryPath = path.join(subjectDir, 'glossary.json')
const lessonsPath = path.join(notesDir, 'lessons.json')
const metaPath = path.join(subjectDir, 'meta.json')

const questions = readJSON(questionsPath, [])
  .map((q, idx) => normalizeQuestion(q, idx, q.section))
  .filter(q => q.question && (q.type === 'written' || q.options.length > 0))
  .filter(q => q.type !== 'multi' || q.correctMultiple.length > 0)
if (fs.existsSync(questionsPath)) writeJSON(questionsPath, questions)

const flashcards = readJSON(flashcardsPath, [])
  .map((f, idx) => normalizeFlashcard(f, idx, f.section))
  .filter(f => f.front && f.back)
if (fs.existsSync(flashcardsPath)) writeJSON(flashcardsPath, flashcards)

const glossary = readJSON(glossaryPath, [])
  .map((g, idx) => normalizeGlossary(g, idx, g.section || g.category))
  .filter(g => g.term && g.definition)
if (fs.existsSync(glossaryPath)) writeJSON(glossaryPath, glossary)

const mdxFiles = fs.existsSync(notesDir)
  ? fs.readdirSync(notesDir).filter(f => f.endsWith('.mdx')).sort()
  : []
const lessons = readJSON(lessonsPath, [])
const normalizedLessons = (lessons.length ? lessons : mdxFiles.map((file, idx) => ({
  slug: file.replace(/\.mdx$/, ''),
  title: file.replace(/\.mdx$/, ''),
  section: 'General',
  lesson: idx + 1,
}))).map((lesson, idx) => ({
  slug: lesson.slug,
  title: lesson.title || lesson.slug,
  section: lesson.section || 'General',
  lesson: Number(lesson.lesson || idx + 1),
  time: lesson.time || '10 min',
  sources: lesson.sources || [],
  activeRecall: lesson.activeRecall || [],
}))
if (mdxFiles.length || lessons.length) writeJSON(lessonsPath, normalizedLessons)

const meta = readJSON(metaPath, {})
const subjectName = subjectSlug === 'it_biztonsag' ? titleFromSlug(subjectSlug) : meta.name || titleFromSlug(subjectSlug)
const subjectDescription = subjectSlug === 'it_biztonsag'
  ? 'IT biztonság jegyzetek és tanulási anyagok'
  : meta.description || `${subjectName} tanulasi anyagok`

writeJSON(metaPath, {
  slug: subjectSlug,
  name: subjectName,
  description: subjectDescription,
  color: meta.color || '#E07355',
  icon: meta.icon || 'book',
})

updateSubjectsIndex(CONTENT_ROOT, subjectSlug, {
  name: subjectName,
  description: subjectDescription,
  color: meta.color || '#E07355',
  icon: meta.icon || 'book',
  questionCount: questions.length,
  lessonCount: normalizedLessons.length,
  flashcardCount: flashcards.length,
  glossaryCount: glossary.length,
})

console.log(`Normalized ${subjectSlug}: ${normalizedLessons.length} lessons, ${questions.length} questions, ${flashcards.length} flashcards, ${glossary.length} glossary entries.`)

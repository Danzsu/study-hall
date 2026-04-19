#!/usr/bin/env node

const assert = require('node:assert/strict')
const path = require('node:path')

const {
  normalizeFlashcard,
  normalizeGlossary,
  normalizeQuestion,
  readJSON,
} = require('../scripts/content-utils')

const ROOT = path.join(__dirname, '..')
const CONTENT_ROOT = path.join(ROOT, 'content')
const SUBJECTS_PATH = path.join(CONTENT_ROOT, 'subjects.json')
const SUBJECT_SLUG = 'it_biztonsag'

function readSubjectFiles(slug) {
  const dir = path.join(CONTENT_ROOT, slug)
  return {
    subject: readJSON(SUBJECTS_PATH, []).find((item) => item.slug === slug) || null,
    questions: readJSON(path.join(dir, 'questions.json'), []),
    flashcards: readJSON(path.join(dir, 'flashcards.json'), []),
    glossary: readJSON(path.join(dir, 'glossary.json'), []),
    lessons: readJSON(path.join(dir, 'notes', 'lessons.json'), []),
  }
}

function requirePlainObject(value, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be a plain object`)
}

function requireString(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string`)
  assert.ok(value.trim().length > 0, `${label} must not be empty`)
}

function checkSubjectIndex(subject) {
  requirePlainObject(subject, 'Subject entry')
  requireString(subject.slug, 'Subject slug')
  requireString(subject.name, 'Subject name')
  requireString(subject.description, 'Subject description')
  requireString(subject.color, 'Subject color')
  requireString(subject.icon, 'Subject icon')
  assert.equal(subject.slug, SUBJECT_SLUG, 'Subject index should include the IT security subject')
  assert.equal(typeof subject.questionCount, 'number', 'Subject questionCount must be numeric')
  assert.equal(typeof subject.flashcardCount, 'number', 'Subject flashcardCount must be numeric')
  assert.equal(typeof subject.glossaryCount, 'number', 'Subject glossaryCount must be numeric')
  assert.equal(typeof subject.lessonCount, 'number', 'Subject lessonCount must be numeric')
}

function checkNormalizedQuestion(rawQuestion, subjectName) {
  const normalized = normalizeQuestion(rawQuestion, 0, subjectName)
  requirePlainObject(normalized, 'Normalized question')
  assert.equal(normalized.id, 'q1')
  requireString(normalized.type, 'Question type')
  requireString(normalized.section, 'Question section')
  requireString(normalized.question, 'Question text')
  assert.ok(Array.isArray(normalized.options), 'Question options must be an array')
  assert.ok(Array.isArray(normalized.keywords), 'Question keywords must be an array')
  assert.ok(typeof normalized.correct === 'number' || typeof normalized.correct === 'undefined', 'Question correct value must be numeric or undefined')
  return normalized
}

function checkNormalizedFlashcard(rawFlashcard, subjectName) {
  const normalized = normalizeFlashcard(rawFlashcard, 0, subjectName)
  requirePlainObject(normalized, 'Normalized flashcard')
  assert.equal(normalized.id, 'f1')
  requireString(normalized.front, 'Flashcard front')
  requireString(normalized.back, 'Flashcard back')
  requireString(normalized.section, 'Flashcard section')
  requireString(normalized.type, 'Flashcard type')
  return normalized
}

function checkNormalizedGlossary(rawGlossary, subjectName) {
  const normalized = normalizeGlossary(rawGlossary, 0, subjectName)
  requirePlainObject(normalized, 'Normalized glossary item')
  assert.equal(normalized.id, 'g1')
  requireString(normalized.term, 'Glossary term')
  requireString(normalized.definition, 'Glossary definition')
  requireString(normalized.category, 'Glossary category')
  requireString(normalized.section, 'Glossary section')
  assert.ok(Array.isArray(normalized.aliases), 'Glossary aliases must be an array')
  return normalized
}

function checkLessonShape(lesson) {
  requirePlainObject(lesson, 'Lesson entry')
  requireString(lesson.slug, 'Lesson slug')
  requireString(lesson.title, 'Lesson title')
  requireString(lesson.section, 'Lesson section')
  requireString(lesson.time, 'Lesson time')
  assert.equal(typeof lesson.lesson, 'number', 'Lesson number must be numeric')
  assert.ok(Array.isArray(lesson.sources), 'Lesson sources must be an array')
  assert.ok(Array.isArray(lesson.activeRecall), 'Lesson activeRecall must be an array')
}

function main() {
  const subject = readSubjectFiles(SUBJECT_SLUG)
  checkSubjectIndex(subject.subject)

  assert.equal(subject.questions.length, subject.subject.questionCount, 'Question count should stay in sync with the subject index')
  assert.equal(subject.flashcards.length, subject.subject.flashcardCount, 'Flashcard count should stay in sync with the subject index')
  assert.equal(subject.glossary.length, subject.subject.glossaryCount, 'Glossary count should stay in sync with the subject index')
  assert.equal(subject.lessons.length, subject.subject.lessonCount, 'Lesson count should stay in sync with the subject index')

  checkNormalizedQuestion(subject.questions[0], subject.subject.name)
  checkNormalizedFlashcard(subject.flashcards[0], subject.subject.name)
  checkNormalizedGlossary(subject.glossary[0], subject.subject.name)
  checkLessonShape(subject.lessons[0])

  const normalizedQuestion = normalizeQuestion({
    type: 'mc',
    section: 'Sample section',
    question: 'Sample question',
    options: ['A', 'B'],
    correct: 1,
    explanation: 'Sample explanation',
    idealAnswer: 'Sample answer',
    keywords: ['one', 'two'],
  }, 3, 'Fallback section')

  assert.equal(normalizedQuestion.id, 'q4')
  assert.equal(normalizedQuestion.type, 'mcq')
  assert.equal(normalizedQuestion.section, 'Sample section')
  assert.equal(normalizedQuestion.correct, 1)
  assert.deepEqual(normalizedQuestion.keywords, ['one', 'two'])

  const normalizedFlashcard = normalizeFlashcard({
    question: 'What is a sample?',
    answer: 'A sample answer',
    section: 'Sample section',
    abbr: 'SA',
  }, 2, 'Fallback section')

  assert.equal(normalizedFlashcard.id, 'f3')
  assert.equal(normalizedFlashcard.type, 'abbr')
  assert.equal(normalizedFlashcard.front, 'What is a sample?')
  assert.equal(normalizedFlashcard.back, 'A sample answer')

  const normalizedGlossary = normalizeGlossary({
    full: 'Sample term',
    def: 'Sample definition',
    category: 'Sample category',
    aliases: ['Alias 1'],
  }, 1, 'Fallback section')

  assert.equal(normalizedGlossary.id, 'g2')
  assert.equal(normalizedGlossary.term, 'Sample term')
  assert.equal(normalizedGlossary.definition, 'Sample definition')
  assert.equal(normalizedGlossary.category, 'Sample category')
  assert.equal(normalizedGlossary.section, 'Sample category')
  assert.deepEqual(normalizedGlossary.aliases, ['Alias 1'])

  console.log([
    'Whitebox content checks passed.',
    `subject: ${subject.subject.slug}`,
    `counts: questions=${subject.questions.length}, flashcards=${subject.flashcards.length}, glossary=${subject.glossary.length}, lessons=${subject.lessons.length}`,
  ].join('\n'))
}

main()

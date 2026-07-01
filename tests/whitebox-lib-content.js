#!/usr/bin/env node
'use strict'

const assert = require('node:assert/strict')

const SUBJECT_SLUG = 'it_biztonsag'

async function main() {
  const {
    clearCache,
    getSubjects,
    getSubject,
    getQuestions,
    getFlashcards,
    getGlossary,
    searchContent,
    getNoteContent,
  } = await import('../lib/content.js')

  // ── Happy path ──────────────────────────────────────────────────────────────

  const subjects = getSubjects()
  assert.ok(Array.isArray(subjects) && subjects.length > 0, 'getSubjects should return a non-empty array')
  for (const s of subjects) {
    assert.ok(typeof s.slug === 'string' && s.slug, `subject.slug must be a non-empty string, got: ${JSON.stringify(s.slug)}`)
    assert.ok(typeof s.name === 'string' && s.name, `subject.name must be a non-empty string, got: ${JSON.stringify(s.name)}`)
  }

  const subject = getSubject(SUBJECT_SLUG)
  assert.ok(subject !== null, `getSubject('${SUBJECT_SLUG}') should not be null`)
  assert.equal(subject.slug, SUBJECT_SLUG, 'getSubject should return the correct subject')

  const questions = getQuestions(SUBJECT_SLUG)
  assert.ok(Array.isArray(questions), 'getQuestions should return an array')
  if (questions.length > 0) {
    const q = questions[0]
    assert.ok(typeof q.id === 'string', 'question.id must be a string')
    assert.ok(typeof q.type === 'string', 'question.type must be a string')
    assert.ok(typeof q.question === 'string', 'question.question must be a string')
    assert.ok(Array.isArray(q.options), 'question.options must be an array')
    assert.ok(Array.isArray(q.keywords), 'question.keywords must be an array')
  }

  const flashcards = getFlashcards(SUBJECT_SLUG)
  assert.ok(Array.isArray(flashcards), 'getFlashcards should return an array')
  if (flashcards.length > 0) {
    const f = flashcards[0]
    assert.ok(typeof f.id === 'string', 'flashcard.id must be a string')
    assert.ok(typeof f.front === 'string', 'flashcard.front must be a string')
    assert.ok(typeof f.back === 'string', 'flashcard.back must be a string')
    assert.ok(typeof f.section === 'string', 'flashcard.section must be a string')
    assert.ok(typeof f.type === 'string', 'flashcard.type must be a string')
  }

  const glossary = getGlossary(SUBJECT_SLUG)
  assert.ok(Array.isArray(glossary), 'getGlossary should return an array')
  if (glossary.length > 0) {
    const g = glossary[0]
    assert.ok(typeof g.id === 'string', 'glossary.id must be a string')
    assert.ok(typeof g.term === 'string', 'glossary.term must be a string')
    assert.ok(typeof g.definition === 'string', 'glossary.definition must be a string')
    assert.ok(Array.isArray(g.aliases), 'glossary.aliases must be an array')
  }

  // Search happy path — pick probe from glossary, fall back to 'IT'
  let probe = 'IT'
  if (glossary.length > 0) {
    const term = String(glossary[0].term || '').trim()
    if (term.length >= 2) probe = term.slice(0, 8)
  }
  const searchResults = searchContent(probe, [SUBJECT_SLUG], ['glossary'])
  assert.ok(Array.isArray(searchResults), 'searchContent should return an array')
  if (searchResults.length > 0) {
    const r = searchResults[0]
    assert.equal(typeof r.type, 'string', 'search result type must be a string')
    assert.equal(typeof r.subject, 'string', 'search result subject must be a string')
    assert.equal(typeof r.slug, 'string', 'search result slug must be a string')
    assert.equal(typeof r.title, 'string', 'search result title must be a string')
    assert.equal(typeof r.url, 'string', 'search result url must be a string')
  }

  // Search type filtering
  const noteResults = searchContent(probe, [SUBJECT_SLUG], ['notes'])
  assert.ok(Array.isArray(noteResults), 'searchContent with notes type should return an array')
  assert.ok(noteResults.every((r) => r.type === 'notes'), 'type-filtered search should return only notes')

  // ── Edge cases ───────────────────────────────────────────────────────────────

  const missing = getSubject('nonexistent-slug-xyz')
  assert.equal(missing, null, 'getSubject with unknown slug should return null')

  const shortSearch = searchContent('a', [SUBJECT_SLUG], ['glossary'])
  assert.ok(Array.isArray(shortSearch) && shortSearch.length === 0, 'searchContent with 1-char query should return []')

  const emptySearch = searchContent('', [SUBJECT_SLUG], ['glossary'])
  assert.ok(Array.isArray(emptySearch) && emptySearch.length === 0, 'searchContent with empty query should return []')

  const missingNote = getNoteContent(SUBJECT_SLUG, 'nonexistent-lesson-xyz')
  assert.equal(missingNote, null, 'getNoteContent for missing lesson should return null')

  const missingNoteWrongSubject = getNoteContent('nonexistent-subject-xyz', 'some-lesson')
  assert.equal(missingNoteWrongSubject, null, 'getNoteContent for missing subject should return null')

  // clearCache should not throw and subsequent calls should still work
  clearCache()
  const afterClear = getSubjects()
  assert.ok(Array.isArray(afterClear), 'getSubjects should work after clearCache()')
  assert.ok(afterClear.length > 0, 'getSubjects after clearCache should still return subjects')

  console.log('whitebox-lib-content passed.')
}

main().catch((err) => {
  console.error(`whitebox-lib-content failed: ${err.message}`)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})

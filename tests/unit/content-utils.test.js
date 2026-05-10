#!/usr/bin/env node

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const {
  normalizeFlashcard,
  normalizeGlossary,
  normalizeQuestion,
  readJSON,
  titleFromSlug,
  writeJSON,
} = require('../../scripts/content-utils')

function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-hall-content-utils-'))
  const filePath = path.join(tempDir, 'nested', 'sample.json')

  writeJSON(filePath, { ok: true, count: 3 })
  assert.deepEqual(readJSON(filePath, null), { ok: true, count: 3 }, 'JSON round-trip should preserve data')
  assert.deepEqual(readJSON(path.join(tempDir, 'missing.json'), { fallback: true }), { fallback: true }, 'Missing JSON files should return the fallback')

  assert.equal(titleFromSlug('network-security-basics'), 'Network Security Basics')
  assert.equal(titleFromSlug('it_biztonsag'), 'IT Biztonság')

  const normalizedQuestion = normalizeQuestion({
    type: 'mc',
    section: 'Foundations',
    question: 'What is least privilege?',
    options: ['A', 'B', 'C', 'D'],
    correct: 2,
    explanation: 'Access should be minimized.',
    ideal_answer: 'Only the required rights should be granted.',
    key_points: ['least privilege', 'access control'],
  }, 4, 'Fallback section')

  assert.equal(normalizedQuestion.id, 'q5')
  assert.equal(normalizedQuestion.type, 'mcq')
  assert.equal(normalizedQuestion.section, 'Foundations')
  assert.equal(normalizedQuestion.correct, 2)
  assert.deepEqual(normalizedQuestion.keywords, ['least privilege', 'access control'])
  assert.equal(normalizedQuestion.idealAnswer.includes('required rights'), true)

  const normalizedFlashcard = normalizeFlashcard({
    question: 'What is MFA?',
    answer: 'Multiple factor authentication.',
    section: 'Authentication',
    abbr: 'MFA',
  }, 1, 'Fallback section')

  assert.equal(normalizedFlashcard.id, 'f2')
  assert.equal(normalizedFlashcard.front, 'What is MFA?')
  assert.equal(normalizedFlashcard.back, 'Multiple factor authentication.')
  assert.equal(normalizedFlashcard.type, 'abbr')
  assert.equal(normalizedFlashcard.section, 'Authentication')

  const normalizedGlossary = normalizeGlossary({
    full: 'Zero Trust',
    def: 'Never trust, always verify.',
    category: 'Architecture',
    aliases: ['ZT'],
  }, 2, 'Fallback section')

  assert.equal(normalizedGlossary.id, 'g3')
  assert.equal(normalizedGlossary.term, 'Zero Trust')
  assert.equal(normalizedGlossary.definition, 'Never trust, always verify.')
  assert.equal(normalizedGlossary.category, 'Architecture')
  assert.deepEqual(normalizedGlossary.aliases, ['ZT'])

  console.log('content-utils unit checks passed.')
}

main()

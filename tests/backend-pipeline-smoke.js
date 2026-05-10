#!/usr/bin/env node

const assert = require('node:assert/strict')
const { buildFallbackFlashcards, buildFallbackGlossary, buildFallbackQuestions } = require('../scripts/local-generators')
const { chunkDocument, splitIntoBlocks } = require('../scripts/document-chunker')
const { normalizeFlashcard, normalizeGlossary, normalizeQuestion } = require('../scripts/content-utils')

const SAMPLE_TEXT = `
# Access Control

Access control is the practice of limiting permissions to what a subject needs.
For example, least privilege gives users only the rights they need.
What makes access control effective? It limits permissions to only what a subject needs.

## Threat Modeling

Threat modeling is a method for identifying likely attacks before deployment.
Example: map assets, trust boundaries, and entry points before release.
It asks which assets need protection.
`

function main() {
  const blocks = splitIntoBlocks(SAMPLE_TEXT)
  assert.ok(blocks.length >= 2, 'Chunker should detect multiple blocks')
  assert.equal(blocks[0].type, 'heading', 'First block should be recognized as a heading')
  assert.equal(blocks[0].heading, 'Access Control', 'Heading text should be preserved')

  const chunks = chunkDocument(SAMPLE_TEXT, { sourceTitle: 'Synthetic source' })
  assert.ok(chunks.length >= 1, 'Chunker should create at least one chunk')
  assert.ok(chunks[0].promptText.includes('Source title: Synthetic source'), 'Chunk prompt should carry source metadata')
  assert.ok(Array.isArray(chunks[0].headings), 'Chunk headings should be an array')
  assert.ok(Array.isArray(chunks[0].visualCandidates), 'Chunk visualCandidates should be an array')
  assert.ok(Array.isArray(chunks[0].learningSignals.concepts), 'Chunk concept signals should be captured')
  assert.ok(Array.isArray(chunks[0].learningSignals.definitions), 'Chunk definition signals should be captured')
  assert.ok(Array.isArray(chunks[0].learningSignals.examples), 'Chunk example signals should be captured')
  assert.ok(Array.isArray(chunks[0].learningSignals.questions), 'Chunk question signals should be captured')
  assert.equal(chunks[0].learningIntent.primary, 'question-practice', 'Question-heavy chunks should prioritize practice intent')
  assert.ok(chunks[0].learningIntent.focus.includes('definition-review'), 'Chunk learning intent should include definition review when definitions are present')
  assert.ok(chunks[0].promptText.includes('Detected concept signals'), 'Chunk prompt should surface concept metadata')
  assert.ok(chunks[0].promptText.includes('Detected definition signals'), 'Chunk prompt should surface definition metadata')
  assert.ok(chunks[0].promptText.includes('Detected example signals'), 'Chunk prompt should surface example metadata')
  assert.ok(chunks[0].promptText.includes('Learning intent:'), 'Chunk prompt should surface learning intent metadata')

  const questions = buildFallbackQuestions(SAMPLE_TEXT, 'Access Control')
  assert.equal(questions.length, 3, 'Fallback question generator should produce three questions')

  const mcq = normalizeQuestion(questions[0], 0, 0)
  assert.equal(mcq.type, 'mcq', 'First fallback question should normalize as mcq')
  assert.ok(Array.isArray(mcq.options) && mcq.options.length === 4, 'MCQ should keep four options')

  const multi = normalizeQuestion(questions[1], 1, 0)
  assert.equal(multi.type, 'multi', 'Second fallback question should normalize as multi')
  assert.ok(Array.isArray(multi.correctMultiple) && multi.correctMultiple.length === 3, 'Multi-select should keep three correct answers')

  const written = normalizeQuestion(questions[2], 2, 0)
  assert.equal(written.type, 'written', 'Third fallback question should normalize as written')
  assert.ok(written.idealAnswer.length > 0, 'Written fallback question should preserve the model answer')
  assert.ok(Array.isArray(written.keywords) && written.keywords.length > 0, 'Written fallback question should preserve key terms')

  const flashcards = buildFallbackFlashcards('Access Control', SAMPLE_TEXT)
  assert.ok(flashcards.length >= 2, 'Fallback flashcard generator should produce cards')
  const normalizedFlashcard = normalizeFlashcard(flashcards[0], 0, 'Access Control')
  assert.equal(normalizedFlashcard.front.length > 0, true, 'Flashcard front should normalize')
  assert.equal(normalizedFlashcard.back.length > 0, true, 'Flashcard back should normalize')

  const glossary = buildFallbackGlossary('Access Control', SAMPLE_TEXT)
  assert.ok(glossary.length >= 1, 'Fallback glossary generator should produce entries')
  const normalizedGlossary = normalizeGlossary(glossary[0], 0, 'Access Control')
  assert.equal(normalizedGlossary.term.length > 0, true, 'Glossary term should normalize')
  assert.equal(normalizedGlossary.definition.length > 0, true, 'Glossary definition should normalize')
  assert.equal(normalizedGlossary.category, 'Access Control', 'Glossary category should survive normalization')

  console.log([
    'Backend pipeline smoke passed.',
    `chunks: ${chunks.length}`,
    `questions: ${questions.length}`,
    `flashcards: ${flashcards.length}`,
    `glossary: ${glossary.length}`,
  ].join('\n'))
}

main()

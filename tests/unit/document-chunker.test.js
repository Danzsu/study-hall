#!/usr/bin/env node

const assert = require('node:assert/strict')
const {
  chunkDocument,
  extractQuestionLikeBlocks,
  splitIntoBlocks,
} = require('../../scripts/document-chunker')

function main() {
  const sample = `
# Access Control

Access control is the practice of limiting permissions to what a user needs.
For example, least privilege gives users only the rights they need.
What makes access control effective?

## Threat Modeling

Threat modeling is a method for identifying likely attacks before deployment.
Example: map assets, trust boundaries, and entry points before release.
It asks which assets need protection.
How do we prioritize threats?
`

  const blocks = splitIntoBlocks(sample)
  assert.ok(blocks.length >= 3, 'Split should produce multiple blocks')
  assert.equal(blocks[0].heading, 'Access Control', 'The first heading should carry through')
  assert.equal(blocks[0].type, 'heading', 'Heading blocks should be classified as headings')

  const questionBlocks = extractQuestionLikeBlocks(sample)
  assert.ok(questionBlocks.length >= 2, 'Question-like blocks should be extracted')
  assert.ok(questionBlocks[0].excerpt.endsWith('?'), 'Question excerpts should retain question phrasing')

  const chunks = chunkDocument(sample, {
    sourceTitle: 'Synthetic source',
    maxChars: 220,
    minChars: 90,
    overlapChars: 50,
  })

  assert.ok(chunks.length >= 2, 'Chunking should split the sample into multiple chunks')
  assert.ok(chunks[0].promptText.includes('Source title: Synthetic source'), 'Chunk metadata should include the source title')
  assert.ok(chunks[0].promptText.includes('Learning intent:'), 'Chunk metadata should include learning intent')
  assert.ok(Array.isArray(chunks[0].learningSignals.concepts), 'Chunk concepts should be tracked')
  assert.ok(Array.isArray(chunks[0].learningSignals.definitions), 'Chunk definitions should be tracked')
  assert.ok(Array.isArray(chunks[0].learningSignals.examples), 'Chunk examples should be tracked')
  assert.ok(Array.isArray(chunks[0].learningSignals.questions), 'Chunk questions should be tracked')
  assert.ok(chunks[0].learningIntent.focus.length >= 1, 'Chunk learning intent should expose a focus list')
  assert.equal(typeof chunks[0].chars, 'number', 'Chunk character counts should be numeric')

  console.log('document-chunker unit checks passed.')
}

main()

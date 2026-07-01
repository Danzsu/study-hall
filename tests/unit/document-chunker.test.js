import { describe, it, expect } from 'vitest'
import {
  chunkDocument,
  extractQuestionLikeBlocks,
  splitIntoBlocks,
} from '../../scripts/document-chunker.js'

const SAMPLE = `
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

describe('splitIntoBlocks', () => {
  it('produces multiple blocks', () => {
    expect(splitIntoBlocks(SAMPLE).length).toBeGreaterThanOrEqual(3)
  })

  it('carries the first heading through', () => {
    const blocks = splitIntoBlocks(SAMPLE)
    expect(blocks[0].heading).toBe('Access Control')
    expect(blocks[0].type).toBe('heading')
  })
})

describe('extractQuestionLikeBlocks', () => {
  it('extracts question blocks ending with ?', () => {
    const blocks = extractQuestionLikeBlocks(SAMPLE)
    expect(blocks.length).toBeGreaterThanOrEqual(2)
    expect(blocks[0].excerpt.endsWith('?')).toBe(true)
  })
})

describe('chunkDocument', () => {
  it('splits into multiple chunks with required metadata', () => {
    const chunks = chunkDocument(SAMPLE, {
      sourceTitle: 'Synthetic source',
      maxChars: 220,
      minChars: 90,
      overlapChars: 50,
    })

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks[0].promptText).toContain('Source title: Synthetic source')
    expect(chunks[0].promptText).toContain('Learning intent:')
    expect(Array.isArray(chunks[0].learningSignals.concepts)).toBe(true)
    expect(Array.isArray(chunks[0].learningSignals.definitions)).toBe(true)
    expect(Array.isArray(chunks[0].learningSignals.examples)).toBe(true)
    expect(Array.isArray(chunks[0].learningSignals.questions)).toBe(true)
    expect(chunks[0].learningIntent.focus.length).toBeGreaterThanOrEqual(1)
    expect(typeof chunks[0].chars).toBe('number')
  })
})

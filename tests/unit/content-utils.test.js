import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  normalizeFlashcard,
  normalizeGlossary,
  normalizeQuestion,
  readJSON,
  titleFromSlug,
  writeJSON,
} from '../../scripts/content-utils.js'

describe('readJSON / writeJSON', () => {
  it('round-trips JSON through disk', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-hall-cu-'))
    try {
      const filePath = path.join(tempDir, 'nested', 'sample.json')
      writeJSON(filePath, { ok: true, count: 3 })
      expect(readJSON(filePath, null)).toEqual({ ok: true, count: 3 })
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('returns fallback for missing files', () => {
    const missing = path.join(os.tmpdir(), `study-hall-missing-${Date.now()}.json`)
    expect(readJSON(missing, { fallback: true })).toEqual({ fallback: true })
  })
})

describe('titleFromSlug', () => {
  it('converts kebab-case to title case', () => {
    expect(titleFromSlug('network-security-basics')).toBe('Network Security Basics')
  })

  it('converts known Hungarian slug', () => {
    expect(titleFromSlug('it_biztonsag')).toBe('IT Biztonság')
  })
})

describe('normalizeQuestion', () => {
  it('normalizes mc → mcq type and maps legacy fields', () => {
    const q = normalizeQuestion({
      type: 'mc',
      section: 'Foundations',
      question: 'What is least privilege?',
      options: ['A', 'B', 'C', 'D'],
      correct: 2,
      explanation: 'Access should be minimized.',
      ideal_answer: 'Only the required rights should be granted.',
      key_points: ['least privilege', 'access control'],
    }, 4, 'Fallback section')

    expect(q.id).toBe('q5')
    expect(q.type).toBe('mcq')
    expect(q.section).toBe('Foundations')
    expect(q.correct).toBe(2)
    expect(q.keywords).toEqual(['least privilege', 'access control'])
    expect(q.idealAnswer).toContain('required rights')
  })
})

describe('normalizeFlashcard', () => {
  it('normalizes to front/back with type detection', () => {
    const card = normalizeFlashcard({
      question: 'What is MFA?',
      answer: 'Multiple factor authentication.',
      section: 'Authentication',
      abbr: 'MFA',
    }, 1, 'Fallback section')

    expect(card.id).toBe('f2')
    expect(card.front).toBe('What is MFA?')
    expect(card.back).toBe('Multiple factor authentication.')
    expect(card.type).toBe('abbr')
    expect(card.section).toBe('Authentication')
  })
})

describe('normalizeGlossary', () => {
  it('normalizes aliases and maps def/full fields', () => {
    const g = normalizeGlossary({
      full: 'Zero Trust',
      def: 'Never trust, always verify.',
      category: 'Architecture',
      aliases: ['ZT'],
    }, 2, 'Fallback section')

    expect(g.id).toBe('g3')
    expect(g.term).toBe('Zero Trust')
    expect(g.definition).toBe('Never trust, always verify.')
    expect(g.category).toBe('Architecture')
    expect(g.aliases).toEqual(['ZT'])
  })
})

import { describe, it, expect } from 'vitest'
import {
  buildAssessmentSourceText,
  detectAssessmentBlocks,
  detectLearningSignals,
  detectVisualReferences,
  normalizeExtractedText,
  slugifySourceName,
} from '../../scripts/source-intelligence.js'

const SAMPLE = 'Line one.\r\n\r\nControl questions:\n1. What is access control?\n\nFigure 2: Auth flow.\n\nTable 1: Roles\tPermissions\n\nE = mc^2'

describe('normalizeExtractedText', () => {
  it('strips CRLF noise from text', () => {
    expect(normalizeExtractedText(SAMPLE).includes('\r')).toBe(false)
  })
})

describe('slugifySourceName', () => {
  it('handles Unicode and non-ASCII characters', () => {
    expect(slugifySourceName('Árvíztűrő Source 01.pdf')).toBe('arvizturo-source-01-pdf')
  })
})

describe('detectAssessmentBlocks', () => {
  it('detects question-like blocks and routes them to questions', () => {
    const normalized = normalizeExtractedText(SAMPLE)
    const blocks = detectAssessmentBlocks(normalized, { sourceKind: 'lesson' })
    expect(blocks.length).toBeGreaterThanOrEqual(1)
    expect(blocks[0].target).toBe('questions')
    expect(['control', 'question-candidate', 'exam', 'quiz', 'self-check'].includes(blocks[0].kind)).toBe(true)
  })

  it('routes weak cues to notes-review', () => {
    const blocks = detectAssessmentBlocks('Why does least privilege matter?', { sourceKind: 'lesson' })
    expect(blocks.length).toBeGreaterThanOrEqual(1)
    expect(blocks[0].target).toBe('notes-review')
  })
})

describe('detectVisualReferences', () => {
  it('detects figures, tables, and equations', () => {
    const normalized = normalizeExtractedText(SAMPLE)
    const refs = detectVisualReferences(normalized)
    expect(refs.some((r) => r.type === 'figure')).toBe(true)
    expect(refs.some((r) => r.type === 'table')).toBe(true)
    expect(refs.some((r) => r.type === 'equation')).toBe(true)
  })
})

describe('detectLearningSignals', () => {
  it('returns concept, definition, and example signal arrays', () => {
    const normalized = normalizeExtractedText(SAMPLE)
    const signals = detectLearningSignals(normalized)
    expect(Array.isArray(signals.concepts)).toBe(true)
    expect(Array.isArray(signals.definitions)).toBe(true)
    expect(Array.isArray(signals.examples)).toBe(true)
    expect(signals.density.concepts).toBeGreaterThanOrEqual(1)
  })
})

describe('buildAssessmentSourceText', () => {
  it('includes SOURCE ROUTING header and test/quiz routing', () => {
    const normalized = normalizeExtractedText(SAMPLE)
    const blocks = detectAssessmentBlocks(normalized, { sourceKind: 'lesson' })
    const text = buildAssessmentSourceText({ sourceFile: 'sample.pdf', assessmentBlocks: blocks })
    expect(text).toContain('SOURCE ROUTING')
    expect(text).toContain('test/quiz')
  })
})

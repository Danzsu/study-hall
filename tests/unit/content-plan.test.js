import { describe, it, expect } from 'vitest'
import { validateContent } from '../../scripts/content-plan.js'

const PLAN = {
  subject: { slug: 'it_biztonsag', name: 'IT Biztonság' },
  qualityTargets: {
    notesIdeal: 999, questionsIdeal: 999, flashcardsIdeal: 999, glossaryIdeal: 999,
  },
  lessonOutline: [
    { id: 'lesson-1', title: 'Access Control', section: 'Access Control', time: '15 min' },
  ],
  conceptInventory: ['Access control'],
  learningObjectives: ['Explain access control'],
  concepts: [{
    id: 'concept-access-control',
    label: 'Access control',
    priority: 5,
    sourceIds: ['lesson-1'],
    evidence: ['Access Control: heading'],
    signalTypes: ['heading'],
  }],
  objectives: [{
    id: 'objective-01',
    type: 'coverage',
    description: 'Recall access control.',
    sourceIds: ['lesson-1'],
    conceptIds: ['concept-access-control'],
    assessmentPriority: 'high',
  }],
  coverageMatrix: [{
    conceptId: 'concept-access-control',
    concept: 'Access control',
    sourceIds: ['lesson-1'],
    notes: true,
    quizTarget: 2,
    writtenTarget: 1,
    flashcardTarget: 1,
    glossaryTarget: 1,
  }],
  sourceCounts: { lessonSources: 1, testSources: 0 },
  lessonSources: [{ id: 'lesson-1', title: 'Access Control' }],
  testSources: [],
  llm: { preferredProviders: [], budgetSnapshot: {} },
}

describe('validateContent', () => {
  it('returns expected top-level report structure', () => {
    const report = validateContent('it_biztonsag', PLAN)
    expect(report.subject.slug).toBe('it_biztonsag')
    expect(report.subject.name).toBe('IT Biztonság')
    expect(typeof report.generatedAt).toBe('string')
    expect(Array.isArray(report.checks)).toBe(true)
    expect(Array.isArray(report.warnings)).toBe(true)
    expect(Array.isArray(report.recommendations)).toBe(true)
    expect(report.plan.coverageRows).toBe(1)
    expect(typeof report.score).toBe('number')
  })

  it('includes all required check names', () => {
    const report = validateContent('it_biztonsag', PLAN)
    const checkNames = new Set(report.checks.map((c) => c.name))
    const required = [
      'notes_count', 'questions_count', 'flashcards_count', 'glossary_count',
      'lesson_coverage', 'written_questions', 'written_completeness',
      'plan_artifact', 'structured_plan_contract', 'question_concept_coverage',
    ]
    for (const name of required) {
      expect(checkNames.has(name), `missing check: ${name}`).toBe(true)
    }
  })

  it('produces warnings and recommendations for strict quality targets', () => {
    const report = validateContent('it_biztonsag', PLAN)
    expect(report.recommendations.length).toBeGreaterThanOrEqual(1)
    expect(report.warnings.length).toBeGreaterThanOrEqual(1)
  })
})

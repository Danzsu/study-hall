#!/usr/bin/env node

const assert = require('node:assert/strict')
const { validateContent } = require('../../scripts/content-plan')

function main() {
  const plan = {
    subject: {
      slug: 'it_biztonsag',
      name: 'IT Biztonság',
    },
    qualityTargets: {
      notesIdeal: 999,
      questionsIdeal: 999,
      flashcardsIdeal: 999,
      glossaryIdeal: 999,
    },
    lessonOutline: [
      { id: 'lesson-1', title: 'Access Control', section: 'Access Control', time: '15 min' },
    ],
    conceptInventory: ['Access control'],
    learningObjectives: ['Explain access control'],
    concepts: [
      {
        id: 'concept-access-control',
        label: 'Access control',
        priority: 5,
        sourceIds: ['lesson-1'],
        evidence: ['Access Control: heading'],
        signalTypes: ['heading'],
      },
    ],
    objectives: [
      {
        id: 'objective-01',
        type: 'coverage',
        description: 'Recall access control.',
        sourceIds: ['lesson-1'],
        conceptIds: ['concept-access-control'],
        assessmentPriority: 'high',
      },
    ],
    coverageMatrix: [
      {
        conceptId: 'concept-access-control',
        concept: 'Access control',
        sourceIds: ['lesson-1'],
        notes: true,
        quizTarget: 2,
        writtenTarget: 1,
        flashcardTarget: 1,
        glossaryTarget: 1,
      },
    ],
    sourceCounts: {
      lessonSources: 1,
      testSources: 0,
    },
    lessonSources: [
      {
        id: 'lesson-1',
        title: 'Access Control',
      },
    ],
    testSources: [],
    llm: {
      preferredProviders: [],
      budgetSnapshot: {},
    },
  }

  const report = validateContent('it_biztonsag', plan)

  assert.equal(report.subject.slug, 'it_biztonsag')
  assert.equal(report.subject.name, 'IT Biztonság')
  assert.equal(typeof report.generatedAt, 'string', 'Report should include a timestamp')
  assert.ok(Array.isArray(report.checks), 'Report checks should be an array')
  assert.ok(Array.isArray(report.warnings), 'Report warnings should be an array')
  assert.ok(Array.isArray(report.recommendations), 'Report recommendations should be an array')
  assert.equal(report.plan.coverageRows, 1, 'Coverage row count should reflect the supplied plan')

  const checkNames = new Set(report.checks.map((check) => check.name))
  for (const name of ['notes_count', 'questions_count', 'flashcards_count', 'glossary_count', 'lesson_coverage', 'written_questions', 'written_completeness', 'plan_artifact', 'structured_plan_contract', 'question_concept_coverage']) {
    assert.ok(checkNames.has(name), `Report should include the ${name} check`)
  }

  assert.ok(report.recommendations.length >= 1, 'A deliberately strict plan should yield recommendations')
  assert.ok(report.warnings.length >= 1, 'A deliberately strict plan should yield warnings')
  assert.equal(typeof report.score, 'number', 'Report score should be numeric')

  console.log('content-plan unit checks passed.')
}

main()

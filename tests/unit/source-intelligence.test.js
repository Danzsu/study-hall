#!/usr/bin/env node

const assert = require('node:assert/strict')
const {
  buildAssessmentSourceText,
  detectAssessmentBlocks,
  detectLearningSignals,
  detectVisualReferences,
  normalizeExtractedText,
  slugifySourceName,
} = require('../../scripts/source-intelligence')

function main() {
  const raw = 'Line one.\r\n\r\nControl questions:\n1. What is access control?\n\nFigure 2: Auth flow.\n\nTable 1: Roles\tPermissions\n\nE = mc^2'
  const normalized = normalizeExtractedText(raw)

  assert.equal(normalized.includes('\r'), false, 'CRLF noise should be removed')
  assert.equal(slugifySourceName('Árvíztűrő Source 01.pdf'), 'arvizturo-source-01-pdf')

  const assessmentBlocks = detectAssessmentBlocks(normalized, { sourceKind: 'lesson' })
  assert.ok(assessmentBlocks.length >= 1, 'Question-like source blocks should be detected')
  assert.equal(assessmentBlocks[0].target, 'questions', 'Strong assessment cues should route to questions')
  assert.ok(['control', 'question-candidate', 'exam', 'quiz', 'self-check'].includes(assessmentBlocks[0].kind), 'Assessment kind should be classified')

  const weakBlocks = detectAssessmentBlocks('Why does least privilege matter?', { sourceKind: 'lesson' })
  assert.ok(weakBlocks.length >= 1, 'A question-like line should still be detected')
  assert.equal(weakBlocks[0].target, 'notes-review', 'Weak cues should stay in notes review')

  const visualReferences = detectVisualReferences(normalized)
  assert.ok(visualReferences.some((item) => item.type === 'figure'), 'Figure references should be preserved')
  assert.ok(visualReferences.some((item) => item.type === 'table'), 'Table references should be preserved')
  assert.ok(visualReferences.some((item) => item.type === 'equation'), 'Equation references should be preserved')

  const learningSignals = detectLearningSignals(normalized)
  assert.ok(Array.isArray(learningSignals.concepts), 'Concept signals should be present')
  assert.ok(Array.isArray(learningSignals.definitions), 'Definition signals should be present')
  assert.ok(Array.isArray(learningSignals.examples), 'Example signals should be present')
  assert.ok(learningSignals.density.concepts >= 1, 'Concept density should be counted')

  const routingText = buildAssessmentSourceText({
    sourceFile: 'sample.pdf',
    assessmentBlocks,
  })
  assert.ok(routingText.includes('SOURCE ROUTING'), 'Assessment routing text should include a routing header')
  assert.ok(routingText.includes('test/quiz'), 'Assessment routing text should mention test/quiz routing')

  console.log('source-intelligence unit checks passed.')
}

main()

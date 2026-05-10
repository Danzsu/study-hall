#!/usr/bin/env node

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const SUBJECT_SLUG = 'it_biztonsag'
const SUBJECT_DIR = path.join(ROOT, 'content', SUBJECT_SLUG)

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function requirePlainObject(value, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be a plain object`)
}

function requireArray(value, label, minLength = 0) {
  assert.ok(Array.isArray(value), `${label} must be an array`)
  assert.ok(value.length >= minLength, `${label} should contain at least ${minLength} item(s)`)
}

function checkPlanContract(plan) {
  requirePlainObject(plan, 'Plan')
  assert.equal(plan.version, 1, 'Plan version should stay stable')
  assert.equal(plan.subject.slug, SUBJECT_SLUG, 'Plan subject should match the test subject')
  assert.equal(plan.status, 'ready', 'Plan should be ready for generated content')

  requireArray(plan.lessonSources, 'Plan lessonSources', 1)
  requireArray(plan.testSources, 'Plan testSources', 1)
  requireArray(plan.concepts, 'Plan structured concepts', 1)
  requireArray(plan.objectives, 'Plan structured objectives', 1)
  requireArray(plan.coverageMatrix, 'Plan coverage matrix', 1)
  requirePlainObject(plan.extractionQuality, 'Plan extractionQuality')
  requirePlainObject(plan.llm, 'Plan llm metadata')

  const conceptIds = new Set(plan.concepts.map((concept) => concept.id))
  for (const concept of plan.concepts.slice(0, 10)) {
    assert.ok(/^concept-/.test(concept.id), `Concept id should be stable: ${concept.id}`)
    assert.equal(typeof concept.label, 'string', 'Concept label must be a string')
    assert.ok(concept.label.length > 0, 'Concept label must not be empty')
    requireArray(concept.sourceIds, `Concept ${concept.id} sourceIds`)
  }

  for (const objective of plan.objectives.slice(0, 10)) {
    assert.ok(/^objective-/.test(objective.id), `Objective id should be stable: ${objective.id}`)
    assert.equal(typeof objective.description, 'string', 'Objective description must be a string')
    requireArray(objective.sourceIds, `Objective ${objective.id} sourceIds`)
    requireArray(objective.conceptIds, `Objective ${objective.id} conceptIds`)
    assert.ok(objective.conceptIds.every((id) => conceptIds.has(id)), `Objective ${objective.id} should reference known concepts`)
  }

  for (const row of plan.coverageMatrix) {
    assert.ok(conceptIds.has(row.conceptId), `Coverage row references unknown concept: ${row.conceptId}`)
    assert.equal(row.notes, true, 'Coverage row should require notes coverage')
    assert.equal(typeof row.quizTarget, 'number', 'Coverage row quizTarget must be numeric')
    assert.equal(typeof row.flashcardTarget, 'number', 'Coverage row flashcardTarget must be numeric')
  }

  assert.ok(plan.extractionQuality.readableSources >= 1, 'Extraction quality should count readable sources')
  assert.ok(plan.extractionQuality.totalSources >= plan.extractionQuality.readableSources, 'Readable sources cannot exceed total sources')
  assert.ok(plan.extractionQuality.totals.textChars > 1000, 'Plan should capture meaningful extracted text')
  assert.ok(plan.extractionQuality.totals.visualReferences >= 1, 'Plan should preserve visual reference counts')
  assert.ok(plan.extractionQuality.totals.routedAssessmentBlocks >= 1, 'Plan should preserve routed assessment block counts')
}

function checkSourceManifests(plan) {
  const sources = [...plan.lessonSources, ...plan.testSources]
    .filter((source) => source.sourceManifest)
    .slice(0, 8)
  requireArray(sources, 'Sources with manifests', 1)

  for (const source of sources) {
    const manifestPath = path.join(SUBJECT_DIR, source.sourceManifest)
    assert.ok(fs.existsSync(manifestPath), `Source manifest must exist: ${source.sourceManifest}`)
    const manifest = readJSON(manifestPath)
    requirePlainObject(manifest, `Manifest ${source.sourceManifest}`)
    assert.equal(manifest.subjectSlug, SUBJECT_SLUG, 'Manifest subjectSlug should match')
    assert.equal(manifest.sourceFile, source.fileName, 'Manifest sourceFile should match plan source')
    requireArray(manifest.assessmentBlocks, 'Manifest assessmentBlocks')
    requireArray(manifest.visualReferences, 'Manifest visualReferences')
    requireArray(manifest.extractedAssets, 'Manifest extractedAssets')
    requirePlainObject(manifest.learningSignals, 'Manifest learningSignals')
  }
}

function checkQualityReport(report) {
  requirePlainObject(report, 'Quality report')
  assert.equal(report.subject.slug, SUBJECT_SLUG, 'Quality report subject should match')
  assert.ok(['pass', 'warn'].includes(report.status), 'Quality report should not be failing')
  assert.ok(report.score >= 80, 'Quality report score should be deploy-friendly')
  requireArray(report.checks, 'Quality report checks', 1)

  const checkNames = new Set(report.checks.map((check) => check.name))
  for (const name of ['structured_plan_contract', 'question_concept_coverage', 'plan_artifact']) {
    assert.ok(checkNames.has(name), `Quality report should include ${name}`)
  }
}

function main() {
  const plan = readJSON(path.join(SUBJECT_DIR, 'plan.json'))
  const report = readJSON(path.join(SUBJECT_DIR, 'quality-report.json'))

  checkPlanContract(plan)
  checkSourceManifests(plan)
  checkQualityReport(report)

  console.log([
    'Whitebox plan contract passed.',
    `subject: ${SUBJECT_SLUG}`,
    `concepts: ${plan.concepts.length}`,
    `coverage rows: ${plan.coverageMatrix.length}`,
    `manifests checked: ${[...plan.lessonSources, ...plan.testSources].filter((source) => source.sourceManifest).slice(0, 8).length}`,
  ].join('\n'))
}

main()

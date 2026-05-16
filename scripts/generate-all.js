#!/usr/bin/env node
/**
 * Run every content generation step for a subject.
 *
 * Usage: node scripts/generate-all.js <subject-slug> [--python]
 *   --python  Spawn the Python orchestrator pipeline instead of the Node.js pipeline
 */

const { execSync } = require('node:child_process')
require('./load-env')
const { getProviderBudgetSnapshot } = require('./llm-rate-limit')

const PYTHON_FLAG = process.argv.includes('--python')

const subjectSlug = process.argv.find((a, i) => i >= 2 && !a.startsWith('--'))

if (!subjectSlug) {
  console.error('Usage: node scripts/generate-all.js <subject-slug> [--python]')
  console.error('Example: node scripts/generate-all.js it_biztonsag')
  process.exit(1)
}

const scripts = [
  { name: 'Build content plan', script: 'build-content-plan.js' },
  { name: 'Generate notes', script: 'generate-notes.js' },
  { name: 'Generate questions', script: 'generate-questions.js' },
  { name: 'Generate flashcards and glossary', script: 'generate-extras.js' },
  { name: 'Generate diagrams', script: 'generate-diagrams.js', optional: true },
  { name: 'Normalize content schema', script: 'normalize-content.js' },
  { name: 'Validate content quality', script: 'validate-content.js' },
]

// ── Python pipeline ───────────────────────────────────────────────────────────

async function runPythonPipeline(slug) {
  const { spawn } = require('node:child_process')
  const path = require('node:path')
  const fs = require('node:fs')

  // Locate input file: look for any PDF/DOCX/PPTX in storage/subjects/{slug}/sources/
  const sourcesDir = path.join(process.cwd(), 'storage', 'subjects', slug, 'sources')
  let inputFile = ''
  if (fs.existsSync(sourcesDir)) {
    const supported = new Set(['.pdf', '.docx', '.pptx', '.ppt', '.txt', '.md'])
    const found = fs.readdirSync(sourcesDir).find(f =>
      supported.has(path.extname(f).toLowerCase())
    )
    if (found) inputFile = path.join(sourcesDir, found)
  }

  if (!inputFile) {
    console.error(`No source file found in ${sourcesDir}`)
    console.error('Place a PDF/DOCX/PPTX file there before running with --python')
    process.exit(1)
  }

  const jobId = Date.now().toString(36)
  const pythonArgs = [
    '-m', 'pipeline.orchestrator',
    '--subject', slug,
    '--input', inputFile,
    '--job-id', jobId,
  ]

  console.log(`Spawning Python pipeline: python ${pythonArgs.join(' ')}\n`)

  return new Promise((resolve, reject) => {
    const proc = spawn('python', pythonArgs, { stdio: 'inherit', cwd: process.cwd() })
    proc.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`Python pipeline exited with code ${code}`))
    )
    proc.on('error', err => reject(new Error(`Failed to start Python pipeline: ${err.message}`)))
  })
}

// ── Main dispatch ─────────────────────────────────────────────────────────────

if (PYTHON_FLAG) {
  runPythonPipeline(subjectSlug).catch(err => {
    console.error(err.message)
    process.exit(1)
  })
} else {
  runNodePipeline()
}

function runNodePipeline() {

console.log(`Generating full content package for ${subjectSlug}...\n`)
console.log('='.repeat(50))
console.log('LLM budget snapshot:')
console.log(JSON.stringify(getProviderBudgetSnapshot(), null, 2))

let successCount = 0
let skipCount = 0

for (const { name, script, optional } of scripts) {
  console.log(`\n${name}`)
  console.log('-'.repeat(40))

  try {
    const cmd = `node scripts/${script} ${subjectSlug}`
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() })
    successCount++
    console.log(`${name} finished.`)
  } catch (err) {
    if (optional) {
      console.log(`${name} skipped (optional): ${err.message}`)
      skipCount++
    } else {
      console.error(`${name} failed.`)
      console.error('\nRun this step again after fixing the issue:')
      console.error(`  node scripts/${script} ${subjectSlug}`)
      process.exit(1)
    }
  }
}

console.log('\n' + '='.repeat(50))
console.log('\nGeneration finished.')
console.log(`  Successful: ${successCount}`)
if (skipCount > 0) console.log(`  Skipped: ${skipCount}`)

console.log(`\nContent location: content/${subjectSlug}/`)
console.log('\nNext steps:')
console.log('  git add .')
console.log(`  git commit -m "Add ${subjectSlug} content"`)
console.log('  git push')
}

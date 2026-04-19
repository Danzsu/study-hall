#!/usr/bin/env node
/**
 * Run every content generation step for a subject.
 *
 * Usage: node scripts/generate-all.js <subject-slug>
 */

const { execSync } = require('child_process')
require('./load-env')
const { getProviderBudgetSnapshot } = require('./llm-rate-limit')

const subjectSlug = process.argv[2]

if (!subjectSlug) {
  console.error('Usage: node scripts/generate-all.js <subject-slug>')
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
      console.log(`${name} skipped (optional).`)
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

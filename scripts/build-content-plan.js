#!/usr/bin/env node

require('./load-env')
const { buildContentPlan, loadContentPlanSummary, planPath } = require('./content-plan')

async function main() {
  const subjectSlug = process.argv[2]
  if (!subjectSlug) {
    console.error('Usage: node scripts/build-content-plan.js <subject-slug>')
    process.exit(1)
  }

  const plan = await buildContentPlan(subjectSlug, { write: true })
  console.log(`Built content plan: ${planPath(subjectSlug)}`)
  console.log('')
  console.log(loadContentPlanSummary(subjectSlug))
}

main().catch((err) => {
  console.error('Content plan build failed:', err.message)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})

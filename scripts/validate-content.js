#!/usr/bin/env node

require('./load-env')
const { validateContent, writeReport, reportPath, renderReportMarkdown } = require('./content-plan')

async function main() {
  const subjectSlug = process.argv[2]
  if (!subjectSlug) {
    console.error('Usage: node scripts/validate-content.js <subject-slug>')
    process.exit(1)
  }

  const report = validateContent(subjectSlug)
  writeReport(subjectSlug, report)

  console.log(`Validation report written to: ${reportPath(subjectSlug)}`)
  console.log(`Status: ${report.status} | Score: ${report.score}/100`)

  if (process.env.DEBUG_REPORT === '1') {
    console.log('')
    console.log(renderReportMarkdown(report))
  }
}

main().catch((err) => {
  console.error('Content validation failed:', err.message)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})

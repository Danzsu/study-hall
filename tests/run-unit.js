#!/usr/bin/env node

const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const unitDir = path.join(__dirname, 'unit')

function listUnitTests() {
  if (!fs.existsSync(unitDir)) return []
  return fs.readdirSync(unitDir)
    .filter((file) => file.endsWith('.test.js'))
    .sort()
    .map((file) => path.join(unitDir, file))
}

function main() {
  const tests = listUnitTests()
  if (!tests.length) {
    console.error('No unit tests found in tests/unit.')
    process.exit(1)
  }

  const failures = []
  for (const testPath of tests) {
    const label = path.relative(process.cwd(), testPath)
    const result = spawnSync(process.execPath, [testPath], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        LLM_DISABLE_RATE_LIMIT: '1',
      },
    })

    if (result.status !== 0) {
      failures.push(`${label} exited with ${result.status}`)
    }
  }

  if (failures.length) {
    console.error('Unit test failures:')
    for (const failure of failures) console.error(`- ${failure}`)
    process.exit(1)
  }

  console.log(`Unit test suite passed (${tests.length} files).`)
}

main()

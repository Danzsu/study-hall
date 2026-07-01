#!/usr/bin/env node
'use strict'

const { fetchJson, parseArgs } = require('./blackbox-helpers')

// All upload routes must reject unauthenticated requests with HTTP 401
const UPLOAD_ROUTES = [
  { method: 'GET',  path: '/api/upload/check-auth' },
  { method: 'POST', path: '/api/upload/extract' },
  { method: 'POST', path: '/api/upload/extract-facts' },
  { method: 'POST', path: '/api/upload/generate-notes' },
  { method: 'POST', path: '/api/upload/generate-quiz' },
  { method: 'POST', path: '/api/upload/generate-image' },
  { method: 'POST', path: '/api/upload/save-subject' },
  { method: 'POST', path: '/api/upload/save-notes' },
  { method: 'POST', path: '/api/upload/generate-pipeline' },
]

async function main() {
  const { baseUrl } = parseArgs(process.argv.slice(2))
  const failures = []

  // ── Upload auth guard: no token → 401 ────────────────────────────────────────
  for (const { method, path } of UPLOAD_ROUTES) {
    const res = await fetchJson(`${baseUrl}${path}`, { method })
    if (res.status !== 401) {
      failures.push(`${method} ${path}: expected 401, got ${res.status}`)
      continue
    }
    if (!res.body || typeof res.body !== 'object' || typeof res.body.error !== 'string') {
      failures.push(`${method} ${path}: 401 response must include { error: string }, got ${JSON.stringify(res.body)}`)
    }
  }

  // ── Jobs API: invalid ID pattern → 400 ───────────────────────────────────────
  const invalidId = await fetchJson(`${baseUrl}/api/jobs/invalid!id`)
  if (invalidId.status !== 400) {
    failures.push(`/api/jobs/invalid!id: expected 400, got ${invalidId.status}`)
  } else if (!invalidId.body || typeof invalidId.body.error !== 'string') {
    failures.push('/api/jobs/invalid!id: 400 response must include { error: string }')
  }

  // ── Jobs API: valid ID pattern but nonexistent → 404 ────────────────────────
  const missingJob = await fetchJson(`${baseUrl}/api/jobs/nonexistent-job-id-xyz`)
  if (missingJob.status !== 404) {
    failures.push(`/api/jobs/nonexistent-job-id-xyz: expected 404, got ${missingJob.status}`)
  } else if (!missingJob.body || typeof missingJob.body.error !== 'string') {
    failures.push('/api/jobs/nonexistent-job-id-xyz: 404 response must include { error: string }')
  }

  if (failures.length) {
    throw new Error(failures.map((f) => `  ${f}`).join('\n'))
  }

  console.log([
    'Upload auth blackbox passed.',
    `baseUrl: ${baseUrl}`,
    `Upload routes tested: ${UPLOAD_ROUTES.length} (all require Authorization header)`,
    'Jobs edge cases: invalid ID pattern → 400, nonexistent ID → 404',
  ].join('\n'))
}

main().catch((err) => {
  console.error(`Upload auth blackbox failed:\n${err.message}`)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})

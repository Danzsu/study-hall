#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const DEFAULT_BASE_URL = 'http://127.0.0.1:3000'
const SUBJECT_SLUG = 'it_biztonsag'
const SUBJECT_GLOSSARY_PATH = path.join(ROOT, 'content', SUBJECT_SLUG, 'glossary.json')
const SUBJECT_LESSONS_PATH = path.join(ROOT, 'content', SUBJECT_SLUG, 'notes', 'lessons.json')

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.BACKEND_BASE_URL || DEFAULT_BASE_URL,
  }

  for (let i = 0; i < argv.length; i++) {
    const value = argv[i]
    if (value === '--base-url' && argv[i + 1]) {
      args.baseUrl = argv[++i]
      continue
    }
  }

  return args
}

function normalizeBaseUrl(value) {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed.replace(/\/+$/, '') : DEFAULT_BASE_URL
}

function readJSON(filePath, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function pickSearchProbe() {
  const glossary = readJSON(SUBJECT_GLOSSARY_PATH, [])
  for (const entry of glossary) {
    const terms = [entry.term, ...(Array.isArray(entry.aliases) ? entry.aliases : [])]
    for (const term of terms) {
      const value = String(term || '').trim()
      if (value.length >= 2) return value
    }
  }
  return 'IT'
}

function pickNoteSlug() {
  const lessons = readJSON(SUBJECT_LESSONS_PATH, [])
  const lesson = lessons.find((item) => item && typeof item.slug === 'string' && item.slug.trim())
  return lesson?.slug || '01-00-introitsec-bme-2026-hu'
}

async function fetchJson(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    })

    const text = await res.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }

    return { ok: res.ok, status: res.status, body, text }
  } finally {
    clearTimeout(timer)
  }
}

async function fetchText(url, timeoutMs = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    const text = await res.text()
    return { ok: res.ok, status: res.status, text }
  } finally {
    clearTimeout(timer)
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertSearchResults(results) {
  assert(Array.isArray(results), 'Search response must be an array')
  assert(results.length > 0, 'Search response should not be empty for the smoke probe')

  const requiredKeys = ['type', 'subject', 'slug', 'title', 'snippet', 'url']
  for (const item of results) {
    assert(item && typeof item === 'object' && !Array.isArray(item), 'Search results must contain objects')
    for (const key of requiredKeys) {
      assert(typeof item[key] === 'string', `Search result is missing string field: ${key}`)
    }
  }

  assert(results.every((item) => item.subject === SUBJECT_SLUG), 'Search response should only include the requested subject')
}

function assertNoteResponse(body) {
  assert(body && typeof body === 'object' && !Array.isArray(body), 'Note response must be an object')
  assert(typeof body.content === 'string', 'Note response must expose string content')
  assert(body.frontmatter && typeof body.frontmatter === 'object' && !Array.isArray(body.frontmatter), 'Note response must include a frontmatter object')
  assert(Array.isArray(body.activeRecall), 'Note response must include activeRecall array')
  assert(Array.isArray(body.sources), 'Note response must include sources array')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const baseUrl = normalizeBaseUrl(args.baseUrl)
  const probe = pickSearchProbe()
  const noteSlug = pickNoteSlug()
  const failures = []
  const pageRoutes = [
    '/',
    `/subject/${SUBJECT_SLUG}`,
    `/study/${SUBJECT_SLUG}`,
    `/search/${SUBJECT_SLUG}`,
    '/onboarding',
    `/glossary/${SUBJECT_SLUG}`,
  ]

  const health = await fetchJson(`${baseUrl}/api/health`)
  if (!health.ok) {
    failures.push(`/api/health returned ${health.status}`)
  } else if (!health.body || typeof health.body !== 'object') {
    failures.push('/api/health did not return a JSON object')
  } else {
    if (health.body.status !== 'ok') failures.push('/api/health did not report status=ok')
    if (typeof health.body.subjects !== 'number' || health.body.subjects < 1) {
      failures.push('/api/health returned an invalid subjects count')
    }
  }

  const search = await fetchJson(
    `${baseUrl}/api/search?q=${encodeURIComponent(probe)}&subject=${encodeURIComponent(SUBJECT_SLUG)}&type=glossary`,
  )
  if (!search.ok) {
    failures.push(`/api/search returned ${search.status}`)
  } else {
    try {
      assertSearchResults(search.body)
    } catch (err) {
      failures.push(err.message)
    }
  }

  const invalidWritten = await fetchJson(`${baseUrl}/api/validate-answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  if (invalidWritten.status !== 400) {
    failures.push(`/api/validate-answer did not reject an empty payload; got ${invalidWritten.status}`)
  } else if (!invalidWritten.body || typeof invalidWritten.body !== 'object' || typeof invalidWritten.body.error !== 'string') {
    failures.push('/api/validate-answer guard response should include a JSON error message')
  }

  const note = await fetchJson(`${baseUrl}/api/notes/${encodeURIComponent(SUBJECT_SLUG)}/${encodeURIComponent(noteSlug)}`)
  if (!note.ok) {
    failures.push(`/api/notes/${SUBJECT_SLUG}/${noteSlug} returned ${note.status}`)
  } else {
    try {
      assertNoteResponse(note.body)
    } catch (err) {
      failures.push(err.message)
    }
  }

  for (const route of pageRoutes) {
    const page = await fetchText(`${baseUrl}${route}`)
    if (!page.ok) {
      failures.push(`${route} returned ${page.status}`)
    } else if (!page.text.includes('<html')) {
      failures.push(`${route} did not return an HTML document`)
    }
  }

  if (failures.length) {
    throw new Error(failures.join('; '))
  }

  console.log([
    'Blackbox smoke passed.',
    `baseUrl: ${baseUrl}`,
    `probe: ${probe}`,
    `routes: /api/health, /api/search, /api/validate-answer, /api/notes/${SUBJECT_SLUG}/${noteSlug}, ${pageRoutes.join(', ')}`,
  ].join('\n'))
}

main().catch((err) => {
  console.error(`Blackbox smoke failed: ${err.message}`)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})

#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const DEFAULT_BASE_URL = 'http://127.0.0.1:3000'
const SUBJECT_SLUG = 'it_biztonsag'

function parseArgs(argv) {
  const args = { baseUrl: process.env.BACKEND_BASE_URL || DEFAULT_BASE_URL }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base-url' && argv[i + 1]) args.baseUrl = argv[++i]
  }
  args.baseUrl = String(args.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '')
  return args
}

function readJSON(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function fetchJson(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    })
    const text = await response.text()
    let body
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }
    return { ok: response.ok, status: response.status, body, text }
  } finally {
    clearTimeout(timer)
  }
}

function pickLessonSlug() {
  const lessons = readJSON(path.join(ROOT, 'content', SUBJECT_SLUG, 'notes', 'lessons.json'), [])
  return lessons.find((lesson) => lesson?.slug)?.slug || '01-00-introitsec-bme-2026-hu'
}

function requireObject(value, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`)
}

function requireArray(value, label, minLength = 0) {
  assert(Array.isArray(value), `${label} must be an array`)
  assert(value.length >= minLength, `${label} should contain at least ${minLength} item(s)`)
}

function requireString(value, label) {
  assert(typeof value === 'string' && value.trim().length > 0, `${label} must be a non-empty string`)
}

async function checkHealth(baseUrl) {
  const response = await fetchJson(`${baseUrl}/api/health`)
  assert(response.status === 200, `/api/health should return 200, got ${response.status}`)
  requireObject(response.body, 'Health response')
  assert(response.body.status === 'ok', 'Health status should be ok')
  assert(typeof response.body.subjects === 'number' && response.body.subjects >= 1, 'Health subjects count should be numeric')
}

async function checkSubjects(baseUrl) {
  const subjects = await fetchJson(`${baseUrl}/api/subjects`)
  assert(subjects.status === 200, `/api/subjects should return 200, got ${subjects.status}`)
  requireArray(subjects.body, 'Subjects response', 1)
  const subject = subjects.body.find((item) => item.slug === SUBJECT_SLUG || item.id === SUBJECT_SLUG)
  requireObject(subject, 'IT security subject')
  requireString(subject.name, 'Subject name')

  const detail = await fetchJson(`${baseUrl}/api/subjects/${SUBJECT_SLUG}`)
  assert(detail.status === 200, `/api/subjects/${SUBJECT_SLUG} should return 200, got ${detail.status}`)
  requireObject(detail.body, 'Subject detail')
  assert(detail.body.slug === SUBJECT_SLUG, 'Subject detail slug should match')
}

async function checkContentEndpoints(baseUrl) {
  const endpointExpectations = [
    ['/api/questions', 'questions'],
    ['/api/flashcards', 'flashcards'],
    ['/api/glossary', 'glossary'],
    ['/api/notes', 'notes'],
  ]

  for (const [prefix, label] of endpointExpectations) {
    const response = await fetchJson(`${baseUrl}${prefix}/${SUBJECT_SLUG}`)
    assert(response.status === 200, `${prefix}/${SUBJECT_SLUG} should return 200, got ${response.status}`)
    requireArray(response.body, `${label} response`, 1)
  }

  const lessonSlug = pickLessonSlug()
  const note = await fetchJson(`${baseUrl}/api/notes/${SUBJECT_SLUG}/${lessonSlug}`)
  assert(note.status === 200, `/api/notes/${SUBJECT_SLUG}/${lessonSlug} should return 200, got ${note.status}`)
  requireObject(note.body, 'Note detail')
  requireString(note.body.content, 'Note content')
  requireObject(note.body.frontmatter, 'Note frontmatter')
  requireArray(note.body.activeRecall, 'Note activeRecall')
}

async function checkSearch(baseUrl) {
  const positive = await fetchJson(`${baseUrl}/api/search?q=IT&subject=${SUBJECT_SLUG}`)
  assert(positive.status === 200, `/api/search positive should return 200, got ${positive.status}`)
  requireArray(positive.body, 'Positive search results', 1)
  assert(positive.body.every((item) => item.subject === SUBJECT_SLUG), 'Search should respect subject filter')

  const short = await fetchJson(`${baseUrl}/api/search?q=x&subject=${SUBJECT_SLUG}`)
  assert(short.status === 400, `/api/search short query should return 400, got ${short.status}`)
  requireObject(short.body, 'Short query error')
  requireString(short.body.error, 'Short query error message')
}

async function checkValidateAnswer(baseUrl) {
  const empty = await fetchJson(`${baseUrl}/api/validate-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  assert(empty.status === 400, `/api/validate-answer empty payload should return 400, got ${empty.status}`)
  requireString(empty.body?.error, 'Empty payload error')

  const oversized = await fetchJson(`${baseUrl}/api/validate-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'Mi az IT biztonsag?',
      student_answer: 'a'.repeat(13000),
    }),
  })
  assert(oversized.status === 413, `/api/validate-answer oversized payload should return 413, got ${oversized.status}`)

  const valid = await fetchJson(`${baseUrl}/api/validate-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'Mi a CIA triad lenyege?',
      student_answer: 'A bizalmassag, sertetlenseg es rendelkezesre allas vedelme.',
      model_answer: 'A CIA triad a bizalmassag, sertetlenseg es rendelkezesre allas harmasa.',
      key_points: ['bizalmassag', 'sertetlenseg', 'rendelkezesre allas'],
      rubric: {
        must_have: ['bizalmassag', 'sertetlenseg', 'rendelkezesre allas'],
        nice_to_have: ['biztonsagi celok'],
      },
    }),
  }, 30000)
  assert(valid.status === 200, `/api/validate-answer valid payload should return 200, got ${valid.status}`)
  requireObject(valid.body, 'Validate-answer response')
  assert(typeof valid.body.score_pct === 'number', 'Validate-answer score_pct should be numeric')
  assert(valid.body.score_pct >= 0 && valid.body.score_pct <= 100, 'Validate-answer score should be clamped to 0-100')
  requireString(valid.body.provider, 'Validate-answer provider')
  requireArray(valid.body.what_was_correct, 'Validate-answer what_was_correct')
  requireArray(valid.body.what_was_missing, 'Validate-answer what_was_missing')
}

async function main() {
  const { baseUrl } = parseArgs(process.argv.slice(2))
  await checkHealth(baseUrl)
  await checkSubjects(baseUrl)
  await checkContentEndpoints(baseUrl)
  await checkSearch(baseUrl)
  await checkValidateAnswer(baseUrl)

  console.log([
    'Blackbox API contract passed.',
    `baseUrl: ${baseUrl}`,
    `subject: ${SUBJECT_SLUG}`,
  ].join('\n'))
}

main().catch((error) => {
  console.error(`Blackbox API contract failed: ${error.message}`)
  if (process.env.DEBUG) console.error(error.stack)
  process.exit(1)
})

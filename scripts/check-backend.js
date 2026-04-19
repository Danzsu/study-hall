#!/usr/bin/env node

require('./load-env')

const { inspectGeneratedContent, validateContent } = require('./content-plan')
const { readJSON } = require('./content-utils')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SUBJECTS_PATH = path.join(ROOT, 'content', 'subjects.json')

function parseArgs(argv) {
  const args = { baseUrl: process.env.BACKEND_BASE_URL || '' }

  for (let i = 0; i < argv.length; i++) {
    const value = argv[i]
    if (value === '--base-url' && argv[i + 1]) {
      args.baseUrl = argv[++i]
      continue
    }
    if (value === '--subject' && argv[i + 1]) {
      args.subject = argv[++i]
      continue
    }
    if (value === '--help' || value === '-h') {
      args.help = true
      continue
    }
  }

  return args
}

function normalizeBaseUrl(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  return trimmed.replace(/\/+$/, '')
}

function pickProbe(generated) {
  const question = generated.questions.find((item) => String(item.question || item.q || '').trim())
  const glossary = generated.glossary.find((item) => String(item.term || '').trim())
  const lesson = generated.lessons.find((item) => String(item.title || '').trim())

  return String(
    glossary?.term ||
    question?.question ||
    lesson?.title ||
    '',
  ).trim()
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function validateSearchResults(results, subjectSlug) {
  if (!Array.isArray(results) || !results.length) {
    return `Search check returned no results for ${subjectSlug}`
  }

  const malformed = results.find((item) => {
    return !isPlainObject(item) ||
      typeof item.type !== 'string' ||
      typeof item.subject !== 'string' ||
      typeof item.title !== 'string' ||
      typeof item.url !== 'string'
  })

  if (malformed) {
    return `Search check returned malformed result for ${subjectSlug}`
  }

  const wrongSubject = results.find((item) => item.subject !== subjectSlug)
  if (wrongSubject) {
    return `Search check returned result outside ${subjectSlug}`
  }

  return null
}

function validateWrittenAnswerResponse(body) {
  if (!isPlainObject(body)) return 'Written-answer check returned a non-object response'
  if (typeof body.provider !== 'string') return 'Written-answer check is missing provider'
  if (typeof body.score_pct !== 'number' || Number.isNaN(body.score_pct) || body.score_pct < 0 || body.score_pct > 100) {
    return 'Written-answer check returned an invalid score_pct'
  }
  if (typeof body.feedback_text !== 'string') return 'Written-answer check is missing feedback_text'
  if (!Array.isArray(body.what_was_correct) || !Array.isArray(body.what_was_missing)) {
    return 'Written-answer check returned an invalid feedback array'
  }
  if (typeof body.model_answer !== 'string') return 'Written-answer check is missing model_answer'
  if (body.rubric !== null && !isPlainObject(body.rubric)) return 'Written-answer check returned an invalid rubric'
  if (!Array.isArray(body.provider_errors)) return 'Written-answer check returned an invalid provider_errors array'

  return null
}

async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    const text = await res.text()
    let body = null

    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }

    return { ok: res.ok, status: res.status, body }
  } finally {
    clearTimeout(timer)
  }
}

async function postJson(url, body, timeoutMs = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let parsed = null

    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = text
    }

    return { ok: res.ok, status: res.status, body: parsed }
  } finally {
    clearTimeout(timer)
  }
}

function printHelp() {
  console.log([
    'Usage: node scripts/check-backend.js [--base-url http://127.0.0.1:3000] [--subject <slug>]',
    '',
    'Checks generated content locally and, when a base URL is provided, probes /api/health, /api/search, and /api/validate-answer.',
    'You can also set BACKEND_BASE_URL instead of passing --base-url.',
  ].join('\n'))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const baseUrl = normalizeBaseUrl(args.baseUrl)
  const subjects = readJSON(SUBJECTS_PATH, [])
  if (!fs.existsSync(SUBJECTS_PATH) || !subjects.length) {
    throw new Error('No subjects found in content/subjects.json')
  }

  const targets = args.subject
    ? subjects.filter((subject) => subject.slug === args.subject)
    : subjects

  if (!targets.length) {
    throw new Error(`Unknown subject slug: ${args.subject}`)
  }

  const failures = []
  const summaries = []

  for (const subject of targets) {
    const report = validateContent(subject.slug)
    const generated = inspectGeneratedContent(subject.slug)
    const probe = pickProbe(generated)

    summaries.push({
      slug: subject.slug,
      status: report.status,
      score: report.score,
      notes: report.content.notes,
      questions: report.content.questions,
      flashcards: report.content.flashcards,
      glossary: report.content.glossary,
      probe: probe || '(no probe term found)',
    })

    if (report.status === 'fail') {
      failures.push(`Content validation failed for ${subject.slug}: score ${report.score}/100`)
    }

    if (!generated.notes || !generated.questions.length || !generated.flashcards.length || !generated.glossary.length) {
      failures.push(`Missing generated content for ${subject.slug}`)
    }

    if (!probe) {
      failures.push(`No search probe term found for ${subject.slug}`)
    }
  }

  if (baseUrl) {
    const health = await fetchJson(`${baseUrl}/api/health`)
    if (!health.ok || !isPlainObject(health.body) || health.body.status !== 'ok') {
      failures.push(`Health check failed at ${baseUrl}/api/health`)
    } else if (typeof health.body.subjects !== 'number' || health.body.subjects < 1) {
      failures.push(`Health check returned an invalid subject count at ${baseUrl}/api/health`)
    }

    const invalidWritten = await postJson(`${baseUrl}/api/validate-answer`, {})
    if (invalidWritten.status !== 400) {
      failures.push(`Written-answer guard did not reject an empty payload at ${baseUrl}/api/validate-answer`)
    }

    const firstTarget = targets[0]
    const generated = inspectGeneratedContent(firstTarget.slug)
    const probe = pickProbe(generated)

    if (probe) {
      const search = await fetchJson(`${baseUrl}/api/search?q=${encodeURIComponent(probe)}&subject=${encodeURIComponent(firstTarget.slug)}`)
      if (!search.ok) {
        failures.push(`Search check failed for ${firstTarget.slug} at ${baseUrl}/api/search`)
      } else {
        const searchError = validateSearchResults(search.body, firstTarget.slug)
        if (searchError) {
          failures.push(`${searchError} at ${baseUrl}/api/search`)
        }
      }

      const written = await postJson(`${baseUrl}/api/validate-answer`, {
        question: `What is ${probe}?`,
        model_answer: `${probe} is a placeholder model answer for smoke testing.`,
        key_points: [probe],
        user_answer: `${probe} is a placeholder answer that mentions the key concept.`,
        rubric: {
          must_have: [probe],
          nice_to_have: ['Smoke test passes when the response shape is stable.'],
          common_mistakes: ['Missing the key concept.'],
          score_bands: {
            '0-39': 'The answer is too thin for a meaningful check.',
            '40-79': 'The answer is partially correct.',
            '80-100': 'The answer covers the expected concept.',
          },
        },
      })

      if (!written.ok) {
        failures.push(`Written-answer smoke call failed for ${firstTarget.slug} at ${baseUrl}/api/validate-answer`)
      } else {
        const writtenError = validateWrittenAnswerResponse(written.body)
        if (writtenError) {
          failures.push(`${writtenError} for ${firstTarget.slug} at ${baseUrl}/api/validate-answer`)
        }
      }
    } else {
      failures.push(`No search probe term found for ${firstTarget.slug} at ${baseUrl}/api/search`)
    }
  }

  for (const summary of summaries) {
    console.log(`- ${summary.slug}: ${summary.status} ${summary.score}/100 | notes ${summary.notes}, questions ${summary.questions}, flashcards ${summary.flashcards}, glossary ${summary.glossary}`)
    console.log(`  probe: ${summary.probe}`)
  }

  if (baseUrl) {
    console.log(`- remote checks: ${baseUrl}`)
  } else {
    console.log('- remote checks: skipped (pass --base-url or BACKEND_BASE_URL to probe live routes)')
  }

  if (failures.length) {
    throw new Error(failures.join('; '))
  }

  console.log('Backend smoke check passed.')
}

main().catch((err) => {
  console.error('Backend smoke check failed:', err.message)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})

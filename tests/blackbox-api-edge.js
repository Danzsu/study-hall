#!/usr/bin/env node
'use strict'

const { fetchJson, parseArgs } = require('./blackbox-helpers')

const SUBJECT_SLUG = 'it_biztonsag'

async function checkSearchEdgeCases(baseUrl, failures) {
  const shortQ = await fetchJson(`${baseUrl}/api/search?q=a`)
  if (shortQ.status !== 400) {
    failures.push(`/api/search?q=a: expected 400 (min 2 chars), got ${shortQ.status}`)
  }

  const emptyQ = await fetchJson(`${baseUrl}/api/search?q=`)
  if (emptyQ.status !== 400) {
    failures.push(`/api/search?q= (empty): expected 400, got ${emptyQ.status}`)
  }

  const typeFilter = await fetchJson(
    `${baseUrl}/api/search?q=IT&type=glossary&subject=${encodeURIComponent(SUBJECT_SLUG)}`,
  )
  if (!typeFilter.ok) {
    failures.push(`/api/search?type=glossary: returned ${typeFilter.status}`)
  } else if (!Array.isArray(typeFilter.body)) {
    failures.push('/api/search?type=glossary: response body should be an array')
  } else if (typeFilter.body.length > 0 && !typeFilter.body.every((r) => r.type === 'glossary')) {
    failures.push('/api/search?type=glossary: response contains non-glossary items')
  }

  const subjectSearch = await fetchJson(
    `${baseUrl}/api/search?q=biztonsag&subject=${encodeURIComponent(SUBJECT_SLUG)}`,
  )
  if (!subjectSearch.ok) {
    failures.push(`/api/search?subject=...: returned ${subjectSearch.status}`)
  } else if (!Array.isArray(subjectSearch.body)) {
    failures.push('/api/search?subject=...: response body should be an array')
  } else if (subjectSearch.body.length > 0 && !subjectSearch.body.every((r) => r.subject === SUBJECT_SLUG)) {
    failures.push('/api/search?subject=...: response contains results from other subjects')
  }
}

async function checkNonExistentSlugs(baseUrl, failures) {
  const noQ = await fetchJson(`${baseUrl}/api/questions/nonexistent-slug-xyz`)
  if (!noQ.ok || !Array.isArray(noQ.body) || noQ.body.length !== 0) {
    failures.push(`/api/questions/nonexistent-slug-xyz: expected 200 + [], got ${noQ.status} body=${JSON.stringify(noQ.body).slice(0, 80)}`)
  }

  const noF = await fetchJson(`${baseUrl}/api/flashcards/nonexistent-slug-xyz`)
  if (!noF.ok || !Array.isArray(noF.body) || noF.body.length !== 0) {
    failures.push(`/api/flashcards/nonexistent-slug-xyz: expected 200 + [], got ${noF.status}`)
  }

  const noG = await fetchJson(`${baseUrl}/api/glossary/nonexistent-slug-xyz`)
  if (!noG.ok || !Array.isArray(noG.body) || noG.body.length !== 0) {
    failures.push(`/api/glossary/nonexistent-slug-xyz: expected 200 + [], got ${noG.status}`)
  }

  const noLesson = await fetchJson(`${baseUrl}/api/notes/${SUBJECT_SLUG}/nonexistent-lesson-xyz`)
  if (noLesson.status !== 404) {
    failures.push(`/api/notes/${SUBJECT_SLUG}/nonexistent-lesson-xyz: expected 404, got ${noLesson.status}`)
  }
}

function checkValidateAnswerShape(r, failures) {
  if (typeof r.score_pct !== 'number' || r.score_pct < 0 || r.score_pct > 100) {
    failures.push(`validate-answer: score_pct should be 0–100, got ${r.score_pct}`)
  }
  if (!Array.isArray(r.what_was_correct)) {
    failures.push('validate-answer: what_was_correct should be an array')
  }
  if (!Array.isArray(r.what_was_missing)) {
    failures.push('validate-answer: what_was_missing should be an array')
  }
  if (typeof r.feedback_text !== 'string') {
    failures.push('validate-answer: feedback_text should be a string')
  }
  if (typeof r.model_answer !== 'string') {
    failures.push('validate-answer: model_answer should be a string')
  }
  if (r.score_pct < 40) {
    failures.push(`validate-answer: on-topic answer should score >= 40, got ${r.score_pct}`)
  }
}

async function checkValidateAnswer(baseUrl, failures) {
  // The local fallback guarantees a response even without any LLM API keys.
  const validPayload = {
    question: 'What is the principle of least privilege?',
    student_answer: 'Least privilege means minimum permissions and minimum access are granted, users get only what they need.',
    model_answer: 'The principle of least privilege states that users should have only the minimum access rights required.',
    key_points: ['minimum permissions', 'minimum access', 'least privilege'],
  }

  const validRes = await fetchJson(`${baseUrl}/api/validate-answer`, {
    method: 'POST',
    body: JSON.stringify(validPayload),
  }, 30000)

  if (validRes.ok) {
    checkValidateAnswerShape(validRes.body, failures)
  } else {
    failures.push(`/api/validate-answer valid request: expected 200, got ${validRes.status}`)
  }

  const emptyBody = await fetchJson(`${baseUrl}/api/validate-answer`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  if (emptyBody.status !== 400) {
    failures.push(`/api/validate-answer empty payload: expected 400, got ${emptyBody.status}`)
  }

  const noAnswer = await fetchJson(`${baseUrl}/api/validate-answer`, {
    method: 'POST',
    body: JSON.stringify({ question: 'What is access control?' }),
  })
  if (noAnswer.status !== 400) {
    failures.push(`/api/validate-answer missing student_answer: expected 400, got ${noAnswer.status}`)
  }

  const hugeAnswer = await fetchJson(`${baseUrl}/api/validate-answer`, {
    method: 'POST',
    body: JSON.stringify({
      question: 'What is access control?',
      student_answer: 'x'.repeat(13000),
    }),
  }, 30000)
  if (hugeAnswer.status !== 413) {
    failures.push(`/api/validate-answer 13 000-char student_answer: expected 413, got ${hugeAnswer.status}`)
  }

  const hugeQuestion = await fetchJson(`${baseUrl}/api/validate-answer`, {
    method: 'POST',
    body: JSON.stringify({
      question: 'q'.repeat(2100),
      student_answer: 'some answer',
    }),
  })
  if (hugeQuestion.status !== 413) {
    failures.push(`/api/validate-answer 2 100-char question: expected 413, got ${hugeQuestion.status}`)
  }
}

async function main() {
  const { baseUrl } = parseArgs(process.argv.slice(2))
  const failures = []

  await checkSearchEdgeCases(baseUrl, failures)
  await checkNonExistentSlugs(baseUrl, failures)
  await checkValidateAnswer(baseUrl, failures)

  if (failures.length) {
    throw new Error(failures.map((f) => `  ${f}`).join('\n'))
  }

  console.log([
    'API edge case blackbox passed.',
    `baseUrl: ${baseUrl}`,
    'Tests: search edge cases, non-existent slugs, validate-answer happy path + error cases',
  ].join('\n'))
}

main().catch((err) => {
  console.error(`API edge case blackbox failed:\n${err.message}`)
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
})

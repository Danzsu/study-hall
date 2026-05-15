export const maxDuration = 30

import { NextResponse } from 'next/server'

const OPENROUTER_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-a4b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
]
const REQUEST_TIMEOUT_MS = 25000
const MAX_REQUEST_BODY_CHARS = 24000
const MAX_FIELD_LENGTHS = {
  question: 2000,
  student_answer: 12000,
  model_answer: 8000,
  key_point: 400,
  rubric_text: 600,
}
const MAX_LIST_ITEMS = 8

function clampText(value, maxLength) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() : text
}

function normalizeTextArray(value, maxItems = MAX_LIST_ITEMS, maxLength = MAX_FIELD_LENGTHS.key_point) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => clampText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function normalizeRubric(rawRubric) {
  if (!rawRubric) return null

  let rubric = rawRubric
  if (typeof rawRubric === 'string') {
    try {
      rubric = JSON.parse(rawRubric)
    } catch {
      return null
    }
  }

  if (!rubric || typeof rubric !== 'object' || Array.isArray(rubric)) return null

  const normalized = {
    must_have: normalizeTextArray(rubric.must_have ?? rubric.mustHave, MAX_LIST_ITEMS, MAX_FIELD_LENGTHS.rubric_text),
    nice_to_have: normalizeTextArray(rubric.nice_to_have ?? rubric.niceToHave, MAX_LIST_ITEMS, MAX_FIELD_LENGTHS.rubric_text),
    common_mistakes: normalizeTextArray(rubric.common_mistakes ?? rubric.commonMistakes, MAX_LIST_ITEMS, MAX_FIELD_LENGTHS.rubric_text),
    score_bands: {},
  }

  const scoreBands = rubric.score_bands ?? rubric.scoreBands
  if (scoreBands && typeof scoreBands === 'object' && !Array.isArray(scoreBands)) {
    for (const [band, text] of Object.entries(scoreBands)) {
      const key = clampText(band, 32)
      const value = clampText(text, MAX_FIELD_LENGTHS.rubric_text)
      if (key && value) normalized.score_bands[key] = value
    }
  }

  if (!normalized.must_have.length && !normalized.nice_to_have.length && !normalized.common_mistakes.length && !Object.keys(normalized.score_bands).length) {
    return null
  }

  return normalized
}

function fieldTooLong(value, maxLength) {
  return String(value ?? '').trim().length > maxLength
}

function arrayTooLong(values, maxItems, maxLength) {
  if (!Array.isArray(values)) return false
  if (values.length > maxItems) return true
  return values.some((item) => fieldTooLong(item, maxLength))
}

function normalizeWrittenAnswerPayload(payload) {
  const rawBody = JSON.stringify(payload ?? {})
  if (rawBody.length > MAX_REQUEST_BODY_CHARS) {
    return { error: 'Payload too large', status: 413 }
  }

  const question = payload?.question
  const studentAnswer = payload?.student_answer ?? payload?.user_answer
  const modelAnswer = payload?.model_answer
  const keyPoints = payload?.key_points ?? payload?.keyPoints ?? payload?.keypoints ?? []
  const rubric = payload?.rubric

  if (!String(question ?? '').trim() || !String(studentAnswer ?? '').trim()) {
    return { error: 'question and student_answer required', status: 400 }
  }

  if (fieldTooLong(question, MAX_FIELD_LENGTHS.question)) {
    return { error: 'question is too long', status: 413 }
  }
  if (fieldTooLong(studentAnswer, MAX_FIELD_LENGTHS.student_answer)) {
    return { error: 'student_answer is too long', status: 413 }
  }
  if (modelAnswer != null && fieldTooLong(modelAnswer, MAX_FIELD_LENGTHS.model_answer)) {
    return { error: 'model_answer is too long', status: 413 }
  }
  if (arrayTooLong(keyPoints, MAX_LIST_ITEMS, MAX_FIELD_LENGTHS.key_point)) {
    return { error: 'key_points is too long', status: 413 }
  }
  if (rubric && typeof rubric === 'object' && !Array.isArray(rubric)) {
    const rubricValues = [
      ...(Array.isArray(rubric.must_have) ? rubric.must_have : Array.isArray(rubric.mustHave) ? rubric.mustHave : []),
      ...(Array.isArray(rubric.nice_to_have) ? rubric.nice_to_have : Array.isArray(rubric.niceToHave) ? rubric.niceToHave : []),
      ...(Array.isArray(rubric.common_mistakes) ? rubric.common_mistakes : Array.isArray(rubric.commonMistakes) ? rubric.commonMistakes : []),
    ]
    if (arrayTooLong(rubricValues, MAX_LIST_ITEMS * 3, MAX_FIELD_LENGTHS.rubric_text)) {
      return { error: 'rubric is too long', status: 413 }
    }
  }

  const normalizedRubric = normalizeRubric(rubric)
  return {
    question: clampText(question, MAX_FIELD_LENGTHS.question),
    student_answer: clampText(studentAnswer, MAX_FIELD_LENGTHS.student_answer),
    user_answer: clampText(studentAnswer, MAX_FIELD_LENGTHS.student_answer),
    model_answer: clampText(modelAnswer, MAX_FIELD_LENGTHS.model_answer),
    key_points: normalizeTextArray(keyPoints, MAX_LIST_ITEMS, MAX_FIELD_LENGTHS.key_point),
    rubric: normalizedRubric,
  }
}

function renderRubric(rubric) {
  if (!rubric) return 'Rubric: none provided.'

  return [
    `Rubric must-have: ${rubric.must_have.length ? rubric.must_have.join('; ') : 'none'}`,
    `Rubric nice-to-have: ${rubric.nice_to_have.length ? rubric.nice_to_have.join('; ') : 'none'}`,
    `Rubric common mistakes: ${rubric.common_mistakes.length ? rubric.common_mistakes.join('; ') : 'none'}`,
    `Rubric score bands: ${Object.keys(rubric.score_bands || {}).length ? Object.entries(rubric.score_bands).map(([band, text]) => `${band} => ${text}`).join(' | ') : 'none'}`,
  ].join('\n')
}

function buildPrompt({ question, model_answer, key_points, user_answer, rubric }) {
  return `You are a strict but fair university professor evaluating a student's written answer.

Question: ${question}

Model answer (reference): ${model_answer}

Key points to check: ${key_points?.join(', ') || 'See model answer'}

${renderRubric(rubric)}

Student's answer: ${user_answer}

Evaluate the student's answer and return a JSON object with exactly this structure:
{
  "score_pct": <number 0-100>,
  "feedback_text": "<one sentence overall feedback>",
  "what_was_correct": ["<point 1>", "<point 2>"],
  "what_was_missing": ["<missing point 1>", "<missing point 2>"],
  "model_answer": "${String(model_answer || '').replace(/"/g, "'")}"
}

Scoring:
- 0-40 pts: Accuracy (factual correctness)
- 0-40 pts: Completeness (covers key concepts)
- 0-20 pts: Clarity (well-structured explanation)

Return ONLY valid JSON, no additional text.`
}

function parseJsonContent(content) {
  try {
    return JSON.parse(content)
  } catch {
    const match = String(content || '').match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON object found in model response')
    return JSON.parse(match[0])
  }
}

function clampScore(value) {
  const score = Number.isFinite(Number(value)) ? Number(value) : 0
  return Math.min(100, Math.max(0, Math.round(score)))
}

function normalizeModelResult(result) {
  if (!result || typeof result !== 'object') return result
  return {
    ...result,
    score_pct: clampScore(result.score_pct),
  }
}

function buildResponseShape({ payload, result, provider, model = null, fallback = null, providerErrors = [] }) {
  const normalizedResult = normalizeModelResult(result) || {}
  return {
    provider,
    model,
    fallback,
    score_pct: clampScore(normalizedResult.score_pct),
    feedback_text: String(normalizedResult.feedback_text || ''),
    what_was_correct: normalizeTextArray(normalizedResult.what_was_correct, MAX_LIST_ITEMS, MAX_FIELD_LENGTHS.rubric_text),
    what_was_missing: normalizeTextArray(normalizedResult.what_was_missing, MAX_LIST_ITEMS, MAX_FIELD_LENGTHS.rubric_text),
    model_answer: payload.model_answer || String(normalizedResult.model_answer || ''),
    rubric: payload.rubric,
    provider_errors: normalizeTextArray(providerErrors, 3, MAX_FIELD_LENGTHS.rubric_text),
  }
}

function localFallback({ model_answer, key_points, user_answer, rubric }) {
  const answer = String(user_answer || '').toLowerCase()
  const rubricKeys = rubric ? [...(rubric.must_have || []), ...(rubric.nice_to_have || [])] : []
  const keys = (key_points?.length ? key_points : rubricKeys.length ? rubricKeys : String(model_answer || '').split(/\W+/).filter(w => w.length > 5).slice(0, 8))
    .map(k => String(k).toLowerCase())
    .filter(Boolean)

  const hits = keys.filter(k => answer.includes(k))
  const keywordPct = keys.length ? hits.length / keys.length : 0
  const lengthPct = Math.min(1, answer.trim().length / 280)
  const score = Math.round(Math.min(100, keywordPct * 70 + lengthPct * 30))
  const missing = keys.filter(k => !hits.includes(k)).slice(0, 5)

  return {
    score_pct: clampScore(score),
    feedback_text: score >= 70
      ? 'Good answer; it covers most expected points.'
      : score >= 40
        ? 'Partially correct, but several key points are missing.'
        : 'The answer needs more of the expected concepts and detail.',
    what_was_correct: hits.slice(0, 5),
    what_was_missing: missing,
    model_answer,
    rubric,
    fallback: 'local',
  }
}

async function callGoogle(prompt, signal) {
  if (!process.env.GOOGLE_AI_KEY) return null

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GOOGLE_AI_KEY}`,
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({
      model: process.env.GOOGLE_STANDARD_MODELS?.split(',')[0]?.trim() || 'gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    }),
  })

  if (!res.ok) throw new Error(`Google ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return normalizeModelResult(parseJsonContent(data.choices?.[0]?.message?.content ?? '{}'))
}

async function callGroq(prompt, signal) {
  if (!process.env.GROQ_API_KEY) return null

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return normalizeModelResult(parseJsonContent(data.choices?.[0]?.message?.content ?? '{}'))
}

async function callOpenRouter(prompt, model, signal) {
  if (!process.env.OPENROUTER_API_KEY) return null

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Study Hall',
    },
    signal,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) throw new Error(`OpenRouter ${model} ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return normalizeModelResult(parseJsonContent(data.choices?.[0]?.message?.content ?? '{}'))
}

export async function POST(req) {
  let payload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const normalizedPayload = normalizeWrittenAnswerPayload(payload)
  if (normalizedPayload?.error) {
    return NextResponse.json({ error: normalizedPayload.error }, { status: normalizedPayload.status })
  }

  const prompt = buildPrompt(normalizedPayload)
  const errors = []
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    try {
      const googleResult = await callGoogle(prompt, controller.signal)
      if (googleResult) {
        return NextResponse.json(buildResponseShape({
          payload: normalizedPayload,
          result: googleResult,
          provider: 'google',
          model: process.env.GOOGLE_STANDARD_MODELS?.split(',')[0]?.trim() || 'gemini-2.5-flash-lite',
        }))
      }
    } catch (err) {
      errors.push(String(err.message || err))
    }

    try {
      const groqResult = await callGroq(prompt, controller.signal)
      if (groqResult) {
        return NextResponse.json(buildResponseShape({
          payload: normalizedPayload,
          result: groqResult,
          provider: 'groq',
        }))
      }
    } catch (err) {
      errors.push(String(err.message || err))
    }

    for (const model of OPENROUTER_MODELS) {
      try {
        const result = await callOpenRouter(prompt, model, controller.signal)
        if (result) {
          return NextResponse.json(buildResponseShape({
            payload: normalizedPayload,
            result,
            provider: 'openrouter',
            model,
          }))
        }
      } catch (err) {
        errors.push(String(err.message || err))
      }
    }
  } finally {
    clearTimeout(timeoutId)
  }

  const fallback = localFallback(normalizedPayload)
  return NextResponse.json(buildResponseShape({
    payload: normalizedPayload,
    result: fallback,
    provider: 'local',
    fallback: 'local',
    providerErrors: errors.slice(-3),
  }))
}

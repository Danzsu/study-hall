import { NextResponse } from 'next/server'

const OPENROUTER_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
]
const REQUEST_TIMEOUT_MS = 25000

function buildPrompt({ question, model_answer, key_points, user_answer }) {
  return `You are a strict but fair university professor evaluating a student's written answer.

Question: ${question}

Model answer (reference): ${model_answer}

Key points to check: ${key_points?.join(', ') || 'See model answer'}

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

function localFallback({ model_answer, key_points, user_answer }) {
  const answer = String(user_answer || '').toLowerCase()
  const keys = (key_points?.length ? key_points : String(model_answer || '').split(/\W+/).filter(w => w.length > 5).slice(0, 8))
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
    fallback: 'local',
  }
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

  const studentAnswer = payload?.student_answer ?? payload?.user_answer
  if (!payload?.question || !String(studentAnswer || '').trim()) {
    return NextResponse.json({ error: 'question and student_answer required' }, { status: 400 })
  }

  const normalizedPayload = {
    ...payload,
    student_answer: studentAnswer,
    user_answer: studentAnswer,
  }
  const prompt = buildPrompt(normalizedPayload)
  const errors = []
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    try {
      const groqResult = await callGroq(prompt, controller.signal)
      if (groqResult) return NextResponse.json({ ...groqResult, provider: 'groq' })
    } catch (err) {
      errors.push(String(err.message || err))
    }

    for (const model of OPENROUTER_MODELS) {
      try {
        const result = await callOpenRouter(prompt, model, controller.signal)
        if (result) return NextResponse.json({ ...result, provider: 'openrouter', model })
      } catch (err) {
        errors.push(String(err.message || err))
      }
    }
  } finally {
    clearTimeout(timeoutId)
  }

  const fallback = localFallback(normalizedPayload)
  return NextResponse.json({
    ...normalizeModelResult(fallback),
    provider: 'local',
    provider_errors: errors.slice(-3),
  })
}

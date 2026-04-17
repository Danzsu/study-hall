import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { question, model_answer, key_points, user_answer } = await req.json()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 })
  }

  const prompt = `You are a strict but fair university professor evaluating a student's written answer.

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
  "model_answer": "${model_answer.replace(/"/g, "'")}"
}

Scoring:
- 0-40 pts: Accuracy (factual correctness)
- 0-40 pts: Completeness (covers key concepts)
- 0-20 pts: Clarity (well-structured explanation)

Return ONLY valid JSON, no additional text.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: 502 })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    const feedback = JSON.parse(content)

    return NextResponse.json(feedback)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

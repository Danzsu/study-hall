'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { Question } from '@/lib/content'

interface Props {
  questions: Question[]
  subjectSlug: string
}

interface AIFeedback {
  score_pct: number
  feedback_text: string
  what_was_correct: string[]
  what_was_missing: string[]
  model_answer: string
}

type Phase = 'writing' | 'evaluating' | 'results'

export function WrittenTestClient({ questions, subjectSlug }: Readonly<Props>) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<Phase>('writing')
  const [feedbacks, setFeedbacks] = useState<Record<string, AIFeedback>>({})
  const [error, setError] = useState<string | null>(null)

  const allAnswered = questions.every((q) => (answers[q.id] ?? '').trim().length > 10)

  const handleSubmit = async () => {
    setPhase('evaluating')
    setError(null)

    const results: Record<string, AIFeedback> = {}

    for (const q of questions) {
      try {
        const res = await fetch('/api/validate-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q.question,
            model_answer: q.model_answer ?? '',
            key_points: q.key_points ?? [],
            user_answer: answers[q.id] ?? '',
          }),
        })
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        results[q.id] = data
      } catch {
        results[q.id] = {
          score_pct: 0,
          feedback_text: 'Could not evaluate — check your GROQ_API_KEY.',
          what_was_correct: [],
          what_was_missing: ['Evaluation failed'],
          model_answer: q.model_answer ?? '',
        }
      }
    }

    const existing = JSON.parse(localStorage.getItem(`writtenScores:${subjectSlug}`) ?? '{}')
    for (const [id, fb] of Object.entries(results)) {
      if (fb.score_pct < 70) {
        const wrongs: string[] = JSON.parse(localStorage.getItem(`wrongAnswers:${subjectSlug}`) ?? '[]')
        if (!wrongs.includes(id)) {
          localStorage.setItem(`wrongAnswers:${subjectSlug}`, JSON.stringify([...wrongs, id]))
        }
      }
      existing[id] = fb.score_pct
    }
    localStorage.setItem(`writtenScores:${subjectSlug}`, JSON.stringify(existing))

    setFeedbacks(results)
    setPhase('results')
  }

  if (questions.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No written questions available yet.</p>
      </div>
    )
  }

  if (phase === 'results') {
    const avg = Math.round(
      Object.values(feedbacks).reduce((s, f) => s + f.score_pct, 0) / questions.length
    )
    return (
      <div className="animate-fade-in" style={{ maxWidth: 768, margin: '0 auto', padding: '24px 16px' }}>
        {/* Overall score */}
        <div className="card" style={{ padding: 24, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, marginBottom: 4, color: avg >= 70 ? 'var(--green)' : 'var(--accent)' }}>
            {avg}%
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Overall score</p>
        </div>

        {/* Per-question feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q) => {
            const fb = feedbacks[q.id]
            if (!fb) return null
            return (
              <div key={q.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.6, flex: 1 }}>
                    {q.question}
                  </p>
                  <span style={{ fontSize: 22, fontWeight: 800, flexShrink: 0, color: fb.score_pct >= 70 ? 'var(--green)' : 'var(--accent)' }}>
                    {fb.score_pct}%
                  </span>
                </div>

                {/* User answer */}
                <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>Your answer</p>
                  <p style={{ fontSize: 13, color: 'var(--text)' }}>{answers[q.id]}</p>
                </div>

                {/* What was correct */}
                {fb.what_was_correct.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={12} /> What you got right
                    </p>
                    <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {fb.what_was_correct.map((item) => (
                        <li key={item} style={{ fontSize: 12, color: 'var(--text)', paddingLeft: 14, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0, color: 'var(--green)' }}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What was missing */}
                {fb.what_was_missing.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} /> What was missing
                    </p>
                    <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {fb.what_was_missing.map((item) => (
                        <li key={item} style={{ fontSize: 12, color: 'var(--text)', paddingLeft: 14, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0 }}>⚠</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Model answer */}
                <details style={{ marginTop: 12 }}>
                  <summary style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
                    📖 Show model answer
                  </summary>
                  <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: 'var(--accent-bg)', border: '1px solid rgba(224,115,85,0.2)' }}>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65 }}>{fb.model_answer}</p>
                  </div>
                </details>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => { setPhase('writing'); setFeedbacks({}) }}
          style={{
            marginTop: 24, width: '100%', padding: '12px 0',
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14,
            fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', system-ui",
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hov)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 768, margin: '0 auto', padding: '24px 16px' }}>
      {/* Progress header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase' }}>
        <span>Written Test</span>
        <span>{Object.values(answers).filter((a) => a.trim().length > 10).length} / {questions.length} answered</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 24 }}>
        <div
          className="progress-fill"
          style={{
            width: `${(Object.values(answers).filter((a) => a.trim().length > 10).length / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Questions */}
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {questions.map((q, i) => (
          <div key={q.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                Question {i + 1}
              </span>
              <span style={{ fontSize: 11, color: 'var(--accent)', flexShrink: 0 }}>{q.section}</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', lineHeight: 1.65, marginBottom: 16 }}>
              {q.question}
            </p>
            <textarea
              rows={5}
              placeholder="Write your answer here..."
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              style={{
                width: '100%', padding: '10px 12px',
                fontSize: 14, background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: 8,
                outline: 'none', color: 'var(--text)',
                fontFamily: "'Lora', Georgia, serif",
                lineHeight: 1.7, resize: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>
        ))}
      </div>

      {/* Submit */}
      <div style={{ marginTop: 24 }}>
        {error && (
          <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12, textAlign: 'center' }}>{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || phase === 'evaluating'}
          style={{
            width: '100%', padding: '14px 0',
            background: allAnswered ? 'var(--accent)' : 'var(--border)',
            color: allAnswered ? '#fff' : 'var(--text-muted)',
            border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            cursor: allAnswered ? 'pointer' : 'not-allowed',
            fontFamily: "'DM Sans', system-ui",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.15s',
            opacity: phase === 'evaluating' ? 0.8 : 1,
          }}
          onMouseEnter={(e) => { if (allAnswered && phase !== 'evaluating') (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hov)' }}
          onMouseLeave={(e) => { if (allAnswered) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)' }}
        >
          {phase === 'evaluating' && <Loader2 size={16} className="animate-spin" />}
          {phase === 'evaluating' ? 'AI is evaluating...' : 'Submit for AI Evaluation'}
        </button>
        {!allAnswered && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Answer all questions to submit (min. 10 characters each)
          </p>
        )}
      </div>
    </div>
  )
}

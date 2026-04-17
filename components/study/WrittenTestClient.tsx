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

export function WrittenTestClient({ questions, subjectSlug }: Props) {
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

    // Save scores to localStorage
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--muted)] text-sm">No written questions available yet.</p>
      </div>
    )
  }

  if (phase === 'results') {
    const avg = Math.round(
      Object.values(feedbacks).reduce((s, f) => s + f.score_pct, 0) / questions.length
    )
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
        {/* Overall score */}
        <div className="card p-6 mb-6 text-center">
          <div
            className="text-5xl font-bold mb-1"
            style={{ color: avg >= 70 ? '#22c55e' : '#E07355' }}
          >
            {avg}%
          </div>
          <p className="text-sm text-[var(--muted)]">Overall score</p>
        </div>

        {/* Per-question feedback */}
        <div className="space-y-4">
          {questions.map((q) => {
            const fb = feedbacks[q.id]
            if (!fb) return null
            return (
              <div key={q.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className="text-sm font-medium text-[var(--foreground)] leading-relaxed">
                    {q.question}
                  </p>
                  <span
                    className="text-2xl font-bold shrink-0"
                    style={{ color: fb.score_pct >= 70 ? '#22c55e' : '#E07355' }}
                  >
                    {fb.score_pct}%
                  </span>
                </div>

                {/* User answer */}
                <div className="mb-4 p-3 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)]">
                  <p className="text-xs text-[var(--muted)] mb-1 font-medium">Your answer</p>
                  <p className="text-sm text-[var(--foreground)]">{answers[q.id]}</p>
                </div>

                {/* What was correct */}
                {fb.what_was_correct.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1">
                      <CheckCircle size={12} /> What you got right
                    </p>
                    <ul className="space-y-1">
                      {fb.what_was_correct.map((item, i) => (
                        <li key={i} className="text-xs text-[var(--foreground)] pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-green-500">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What was missing */}
                {fb.what_was_missing.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-accent mb-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> What was missing
                    </p>
                    <ul className="space-y-1">
                      {fb.what_was_missing.map((item, i) => (
                        <li key={i} className="text-xs text-[var(--foreground)] pl-4 relative before:content-['⚠'] before:absolute before:left-0 before:text-xs">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Model answer */}
                <details className="mt-3">
                  <summary className="text-xs text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors">
                    📖 Show model answer
                  </summary>
                  <div className="mt-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm text-[var(--foreground)] leading-relaxed">{fb.model_answer}</p>
                  </div>
                </details>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => { setPhase('writing'); setFeedbacks({}) }}
          className="mt-6 w-full py-3 bg-accent hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Progress header */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
        <span>WRITTEN TEST</span>
        <span>{Object.values(answers).filter((a) => a.trim().length > 10).length} / {questions.length} answered</span>
      </div>
      <div className="progress-bar mb-6">
        <div
          className="progress-fill"
          style={{
            width: `${(Object.values(answers).filter((a) => a.trim().length > 10).length / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Questions */}
      <div className="space-y-6 animate-fade-in">
        {questions.map((q, i) => (
          <div key={q.id} className="card p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                Question {i + 1}
              </span>
              <span className="text-xs text-accent shrink-0">{q.section}</span>
            </div>
            <p className="text-[var(--foreground)] font-medium leading-relaxed mb-4">
              {q.question}
            </p>
            <textarea
              rows={5}
              placeholder="Write your answer here..."
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg outline-none focus:border-accent text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors resize-none"
            />
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-6">
        {error && (
          <p className="text-sm text-red-400 mb-3 text-center">{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || phase === 'evaluating'}
          className="w-full py-3 bg-accent hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {phase === 'evaluating' && <Loader2 size={16} className="animate-spin" />}
          {phase === 'evaluating' ? 'AI is evaluating...' : 'Submit for AI Evaluation'}
        </button>
        {!allAnswered && (
          <p className="text-xs text-[var(--muted)] text-center mt-2">
            Answer all questions to submit (min. 10 characters each)
          </p>
        )}
      </div>
    </div>
  )
}

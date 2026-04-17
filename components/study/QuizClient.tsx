'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronLeft, CheckCircle, XCircle } from 'lucide-react'
import type { Question } from '@/lib/content'

interface Props {
  questions: Question[]
  subjectSlug: string
}

type Phase = 'quiz' | 'results'

export function QuizClient({ questions, subjectSlug }: Props) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<Phase>('quiz')

  const q = questions[current]
  const isMulti = q?.type === 'multi'
  const correctArr = q
    ? Array.isArray(q.correct) ? q.correct : (q.correct != null ? [q.correct] : [])
    : []

  const saveWrong = useCallback((qId: string) => {
    const raw = localStorage.getItem(`wrongAnswers:${subjectSlug}`)
    const arr: string[] = raw ? JSON.parse(raw) : []
    if (!arr.includes(qId)) {
      localStorage.setItem(`wrongAnswers:${subjectSlug}`, JSON.stringify([...arr, qId]))
    }
  }, [subjectSlug])

  const handleSelect = (idx: number) => {
    if (submitted) return
    if (isMulti) {
      setSelected((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      )
    } else {
      setSelected([idx])
    }
  }

  const handleSubmit = () => {
    if (selected.length === 0) return
    const isCorrect =
      selected.length === correctArr.length &&
      selected.every((i) => correctArr.includes(i))
    if (isCorrect) {
      setScore((s) => s + 1)
    } else {
      saveWrong(q.id)
    }
    setSubmitted(true)
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      updateStreak()
      setPhase('results')
    } else {
      setCurrent((c) => c + 1)
      setSelected([])
      setSubmitted(false)
    }
  }

  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0]
    const raw = localStorage.getItem('streak')
    const streak = raw ? JSON.parse(raw) : { count: 0, lastDate: '' }
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (streak.lastDate === today) return
    const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1
    localStorage.setItem('streak', JSON.stringify({ count: newCount, lastDate: today }))
  }

  const restart = () => {
    setCurrent(0)
    setSelected([])
    setSubmitted(false)
    setScore(0)
    setPhase('quiz')
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--muted)] text-sm">No quiz questions available yet.</p>
      </div>
    )
  }

  if (phase === 'results') {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="card p-8">
          <div className="text-5xl font-bold mb-2" style={{ color: pct >= 70 ? '#22c55e' : '#E07355' }}>
            {pct}%
          </div>
          <p className="text-[var(--muted)] text-sm mb-1">
            {score} / {questions.length} correct
          </p>
          <p className="text-[var(--foreground)] font-medium mt-4">
            {pct >= 90 ? '🎉 Excellent!' : pct >= 70 ? '👍 Good job!' : '📚 Keep studying!'}
          </p>
          <button
            onClick={restart}
            className="mt-6 px-6 py-2.5 bg-accent hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const progress = ((current) / questions.length) * 100

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
        <span>QUIZ</span>
        <span>{current + 1} / {questions.length}</span>
      </div>
      <div className="progress-bar mb-6">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question card */}
      <div className="card p-6">
        {/* Type + section */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            {isMulti ? `Select ${Array.isArray(q.correct) ? q.correct.length : ''} answers` : 'Multiple choice'}
          </span>
          <span className="text-xs text-accent shrink-0">{q.section}</span>
        </div>

        {/* Question text */}
        <p className="text-[var(--foreground)] font-medium leading-relaxed mb-6">
          {q.question}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {q.options?.map((opt, oi) => {
            const isSelected = selected.includes(oi)
            const isCorrectOpt = correctArr.includes(oi)
            let cls = 'answer-option'
            if (submitted) {
              if (isCorrectOpt) cls += ' correct'
              else if (isSelected && !isCorrectOpt) cls += ' incorrect'
            } else if (isSelected) {
              cls += ' selected'
            }
            return (
              <button
                key={oi}
                className={`${cls} w-full text-left`}
                onClick={() => handleSelect(oi)}
              >
                <span className="font-semibold text-xs text-[var(--muted)] mt-0.5 w-5 shrink-0">
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className="text-sm text-[var(--foreground)]">{opt}</span>
                {submitted && isCorrectOpt && (
                  <CheckCircle size={14} className="ml-auto text-green-500 shrink-0" />
                )}
                {submitted && isSelected && !isCorrectOpt && (
                  <XCircle size={14} className="ml-auto text-red-400 shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {submitted && q.explanation && (
          <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20 animate-fade-in">
            <p className="text-xs font-medium text-accent uppercase tracking-wide mb-1">Explanation</p>
            <p className="text-sm text-[var(--foreground)] leading-relaxed">{q.explanation}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => { setCurrent((c) => Math.max(0, c - 1)); setSelected([]); setSubmitted(false) }}
          disabled={current === 0}
          className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors px-2 py-1"
        >
          <ChevronLeft size={16} /> Prev
        </button>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="px-6 py-2.5 bg-accent hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isMulti ? 'Submit Multiple' : 'Submit'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-6 py-2.5 bg-accent hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors"
          >
            {current + 1 >= questions.length ? 'See Results' : 'Next'} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

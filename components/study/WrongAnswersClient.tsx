'use client'

import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import type { Question } from '@/lib/content'
import { QuizClient } from './QuizClient'

interface Props {
  allQuestions: Question[]
  subjectSlug: string
}

export function WrongAnswersClient({ allQuestions, subjectSlug }: Props) {
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(`wrongAnswers:${subjectSlug}`)
    setWrongIds(raw ? JSON.parse(raw) : [])
    setLoaded(true)
  }, [subjectSlug])

  const clearWrong = () => {
    localStorage.removeItem(`wrongAnswers:${subjectSlug}`)
    setWrongIds([])
  }

  if (!loaded) return null

  const wrongQuestions = allQuestions.filter((q) => wrongIds.includes(q.id))

  if (wrongIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-[var(--foreground)] font-medium">No wrong answers yet!</p>
        <p className="text-sm text-[var(--muted)]">
          Complete a quiz and your mistakes will appear here.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 pt-4 flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          Practising {wrongQuestions.length} wrong answer{wrongQuestions.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={clearWrong}
          className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} /> Clear all
        </button>
      </div>
      <QuizClient questions={wrongQuestions} subjectSlug={subjectSlug} />
    </div>
  )
}

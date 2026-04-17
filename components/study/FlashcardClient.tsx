'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Flashcard } from '@/lib/content'

export function FlashcardClient({ cards }: { cards: Flashcard[] }) {
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const card = cards[current]

  const goNext = useCallback(() => {
    setFlipped(false)
    setTimeout(() => setCurrent((c) => Math.min(c + 1, cards.length - 1)), 150)
  }, [cards.length])

  const goPrev = useCallback(() => {
    setFlipped(false)
    setTimeout(() => setCurrent((c) => Math.max(c - 1, 0)), 150)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f) }
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev])

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--muted)] text-sm">No flashcards available yet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-6">
        <span>FLASHCARD</span>
        <span>{current + 1} / {cards.length}</span>
      </div>

      {/* Flashcard */}
      <div
        className="flashcard-container w-full"
        style={{ height: '320px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={`flashcard-inner w-full h-full cursor-pointer ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-face bg-[var(--surface)] border border-[var(--border)] flex flex-col items-center justify-center p-8 text-center shadow-card">
            <span className="text-xs font-medium text-accent uppercase tracking-widest mb-4">Question</span>
            <p className="text-[var(--foreground)] font-medium text-lg leading-relaxed">
              {card.question}
            </p>
            <p className="text-xs text-[var(--muted)] mt-8">tap to flip</p>
          </div>

          {/* Back */}
          <div className="flashcard-face flashcard-back bg-[var(--surface)] border border-accent/40 flex flex-col items-start justify-center p-8 shadow-card-hover">
            <span className="text-xs font-medium text-accent uppercase tracking-widest mb-4">Answer</span>
            <p className="text-[var(--foreground)] font-semibold text-lg leading-relaxed mb-3">
              {card.answer}
            </p>
            {card.explanation && (
              <div className="w-full mt-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-xs text-[var(--foreground)] leading-relaxed">{card.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors px-2 py-1"
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <p className="text-xs text-[var(--muted)]">Space / ← → to navigate</p>
        <button
          onClick={goNext}
          disabled={current === cards.length - 1}
          className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors px-2 py-1"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Flashcard } from '@/lib/content'

export function FlashcardClient({ cards }: Readonly<{ cards: Flashcard[] }>) {
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
    globalThis.addEventListener('keydown', handler)
    return () => globalThis.removeEventListener('keydown', handler)
  }, [goNext, goPrev])

  if (cards.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Még nincs flashkártya ehhez a tantárgyhoz.</p>
      </div>
    )
  }

  const progress = ((current + 1) / cards.length) * 100

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '36px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="pill pill-accent">Flashkártyák</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sub)' }}>
          {current + 1} / {cards.length}
        </span>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {cards.map((c, i) => {
          let dotBg = 'var(--border)'
          if (i === current) dotBg = 'var(--accent)'
          else if (i < current) dotBg = 'rgba(224,115,85,0.4)'
          return (
            <button
              key={c.id}
              onClick={() => { setFlipped(false); setCurrent(i) }}
              style={{
                flex: 1, height: 4, borderRadius: 99, border: 'none',
                cursor: 'pointer', transition: 'background .2s',
                background: dotBg,
              }}
            />
          )
        })}
      </div>

      {/* Card — button for full keyboard + screen-reader accessibility */}
      <button
        className="flashcard-container"
        aria-label={flipped ? 'Kártya hátlapja — koppints a visszafordításhoz' : 'Kártya előlapja — koppints a megfordításhoz'}
        style={{
          height: 320, width: '100%', cursor: 'pointer',
          background: 'none', border: 'none', padding: 0, display: 'block',
        }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={`flashcard-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div
            className="flashcard-face"
            style={{
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: 40, textAlign: 'center',
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '1.5px',
              color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 20,
            }}>
              Kérdés
            </span>
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 22, fontWeight: 700, color: 'var(--text)',
              lineHeight: 1.4,
            }}>
              {card.question}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 32 }}>
              koppints a megfordításhoz · Space
            </p>
          </div>

          {/* Back */}
          <div
            className="flashcard-face flashcard-back"
            style={{
              background: 'var(--surface)', border: `1.5px solid var(--accent)`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'flex-start', justifyContent: 'center',
              padding: 40,
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '1.5px',
              color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16,
            }}>
              Válasz
            </span>
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 18, fontWeight: 600, color: 'var(--text)',
              lineHeight: 1.6, marginBottom: card.explanation ? 16 : 0,
            }}>
              {card.answer}
            </p>
            {card.explanation && (
              <div style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                background: 'var(--accent-bg)', borderLeft: '3px solid var(--accent)',
              }}>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                  {card.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
        <button
          onClick={goPrev}
          disabled={current === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'var(--surface)', color: 'var(--text-sub)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700,
            cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.4 : 1,
          }}
        >
          <ChevronLeft size={14} /> Előző
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Space · ← →</p>

        <button
          onClick={goNext}
          disabled={current === cards.length - 1}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)',
            borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700,
            cursor: current === cards.length - 1 ? 'not-allowed' : 'pointer',
            opacity: current === cards.length - 1 ? 0.4 : 1,
          }}
        >
          Következő <ChevronRight size={14} />
        </button>
      </div>

      {/* Overall progress bar */}
      <div className="progress-bar" style={{ marginTop: 20 }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </main>
  )
}

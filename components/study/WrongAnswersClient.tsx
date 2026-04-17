'use client'

import { useState, useEffect } from 'react'
import { XCircle, CheckCircle2, RotateCcw, BookOpen, Layers } from 'lucide-react'
import Link from 'next/link'
import type { Question } from '@/lib/content'

interface Props {
  allQuestions: Question[]
  subjectSlug: string
}

const LABELS = ['A', 'B', 'C', 'D', 'E']

function attemptColor(n: number): string {
  if (n >= 3) return 'var(--red)'
  if (n === 2) return 'var(--gold)'
  return 'var(--accent)'
}

function AttemptBadge({ attempts }: Readonly<{ attempts: number }>) {
  const color = attemptColor(attempts)
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.4px',
      color, background: `${color}18`,
      border: `1px solid ${color}35`,
      borderRadius: 20, padding: '2px 8px',
    }}>
      {attempts}× hibázva
    </span>
  )
}

interface OptionProps {
  opt: string
  index: number
  isSelected: boolean
  isCorrect: boolean
  isWrong: boolean
  isPrevMistake: boolean
  submitted: boolean
  onSelect: (i: number) => void
}

function optionBg(isCorrect: boolean, isWrong: boolean, isSelected: boolean): string {
  if (isCorrect) return 'rgba(90,158,114,0.1)'
  if (isWrong) return 'rgba(192,80,74,0.08)'
  if (isSelected) return 'var(--accent-bg2)'
  return 'var(--surface)'
}

function optionBorder(isCorrect: boolean, isWrong: boolean, isSelected: boolean): string {
  if (isCorrect) return 'var(--green)'
  if (isWrong) return 'var(--red)'
  if (isSelected) return 'var(--accent)'
  return 'var(--border)'
}

function optionCircleBg(isCorrect: boolean, isWrong: boolean, isSelected: boolean): string {
  if (isCorrect) return 'var(--green)'
  if (isWrong) return 'var(--red)'
  if (isSelected) return 'var(--accent)'
  return 'var(--surface2)'
}

function OptionButton({ opt, index, isSelected, isCorrect, isWrong, isPrevMistake, submitted, onSelect }: Readonly<OptionProps>) {
  const bg = optionBg(isCorrect, isWrong, isSelected)
  const border = optionBorder(isCorrect, isWrong, isSelected)
  const borderStyle = isPrevMistake ? 'dashed' : 'solid'
  const circleBg = optionCircleBg(isCorrect, isWrong, isSelected)
  const circleColor = (isCorrect || isWrong || isSelected) ? '#fff' : 'var(--text-muted)'

  return (
    <button
      key={opt}
      onClick={() => { if (!submitted) onSelect(index) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderRadius: 10,
        background: bg, border: `2px ${borderStyle} ${border}`,
        cursor: submitted ? 'default' : 'pointer',
        textAlign: 'left', width: '100%',
        transition: 'all .15s',
      }}
    >
      <span style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800,
        background: circleBg, color: circleColor,
        transition: 'all .15s',
      }}>
        {isCorrect && <CheckCircle2 size={13} />}
        {isWrong && <XCircle size={13} />}
        {!isCorrect && !isWrong && LABELS[index]}
      </span>
      <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)', flex: 1 }}>{opt}</span>
    </button>
  )
}

function submitLabel(submitted: boolean, idx: number, total: number): string {
  if (!submitted) return 'Ellenőrzés'
  return idx < total - 1 ? 'Következő →' : 'Eredmények'
}

function resultEmoji(correct: number, total: number): string {
  const pct = correct / total
  if (pct >= 0.8) return '🎉'
  if (pct >= 0.5) return '💪'
  return '📖'
}

export function WrongAnswersClient({ allQuestions, subjectSlug }: Readonly<Props>) {
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [attempts, setAttempts] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz')

  useEffect(() => {
    const raw = localStorage.getItem(`wrongAnswers:${subjectSlug}`)
    const ids: string[] = raw ? JSON.parse(raw) : []
    setWrongIds(ids)

    const attRaw = localStorage.getItem(`wrongAttemptsCount:${subjectSlug}`)
    const att: Record<string, number> = attRaw ? JSON.parse(attRaw) : {}
    const defaulted: Record<string, number> = {}
    for (const id of ids) defaulted[id] = att[id] ?? 1
    setAttempts(defaulted)

    setLoaded(true)
  }, [subjectSlug])

  const wrongQuestions = allQuestions.filter((q) => wrongIds.includes(q.id))

  const handleSubmit = () => {
    if (!submitted) {
      setSubmitted(true)
      const q = wrongQuestions[idx]
      const correct = Array.isArray(q.correct)
        ? selected !== null && q.correct.includes(selected)
        : selected === q.correct
      setResults((prev) => ({ ...prev, [q.id]: correct }))
      if (!correct) {
        const newAtt = { ...attempts, [q.id]: (attempts[q.id] ?? 1) + 1 }
        setAttempts(newAtt)
        localStorage.setItem(`wrongAttemptsCount:${subjectSlug}`, JSON.stringify(newAtt))
      }
    } else if (idx < wrongQuestions.length - 1) {
      setIdx((i) => i + 1)
      setSelected(null)
      setSubmitted(false)
    } else {
      setPhase('results')
    }
  }

  const handleRetry = () => {
    const stillWrong = wrongQuestions.filter((q) => !results[q.id]).map((q) => q.id)
    localStorage.setItem(`wrongAnswers:${subjectSlug}`, JSON.stringify(stillWrong))
    setWrongIds(stillWrong)
    setIdx(0)
    setSelected(null)
    setSubmitted(false)
    setResults({})
    setPhase('quiz')
  }

  if (!loaded) return null

  if (wrongIds.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Nincsenek hibás válaszok!</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Csináld végig egy kvízt, és ide kerülnek a hibák.</p>
        <Link href={`/subject/${subjectSlug}/quiz`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 20px', borderRadius: 8,
          background: 'var(--accent)', color: '#fff',
          fontSize: 13, fontWeight: 700, textDecoration: 'none', marginTop: 8,
        }}>
          Kvíz indítása
        </Link>
      </div>
    )
  }

  /* ── Results screen ── */
  if (phase === 'results') {
    const correctCount = Object.values(results).filter(Boolean).length
    const stillWrong = wrongQuestions.filter((q) => !results[q.id]).length
    const improved = wrongQuestions.filter((q) => results[q.id]).length
    const emoji = resultEmoji(correctCount, wrongQuestions.length)

    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '36px 24px' }} className="animate-fade-up">
        {/* Hero */}
        <div className="card" style={{ padding: '32px 24px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
          <h2 style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8,
          }}>
            {correctCount === wrongQuestions.length ? 'Minden helyes!' : 'Jó munka!'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>
            {wrongQuestions.length} kérdésből {correctCount} helyes
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Most helyes', value: improved, color: 'var(--green)' },
            { label: 'Még hibás', value: stillWrong, color: 'var(--red)' },
            { label: 'Összes', value: wrongQuestions.length, color: 'var(--text-muted)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: '16px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 26, fontWeight: 800, color }}>{value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stillWrong > 0 && (
            <button onClick={handleRetry} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px', borderRadius: 10, border: 'none',
              background: 'var(--accent)', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              <RotateCcw size={15} /> Hibákat újra ({stillWrong})
            </button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href={`/subject/${subjectSlug}/flashcards`} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '11px', borderRadius: 10,
              background: 'var(--surface)', border: '1px solid var(--border)',
              fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', textDecoration: 'none',
            }}>
              <Layers size={13} /> Flashkártyák
            </Link>
            <Link href={`/subject/${subjectSlug}/study`} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '11px', borderRadius: 10,
              background: 'var(--surface)', border: '1px solid var(--border)',
              fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', textDecoration: 'none',
            }}>
              <BookOpen size={13} /> Tanulás
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Quiz screen ── */
  const q = wrongQuestions[idx]
  const correctIdx = Array.isArray(q.correct) ? q.correct[0] : q.correct
  const prevChoice = undefined // not stored per-question in current data model

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="pill pill-muted">Hibás válaszok</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AttemptBadge attempts={attempts[q.id] ?? 1} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sub)' }}>
            {idx + 1} / {wrongQuestions.length}
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {wrongQuestions.map((wq, i) => {
          let bg = 'var(--border)'
          if (i === idx) bg = 'var(--accent)'
          else if (results[wq.id] === true) bg = 'var(--green)'
          else if (results[wq.id] === false) bg = 'var(--red)'
          return (
            <div key={wq.id} style={{
              flex: 1, height: 4, borderRadius: 99,
              background: bg, transition: 'background .2s',
            }} />
          )
        })}
      </div>

      {/* Section + question */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="pill" style={{ fontSize: 11, background: 'var(--surface2)', color: 'var(--text-muted)' }}>{q.section}</span>
      </div>
      <p style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 18, fontWeight: 700, lineHeight: 1.5,
        color: 'var(--text)', marginBottom: 20,
      }}>
        {q.question}
      </p>

      {/* Previous answer hint */}
      {submitted && selected !== null && selected !== correctIdx && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 14px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(192,80,74,0.08)', border: '1px solid rgba(192,80,74,0.25)',
        }}>
          <XCircle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>
            Ezt választottad: <strong>{q.options?.[selected]}</strong>
          </p>
        </div>
      )}

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {q.options?.map((opt, i) => (
          <OptionButton
            key={opt}
            opt={opt}
            index={i}
            isSelected={selected === i}
            isCorrect={submitted && i === correctIdx}
            isWrong={submitted && selected === i && i !== correctIdx}
            isPrevMistake={!submitted && prevChoice === i}
            submitted={submitted}
            onSelect={setSelected}
          />
        ))}
      </div>

      {/* Explanation */}
      {submitted && q.explanation && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 20,
          background: 'var(--accent-bg)', borderLeft: '3px solid var(--accent)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{q.explanation}</p>
        </div>
      )}

      {/* Submit / Next */}
      <button
        onClick={handleSubmit}
        disabled={selected === null}
        style={{
          width: '100%', padding: '14px',
          borderRadius: 10, border: 'none',
          background: selected === null ? 'var(--surface2)' : 'var(--accent)',
          color: selected === null ? 'var(--text-muted)' : '#fff',
          fontSize: 14, fontWeight: 700,
          cursor: selected === null ? 'not-allowed' : 'pointer',
          transition: 'all .2s',
        }}
      >
        {submitLabel(submitted, idx, wrongQuestions.length)}
      </button>
    </div>
  )
}

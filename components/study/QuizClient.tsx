'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Flag } from 'lucide-react'
import Link from 'next/link'
import type { Question } from '@/lib/content'

// ── Types ────────────────────────────────────────────────────────────────────
interface Props {
  questions: Question[]
  subjectSlug: string
  subjectName?: string
}

type Phase = 'quiz' | 'results'
type OptionState = 'default' | 'selected' | 'correct' | 'wrong'

// ── Helpers ──────────────────────────────────────────────────────────────────
function saveWrong(slug: string, qId: string) {
  try {
    const raw = localStorage.getItem(`wrongAnswers:${slug}`)
    const arr: string[] = raw ? JSON.parse(raw) : []
    if (!arr.includes(qId)) {
      localStorage.setItem(`wrongAnswers:${slug}`, JSON.stringify([...arr, qId]))
    }
  } catch { /* ignore */ }
}

function updateStreak() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const raw = localStorage.getItem('streak')
    const streak = raw ? JSON.parse(raw) : { count: 0, lastDate: '' }
    if (streak.lastDate === today) return
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1
    localStorage.setItem('streak', JSON.stringify({ count: newCount, lastDate: today }))
  } catch { /* ignore */ }
}

function getOptionLabel(state: OptionState, letter: string): string {
  if (state === 'correct') return '✓'
  if (state === 'wrong') return '✗'
  return letter
}

function getOptionState(isAnswered: boolean, isPicked: boolean, isOptCorrect: boolean): OptionState {
  if (!isAnswered) return isPicked ? 'selected' : 'default'
  if (isOptCorrect) return 'correct'
  if (isPicked) return 'wrong'
  return 'default'
}

function getOptionClass(isAnswered: boolean, isPicked: boolean, isOptCorrect: boolean): string {
  if (!isAnswered) return isPicked ? 'answer-option selected' : 'answer-option'
  if (isOptCorrect) return 'answer-option correct'
  if (isPicked) return 'answer-option incorrect'
  return 'answer-option'
}

// ── Option Circle ─────────────────────────────────────────────────────────────
const CIRCLE_STYLES: Record<OptionState, { bg: string; border: string; color: string }> = {
  default:  { bg: 'transparent',  border: 'var(--border2)', color: 'var(--text-sub)' },
  selected: { bg: 'var(--accent)', border: 'var(--accent)', color: '#fff' },
  correct:  { bg: 'var(--green)',  border: 'var(--green)',  color: '#fff' },
  wrong:    { bg: 'var(--red)',    border: 'var(--red)',    color: '#fff' },
}

function OptionCircle({ letter, state }: Readonly<{ letter: string; state: OptionState }>) {
  const s = CIRCLE_STYLES[state]
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      border: `1.5px solid ${s.border}`,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .15s',
    }}>
      {getOptionLabel(state, letter)}
    </div>
  )
}

// ── Results helpers ───────────────────────────────────────────────────────────
function getGrade(pct: number): string {
  if (pct >= 90) return 'A'
  if (pct >= 80) return 'B'
  if (pct >= 70) return 'C'
  if (pct >= 60) return 'D'
  return 'F'
}

function getResultMsg(pct: number): string {
  if (pct >= 80) return 'Kiváló munka!'
  if (pct >= 60) return 'Szolid teljesítmény — nézd át a trükkös részeket.'
  return 'Érdemes még egyszer átmenni.'
}

function getScoreColor(pct: number): string {
  if (pct >= 80) return 'var(--green)'
  if (pct >= 60) return 'var(--gold)'
  return 'var(--accent)'
}

// ── Results view ─────────────────────────────────────────────────────────────
function ResultsView({ questions, score, subjectSlug, subjectName, onRestart }: Readonly<{
  questions: Question[]
  score: number
  subjectSlug: string
  subjectName?: string
  onRestart: () => void
}>) {
  const pct = Math.round((score / questions.length) * 100)
  const grade = getGrade(pct)
  const msg = getResultMsg(pct)
  const scoreColor = getScoreColor(pct)
  const circ = 2 * Math.PI * 48

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 28px', animation: 'fadeUp .4s ease both' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span className="pill pill-accent">Kvíz kész</span>
        <h1 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 32, fontWeight: 700, letterSpacing: '-.6px', margin: '14px 0 8px',
          color: 'var(--text)',
        }}>
          {msg}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>
          {subjectName ?? subjectSlug} · {questions.length} kérdés
        </p>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 28, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={55} cy={55} r={48} fill="none" stroke="var(--surface2)" strokeWidth={8} />
              <circle cx={55} cy={55} r={48} fill="none" stroke={scoreColor} strokeWidth={8}
                strokeLinecap="round" strokeDasharray={`${(pct / 100) * circ} ${circ}`} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text)' }}>{grade}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{score}/{questions.length}</span>
            </div>
          </div>
          <div>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 20, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>
              {pct}% helyes
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6 }}>
              Folytasd a lendületet még 2 kvízzal ezen a héten!
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
            <button onClick={onRestart} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 8,
              background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              Újra próbálom
            </button>
            <Link href={`/subject/${subjectSlug}/study`} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 8,
              background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>
              Vissza a leckékhez
            </Link>
          </div>
        </div>
      </div>

      <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>Kérdésenkénti bontás</span>
      <div className="card" style={{ padding: 0 }}>
        {questions.map((question, i) => {
          const ok = i < score
          return (
            <div key={question.id} style={{
              padding: '14px 20px',
              borderBottom: i < questions.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: ok ? 'var(--green-bg)' : 'var(--red-bg)',
                color: ok ? 'var(--green)' : 'var(--red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2, color: 'var(--text)' }}>{question.question}</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{question.section}</p>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

// ── Quiz card ─────────────────────────────────────────────────────────────────
function QuizCard({ q, idx, total, score, picked, isAnswered, onPick, onPrev, onNext }: Readonly<{
  q: Question
  idx: number
  total: number
  score: number
  picked: number | boolean | undefined
  isAnswered: boolean
  onPick: (v: number) => void
  onPrev: () => void
  onNext: () => void
}>) {
  const correctVal = Array.isArray(q.correct) ? q.correct[0] : q.correct
  const isCorrect = isAnswered && picked === correctVal
  const isLast = idx === total - 1
  const revealedCount = idx  // approximation for footer counter

  return (
    <div className="card" style={{ padding: 0, animation: 'fadeUp .3s ease both' }}>
      <div style={{ padding: '30px 32px 24px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <span className="pill pill-muted">{q.section}</span>
          <span className="pill pill-blue">Feleletválasztós</span>
        </div>

        <h2 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 22, fontWeight: 700, lineHeight: 1.4,
          marginBottom: 24, color: 'var(--text)',
        }}>
          {q.question}
        </h2>

        {q.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, oi) => {
              const isPicked = picked === oi
              const isOptCorrect = oi === correctVal
              const state = getOptionState(isAnswered, isPicked, isOptCorrect)
              const cls = getOptionClass(isAnswered, isPicked, isOptCorrect)
              const letter = String.fromCodePoint(65 + oi)

              return (
                <button
                  key={opt}
                  className={`${cls} w-full text-left`}
                  disabled={isAnswered}
                  onClick={() => onPick(oi)}
                >
                  <OptionCircle letter={letter} state={state} />
                  <span style={{
                    flex: 1, fontSize: 14.5, color: 'var(--text)',
                    fontWeight: (isPicked || isOptCorrect) && isAnswered ? 600 : 500,
                  }}>
                    {opt}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {isAnswered && q.explanation && (
          <div style={{
            marginTop: 22, padding: '16px 18px',
            background: isCorrect ? 'var(--green-bg)' : 'var(--red-bg)',
            borderLeft: `3px solid ${isCorrect ? 'var(--green)' : 'var(--red)'}`,
            borderRadius: '0 10px 10px 0',
            animation: 'fadeUp .25s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {isCorrect
                ? <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
                : <XCircle size={16} style={{ color: 'var(--red)' }} />
              }
              <span style={{
                fontSize: 12, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
                color: isCorrect ? 'var(--green)' : 'var(--red)',
              }}>
                {isCorrect ? 'Helyes' : 'Nem egészen'}
              </span>
            </div>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>
              {q.explanation}
            </p>
          </div>
        )}
      </div>

      <div style={{
        borderTop: '1px solid var(--border)', padding: '14px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button onClick={onPrev} disabled={idx === 0} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'var(--surface)', color: 'var(--text-sub)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700,
          cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1,
        }}>
          <ChevronLeft size={14} /> Előző
        </button>

        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {score} helyes · {Math.max(0, revealedCount - score)} hibás
        </span>

        <button onClick={onNext} disabled={!isAnswered} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)',
          borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700,
          cursor: isAnswered ? 'pointer' : 'not-allowed', opacity: isAnswered ? 1 : 0.4,
        }}>
          {isLast
            ? <><Flag size={14} /> Eredmény</>
            : <>Következő <ChevronRight size={14} /></>
          }
        </button>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function QuizClient({ questions, subjectSlug, subjectName }: Readonly<Props>) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number | boolean>>({})
  const [revealed, setRevealed] = useState<Record<number, true>>({})
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<Phase>('quiz')

  const q = questions[idx]

  const pick = useCallback((v: number) => {
    if (!q || revealed[idx]) return
    setAnswers((a) => ({ ...a, [idx]: v }))
    setRevealed((r) => ({ ...r, [idx]: true }))
    const correctVal = Array.isArray(q.correct) ? q.correct[0] : q.correct
    if (v === correctVal) {
      setScore((s) => s + 1)
    } else {
      saveWrong(subjectSlug, q.id)
    }
  }, [q, idx, revealed, subjectSlug])

  const goNext = useCallback(() => {
    if (idx + 1 >= questions.length) {
      updateStreak()
      setPhase('results')
    } else {
      setIdx((i) => i + 1)
    }
  }, [idx, questions.length])

  const restart = () => {
    setIdx(0); setAnswers({}); setRevealed({}); setScore(0); setPhase('quiz')
  }

  if (questions.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Még nincs kvízkérdés.</p>
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <ResultsView
        questions={questions} score={score}
        subjectSlug={subjectSlug} subjectName={subjectName}
        onRestart={restart}
      />
    )
  }

  const progress = (idx + 1) / questions.length

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '36px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="pill pill-accent">Kvíz · {subjectName ?? subjectSlug}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sub)' }}>{idx + 1} / {questions.length}</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 28 }}>
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <QuizCard
        q={q} idx={idx} total={questions.length}
        score={score} picked={answers[idx]}
        isAnswered={!!revealed[idx]}
        onPick={pick}
        onPrev={() => setIdx((i) => Math.max(0, i - 1))}
        onNext={goNext}
      />
    </main>
  )
}

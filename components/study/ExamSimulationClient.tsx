'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Clock, Play, ChevronRight, ChevronLeft,
  CheckCircle2, XCircle, Minus, Plus, Check,
  Flag, RotateCcw,
} from 'lucide-react'
import type { Question } from '@/lib/content'

interface Props {
  questions: Question[]
  subjectSlug: string
}

interface ExamQuestion {
  id: string
  type: 'mc' | 'written'
  question: string
  options?: string[]
  correct?: number
  model_answer?: string
  key_points?: string[]
  section: string
}

interface EvalResult {
  grade: 'correct' | 'partial' | 'incorrect'
  feedback: string
  score: number
}

interface ExamConfig {
  questions: ExamQuestion[]
  minutes: number
  showTimer: boolean
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${m}:${String(ss).padStart(2, '0')}`
}

function gradeLabel(pct: number): string {
  if (pct >= 85) return 'Excellent'
  if (pct >= 70) return 'Good'
  if (pct >= 55) return 'Passing'
  return 'Needs work'
}

function gradeEmoji(pct: number): string {
  if (pct >= 85) return '🏆'
  if (pct >= 70) return '👍'
  if (pct >= 55) return '📈'
  return '💪'
}

function gradeColor(pct: number): string {
  if (pct >= 85) return 'var(--green)'
  if (pct >= 70) return 'var(--blue)'
  if (pct >= 55) return 'var(--gold)'
  return 'var(--red)'
}

function reviewBorderColor(correct: boolean, partial: boolean): string {
  if (correct) return 'var(--green)'
  if (partial) return 'var(--gold)'
  return 'var(--red)'
}

function timerBg(timeLeft: number): string {
  return timeLeft < 120 ? 'var(--red-bg)' : 'var(--surface2)'
}

function timerBorderColor(timeLeft: number): string {
  return timeLeft < 120 ? 'rgba(192,80,74,0.4)' : 'var(--border)'
}

function timerColor(timeLeft: number): string {
  if (timeLeft < 120) return 'var(--red)'
  if (timeLeft < 300) return 'var(--gold)'
  return 'var(--green)'
}

function evalWrittenFeedback(hits: string[], keywords: string[]): string {
  if (hits.length > 0) {
    return 'Good answer. Key concepts covered: ' + hits.map((k) => '"' + k + '"').join(', ') + '.'
  }
  return 'Good answer. Relevant ideas covered.'
}

function evalWrittenPartialFeedback(keywords: string[], lower: string): string {
  const missing = keywords.filter((k) => !lower.includes(k.toLowerCase())).slice(0, 3)
  return 'Partially correct. Consider expanding on: ' + missing.map((k) => '"' + k + '"').join(', ') + '.'
}

function evalWritten(answer: string, q: ExamQuestion): EvalResult {
  const lower = (answer ?? '').toLowerCase()
  const keywords = q.key_points ?? []
  const hits = keywords.filter((k) => lower.includes(k.toLowerCase()))
  const wc = (answer ?? '').trim().split(/\s+/).filter(Boolean).length
  if (wc < 15) return { grade: 'incorrect', feedback: 'Answer too brief — aim for at least 2–3 sentences.', score: 0 }
  const pct = keywords.length > 0 ? hits.length / keywords.length : 0.5
  if (pct >= 0.6) return { grade: 'correct', feedback: evalWrittenFeedback(hits, keywords), score: 2 }
  if (pct >= 0.3) return { grade: 'partial', feedback: evalWrittenPartialFeedback(keywords, lower), score: 1 }
  return { grade: 'incorrect', feedback: 'Key concepts are missing. Review the material and try again.', score: 0 }
}

// ── STEPPER ──────────────────────────────────────────────────────────────────
function Stepper({ label, value, min, max, onChange, color }: Readonly<{
  label: string; value: number; min: number; max: number
  onChange: (v: number) => void; color: string
}>) {
  const atMax = max > 0 && value >= max
  const atMin = value <= min
  const overMax = max > 0 && value >= max
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: 'var(--surface)', border: `1px solid ${atMax ? color + '40' : 'var(--border)'}`, borderRadius: 12, transition: 'border-color 0.2s' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={atMin} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', cursor: atMin ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: atMin ? 'var(--border2)' : 'var(--text-sub)', opacity: atMin ? 0.4 : 1 }}>
          <Minus size={12} />
        </button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, minWidth: 48, justifyContent: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</span>
          {max > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>/{max}</span>}
        </div>
        <button onClick={() => onChange(Math.min(max > 0 ? max : 999, value + 1))} disabled={overMax} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', cursor: overMax ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: overMax ? 'var(--border2)' : 'var(--text-sub)', opacity: overMax ? 0.4 : 1 }}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}

function ToggleRow({ label, sub, checked, onChange, color }: Readonly<{ label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void; color: string }>) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '13px 16px', background: 'var(--surface)', border: `1px solid ${checked ? color + '45' : 'var(--border)'}`, borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.2s', fontFamily: 'inherit', textAlign: 'left' }}
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: sub ? 2 : 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
      <div style={{ width: 40, height: 22, borderRadius: 99, background: checked ? color : 'var(--border)', position: 'relative', transition: 'background 0.22s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.22s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }} />
      </div>
    </button>
  )
}

// ── RESULTS VIEW ─────────────────────────────────────────────────────────────
function ResultsView({ questions, answers, evalResults, onEnd }: Readonly<{
  questions: ExamQuestion[]
  answers: Record<string, string | number>
  evalResults: Record<string, EvalResult>
  onEnd: () => void
}>) {
  const mcQs = questions.filter((q) => q.type === 'mc')
  const wrQs = questions.filter((q) => q.type === 'written')
  const mcScore = mcQs.filter((q) => answers[q.id] === q.correct).length
  const wrScore = Object.values(evalResults).reduce((a, r) => a + r.score, 0)
  const wrMax = wrQs.length * 2
  const totalPts = mcScore + wrScore
  const maxPts = mcQs.length + wrMax
  const pct = maxPts > 0 ? Math.round((totalPts / maxPts) * 100) : 0

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px 80px' }} className="animate-fade-up">
      <div className="card" style={{ padding: '28px 24px', textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 32, marginBottom: 10 }}>{gradeEmoji(pct)}</p>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>{gradeLabel(pct)}</h2>
        <p style={{ fontSize: 38, fontWeight: 800, color: gradeColor(pct), letterSpacing: '-1px', lineHeight: 1 }}>{pct}%</p>
        <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 6 }}>{totalPts} / {maxPts} points</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          {mcQs.length > 0 && (
            <div style={{ background: 'var(--accent-bg)', borderRadius: 10, padding: '10px 16px' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{mcScore}/{mcQs.length}</p>
              <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>MC</p>
            </div>
          )}
          {wrQs.length > 0 && (
            <div style={{ background: 'var(--purple-bg)', borderRadius: 10, padding: '10px 16px' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--purple)' }}>{wrScore}/{wrMax}</p>
              <p style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700 }}>Written</p>
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Question Review</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {questions.map((q, i) => {
          const correct = q.type === 'mc' ? answers[q.id] === q.correct : evalResults[q.id]?.grade === 'correct'
          const partial = q.type === 'written' && evalResults[q.id]?.grade === 'partial'
          const col = reviewBorderColor(correct, partial)
          const typeColor = q.type === 'mc' ? 'var(--accent)' : 'var(--purple)'
          const typeBg = q.type === 'mc' ? 'var(--accent-bg)' : 'var(--purple-bg)'
          return (
            <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${col}`, borderRadius: '0 10px 10px 0', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', flexShrink: 0, minWidth: 20 }}>#{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: typeColor, background: typeBg, borderRadius: 20, padding: '1px 7px' }}>
                    {q.type === 'mc' ? 'MC' : 'Written'}
                  </span>
                  {correct && <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />}
                  {!correct && partial && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>Partial</span>}
                  {!correct && !partial && <XCircle size={13} style={{ color: 'var(--red)' }} />}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.4 }}>{q.question}</p>
                {q.type === 'written' && evalResults[q.id] && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{evalResults[q.id].feedback}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onEnd} style={{ flex: 1, padding: 13, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <RotateCcw size={14} /> New exam
        </button>
        <button onClick={onEnd} style={{ flex: 1, padding: 13, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: 'var(--text)', fontFamily: "'DM Sans', system-ui" }}>
          Back
        </button>
      </div>
    </div>
  )
}

// ── QUESTION CARD ─────────────────────────────────────────────────────────────
const MC_LABELS = ['A', 'B', 'C', 'D']

function McQuestion({ q, answer, onAnswer }: Readonly<{
  q: ExamQuestion
  answer: string | number | undefined
  onAnswer: (i: number) => void
}>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(q.options ?? []).map((opt, i) => {
        const isSel = answer === i
        return (
          <button
            key={q.id + '-' + i}
            onClick={() => onAnswer(i)}
            style={{ background: isSel ? 'var(--accent-bg2)' : 'var(--surface)', border: `1.5px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}
          >
            <span style={{ width: 26, height: 26, borderRadius: 7, background: isSel ? 'var(--accent)' : 'var(--surface2)', color: isSel ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
              {MC_LABELS[i]}
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text)', flex: 1, fontWeight: isSel ? 600 : 400 }}>{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

function WrittenQuestion({ q, answer, onAnswer }: Readonly<{
  q: ExamQuestion
  answer: string
  onAnswer: (v: string) => void
}>) {
  const wc = answer.trim().split(/\s+/).filter(Boolean).length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--purple-bg)', border: '1px solid rgba(155,109,217,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.5 }}>
        Write a complete answer in your own words. Aim for at least 3–4 sentences.
      </div>
      <textarea
        value={answer}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Type your answer here…"
        rows={5}
        style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid rgba(155,109,217,0.55)', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontFamily: "'Lora', Georgia, serif", color: 'var(--text)', lineHeight: 1.75, resize: 'none', outline: 'none', display: 'block', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--purple)' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(155,109,217,0.55)' }}
      />
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{wc} words</span>
    </div>
  )
}

// ── CONFIGURATOR ─────────────────────────────────────────────────────────────
function Configurator({ questions, onStart }: Readonly<{ questions: Question[]; onStart: (cfg: ExamConfig) => void }>) {
  const allSections = Array.from(new Set(questions.map((q) => q.section)))
  const [activeSections, setActiveSections] = useState<Set<string>>(new Set(allSections))
  const [mcCount, setMcCount] = useState(10)
  const [wrCount, setWrCount] = useState(2)
  const [minutes, setMinutes] = useState(30)
  const [doShuffle, setDoShuffle] = useState(true)
  const [showTimer, setShowTimer] = useState(true)

  const availMC = questions.filter((q) => activeSections.has(q.section) && (q.type === 'mcq' || q.type === 'multi')).length
  const availWR = questions.filter((q) => activeSections.has(q.section) && q.type === 'written').length
  const safeMc = Math.min(mcCount, availMC)
  const safeWr = Math.min(wrCount, availWR)
  const totalQ = safeMc + safeWr
  const cannotStart = totalQ === 0

  const sectionColors: Record<number, string> = {
    0: 'var(--accent)', 1: 'var(--blue)', 2: 'var(--gold)', 3: 'var(--green)', 4: 'var(--purple)',
  }

  const toggleSection = (sec: string) => {
    setActiveSections((prev) => {
      const next = new Set(prev)
      if (next.has(sec)) { if (next.size > 1) next.delete(sec) }
      else next.add(sec)
      return next
    })
  }

  const buildExam = () => {
    const mcPool = questions.filter((q) => activeSections.has(q.section) && (q.type === 'mcq' || q.type === 'multi'))
    const wrPool = questions.filter((q) => activeSections.has(q.section) && q.type === 'written')
    const mc: ExamQuestion[] = (doShuffle ? shuffle(mcPool) : mcPool).slice(0, safeMc).map((q) => ({
      id: q.id, type: 'mc' as const,
      question: q.question,
      options: q.options,
      correct: Array.isArray(q.correct) ? q.correct[0] : q.correct,
      section: q.section,
    }))
    const wr: ExamQuestion[] = (doShuffle ? shuffle(wrPool) : wrPool).slice(0, safeWr).map((q) => ({
      id: q.id, type: 'written' as const,
      question: q.question,
      model_answer: q.model_answer,
      key_points: q.key_points,
      section: q.section,
    }))
    const combined = doShuffle ? shuffle([...mc, ...wr]) : [...mc, ...wr]
    onStart({ questions: combined, minutes, showTimer })
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '36px 24px 80px' }} className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 6, color: 'var(--text)' }}>
          Configure your exam
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6 }}>
          Choose topics, set the question mix, and time limit.
        </p>
      </div>

      {/* Section picker */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Topics</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setActiveSections(new Set(allSections))} style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>All</button>
            <span style={{ color: 'var(--border2)' }}>·</span>
            <button onClick={() => setActiveSections(new Set([allSections[0]]))} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>None</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allSections.map((sec, idx) => {
            const active = activeSections.has(sec)
            const color = sectionColors[idx % 5]
            const secMC = questions.filter((q) => q.section === sec && (q.type === 'mcq' || q.type === 'multi')).length
            const secWR = questions.filter((q) => q.section === sec && q.type === 'written').length
            return (
              <button
                key={sec}
                type="button"
                onClick={() => toggleSection(sec)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', width: '100%', background: active ? color + '0e' : 'var(--surface)', border: `1.5px solid ${active ? color + '50' : 'var(--border)'}`, borderRadius: 11, cursor: 'pointer', transition: 'all 0.15s', opacity: active ? 1 : 0.55, fontFamily: 'inherit', textAlign: 'left' }}
              >
                <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: active ? color : 'transparent', border: `1.5px solid ${active ? color : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  {active && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--text)' : 'var(--text-sub)', flex: 1 }}>{sec}</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  {secMC > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text-muted)', background: active ? 'var(--accent-bg)' : 'var(--surface2)', borderRadius: 20, padding: '1px 7px' }}>{secMC} MC</span>}
                  {secWR > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: active ? 'var(--purple)' : 'var(--text-muted)', background: active ? 'var(--purple-bg)' : 'var(--surface2)', borderRadius: 20, padding: '1px 7px' }}>{secWR} W</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

      {/* Question mix */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Question Mix</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Stepper label="Multiple choice" value={safeMc} min={0} max={availMC} onChange={setMcCount} color="var(--accent)" />
          {availWR > 0 && <Stepper label="Written" value={safeWr} min={0} max={availWR} onChange={setWrCount} color="var(--purple)" />}
        </div>
        <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 10, display: 'flex', gap: 0 }}>
          {[
            { label: 'Total', val: totalQ, color: 'var(--text)', border: true },
            { label: 'MC', val: safeMc, color: 'var(--accent)', border: availWR > 0 },
            ...(availWR > 0 ? [{ label: 'Written', val: safeWr, color: 'var(--purple)', border: false }] : []),
          ].map(({ label, val, color, border }) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: border ? '1px solid var(--border)' : 'none', padding: '0 8px' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{val}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Time */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Time Limit</p>
        <Stepper label={`${minutes} minutes`} value={minutes} min={5} max={180} onChange={setMinutes} color="var(--gold)" />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 7, paddingLeft: 2 }}>
          ≈ {totalQ > 0 ? Math.round((minutes * 60) / totalQ) : '—'}s per question
        </p>
      </div>

      {/* Options */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Options</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleRow label="Show timer" sub="Visible countdown during the exam" checked={showTimer} onChange={setShowTimer} color="var(--gold)" />
          <ToggleRow label="Shuffle questions" sub="Randomise the order" checked={doShuffle} onChange={setDoShuffle} color="var(--green)" />
        </div>
      </div>

      <button
        onClick={buildExam}
        disabled={cannotStart}
        style={{ width: '100%', padding: 15, background: cannotStart ? 'var(--border)' : 'var(--accent)', color: cannotStart ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: cannotStart ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'background 0.15s' }}
        onMouseEnter={(e) => { if (cannotStart === false) e.currentTarget.style.background = 'var(--accent-hov)' }}
        onMouseLeave={(e) => { if (cannotStart === false) e.currentTarget.style.background = 'var(--accent)' }}
      >
        <Play size={16} /> Start exam · {totalQ} question{totalQ !== 1 ? 's' : ''}
      </button>
    </div>
  )
}

type SlideDir = 'idle' | 'out-left' | 'out-right' | 'in'

function getSlideStyle(dir: SlideDir): React.CSSProperties {
  if (dir === 'idle') return { opacity: 1, transform: 'translateX(0) scale(1)', transition: 'opacity 0.24s ease, transform 0.28s cubic-bezier(0.22,1,0.36,1)' }
  if (dir === 'in') return { opacity: 0, transform: 'translateX(0) scale(0.98)', transition: 'none' }
  const tx = dir === 'out-left' ? 'translateX(-36px) scale(0.97)' : 'translateX(36px) scale(0.97)'
  return { opacity: 0, transform: tx, transition: 'opacity 0.16s, transform 0.18s ease' }
}

function applySlideIn(
  nextIdx: number,
  setIdx: (n: number) => void,
  setSlideDir: (d: SlideDir) => void,
) {
  setIdx(nextIdx)
  setSlideDir('in')
  setTimeout(() => setSlideDir('idle'), 20)
}

function navigateSlide(
  dir: number,
  idx: number,
  total: number,
  setIdx: (n: number) => void,
  setSlideDir: (d: SlideDir) => void,
) {
  const next = idx + dir
  if (next < 0 || next >= total) return
  setSlideDir(dir > 0 ? 'out-left' : 'out-right')
  setTimeout(() => applySlideIn(next, setIdx, setSlideDir), 180)
}

// ── EXAM SESSION ─────────────────────────────────────────────────────────────
function ExamSession({ config, onEnd }: Readonly<{ config: ExamConfig; onEnd: () => void }>) {
  const { questions, minutes, showTimer } = config
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [timeLeft, setTimeLeft] = useState(minutes * 60)
  const [submitted, setSubmitted] = useState(false)
  const [evalResults, setEvalResults] = useState<Record<string, EvalResult>>({})
  const [slideDir, setSlideDir] = useState<SlideDir>('idle')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const q = questions[idx]
  const answeredCount = Object.keys(answers).length
  const flaggedCount = Object.values(flagged).filter(Boolean).length

  const handleSubmitAll = useCallback(() => {
    const evals: Record<string, EvalResult> = {}
    questions.filter((q) => q.type === 'written').forEach((q) => {
      evals[q.id] = evalWritten(String(answers[q.id] ?? ''), q)
    })
    setEvalResults(evals)
    setSubmitted(true)
  }, [questions, answers])

  useEffect(() => {
    if (submitted) return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t > 1) return t - 1
        clearInterval(timerRef.current ?? undefined)
        handleSubmitAll()
        return 0
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [submitted, handleSubmitAll])

  const navigate = (dir: number) => navigateSlide(dir, idx, questions.length, setIdx, setSlideDir)

  const slideStyle = getSlideStyle(slideDir)

  if (submitted) {
    return <ResultsView questions={questions} answers={answers} evalResults={evalResults} onEnd={onEnd} />
  }

  const tColor = timerColor(timeLeft)
  const toggleFlag = () => setFlagged((p) => ({ ...p, [q.id]: !p[q.id] }))

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px 120px' }}>
      {/* Progress + timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${((idx + 1) / questions.length) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{idx + 1}/{questions.length}</span>
        {showTimer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: timerBg(timeLeft), border: `1px solid ${timerBorderColor(timeLeft)}`, borderRadius: 8, padding: '4px 10px', transition: 'all 0.3s' }}>
            <Clock size={12} style={{ color: tColor }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: tColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px' }}>{fmtTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{answeredCount}/{questions.length} answered</span>
        {flaggedCount > 0 && (
          <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Flag size={10} />{flaggedCount} flagged
          </span>
        )}
      </div>

      {/* Question card */}
      <div style={slideStyle}>
        <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.7px', color: q.type === 'mc' ? 'var(--accent)' : 'var(--purple)' }}>
                  {q.type === 'mc' ? 'MULTIPLE CHOICE' : 'WRITTEN'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{q.section}</span>
              </div>
              <button
                onClick={toggleFlag}
                style={{ background: flagged[q.id] ? 'var(--gold-bg)' : 'none', border: `1px solid ${flagged[q.id] ? 'rgba(196,154,60,0.5)' : 'var(--border)'}`, borderRadius: 7, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: flagged[q.id] ? 'var(--gold)' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s' }}
              >
                <Flag size={11} />{flagged[q.id] ? 'Flagged' : 'Flag'}
              </button>
            </div>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 700, lineHeight: 1.48, color: 'var(--text)' }}>{q.question}</h2>
          </div>

          <div style={{ padding: '18px 20px' }}>
            {q.type === 'mc' && (
              <McQuestion
                q={q}
                answer={answers[q.id]}
                onAnswer={(i) => setAnswers((p) => ({ ...p, [q.id]: i }))}
              />
            )}
            {q.type === 'written' && (
              <WrittenQuestion
                q={q}
                answer={String(answers[q.id] ?? '')}
                onAnswer={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg)', borderTop: '1px solid var(--border)', padding: '12px 20px 20px', zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', gap: 10 }}>
          <button onClick={() => navigate(-1)} disabled={idx === 0} style={{ width: 48, height: 48, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: idx === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', opacity: idx === 0 ? 0.35 : 1, flexShrink: 0 }}>
            <ChevronLeft size={18} />
          </button>
          {idx < questions.length - 1 ? (
            <button onClick={() => navigate(1)} style={{ flex: 1, height: 48, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hov)' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)' }}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmitAll} style={{ flex: 1, height: 48, background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <CheckCircle2 size={16} /> Submit exam
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export function ExamSimulationClient({ questions }: Readonly<Props>) {
  const [phase, setPhase] = useState<'config' | 'exam'>('config')
  const [config, setConfig] = useState<ExamConfig | null>(null)

  return (
    <>
      {phase === 'config' && (
        <Configurator
          questions={questions}
          onStart={(cfg) => { setConfig(cfg); setPhase('exam') }}
        />
      )}
      {phase === 'exam' && config && (
        <ExamSession config={config} onEnd={() => setPhase('config')} />
      )}
    </>
  )
}

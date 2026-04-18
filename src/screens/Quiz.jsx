'use client'
import { useState, useEffect } from 'react'
import {
  CheckCircle2, XCircle, ChevronRight,
  RotateCcw, Zap, BookOpen, AlertTriangle,
  Clock, Target, TrendingUp,
} from 'lucide-react'
import { useTheme, navigate } from '../store'
import { C } from '../theme'
import { playSound } from '../sounds'

const LABELS = ['A', 'B', 'C', 'D']

function sameSet(a = [], b = []) {
  if (a.length !== b.length) return false
  return [...a].sort().join(',') === [...b].sort().join(',')
}

function formatTime(s) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function scoreGrade(pct) {
  if (pct >= 90) return { label: 'Excellent', color: C.green, emoji: '🏆' }
  if (pct >= 75) return { label: 'Good',      color: C.blue,  emoji: '👍' }
  if (pct >= 60) return { label: 'Passing',   color: C.gold,  emoji: '📈' }
  return               { label: 'Keep going', color: C.red,   emoji: '💪' }
}

function Progress({ total, current, results, t }) {
  return (
    <div>
      <div style={{ height: 3, background: t.border, borderRadius: 99, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{
          width: `${(current / total) * 100}%`, height: '100%',
          background: C.accent, borderRadius: 99,
          transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 28 }}>
        {Array.from({ length: total }, (_, i) => {
          const s = i < current
            ? (results[i] === 'correct' ? 'correct' : 'wrong')
            : i === current ? 'active' : 'future'
          const bg = { correct: C.green, wrong: C.red, active: C.accent, future: t.border }[s]
          return (
            <div key={i} style={{
              width: s === 'active' ? 22 : 7, height: 7,
              borderRadius: 99, background: bg,
              opacity: s === 'future' ? 0.3 : 1,
              transition: 'width 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.22s',
            }} />
          )
        })}
      </div>
    </div>
  )
}

function QuestionCard({ q, qIdx, total, selected, submitted, onSelect, onSubmit, onNext, phase, t }) {
  const isMulti = q.type === 'multi'
  const selectedList = Array.isArray(selected) ? selected : selected == null ? [] : [selected]
  const correctList = isMulti ? (q.correctMultiple ?? []) : [q.correct]
  const hasSelection = isMulti ? selectedList.length > 0 : selected !== null
  const isCorrect = submitted && (isMulti ? sameSet(selectedList, correctList) : selected === q.correct)
  const buttonLabel = !submitted ? 'Submit' : qIdx < total - 1 ? 'Next question →' : 'See results →'

  const phaseStyle = {
    idle:  { opacity: 1, transform: 'translateX(0) scale(1)' },
    exit:  { opacity: 0, transform: 'translateX(-48px) scale(0.97)' },
    enter: { opacity: 0, transform: 'translateX(32px) scale(0.97)' },
  }[phase] || {}
  const phaseTransition = phase === 'idle'
    ? 'opacity 350ms ease, transform 350ms cubic-bezier(0.22,1,0.36,1)'
    : phase === 'exit' ? 'opacity 240ms ease, transform 240ms cubic-bezier(0.55,0,1,0.7)'
    : 'none'

  return (
    <div style={{ ...phaseStyle, transition: phaseTransition }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{
          background: t.surface2, border: `1px solid ${t.border}`,
          borderRadius: 20, padding: '4px 12px',
          fontSize: 11, fontWeight: 700, color: t.textSub,
        }}>{q.section}</span>
        {q.difficulty && (
          <span style={{
            background: q.difficulty === 'advanced' ? `${C.gold}14` : `${C.blue}14`,
            border: `1px solid ${q.difficulty === 'advanced' ? C.gold : C.blue}35`,
            borderRadius: 20, padding: '4px 12px',
            fontSize: 11, fontWeight: 700,
            color: q.difficulty === 'advanced' ? C.gold : C.blue,
          }}>{q.difficulty}</span>
        )}
        {isMulti && (
          <span style={{
            background: `${C.purple}14`,
            border: `1px solid ${C.purple}35`,
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 700,
            color: C.purple,
          }}>multi-select</span>
        )}
        <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 'auto' }}>{qIdx + 1} / {total}</span>
      </div>

      <h2 style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 19, fontWeight: 700, lineHeight: 1.5,
        letterSpacing: '-0.2px', marginBottom: 24, color: t.text,
      }}>
        {q.q}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {(q.options || []).map((opt, oi) => {
          const isSelected   = selectedList.includes(oi)
          const isCorrectOpt = submitted && correctList.includes(oi)
          const isWrongOpt   = submitted && isSelected && !correctList.includes(oi)

          let bg, border, labelBg, labelColor
          if (isCorrectOpt) {
            bg = `${C.green}14`; border = `2px solid ${C.green}70`
            labelBg = C.green; labelColor = '#fff'
          } else if (isWrongOpt) {
            bg = `${C.red}10`; border = `2px solid ${C.red}60`
            labelBg = C.red; labelColor = '#fff'
          } else if (isSelected && !submitted) {
            bg = `${C.accent}16`; border = `2px solid ${C.accent}`
            labelBg = C.accent; labelColor = '#fff'
          } else {
            bg = t.surface; border = `1.5px solid ${t.border}`
            labelBg = t.surface2; labelColor = t.textMuted
          }

          return (
            <button
              key={oi}
              onClick={() => !submitted && onSelect(isMulti
                ? (isSelected ? selectedList.filter(v => v !== oi) : [...selectedList, oi])
                : oi
              )}
              style={{
                background: bg, border, borderRadius: 12,
                padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                cursor: submitted ? 'default' : 'pointer',
                textAlign: 'left', width: '100%',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (!submitted && !isSelected) e.currentTarget.style.borderColor = `${C.accent}60` }}
              onMouseLeave={e => { if (!submitted && !isSelected) e.currentTarget.style.borderColor = t.border }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: labelBg, color: labelColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, transition: 'all 0.15s',
              }}>{LABELS[oi]}</span>
              <span style={{ fontSize: 14, lineHeight: 1.55, color: t.text, fontWeight: isCorrectOpt ? 600 : 400, flex: 1 }}>
                {opt}
                {isCorrectOpt && !isWrongOpt && <span style={{ marginLeft: 8, fontSize: 11, color: C.green, fontWeight: 700 }}>✓ correct</span>}
                {isWrongOpt && <span style={{ marginLeft: 8, fontSize: 11, color: C.red, fontWeight: 700 }}>✗ your answer</span>}
              </span>
              {isCorrectOpt && <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0, marginTop: 2 }} />}
            </button>
          )
        })}
      </div>

      {submitted && q.explain && (
        <div style={{
          background: isCorrect ? `${C.green}14` : `${C.red}10`,
          border: `1px solid ${isCorrect ? C.green : C.red}30`,
          borderLeft: `3px solid ${isCorrect ? C.green : C.red}`,
          borderRadius: '0 10px 10px 0',
          padding: '14px 16px', display: 'flex', gap: 10,
          alignItems: 'flex-start', marginBottom: 24,
          animation: 'explanationIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          {isCorrect
            ? <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
            : <XCircle     size={16} style={{ color: C.red,   flexShrink: 0, marginTop: 1 }} />
          }
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.5px', color: isCorrect ? C.green : C.red, marginBottom: 4 }}>
              {isCorrect ? 'CORRECT — well done!' : 'INCORRECT — review this'}
            </p>
            <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6 }}>{q.explain}</p>
          </div>
        </div>
      )}

      <button
        disabled={!hasSelection && !submitted}
        onClick={submitted ? onNext : onSubmit}
        style={{
          width: '100%', padding: '15px',
          background: hasSelection || submitted ? C.accent : t.border,
          color: hasSelection || submitted ? '#fff' : t.textMuted,
          border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 700,
          cursor: hasSelection || submitted ? 'pointer' : 'not-allowed',
          fontFamily: "'DM Sans', system-ui",
          transition: 'background 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => { if (hasSelection || submitted) e.currentTarget.style.background = C.accentHov }}
        onMouseLeave={e => { if (hasSelection || submitted) e.currentTarget.style.background = C.accent }}
      >
        {buttonLabel}
        {submitted && <ChevronRight size={16} />}
      </button>
    </div>
  )
}

function SectionBreakdown({ questions, results, t }) {
  const sections = {}
  questions.forEach((q, i) => {
    if (!sections[q.section]) sections[q.section] = { total: 0, correct: 0 }
    sections[q.section].total++
    if (results[i] === 'correct') sections[q.section].correct++
  })
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: t.textMuted }}>BY SECTION</p>
      </div>
      {Object.entries(sections).map(([sec, { total, correct }], i, arr) => {
        const pct = Math.round((correct / total) * 100)
        const col = pct >= 80 ? C.green : pct >= 60 ? C.gold : C.red
        return (
          <div key={sec} style={{
            padding: '14px 20px', borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: t.text }}>{sec}</span>
            <div style={{ width: 90, height: 4, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 99, transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: col, minWidth: 48, textAlign: 'right' }}>{correct}/{total}</span>
          </div>
        )
      })}
    </div>
  )
}

function ResultsView({ questions, results, answers, timeTaken, subjectId, subjectName, t, onRetry }) {
  const [showAll, setShowAll] = useState(false)
  const correctCount = results.filter(r => r === 'correct').length
  const wrongCount = questions.length - correctCount
  const pct = Math.round((correctCount / questions.length) * 100)
  const grade = scoreGrade(pct)
  const avgTime = Math.round(timeTaken / questions.length)

  const R = 52, STROKE = 6
  const circ = 2 * Math.PI * R
  const dash = (pct / 100) * circ

  const wrongQs   = questions.filter((_, i) => results[i] === 'wrong')
  const correctQs = questions.filter((_, i) => results[i] === 'correct')

  const saveWrongAnswers = () => {
    if (!subjectId) return
    const key = `wrongAnswers:${subjectId}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const newIds = wrongQs.map(q => String(q.id))
    const merged = [...new Set([...existing, ...newIds])]
    localStorage.setItem(key, JSON.stringify(merged))
    // Save timestamps so WrongAnswers screen can show relative dates
    const dateKey = `wrongAnswerDates:${subjectId}`
    const existingDates = JSON.parse(localStorage.getItem(dateKey) || '{}')
    const metaKey = `wrongAnswerMeta:${subjectId}`
    const existingMeta = JSON.parse(localStorage.getItem(metaKey) || '{}')
    const now = Date.now()
    const newDates = wrongQs.reduce((acc, q) => ({ ...acc, [q.id]: now }), {})
    const newMeta = wrongQs.reduce((acc, q) => ({ ...acc, [q.id]: { selected: answers[q.id], date: now } }), {})
    localStorage.setItem(dateKey, JSON.stringify({ ...existingDates, ...newDates }))
    localStorage.setItem(metaKey, JSON.stringify({ ...existingMeta, ...newMeta }))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { saveWrongAnswers() }, [])

  return (
    <div style={{ animation: 'fadeUp 0.38s ease both' }}>
      {/* Hero */}
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 20, padding: '36px 32px',
        display: 'flex', alignItems: 'center', gap: 36,
        marginBottom: 24, flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={65} cy={65} r={R} fill="none" stroke={t.surface2} strokeWidth={STROKE} />
            <circle cx={65} cy={65} r={R} fill="none" stroke={grade.color} strokeWidth={STROKE}
              strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
              style={{ animation: `arcGrow 900ms cubic-bezier(0.22,1,0.36,1) both 200ms` }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: t.text, lineHeight: 1, letterSpacing: '-1px' }}>{pct}%</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: grade.color, marginTop: 2 }}>{grade.label}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{grade.emoji}</span>
            <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', color: t.text }}>
              {grade.label} work
            </h1>
          </div>
          <p style={{ fontSize: 14, color: t.textSub, marginBottom: 20, lineHeight: 1.5 }}>
            {questions.length} questions completed
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { icon: CheckCircle2, label: 'Correct',    val: correctCount,       color: C.green, bg: `${C.green}14`  },
              { icon: XCircle,      label: 'Wrong',      val: wrongCount,         color: C.red,   bg: `${C.red}10`    },
              { icon: Clock,        label: 'Avg / Q',    val: formatTime(avgTime),color: C.blue,  bg: `${C.blue}14`   },
              { icon: Target,       label: 'Total time', val: formatTime(timeTaken), color: C.gold, bg: `${C.gold}14` },
            ].map(({ icon: Icon, label, val, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} style={{ color }} />
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1 }}>{val}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color, marginTop: 2, letterSpacing: '0.3px' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionBreakdown questions={questions} results={results} t={t} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
        {wrongCount > 0 && (
          <button
            onClick={() => navigate('/wrong-answers', { id: subjectId, name: subjectName })}
            style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', system-ui", display: 'inline-flex', alignItems: 'center', gap: 7 }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentHov}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
          >
            <AlertTriangle size={14} /> Retry {wrongCount} wrong answers
          </button>
        )}
        <button
          onClick={() => navigate('/flashcards', { id: subjectId, name: subjectName })}
          style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '11px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: t.text, fontFamily: "'DM Sans', system-ui", display: 'inline-flex', alignItems: 'center', gap: 7 }}
        >
          <Zap size={14} style={{ color: C.accent }} /> Flashcards
        </button>
        <button
          onClick={onRetry}
          style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '11px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: t.text, fontFamily: "'DM Sans', system-ui", display: 'inline-flex', alignItems: 'center', gap: 7 }}
        >
          <RotateCcw size={14} /> New quiz
        </button>
      </div>

      {/* Wrong answers */}
      {wrongQs.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={15} style={{ color: C.red }} />
            <p style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Needs review</p>
            <span style={{ background: `${C.red}14`, color: C.red, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20, border: `1px solid ${C.red}30` }}>{wrongQs.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {wrongQs.map((q, i) => {
              const origIdx = questions.indexOf(q)
              return (
                <div key={q.id} style={{
                  background: t.surface, border: `1px solid ${t.border}`,
                  borderLeft: `3px solid ${C.red}`, borderRadius: '0 12px 12px 0',
                  padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <XCircle size={16} style={{ color: C.red, flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted }}>Q{origIdx + 1} · {q.section}</span>
                    <p style={{ fontSize: 14, fontWeight: 500, color: t.text, lineHeight: 1.5, marginTop: 2 }}>{q.q}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Correct answers */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={15} style={{ color: C.green }} />
            <p style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Correct answers</p>
            <span style={{ background: `${C.green}14`, color: C.green, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20, border: `1px solid ${C.green}30` }}>{correctQs.length}</span>
          </div>
          <button
            onClick={() => setShowAll(s => !s)}
            style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: t.textSub, fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {showAll ? 'Hide' : 'Show all'}
          </button>
        </div>
        {showAll && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {correctQs.map((q) => {
              const origIdx = questions.indexOf(q)
              return (
                <div key={q.id} style={{
                  background: t.surface, border: `1px solid ${t.border}`,
                  borderLeft: `3px solid ${C.green}`, borderRadius: '0 12px 12px 0',
                  padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted }}>Q{origIdx + 1} · {q.section}</span>
                    <p style={{ fontSize: 14, fontWeight: 500, color: t.text, lineHeight: 1.5, marginTop: 2 }}>{q.q}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {!showAll && correctQs.length > 0 && (
          <div
            onClick={() => setShowAll(true)}
            style={{
              background: t.surface, border: `1px solid ${t.border}`,
              borderLeft: `3px solid ${C.green}`, borderRadius: '0 12px 12px 0',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}
          >
            <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: t.textSub }}>{correctQs.length} questions answered correctly — click to expand</span>
            <ChevronRight size={14} style={{ color: t.textMuted, marginLeft: 'auto' }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Quiz({ subjectId, section }) {
  const t = useTheme()
  const [allQuestions, setAllQuestions] = useState([])
  const [questions, setQuestions]       = useState([])
  const [qIdx, setQIdx]       = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState([])
  const [phase, setPhase]     = useState('idle')
  const [done, setDone]       = useState(false)
  const [startTime]           = useState(() => Date.now())
  const [timeTaken, setTimeTaken] = useState(0)

  useEffect(() => {
    if (!subjectId) return
    const qs = section ? `?section=${encodeURIComponent(section)}` : ''
    fetch(`/api/questions/${subjectId}${qs}`)
      .then(r => r.json())
      .then(data => {
        const mcOnly = data.filter(q => (q.type === 'mc' || q.type === 'mcq' || q.type === 'multi') && q.options?.length > 0)
        setAllQuestions(mcOnly)
        setQuestions(mcOnly.slice(0, 20))
      })
      .catch(() => {})
  }, [subjectId, section])

  const q = questions[qIdx]
  const busy = phase !== 'idle'

  const handleSubmit = () => {
    const hasSelection = Array.isArray(selected) ? selected.length > 0 : selected !== null
    if (!hasSelection || submitted) return
    setSubmitted(true)
    setAnswers(p => ({ ...p, [q.id]: selected }))
    const correct = q.type === 'multi'
      ? sameSet(selected, q.correctMultiple ?? [])
      : selected === q.correct
    playSound(correct ? 'correct' : 'wrong')
    setResults(r => [...r, correct ? 'correct' : 'wrong'])
  }

  const handleNext = () => {
    if (busy) return
    setPhase('exit')
    setTimeout(() => {
      const next = qIdx + 1
      if (next >= questions.length) {
        setTimeTaken(Math.round((Date.now() - startTime) / 1000))
        setDone(true)
        return
      }
      setPhase('enter')
      setSelected(null)
      setSubmitted(false)
      setTimeout(() => { setQIdx(next); setPhase('idle') }, 40)
    }, 260)
  }

  const handleRetry = () => {
    setQuestions(allQuestions.slice(0, 20))
    setQIdx(0); setSelected(null); setSubmitted(false)
    setAnswers({}); setResults([]); setPhase('idle'); setDone(false)
  }

  if (!questions.length) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: t.textMuted }}>Loading…</div>
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes explanationIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        @keyframes arcGrow { from{stroke-dasharray:0 327} to{stroke-dasharray:var(--dash,0) 327} }
      `}</style>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>
        {done ? (
          <ResultsView
            questions={questions}
            results={results}
            answers={answers}
            timeTaken={timeTaken}
            subjectId={subjectId}
            t={t}
            onRetry={handleRetry}
          />
        ) : (
          <>
            <Progress total={questions.length} current={qIdx} results={results} t={t} />
            <QuestionCard
              q={q} qIdx={qIdx} total={questions.length}
              selected={selected} submitted={submitted}
              onSelect={setSelected} onSubmit={handleSubmit} onNext={handleNext}
              phase={phase} t={t}
            />
          </>
        )}
      </main>
    </>
  )
}

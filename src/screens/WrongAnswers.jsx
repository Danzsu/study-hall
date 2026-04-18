'use client'
import { useState, useEffect } from 'react'
import {
  RotateCcw, CheckCircle2, XCircle,
  Zap, BookOpen, ChevronRight,
} from 'lucide-react'
import { useTheme, navigate } from '../store'
import { C } from '../theme'

const LABELS = ['A', 'B', 'C', 'D']

function sameSet(a = [], b = []) {
  if (a.length !== b.length) return false
  return [...a].sort().join(',') === [...b].sort().join(',')
}

function relativeDate(ts) {
  const days = Math.floor((Date.now() - ts) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return `${Math.floor(days / 7)}w ago`
}

function AttemptBadge({ attempts }) {
  const color = attempts >= 3 ? C.red : attempts === 2 ? C.gold : C.accent
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.4px',
      color, background: `${color}18`, border: `1px solid ${color}35`,
      borderRadius: 20, padding: '2px 8px', fontFamily: "'DM Sans', system-ui",
    }}>
      {attempts}× missed
    </span>
  )
}

function PrevHint({ q, t, visible }) {
  const previous = Array.isArray(q.previousChoice) ? q.previousChoice : [q.previousChoice].filter(v => v !== undefined && v !== null)
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '10px 14px', background: `${C.red}10`,
      border: `1px solid ${C.red}30`, borderRadius: 10, marginBottom: 20,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-6px)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
      pointerEvents: 'none',
    }}>
      <XCircle size={14} style={{ color: C.red, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.red }}>Last time you chose</p>
          {q.previousDate && (
            <span style={{ fontSize: 10, fontWeight: 600, color: t.textMuted }}>{q.previousDate}</span>
          )}
        </div>
        <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.4 }}>
          {previous.length > 0
            ? previous.map(i => `${LABELS[i]}. ${q.options[i]}`).join(' | ')
            : 'Saved as a mistake in the last quiz session.'}
        </p>
      </div>
    </div>
  )
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{
          background: t.surface2, border: `1px solid ${t.border}`,
          borderRadius: 20, padding: '4px 12px',
          fontSize: 11, fontWeight: 700, color: t.textSub,
        }}>{q.section}</span>
        <AttemptBadge attempts={q.attempts} />
        <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 'auto' }}>{qIdx + 1} / {total}</span>
      </div>

      <PrevHint q={q} t={t} visible={!submitted} />

      <h2 style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 19, fontWeight: 700, lineHeight: 1.5,
        letterSpacing: '-0.2px', marginBottom: 24, color: t.text,
      }}>
        {q.q}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {q.options.map((opt, oi) => {
          const previousList = Array.isArray(q.previousChoice) ? q.previousChoice : [q.previousChoice]
          const isSelected   = selectedList.includes(oi)
          const isCorrectOpt = submitted && correctList.includes(oi)
          const isWrongOpt   = submitted && isSelected && !correctList.includes(oi)
          const wasPrev      = submitted && previousList.includes(oi) && !correctList.includes(oi)

          let bg, border, labelBg, labelColor
          if (isCorrectOpt) {
            bg = `${C.green}14`; border = `2px solid ${C.green}70`
            labelBg = C.green; labelColor = '#fff'
          } else if (isWrongOpt) {
            bg = `${C.red}10`; border = `2px solid ${C.red}60`
            labelBg = C.red; labelColor = '#fff'
          } else if (wasPrev) {
            bg = `${C.red}08`; border = `1.5px dashed ${C.red}40`
            labelBg = `${C.red}20`; labelColor = C.red
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
                padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
                cursor: submitted ? 'default' : 'pointer',
                textAlign: 'left', width: '100%', transition: 'all 0.15s ease',
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
                {wasPrev && !isSelected && <span style={{ marginLeft: 8, fontSize: 11, color: C.red, fontWeight: 600, opacity: 0.7 }}>← previous mistake</span>}
              </span>
              {isCorrectOpt && <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0, marginTop: 2 }} />}
            </button>
          )
        })}
      </div>

      {submitted && (
        <div style={{
          background: isCorrect ? `${C.green}14` : `${C.red}10`,
          border: `1px solid ${isCorrect ? C.green : C.red}30`,
          borderLeft: `3px solid ${isCorrect ? C.green : C.red}`,
          borderRadius: '0 10px 10px 0',
          padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
          marginBottom: 24, animation: 'explanationIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          {isCorrect
            ? <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
            : <XCircle     size={16} style={{ color: C.red,   flexShrink: 0, marginTop: 1 }} />
          }
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.5px', color: isCorrect ? C.green : C.red, marginBottom: 4 }}>
              {isCorrect ? 'CORRECT — well done!' : 'INCORRECT — this question will repeat'}
            </p>
            {q.explain && <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6 }}>{q.explain}</p>}
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
          border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
          cursor: hasSelection || submitted ? 'pointer' : 'not-allowed',
          fontFamily: "'DM Sans', system-ui", transition: 'background 0.15s',
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

function SessionResults({ questions, results, t, subjectId, onRetry, onRetryWrong }) {
  const correctCount = results.filter(r => r === 'correct').length
  const pct = Math.round((correctCount / questions.length) * 100)
  const stillWrong  = questions.filter((_, i) => results[i] === 'wrong')
  const nowCorrect  = questions.filter((_, i) => results[i] === 'correct')
  const improved    = nowCorrect.filter(q => q.attempts > 1).length

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 20, padding: '32px 28px', textAlign: 'center', marginBottom: 20,
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>
          {pct === 100 ? '🎉' : pct >= 60 ? '💪' : '📖'}
        </div>
        <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 24, fontWeight: 700, marginBottom: 6, color: t.text }}>
          {pct === 100 ? 'All cleared!' : pct >= 60 ? 'Making progress' : 'Keep practising'}
        </h2>
        <p style={{ fontSize: 14, color: t.textSub, marginBottom: 24 }}>{questions.length} wrong answers reviewed</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Now correct', val: correctCount,     color: C.green, bg: `${C.green}14` },
            { label: 'Still wrong', val: stillWrong.length, color: C.red,   bg: `${C.red}10`  },
            { label: 'Improved',    val: improved,          color: C.gold,  bg: `${C.gold}14` },
          ].map(({ label, val, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 18px', minWidth: 88 }}>
              <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{val}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color, marginTop: 3 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {stillWrong.length > 0 && (
          <button
            onClick={onRetryWrong}
            style={{
              background: C.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '15px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', system-ui",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentHov}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
          >
            <RotateCcw size={15} />
            Retry {stillWrong.length} still-wrong question{stillWrong.length > 1 ? 's' : ''}
          </button>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onRetry} style={{ flex: 1, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: t.text, fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <RotateCcw size={14} /> Restart all
          </button>
          <button onClick={() => navigate('/flashcards', { id: subjectId })} style={{ flex: 1, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: t.text, fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <Zap size={14} style={{ color: C.accent }} /> Flashcards
          </button>
          <button onClick={() => navigate('/study', { id: subjectId })} style={{ flex: 1, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: t.text, fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <BookOpen size={14} style={{ color: C.blue }} /> Study notes
          </button>
        </div>
      </div>

      {[
        { label: 'Still need work',      qs: stillWrong, color: C.red,   icon: XCircle      },
        { label: 'Cleared this session', qs: nowCorrect, color: C.green, icon: CheckCircle2 },
      ].map(({ label, qs, color, icon: Icon }) => qs.length > 0 && (
        <div key={label} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon size={14} style={{ color }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: t.text }}>{label}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 20, padding: '2px 8px' }}>{qs.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {qs.map(q => (
              <div key={q.id} style={{
                background: t.surface, border: `1px solid ${t.border}`,
                borderLeft: `3px solid ${color}`, borderRadius: '0 10px 10px 0',
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Icon size={14} style={{ color, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.4, flex: 1 }}>{q.q}</p>
                <AttemptBadge attempts={q.attempts + (qs === stillWrong ? 1 : 0)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function WrongAnswers({ subjectId }) {
  const t = useTheme()
  const [questions, setQuestions] = useState([])
  const [qIdx, setQIdx]         = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults]   = useState([])
  const [phase, setPhase]       = useState('idle')
  const [done, setDone]         = useState(false)

  useEffect(() => {
    if (!subjectId) return
    const wrongIds = JSON.parse(localStorage.getItem(`wrongAnswers:${subjectId}`) || '[]')
    const attempts = JSON.parse(localStorage.getItem(`wrongAttemptsCount:${subjectId}`) || '{}')

    const dates = JSON.parse(localStorage.getItem(`wrongAnswerDates:${subjectId}`) || '{}')
    const meta = JSON.parse(localStorage.getItem(`wrongAnswerMeta:${subjectId}`) || '{}')
    fetch(`/api/questions/${subjectId}`)
      .then(r => r.json())
      .then(data => {
        const mcOnly = data.filter(q => (q.type === 'mc' || q.type === 'mcq' || q.type === 'multi') && q.options?.length > 0)
        const wrong  = wrongIds.length > 0
          ? mcOnly.filter(q => wrongIds.includes(String(q.id)))
          : mcOnly.slice(0, 5)
        const enriched = wrong.map(q => ({
          ...q,
          attempts: attempts[q.id] ?? 1,
          previousChoice: meta[q.id]?.selected ?? 0,
          previousDate: (meta[q.id]?.date ?? dates[q.id]) ? relativeDate(meta[q.id]?.date ?? dates[q.id]) : null,
        }))
        setQuestions(enriched)
      })
      .catch(() => {})
  }, [subjectId])

  const q    = questions[qIdx]
  const busy = phase !== 'idle'

  const handleSubmit = () => {
    const hasSelection = Array.isArray(selected) ? selected.length > 0 : selected !== null
    if (!hasSelection || submitted) return
    setSubmitted(true)
    const correct = q.type === 'multi'
      ? sameSet(selected, q.correctMultiple ?? [])
      : selected === q.correct
    setResults(r => [...r, correct ? 'correct' : 'wrong'])
  }

  const handleNext = () => {
    if (busy) return
    setPhase('exit')
    setTimeout(() => {
      const next = qIdx + 1
      if (next >= questions.length) { setDone(true); return }
      setPhase('enter')
      setSelected(null)
      setSubmitted(false)
      setTimeout(() => { setQIdx(next); setPhase('idle') }, 40)
    }, 260)
  }

  const handleRetry = () => {
    setQIdx(0); setSelected(null); setSubmitted(false)
    setResults([]); setPhase('idle'); setDone(false)
  }

  const handleRetryWrong = () => {
    const stillWrong = questions
      .filter((_, i) => results[i] === 'wrong')
      .map(q => ({ ...q, attempts: q.attempts + 1 }))
    setQuestions(stillWrong)
    setQIdx(0); setSelected(null); setSubmitted(false)
    setResults([]); setPhase('idle'); setDone(false)
  }

  if (!questions.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <CheckCircle2 size={32} style={{ color: C.green }} />
        <p style={{ fontSize: 14, color: t.textMuted }}>No wrong answers to review!</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes explanationIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
      `}</style>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>
        {done ? (
          <SessionResults
            questions={questions} results={results} t={t}
            subjectId={subjectId}
            onRetry={handleRetry} onRetryWrong={handleRetryWrong}
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

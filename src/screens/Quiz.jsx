'use client'
import { useState, useEffect } from 'react'
import {
  CheckCircle2, XCircle, ChevronRight, ChevronDown, ChevronUp,
  RotateCcw, Zap, AlertTriangle,
  Clock, Target, Shuffle, ChevronLeft, ThumbsUp, ThumbsDown,
} from 'lucide-react'
import { useTheme, navigate } from '../store'
import { appendSession } from '../lib/activityLog'
import { C } from '../theme'
import { playSound } from '../sounds'
import QuestionRenderer, { evaluateAnswer, hasValidSelection } from '../components/QuestionRenderer'
import MarkdownText from '../components/MarkdownText'
import { getFirebaseAuth } from '../../lib/firebase'
import { voteQuestion, getQuestionTrustScore } from '../../lib/question-votes'

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
  if (pct >= 90) return { grade: 'A', label: 'Excellent', color: C.green }
  if (pct >= 80) return { grade: 'B', label: 'Strong', color: C.green }
  if (pct >= 70) return { grade: 'C', label: 'Good', color: C.blue }
  if (pct >= 60) return { grade: 'D', label: 'Passing', color: C.gold }
  return               { grade: 'F', label: 'Keep going', color: C.red }
}

function Progress({ total, current, results, onJump = null, t = {} }) {
  return (
    <div>
      <div style={{ height: 3, background: t.border, borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{
          width: `${(current / total) * 100}%`, height: '100%',
          background: C.accent, borderRadius: 99,
          transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        {Array.from({ length: total }, (_, i) => {
          const s = results[i] === 'correct' ? 'correct'
            : results[i] === 'wrong' ? 'wrong'
            : i === current ? 'active' : 'future'
          const bg = { correct: C.green, wrong: C.red, active: C.accent, future: t.border }[s]
          return (
            <button key={i} onClick={() => onJump?.(i)} style={{
              width: i === current ? 28 : 10, height: 10,
              borderRadius: 5, background: bg,
              opacity: s === 'future' ? 0.3 : 1,
              transition: 'all 120ms ease',
              border: 'none', padding: 0, cursor: 'pointer',
            }} />
          )
        })}
      </div>
    </div>
  )
}

const DIFFICULTY_COLORS = { easy: C.green, medium: C.gold, hard: C.red }

function getTrustBarColor(pct) {
  if (pct >= 70) return C.green
  if (pct >= 40) return C.gold
  return C.red
}
const SUPERVISED_BADGE = {
  yes: { label: 'Ellenőrzött', color: C.green },
  no:  { label: 'Nem ellenőrzött', color: C.gold },
}

function microPress(e) { e.currentTarget.style.transform = 'scale(0.97)' }
function microRelease(e) { e.currentTarget.style.transform = 'scale(1)' }

function QuestionCard({ q, qIdx, total, selected, submitted, onSelect, onSubmit, onNext, phase, t }) {
  const isMulti = q.type === 'multi'
  const isMcqType = q.type === 'mcq' || q.type === 'multi'
  const selectedList = Array.isArray(selected) ? selected : selected == null ? [] : [selected]
  const correctList = isMulti ? (q.correctMultiple ?? []) : [q.correct]
  const hasSelection = hasValidSelection(q, selected)
  const isCorrect = submitted && (evaluateAnswer(q, selected) === true)
  const buttonLabel = !submitted ? 'Submit' : qIdx < total - 1 ? 'Next question' : 'See results'

  const diffColor = DIFFICULTY_COLORS[q.difficulty] ?? C.blue
  const supBadge = SUPERVISED_BADGE[q.supervised]

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
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden', ...phaseStyle, transition: phaseTransition }}>

      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.accent}, ${C.blue}, ${C.green})` }} />

      <div style={{ padding: '20px 22px 22px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ background: C.accent, color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
            {qIdx + 1}
          </span>
          <span style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: t.textSub }}>
            {q.section}
          </span>
          {q.difficulty && (
            <span style={{ background: `${diffColor}14`, border: `1px solid ${diffColor}35`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: diffColor }}>
              {q.difficulty}
            </span>
          )}
          {isMulti && (
            <span style={{ background: `${C.purple}14`, border: `1px solid ${C.purple}35`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: C.purple }}>
              multi
            </span>
          )}
          {supBadge && (
            <span style={{ background: `${supBadge.color}14`, border: `1px solid ${supBadge.color}35`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: supBadge.color }}>
              {supBadge.label}
            </span>
          )}
          <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 'auto' }}>{qIdx + 1} / {total}</span>
        </div>

        {q.image && (
          <img src={q.image} alt="" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 10, marginBottom: 16 }} />
        )}

        <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 19, fontWeight: 700, lineHeight: 1.5, letterSpacing: '-0.2px', marginBottom: 24, color: t.text }}>
          <MarkdownText text={q.question} />
        </h2>

        {isMcqType ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {(q.options || []).map((opt, oi) => {
              const isSelected   = selectedList.includes(oi)
              const isCorrectOpt = submitted && correctList.includes(oi)
              const isWrongOpt   = submitted && isSelected && !correctList.includes(oi)

              let bg, border, labelBg, labelColor
              if (isCorrectOpt)            { bg = `${C.green}14`; border = `2px solid ${C.green}70`; labelBg = C.green; labelColor = '#fff' }
              else if (isWrongOpt)         { bg = `${C.red}10`;   border = `2px solid ${C.red}60`;   labelBg = C.red;   labelColor = '#fff' }
              else if (isSelected)         { bg = `${C.accent}16`; border = `2px solid ${C.accent}`; labelBg = C.accent; labelColor = '#fff' }
              else                         { bg = t.surface2; border = `1.5px solid ${t.border}`;    labelBg = t.surface2; labelColor = t.textMuted }

              return (
                <button key={oi}
                  onClick={() => !submitted && onSelect(isMulti ? (isSelected ? selectedList.filter(v => v !== oi) : [...selectedList, oi]) : oi)}
                  onMouseEnter={e => { if (!submitted && !isSelected) e.currentTarget.style.borderColor = `${C.accent}60` }}
                  onMouseLeave={e => { if (!submitted && !isSelected) e.currentTarget.style.borderColor = t.border }}
                  onMouseDown={microPress} onMouseUp={microRelease}
                  style={{
                    background: bg, border, borderRadius: 12, padding: '14px 16px',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    cursor: submitted ? 'default' : 'pointer',
                    textAlign: 'left', width: '100%',
                    transition: 'all 0.15s ease, transform 80ms',
                    animation: `optSlideUp 220ms ease-out ${oi * 40}ms both`,
                  }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: labelBg, color: labelColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, transition: 'all 0.15s' }}>
                    {LABELS[oi]}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.55, color: t.text, fontWeight: isCorrectOpt ? 600 : 400, flex: 1 }}>
                    <MarkdownText text={opt} />
                    {isCorrectOpt && !isWrongOpt && <span style={{ marginLeft: 8, fontSize: 11, color: C.green, fontWeight: 700 }}>correct</span>}
                    {isWrongOpt && <span style={{ marginLeft: 8, fontSize: 11, color: C.red, fontWeight: 700 }}>your answer</span>}
                  </span>
                  {isCorrectOpt && <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0, marginTop: 2 }} />}
                </button>
              )
            })}
          </div>
        ) : (
          <QuestionRenderer q={q} selected={selected} onSelect={onSelect} submitted={submitted} t={t} />
        )}

        {submitted && q.explanation && (
          <div style={{
            background: isCorrect ? `${C.green}14` : `${C.red}10`,
            border: `1px solid ${isCorrect ? C.green : C.red}30`,
            borderLeft: `3px solid ${isCorrect ? C.green : C.red}`,
            borderRadius: '0 10px 10px 0',
            padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 24,
            animation: 'explanationIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            {isCorrect
              ? <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
              : <XCircle      size={16} style={{ color: C.red,   flexShrink: 0, marginTop: 1 }} />
            }
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.5px', color: isCorrect ? C.green : C.red, marginBottom: 4 }}>
                {isCorrect ? 'CORRECT — well done!' : 'INCORRECT — review this'}
              </p>
              <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6 }}><MarkdownText text={q.explanation} /></p>
            </div>
          </div>
        )}

        <button
          disabled={!hasSelection && !submitted}
          onClick={submitted ? onNext : onSubmit}
          onMouseDown={microPress} onMouseUp={microRelease}
          style={{
            width: '100%', padding: '15px',
            background: hasSelection || submitted ? C.accent : t.border,
            color: hasSelection || submitted ? '#fff' : t.textMuted,
            border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: hasSelection || submitted ? 'pointer' : 'not-allowed',
            fontFamily: "'DM Sans', system-ui",
            transition: 'background 0.15s, transform 80ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={e => { if (hasSelection || submitted) e.currentTarget.style.background = C.accentHov }}
          onMouseLeave={e => { if (hasSelection || submitted) e.currentTarget.style.background = C.accent }}
        >
          {buttonLabel}
          {submitted && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  )
}

function ActionBar({ qIdx, total, onPrev, onNext, onClear, onShuffle, onEvaluate, canClear, canShuffle, t }) {
  const btnBase = {
    border: `1px solid ${t.border}`, borderRadius: 9, padding: '8px 14px',
    fontSize: 12, fontWeight: 700, cursor: 'pointer', background: t.surface,
    color: t.textSub, fontFamily: "'DM Sans', system-ui",
    transition: 'background 0.12s, transform 80ms',
    display: 'inline-flex', alignItems: 'center', gap: 5,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>

      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ ...btnBase, opacity: canClear ? 1 : 0.4 }} disabled={!canClear}
          onClick={onClear} onMouseDown={microPress} onMouseUp={microRelease}>
          <RotateCcw size={12} /> Clear
        </button>
        <button style={{ ...btnBase, opacity: canShuffle ? 1 : 0.4 }} disabled={!canShuffle}
          onClick={onShuffle} onMouseDown={microPress} onMouseUp={microRelease}>
          <Shuffle size={12} /> Shuffle
        </button>
      </div>


      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
        <button disabled={qIdx === 0}
          onClick={onPrev} onMouseDown={microPress} onMouseUp={microRelease}
          style={{ ...btnBase, padding: '8px 10px', opacity: qIdx === 0 ? 0.4 : 1 }}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.text, minWidth: 54, textAlign: 'center' }}>
          {qIdx + 1} / {total}
        </span>
        <button style={{ ...btnBase, padding: '8px 10px', opacity: qIdx >= total - 1 ? 0.4 : 1 }} disabled={qIdx >= total - 1}
          onClick={onNext} onMouseDown={microPress} onMouseUp={microRelease}>
          <ChevronRight size={14} />
        </button>
      </div>


      <button style={{ ...btnBase, background: `${C.accent}16`, color: C.accent, border: `1px solid ${C.accent}40` }}
        onClick={onEvaluate} onMouseDown={microPress} onMouseUp={microRelease}>
        Evaluate
      </button>
    </div>
  )
}

function TrustVoting({ subjectId, questionId, t }) {
  const [score, setScore] = useState(null)
  const [userVote, setUserVote] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    getQuestionTrustScore(subjectId, questionId).then(s => { if (!cancelled) setScore(s) }).catch(() => {})
    return () => { cancelled = true }
  }, [subjectId, questionId])

  const handleVote = async (voteType) => {
    const auth = getFirebaseAuth()
    const userId = auth?.currentUser?.uid
    if (!userId || loading) return
    setLoading(true)
    try {
      const updated = await voteQuestion(subjectId, questionId, userId, voteType)
      if (updated) { setScore(updated); setUserVote(voteType) }
    } catch {
      // voting is non-critical; quiz flow continues uninterrupted
    } finally {
      setLoading(false)
    }
  }

  if (score === null) return null

  const isTrusted = score.totalVotes >= 10 && score.trustPct >= 70

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
      padding: '10px 14px', background: t.surface2, borderRadius: 10,
      border: `1px solid ${t.border}`, flexWrap: 'wrap',
    }}>
      {isTrusted && (
        <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: `${C.green}14`, border: `1px solid ${C.green}30`, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
          ✓ Trusted
        </span>
      )}
      <div style={{ flex: 1, minWidth: 100 }}>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: score.totalVotes > 0 ? 3 : 0 }}>
          Community trust — {score.positiveVotes}/{score.totalVotes} {score.totalVotes === 1 ? 'vote' : 'votes'}
        </div>
        {score.totalVotes > 0 && (
          <div style={{ height: 3, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              width: `${score.trustPct}%`, height: '100%', borderRadius: 99,
              background: getTrustBarColor(score.trustPct),
              transition: 'width 0.4s ease',
            }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {[
          { type: 'trust',    Icon: ThumbsUp,   activeColor: C.green },
          { type: 'distrust', Icon: ThumbsDown, activeColor: C.red   },
        ].map(({ type, Icon, activeColor }) => (
          <button
            key={type}
            onClick={() => handleVote(type)}
            disabled={loading || userVote === type}
            onMouseDown={microPress} onMouseUp={microRelease}
            style={{
              width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${userVote === type ? activeColor + '50' : t.border}`,
              background: userVote === type ? `${activeColor}14` : t.surface,
              color: userVote === type ? activeColor : t.textMuted,
              cursor: loading || userVote === type ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s, transform 80ms',
            }}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>
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

function QuestionBreakdown({ questions, results, answers, t }) {
  const [open, setOpen] = useState({})

  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 28 }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: t.textMuted }}>QUESTION BREAKDOWN</p>
        <span style={{ fontSize: 11, color: t.textMuted }}>{questions.length} answered</span>
      </div>
      {questions.map((q, i) => {
        const isOpen = !!open[i]
        const isCorrect = results[i] === 'correct'
        const selected = Array.isArray(answers[q.id]) ? answers[q.id] : answers[q.id] == null ? [] : [answers[q.id]]
        const correctList = q.type === 'multi' ? (q.correctMultiple ?? []) : [q.correct]

        return (
          <div key={q.id} style={{ borderBottom: i < questions.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <button
              onClick={() => setOpen(p => ({ ...p, [i]: !p[i] }))}
              style={{ width: '100%', border: 'none', background: 'transparent', padding: '13px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontFamily: "'DM Sans', system-ui" }}
            >
              {isCorrect
                ? <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0 }} />
                : <XCircle size={16} style={{ color: C.red, flexShrink: 0 }} />
              }
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 650, color: t.text, lineHeight: 1.4 }}>{q.question}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: isCorrect ? C.green : C.red, background: isCorrect ? C.greenBg : C.redBg, borderRadius: 20, padding: '3px 8px', flexShrink: 0 }}>
                {isCorrect ? 'Correct' : 'Review'}
              </span>
              {isOpen ? <ChevronUp size={15} style={{ color: t.textMuted }} /> : <ChevronDown size={15} style={{ color: t.textMuted }} />}
            </button>
            {isOpen && (
              <div style={{ padding: '0 18px 16px 46px', animation: 'explanationIn 0.22s ease both' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: q.explain ? 10 : 0 }}>
                  {(q.options ?? []).map((opt, oi) => {
                    const wasSelected = selected.includes(oi)
                    const wasCorrect = correctList.includes(oi)
                    const color = wasCorrect ? C.green : wasSelected ? C.red : t.textMuted
                    return (
                      <span key={oi} style={{ border: `1px solid ${wasCorrect || wasSelected ? color + '70' : t.border}`, background: wasCorrect ? C.greenBg : wasSelected ? C.redBg : t.surface2, color, borderRadius: 8, padding: '5px 8px', fontSize: 11.5, fontWeight: 700 }}>
                        {LABELS[oi]} {wasCorrect ? 'correct' : wasSelected ? 'yours' : ''}
                      </span>
                    )
                  })}
                </div>
                {q.explanation && <p style={{ fontSize: 13, lineHeight: 1.6, color: t.textSub }}>{q.explanation}</p>}
              </div>
            )}
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
    appendSession({
      type: 'quiz',
      subjectId,
      subjectName,
      color: C.accent,
      durationSecs: timeTaken,
      score: correctCount,
      total: questions.length,
    })
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
            <span style={{ fontSize: 34, fontWeight: 900, color: grade.color, lineHeight: 1, letterSpacing: '-1px' }}>{grade.grade}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, marginTop: 3 }}>{correctCount}/{questions.length}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: grade.color, background: `${grade.color}16`, border: `1px solid ${grade.color}35`, borderRadius: 8, padding: '4px 8px' }}>GRADE {grade.grade}</span>
            <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', color: t.text }}>
              {grade.label} work
            </h1>
          </div>
          <p style={{ fontSize: 14, color: t.textSub, marginBottom: 20, lineHeight: 1.5 }}>
            {pct}% score across {questions.length} questions
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
      <QuestionBreakdown questions={questions} results={results} answers={answers} t={t} />

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
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted }}>Q{origIdx + 1} - {q.section}</span>
                    <p style={{ fontSize: 14, fontWeight: 500, color: t.text, lineHeight: 1.5, marginTop: 2 }}>{q.question}</p>
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
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted }}>Q{origIdx + 1} - {q.section}</span>
                    <p style={{ fontSize: 14, fontWeight: 500, color: t.text, lineHeight: 1.5, marginTop: 2 }}>{q.question}</p>
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
            <span style={{ fontSize: 13, color: t.textSub }}>{correctQs.length} questions answered correctly - click to expand</span>
            <ChevronRight size={14} style={{ color: t.textMuted, marginLeft: 'auto' }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Quiz({ subjectId, section, subjectName: subjectNameProp = '' }) {
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

  const subjectName = subjectNameProp || (subjectId?.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') ?? '')

  useEffect(() => {
    if (!subjectId) return
    const qs = section ? `?section=${encodeURIComponent(section)}` : ''
    fetch(`/api/questions/${subjectId}${qs}`)
      .then(r => r.json())
      .then(data => {
        const mcOnly = data.filter(q => q.type !== 'written')
        setAllQuestions(mcOnly)
        setQuestions(mcOnly.slice(0, 20))
      })
      .catch(() => {})
  }, [subjectId, section])

  const q = questions[qIdx]
  const busy = phase !== 'idle'

  const handleSubmit = () => {
    if (!hasValidSelection(q, selected) || submitted) return
    setSubmitted(true)
    setAnswers(p => ({ ...p, [q.id]: selected }))
    const correct = evaluateAnswer(q, selected)
    playSound(correct !== false ? 'correct' : 'wrong')
    setResults(r => { const n = [...r]; n[qIdx] = correct !== false ? 'correct' : 'wrong'; return n })
  }

  const restoreNavState = (idx) => {
    const tq = questions[idx]
    setSelected(answers[tq?.id] ?? null)
    setSubmitted(!!answers[tq?.id])
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
      restoreNavState(next)
      setTimeout(() => { setQIdx(next); setPhase('idle') }, 40)
    }, 260)
  }

  const handlePrev = () => {
    if (busy || qIdx === 0) return
    setPhase('exit')
    setTimeout(() => {
      const prev = qIdx - 1
      setPhase('enter')
      restoreNavState(prev)
      setTimeout(() => { setQIdx(prev); setPhase('idle') }, 40)
    }, 260)
  }

  const handleJump = (idx) => {
    if (busy || idx === qIdx) return
    restoreNavState(idx)
    setQIdx(idx)
  }

  const handleClear   = () => { setSelected(null) }
  const handleEvaluate = () => { setTimeTaken(Math.round((Date.now() - startTime) / 1000)); setDone(true) }

  const handleShuffle = () => {
    setQuestions(qs => [...qs].sort(() => Math.random() - 0.5))
    setQIdx(0); setSelected(null); setSubmitted(false); setAnswers({}); setResults([])
  }

  const handleRetry = () => {
    setQuestions(allQuestions.slice(0, 20))
    setQIdx(0); setSelected(null); setSubmitted(false)
    setAnswers({}); setResults([]); setPhase('idle'); setDone(false)
  }

  useEffect(() => {
    if (done) return
    const h = (e) => {
      if (e.key === 'ArrowLeft')               handlePrev()
      if (e.key === 'ArrowRight' && submitted)  handleNext()
      if (e.key === 'c' || e.key === 'C')      handleClear()
      if (e.key === 'e' || e.key === 'E')      handleEvaluate()
    }
    globalThis.addEventListener('keydown', h)
    return () => globalThis.removeEventListener('keydown', h)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, submitted, done])

  if (!questions.length) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: t.textMuted }}>Loading...</div>
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes explanationIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        @keyframes arcGrow { from{stroke-dasharray:0 327} to{stroke-dasharray:var(--dash,0) 327} }
        @keyframes optSlideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      `}</style>
      <main className="page-wrap" style={{ '--pw': '640px', paddingTop: 40, paddingBottom: 80 }}>
        {done ? (
          <ResultsView
            questions={questions}
            results={results}
            answers={answers}
            timeTaken={timeTaken}
            subjectId={subjectId}
            subjectName={subjectName}
            t={t}
            onRetry={handleRetry}
          />
        ) : (
          <>
            <Progress total={questions.length} current={qIdx} results={results} onJump={handleJump} t={t} />
            <ActionBar
              qIdx={qIdx} total={questions.length}
              onPrev={handlePrev} onNext={handleNext}
              onClear={handleClear} onShuffle={handleShuffle} onEvaluate={handleEvaluate}
              canClear={selected !== null && submitted === false}
              canShuffle={!busy}
              t={t}
            />
            <QuestionCard
              q={q} qIdx={qIdx} total={questions.length}
              selected={selected} submitted={submitted}
              onSelect={setSelected} onSubmit={handleSubmit} onNext={handleNext}
              phase={phase} t={t}
            />
            {submitted && q && (
              <TrustVoting key={q.id} subjectId={subjectId} questionId={q.id} t={t} />
            )}
          </>
        )}
      </main>
    </>
  )
}

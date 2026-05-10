'use client'
import { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Sparkles,
  CheckCircle2, XCircle, AlertCircle, RotateCcw,
} from 'lucide-react'
import { useTheme } from '../store'
import { C } from '../theme'

function evaluateAnswer(answer, question) {
  const lower = answer.toLowerCase()
  const keywords = question.keywords ?? []
  const hits = keywords.filter(k => lower.includes(k.toLowerCase()))
  const coverage = keywords.length > 0 ? hits.length / keywords.length : 0
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length

  if (wordCount < 15) {
    return { score: 1, grade: 'incomplete', feedback: 'Your answer is too brief. Try to explain the concept in at least 2-3 sentences.', explanation: null }
  }
  if (coverage >= 0.65 || (keywords.length === 0 && wordCount >= 30)) {
    const hitList = hits.map(k => `"${k}"`).join(', ')
    return { score: 3, grade: 'correct', feedback: `Strong answer!${hitList ? ` You covered: ${hitList}.` : ''}`, explanation: question.ideal }
  }
  if (coverage >= 0.35) {
    const missed = keywords.filter(k => !lower.includes(k.toLowerCase())).slice(0, 3)
    return { score: 2, grade: 'partial', feedback: `Partially correct. Consider mentioning: ${missed.map(k => `"${k}"`).join(', ')}.`, explanation: question.ideal }
  }
  return { score: 1, grade: 'incorrect', feedback: "Your answer doesn't cover the key concepts expected. Review the material and try again.", explanation: question.ideal }
}

function ScoreBadge({ grade, t }) {
  const map = {
    correct:    { icon: CheckCircle2, color: C.green,       bg: `${C.green}14`,   label: 'Correct'    },
    partial:    { icon: AlertCircle,  color: C.gold,        bg: `${C.gold}14`,    label: 'Partial'    },
    incorrect:  { icon: XCircle,      color: C.red,         bg: `${C.red}10`,     label: 'Incorrect'  },
    incomplete: { icon: AlertCircle,  color: t.textMuted,   bg: t.surface2,        label: 'Too brief'  },
  }
  const s = map[grade] ?? map.incomplete
  const Icon = s.icon
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, borderRadius: 20, padding: '5px 12px', fontSize: 13, fontWeight: 700, color: s.color }}>
      <Icon size={14} /> {s.label}
    </div>
  )
}

function AnnotatedAnswer({ userAnswer, question, result, t }) {
  const borderMap = { correct: C.green, partial: C.gold, incorrect: C.red, incomplete: t.border2 }
  const bgMap     = { correct: `${C.green}14`, partial: `${C.gold}14`, incorrect: `${C.red}10`, incomplete: t.surface2 }
  const borderColor = borderMap[result.grade]
  const keywords = question.keywords ?? []
  const sentences = userAnswer.split(/(?<=[.!?])\s+/).filter(Boolean)
  const lowerCorrect = (result.correct ?? []).map(item => String(item).toLowerCase())

  const markSentence = (sentence) => {
    const lower = sentence.toLowerCase()
    const directHit = keywords.some(keyword => lower.includes(String(keyword).toLowerCase()))
    const aiHit = lowerCorrect.some(keyword => keyword && lower.includes(keyword))
    if (directHit || aiHit) return 'good'
    if (sentence.trim().split(/\s+/).length >= 10 && result.grade === 'partial') return 'partial'
    return 'neutral'
  }

  return (
    <div>
      <div style={{ border: `1px solid ${borderColor}`, borderLeft: `4px solid ${borderColor}`, borderRadius: '0 10px 10px 0', padding: '14px 16px', background: bgMap[result.grade] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ScoreBadge grade={result.grade} t={t} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: t.textMuted }}>ANNOTATED ANSWER</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.85, color: t.text, fontFamily: "'Lora', Georgia, serif" }}>
          {sentences.length ? sentences.map((sentence, i) => {
            const mark = markSentence(sentence)
            return (
              <span
                key={i}
                style={{
                  background: mark === 'good' ? C.greenBg : mark === 'partial' ? C.goldBg : 'transparent',
                  borderBottom: mark === 'good' ? `2px solid ${C.green}` : mark === 'partial' ? `2px solid ${C.gold}` : 'none',
                  borderRadius: mark === 'neutral' ? 0 : '3px 3px 0 0',
                  padding: mark === 'neutral' ? 0 : '0 3px',
                  marginRight: 4,
                }}
              >
                {sentence}{' '}
              </span>
            )
          }) : userAnswer}
        </p>
      </div>

      {result.explanation && (
        <div style={{ marginTop: 12, border: `1px solid ${C.green}`, borderLeft: `4px solid ${C.green}`, borderRadius: '0 10px 10px 0', padding: '14px 16px', background: `${C.green}14` }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: C.green, display: 'block', marginBottom: 8 }}>MODEL ANSWER</span>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: t.text, fontFamily: "'Lora', Georgia, serif" }}>{result.explanation}</p>
        </div>
      )}

      <div style={{ marginTop: 12, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Sparkles size={16} style={{ color: C.accent, flexShrink: 0, marginTop: 2 }} />
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: C.accent, display: 'block', marginBottom: 5 }}>AI EVALUATION</span>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: t.textSub }}>{result.feedback}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedbackSidebar({ question, result, t }) {
  const keywords = question.keywords ?? []
  const correct = new Set((result.correct ?? []).map(item => String(item).toLowerCase()))
  const missing = new Set((result.missing ?? []).map(item => String(item).toLowerCase()))
  const score = result.scorePct ?? Math.round((result.score / 3) * 100)
  const scoreColor = score >= 80 ? C.green : score >= 50 ? C.gold : C.red

  return (
    <aside style={{ flex: '0 0 270px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '18px 16px', textAlign: 'center' }}>
        <img src="/assets/mascot-clipboard.png" alt="" style={{ width: 88, height: 88, objectFit: 'contain', marginBottom: 8 }} />
        <p style={{ fontSize: 34, fontWeight: 800, color: scoreColor, letterSpacing: '-1px', lineHeight: 1 }}>{score}%</p>
        <p style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginTop: 4 }}>Coverage</p>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '16px' }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: t.textMuted, marginBottom: 12 }}>KEY CONCEPT CHECKLIST</p>
        {(keywords.length ? keywords : [...correct, ...missing]).slice(0, 10).map((keyword, i) => {
          const lower = String(keyword).toLowerCase()
          const isCovered = correct.has(lower) || (!missing.has(lower) && result.grade === 'correct')
          return (
            <div key={`${keyword}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 9 }}>
              {isCovered
                ? <CheckCircle2 size={15} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
                : <AlertCircle size={15} style={{ color: C.gold, flexShrink: 0, marginTop: 1 }} />
              }
              <span style={{ fontSize: 12.5, color: isCovered ? t.text : t.textMuted, lineHeight: 1.4 }}>{keyword}</span>
            </div>
          )
        })}
        {!keywords.length && !(result.correct?.length || result.missing?.length) && (
          <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>No keyword rubric available for this question.</p>
        )}
      </div>
    </aside>
  )
}

function AnswerComparison({ userAnswer, question, result, t }) {
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginTop: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 360px', minWidth: 0 }}>
        <AnnotatedAnswer userAnswer={userAnswer} question={question} result={result} t={t} />
      </div>
      <FeedbackSidebar question={question} result={result} t={t} />
    </div>
  )
}

function EvaluatingPanel({ t }) {
  return (
    <div style={{ padding: '34px 28px', background: `${C.accent}10`, border: `1px dashed ${C.accent}55`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 22 }}>
      <img src="/assets/mascot-clipboard.png" alt="" style={{ width: 84, height: 84, objectFit: 'contain', flexShrink: 0 }} />
      <div>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 17, fontWeight: 600, color: t.text, marginBottom: 10 }}>Reading carefully...</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Written({ subjectId }) {
  const t = useTheme()
  const [questions, setQuestions] = useState([])
  const [idx, setIdx]             = useState(0)
  const [answers, setAnswers]     = useState({})
  const [results, setResults]     = useState({})
  const [loading, setLoading]     = useState(false)
  const textareaRef               = useRef(null)

  useEffect(() => {
    if (!subjectId) return
    fetch(`/api/questions/${subjectId}`)
      .then(r => r.json())
      .then(data => {
        const written = data.filter(q => q.type === 'written' || q.ideal)
        setQuestions(written.length > 0 ? written : data.slice(0, 8))
      })
      .catch(() => {})
  }, [subjectId])

  const q = questions[idx]
  const userAnswer = q ? (answers[q.id] ?? '') : ''
  const result     = q ? results[q.id] : null
  const submitted  = !!result

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }
  }, [userAnswer])

  const handleSubmit = async () => {
    if (!userAnswer.trim() || submitted || !q) return
    setLoading(true)
    try {
      const res = await fetch('/api/validate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.q,
          model_answer: q.ideal ?? q.explain ?? '',
          key_points: q.keywords ?? [],
          user_answer: userAnswer,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const pct = data.score_pct ?? 0
        let grade = 'incomplete'
        if (pct >= 80) grade = 'correct'
        else if (pct >= 50) grade = 'partial'
        else if (pct >= 20) grade = 'incorrect'
        let score = 1
        if (pct >= 80) score = 3
        else if (pct >= 50) score = 2
        setResults(p => ({
          ...p,
          [q.id]: {
            score,
            grade,
            scorePct: pct,
            feedback: data.feedback_text ?? '',
            explanation: data.model_answer ?? q.ideal ?? null,
            correct: data.what_was_correct ?? [],
            missing: data.what_was_missing ?? [],
          },
        }))
        setLoading(false)
        return
      }
    } catch { /* fall through to local eval */ }
    setResults(p => ({ ...p, [q.id]: evaluateAnswer(userAnswer, q) }))
    setLoading(false)
  }

  const goTo = (i) => setIdx(i)

  const scoreCount = Object.values(results)
  const totalScore = scoreCount.reduce((a, r) => a + r.score, 0)
  const maxScore   = scoreCount.length * 3
  const allDone    = questions.length > 0 && Object.keys(results).length === questions.length

  if (!questions.length) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: t.textMuted }}>Loading...</div>
  }

  return (
    <>
      <style>{`
        .wt-textarea {
          width:100%;background:${t.bg};border:1.5px solid ${t.border};border-radius:12px;
          padding:16px 18px;font-size:15px;font-family:'Lora',Georgia,serif;color:${t.text};
          line-height:1.75;resize:none;min-height:140px;outline:none;transition:border-color 0.15s;
        }
        .wt-textarea:focus{border-color:${C.accent}}
        .wt-textarea::placeholder{color:${t.textMuted};font-style:italic}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .fade-up{animation:fadeUp 0.35s ease both}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite}
      `}</style>

      <main className="page-wrap" style={{ '--pw': '680px', paddingTop: 40, paddingBottom: 80 }}>

        {/* Question dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {questions.map((qq, i) => {
              const r = results[qq.id]
              const isActive = i === idx
              const bg = r
                ? r.grade === 'correct' ? C.green : r.grade === 'partial' ? C.gold : C.red
                : isActive ? C.accent : t.border
              return (
                <div
                  key={qq.id}
                  onClick={() => goTo(i)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    background: bg, color: (r || isActive) ? '#fff' : t.textMuted,
                    border: `2px solid ${isActive && !r ? C.accent : 'transparent'}`,
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}
                >{i + 1}</div>
              )
            })}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted }}>{idx + 1} / {questions.length}</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: t.border, borderRadius: 99, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{
            width: `${((idx + (submitted ? 1 : 0)) / questions.length) * 100}%`,
            height: '100%', background: C.accent, borderRadius: 99, transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Section + question */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }} className="fade-up">
          <span style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: t.textSub }}>
            {q.section}
          </span>
        </div>

        <h2 key={q.id} style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 22, fontWeight: 700, lineHeight: 1.45, letterSpacing: '-0.2px', marginBottom: 28, color: t.text }} className="fade-up">
          {q.q}
        </h2>

        {loading ? (
          <div className="fade-up">
            <EvaluatingPanel t={t} />
          </div>
        ) : !submitted ? (
          <div className="fade-up">
            <textarea
              ref={textareaRef}
              className="wt-textarea"
              value={userAnswer}
              onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
              placeholder="Type your answer here... (Ctrl+Enter to submit)"
              rows={5}
              disabled={loading}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 12, color: t.textMuted }}>
                {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                {userAnswer.length > 0 && userAnswer.trim().split(/\s+/).length < 20 && (
                  <span style={{ color: C.gold, marginLeft: 8 }}>- Aim for at least 30 words</span>
                )}
              </span>
              <button
                disabled={!userAnswer.trim() || loading}
                onClick={handleSubmit}
                style={{
                  background: C.accent, color: '#fff', border: 'none', borderRadius: 10,
                  padding: '13px 28px', fontSize: 14, fontWeight: 700,
                  cursor: !userAnswer.trim() || loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', system-ui",
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  opacity: !userAnswer.trim() || loading ? 0.45 : 1, transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!loading && userAnswer.trim()) e.currentTarget.style.background = C.accentHov }}
                onMouseLeave={e => { e.currentTarget.style.background = C.accent }}
              >
                {loading ? <><div className="spinner" /> Evaluating...</> : <><Sparkles size={15} /> Submit</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="fade-up">
            <AnswerComparison userAnswer={userAnswer} question={q} result={result} t={t} />
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36, paddingTop: 24, borderTop: `1px solid ${t.border}` }}>
          <button
            disabled={idx === 0}
            onClick={() => goTo(idx - 1)}
            style={{
              background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8,
              color: t.textSub, padding: '9px 14px', fontSize: 13, fontWeight: 600,
              cursor: idx === 0 ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', system-ui",
              display: 'inline-flex', alignItems: 'center', gap: 5, opacity: idx === 0 ? 0.35 : 1,
            }}
          >
            <ChevronLeft size={15} /> Previous
          </button>

          {submitted && (
            <button
              onClick={() => { setResults(p => { const n = { ...p }; delete n[q.id]; return n }); setAnswers(p => ({ ...p, [q.id]: '' })) }}
              style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: t.textSub, fontFamily: "'DM Sans', system-ui", display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RotateCcw size={14} /> Retry
            </button>
          )}

          {idx < questions.length - 1 ? (
            <button
              onClick={() => goTo(idx + 1)}
              style={{
                background: t.surface, border: `1px solid ${submitted ? C.accent : t.border}`,
                borderRadius: 8, color: submitted ? C.accent : t.textSub,
                padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', system-ui", display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            allDone && (
              <div style={{
                background: `${C.accent}16`, border: `1px solid ${C.accent}`,
                borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: C.accent,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle2 size={15} />
                {totalScore}/{maxScore} pts - Test complete!
              </div>
            )
          )}
        </div>

        {allDone && (
          <div style={{ marginTop: 32, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '24px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: t.textMuted, marginBottom: 6 }}>FINAL SCORE</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: C.accent, letterSpacing: '-1px' }}>
                {totalScore}<span style={{ fontSize: 16, color: t.textMuted, fontWeight: 600 }}>/{maxScore}</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {[{ g: 'correct', c: C.green, label: 'Correct' }, { g: 'partial', c: C.gold, label: 'Partial' }, { g: 'incorrect', c: C.red, label: 'Incorrect' }].map(({ g, c, label }) => {
                const count = scoreCount.filter(r => r.grade === g).length
                return (
                  <div key={g} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: c }}>{count}</p>
                    <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>{label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </>
  )
}

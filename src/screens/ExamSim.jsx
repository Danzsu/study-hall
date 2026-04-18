'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Clock, Play, ChevronRight, ChevronLeft, CheckCircle2, XCircle, PenLine, Sparkles, RotateCcw, Flag, Check, Minus, Plus } from 'lucide-react'
import { useTheme, navigate } from '../store'
import { C } from '../theme'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function fmtTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function mapQuestion(q, idx) {
  return {
    id: q.id || String(idx),
    type: q.type === 'mcq' ? 'mc' : q.type === 'written' ? 'written' : 'mc',
    q: q.question || q.q || '',
    section: q.section || q.topic || 'General',
    options: q.options || [],
    correct: typeof q.correct === 'number' ? q.correct : (q.correct_index ?? 0),
    keywords: q.key_points || q.keywords || [],
    ideal: q.ideal_answer || q.explanation || '',
  }
}

function evalWritten(answer, q) {
  const lower = (answer || '').toLowerCase()
  const kws = q.keywords || []
  const hits = kws.filter(k => lower.includes(k.toLowerCase()))
  const pct = kws.length > 0 ? hits.length / kws.length : 0
  const wc = (answer || '').trim().split(/\s+/).filter(Boolean).length
  if (wc < 15) return { grade: 'incorrect', feedback: 'Answer too brief — aim for at least 2–3 sentences.', score: 0 }
  if (pct >= 0.6) return { grade: 'correct', feedback: `Strong answer. Key ideas covered: ${hits.map(k => `"${k}"`).join(', ')}.`, score: 2 }
  if (pct >= 0.3) return { grade: 'partial', feedback: `Partially correct. You mentioned ${hits.length}/${kws.length} key concepts. Also consider: ${kws.filter(k => !lower.includes(k.toLowerCase())).slice(0, 3).map(k => `"${k}"`).join(', ')}.`, score: 1 }
  return { grade: 'incorrect', feedback: 'Key concepts are missing. Review the material and try again.', score: 0 }
}

function Stepper({ label, value, min, max, onChange, color, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: t.surface, border: `1px solid ${value >= max && max > 0 ? color + '40' : t.border}`, borderRadius: 12, transition: 'border-color .2s' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} style={{ width: 28, height: 28, borderRadius: '50%', background: t.surface2, border: `1px solid ${t.border}`, cursor: value <= min ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: value <= min ? t.border2 : t.textSub, opacity: value <= min ? 0.4 : 1 }}
          onMouseEnter={e => { if (value > min) { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSub }}>
          <Minus size={12}/>
        </button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, minWidth: 48, justifyContent: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>/{max}</span>
        </div>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} style={{ width: 28, height: 28, borderRadius: '50%', background: t.surface2, border: `1px solid ${t.border}`, cursor: value >= max ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: value >= max ? t.border2 : t.textSub, opacity: value >= max ? 0.4 : 1 }}
          onMouseEnter={e => { if (value < max) { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSub }}>
          <Plus size={12}/>
        </button>
      </div>
    </div>
  )
}

function ToggleRow({ label, sub, checked, onChange, color, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: t.surface, border: `1px solid ${checked ? color + '45' : t.border}`, borderRadius: 12, cursor: 'pointer', transition: 'border-color .2s' }} onClick={() => onChange(!checked)}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: sub ? 2 : 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: t.textMuted }}>{sub}</p>}
      </div>
      <div style={{ width: 40, height: 22, borderRadius: 99, background: checked ? color : t.border, position: 'relative', transition: 'background .22s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .22s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }}/>
      </div>
    </div>
  )
}

function McQuestion({ q, answer, onAnswer, submitted, t }) {
  const labels = ['A','B','C','D']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {q.options.map((opt, i) => {
        const isSel   = answer === i
        const isCorr  = submitted && i === q.correct
        const isWrong = submitted && isSel && i !== q.correct
        let bg = t.surface, border = `1.5px solid ${t.border}`, labelBg = t.surface2, labelColor = t.textMuted
        if (isCorr)       { bg = C.greenBg;  border = `2px solid ${C.green}60`;  labelBg = C.green;  labelColor = '#fff' }
        else if (isWrong) { bg = C.redBg;    border = `2px solid ${C.red}55`;    labelBg = C.red;    labelColor = '#fff' }
        else if (isSel)   { bg = C.accentBg2; border = `2px solid ${C.accent}`; labelBg = C.accent; labelColor = '#fff' }
        return (
          <button key={i} onClick={() => !submitted && onAnswer(i)} style={{ background: bg, border, borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: submitted ? 'default' : 'pointer', textAlign: 'left', width: '100%', transition: 'all .15s' }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: labelBg, color: labelColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{labels[i]}</span>
            <span style={{ fontSize: 14, lineHeight: 1.55, color: t.text, flex: 1, fontWeight: isSel || isCorr ? 600 : 400 }}>{opt}
              {isCorr && !isWrong && <span style={{ marginLeft: 6, fontSize: 11, color: C.green, fontWeight: 700 }}>✓ correct</span>}
              {isWrong && <span style={{ marginLeft: 6, fontSize: 11, color: C.red, fontWeight: 700 }}>✗ your answer</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function WrittenQuestion({ q, answer, onAnswer, submitted, evalResult, t }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px' }
  }, [answer])
  const wc = (answer || '').trim().split(/\s+/).filter(Boolean).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: C.purpleBg, border: `1px solid ${C.purple}30`, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <PenLine size={13} style={{ color: C.purple, flexShrink: 0, marginTop: 1 }}/>
        <p style={{ fontSize: 12, color: t.textSub, lineHeight: 1.5 }}>
          Write a complete answer in your own words. Aim for at least 3–4 sentences.
        </p>
      </div>
      <div style={{ background: t.surface, border: `1.5px solid ${submitted ? t.border : C.purple + '55'}`, borderRadius: 12, overflow: 'hidden' }}>
        <textarea ref={ref} value={answer || ''} onChange={e => !submitted && onAnswer(e.target.value)} disabled={submitted}
          placeholder="Type your answer here…" rows={5}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '14px 16px', fontSize: 15, fontFamily: "'Lora',Georgia,serif", color: t.text, lineHeight: 1.75, resize: 'none', display: 'block' }}/>
        <div style={{ padding: '8px 16px 10px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: t.textMuted }}>{wc} word{wc !== 1 ? 's' : ''}</span>
          {wc > 0 && wc < 20 && !submitted && <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>Aim for more detail</span>}
          {wc >= 20 && !submitted && <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Good length</span>}
        </div>
      </div>
      {submitted && evalResult && (
        <div style={{ background: evalResult.grade === 'correct' ? C.greenBg : evalResult.grade === 'partial' ? C.goldBg : C.redBg, border: `1px solid ${evalResult.grade === 'correct' ? C.green : evalResult.grade === 'partial' ? C.gold : C.red}35`, borderLeft: `3px solid ${evalResult.grade === 'correct' ? C.green : evalResult.grade === 'partial' ? C.gold : C.red}`, borderRadius: '0 10px 10px 0', padding: '12px 14px', animation: 'examFadeDown .22s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.5px', color: evalResult.grade === 'correct' ? C.green : evalResult.grade === 'partial' ? C.gold : C.red, marginBottom: 5 }}>
            {evalResult.grade === 'correct' ? 'CORRECT' : evalResult.grade === 'partial' ? 'PARTIAL CREDIT' : 'NEEDS IMPROVEMENT'}
          </p>
          <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6, marginBottom: q.ideal ? 8 : 0 }}>{evalResult.feedback}</p>
          {q.ideal && (
            <details>
              <summary style={{ fontSize: 12, fontWeight: 700, color: t.textSub, cursor: 'pointer' }}>See ideal answer</summary>
              <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.65, marginTop: 8, fontStyle: 'italic', fontFamily: "'Lora',serif" }}>{q.ideal}</p>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function Configurator({ rawQuestions, onStart, t }) {
  const sections = Array.from(new Set(rawQuestions.map(q => q.section)))
  const palette = [C.accent, C.blue, C.green, C.gold, C.purple, C.red]
  const sectionColors = Object.fromEntries(sections.map((s, i) => [s, palette[i % palette.length]]))

  const [activeSections, setActiveSections] = useState(new Set(sections))
  const [mcCount, setMcCount] = useState(10)
  const [wrCount, setWrCount] = useState(2)
  const [minutes, setMinutes] = useState(30)
  const [shuffleQ, setShuffleQ] = useState(true)
  const [showTimer, setShowTimer] = useState(true)

  const mcPool = rawQuestions.filter(q => q.type === 'mc' && activeSections.has(q.section))
  const wrPool = rawQuestions.filter(q => q.type === 'written' && activeSections.has(q.section))
  const safeMc = Math.min(mcCount, mcPool.length)
  const safeWr = Math.min(wrCount, wrPool.length)
  const totalQ = safeMc + safeWr

  const toggleSection = (sec) => {
    setActiveSections(prev => {
      const next = new Set(prev)
      if (next.has(sec)) { if (next.size > 1) next.delete(sec) } else next.add(sec)
      return next
    })
  }

  const buildExam = () => {
    const mc = shuffle(mcPool).slice(0, safeMc)
    const wr = shuffle(wrPool).slice(0, safeWr)
    const combined = shuffleQ ? shuffle([...mc, ...wr]) : [...mc, ...wr]
    onStart({ questions: combined, minutes, showTimer })
  }

  const sectionStats = sections.map(sec => ({
    sec,
    mc: rawQuestions.filter(q => q.type === 'mc' && q.section === sec).length,
    wr: rawQuestions.filter(q => q.type === 'written' && q.section === sec).length,
  }))

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '36px 24px 80px', animation: 'examFadeUp .32s ease both' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Lora',serif", fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 6, color: t.text }}>Configure your exam</h1>
        <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.6 }}>Choose which topics to include, set the question mix, and time limit.</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted }}>TOPICS</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setActiveSections(new Set(sections))} style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',system-ui" }}>All</button>
            <span style={{ color: t.border2 }}>·</span>
            <button onClick={() => setActiveSections(new Set([sections[0]]))} style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',system-ui" }}>None</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sectionStats.map(({ sec, mc, wr }) => {
            const active = activeSections.has(sec)
            const color = sectionColors[sec]
            return (
              <div key={sec} onClick={() => toggleSection(sec)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: active ? `${color}0e` : t.surface, border: `1.5px solid ${active ? color + '50' : t.border}`, borderRadius: 11, cursor: 'pointer', transition: 'all .15s', opacity: active ? 1 : 0.55 }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.opacity = '0.75' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.opacity = '0.55' }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: active ? color : 'transparent', border: `1.5px solid ${active ? color : t.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                  {active && <Check size={11} color="#fff" strokeWidth={3}/>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: active ? t.text : t.textSub, flex: 1 }}>{sec}</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  {mc > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.accent : t.textMuted, background: active ? C.accentBg : t.surface2, border: `1px solid ${active ? C.accent + '30' : t.border}`, borderRadius: 20, padding: '1px 7px' }}>{mc} MC</span>}
                  {wr > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.purple : t.textMuted, background: active ? C.purpleBg : t.surface2, border: `1px solid ${active ? C.purple + '30' : t.border}`, borderRadius: 20, padding: '1px 7px' }}>{wr} W</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ height: 1, background: t.border, marginBottom: 20 }}/>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 10 }}>QUESTION MIX</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Stepper label="Multiple choice" value={safeMc} min={0} max={mcPool.length} onChange={setMcCount} color={C.accent} t={t}/>
          <Stepper label="Written" value={safeWr} min={0} max={wrPool.length} onChange={setWrCount} color={C.purple} t={t}/>
        </div>
        <div style={{ marginTop: 12, padding: '12px 16px', background: t.surface2, borderRadius: 10, display: 'flex' }}>
          {[{ label: 'Total', val: totalQ, color: t.text, border: true }, { label: 'MC', val: safeMc, color: C.accent, border: true }, { label: 'Written', val: safeWr, color: C.purple, border: false }]
            .map(({ label, val, color, border }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: border ? `1px solid ${t.border}` : 'none', padding: '0 8px' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{val}</p>
                <p style={{ fontSize: 10, color: t.textMuted, marginTop: 3 }}>{label}</p>
              </div>
            ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 10 }}>TIME LIMIT</p>
        <Stepper label={`${minutes} minutes`} value={minutes} min={5} max={180} onChange={setMinutes} color={C.gold} t={t}/>
        <p style={{ fontSize: 11, color: t.textMuted, marginTop: 7, paddingLeft: 2 }}>
          ≈ {totalQ > 0 ? Math.round((minutes * 60) / totalQ) : '—'}s per question
        </p>
      </div>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 10 }}>OPTIONS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleRow label="Show timer" sub="Visible countdown during the exam" checked={showTimer} onChange={setShowTimer} color={C.gold} t={t}/>
          <ToggleRow label="Shuffle questions" sub="Randomise the order" checked={shuffleQ} onChange={setShuffleQ} color={C.green} t={t}/>
        </div>
      </div>

      {safeWr > 0 && (
        <div style={{ background: C.purpleBg, border: `1px solid ${C.purple}35`, borderRadius: 10, padding: '11px 14px', marginBottom: 24, display: 'flex', gap: 10 }}>
          <Sparkles size={14} style={{ color: C.purple, flexShrink: 0, marginTop: 1 }}/>
          <p style={{ fontSize: 12, color: t.textSub, lineHeight: 1.6 }}>
            Written answers are keyword-evaluated after submission. You&apos;ll see feedback once the exam ends.
          </p>
        </div>
      )}

      <button onClick={buildExam} disabled={totalQ === 0} style={{ width: '100%', padding: '15px', background: totalQ > 0 ? C.accent : t.border, color: totalQ > 0 ? '#fff' : t.textMuted, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: totalQ > 0 ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
        onMouseEnter={e => { if (totalQ > 0) e.currentTarget.style.background = C.accentHov }}
        onMouseLeave={e => { if (totalQ > 0) e.currentTarget.style.background = C.accent }}>
        <Play size={16}/> Start exam · {totalQ} question{totalQ !== 1 ? 's' : ''}
      </button>
    </div>
  )
}

function ExamSession({ config, onEnd, t }) {
  const { questions, minutes, showTimer } = config
  const [idx,        setIdx]        = useState(0)
  const [answers,    setAnswers]    = useState({})
  const [flagged,    setFlagged]    = useState({})
  const [timeLeft,   setTimeLeft]   = useState(minutes * 60)
  const [submitted,  setSubmitted]  = useState(false)
  const [evalResults,setEvalResults]= useState({})
  const [phase,      setPhase]      = useState('idle')

  const q = questions[idx]
  const isFlagged      = !!flagged[q.id]
  const answeredCount  = Object.keys(answers).length
  const flaggedCount   = Object.values(flagged).filter(Boolean).length
  const timerColor     = timeLeft < 120 ? C.red : timeLeft < 300 ? C.gold : C.green

  const handleSubmitAll = useCallback(() => {
    const evals = {}
    questions.filter(q => q.type === 'written').forEach(q => { evals[q.id] = evalWritten(answers[q.id], q) })
    setEvalResults(evals)
    setSubmitted(true)
  }, [questions, answers])

  useEffect(() => {
    if (submitted) return
    const iv = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(iv); handleSubmitAll(); return 0 } return t - 1 })
    }, 1000)
    return () => clearInterval(iv)
  }, [submitted, handleSubmitAll])

  const navTo = (dir) => {
    const next = idx + dir
    if (next < 0 || next >= questions.length) return
    setPhase(dir > 0 ? 'out-left' : 'out-right')
    setTimeout(() => { setIdx(next); setPhase('in'); requestAnimationFrame(() => requestAnimationFrame(() => setPhase('idle'))) }, 200)
  }

  const typeLabel = { mc: 'MULTIPLE CHOICE', written: 'WRITTEN' }
  const typeColor = { mc: C.accent, written: C.purple }

  const phaseStyle = {
    idle:        { opacity: 1, transform: 'translateX(0) scale(1)' },
    'out-left':  { opacity: 0, transform: 'translateX(-40px) scale(0.97)' },
    'out-right': { opacity: 0, transform: 'translateX(40px) scale(0.97)' },
    in:          { opacity: 0, transform: 'translateX(0) scale(0.98)' },
  }[phase] || {}
  const phaseTr = phase === 'idle'
    ? 'opacity .28s ease, transform .3s cubic-bezier(0.22,1,0.36,1)'
    : phase === 'in' ? 'none' : 'opacity .18s, transform .2s ease'

  if (submitted) {
    const mcScore  = questions.filter(q => q.type === 'mc').filter(q => answers[q.id] === q.correct).length
    const wrScore  = Object.values(evalResults).reduce((a, r) => a + r.score, 0)
    const mcMax    = questions.filter(q => q.type === 'mc').length
    const wrMax    = questions.filter(q => q.type === 'written').length * 2
    const totalPts = mcScore + wrScore
    const maxPts   = mcMax + wrMax
    const pct      = maxPts > 0 ? Math.round((totalPts / maxPts) * 100) : 0
    const grade    = pct >= 85 ? 'Excellent' : pct >= 70 ? 'Good' : pct >= 55 ? 'Passing' : 'Needs work'
    const gradeCol = pct >= 85 ? C.green : pct >= 70 ? C.blue : pct >= 55 ? C.gold : C.red

    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px 80px', animation: 'examFadeUp .36s ease' }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, padding: '28px 24px', textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>{pct >= 85 ? '🏆' : pct >= 70 ? '👍' : pct >= 55 ? '📈' : '💪'}</p>
          <h2 style={{ fontFamily: "'Lora',serif", fontSize: 24, fontWeight: 700, marginBottom: 6, color: t.text }}>{grade}</h2>
          <p style={{ fontSize: 38, fontWeight: 800, color: gradeCol, letterSpacing: '-1px', lineHeight: 1 }}>{pct}%</p>
          <p style={{ fontSize: 13, color: t.textSub, marginTop: 6 }}>{totalPts} / {maxPts} points</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            {mcMax > 0 && <div style={{ background: C.accentBg, borderRadius: 10, padding: '10px 16px' }}><p style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{mcScore}/{mcMax}</p><p style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>MC</p></div>}
            {wrMax > 0 && <div style={{ background: C.purpleBg, borderRadius: 10, padding: '10px 16px' }}><p style={{ fontSize: 18, fontWeight: 800, color: C.purple }}>{wrScore}/{wrMax}</p><p style={{ fontSize: 10, color: C.purple, fontWeight: 700 }}>Written</p></div>}
          </div>
        </div>

        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 12 }}>QUESTION REVIEW</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {questions.map((q, i) => {
            const correct  = q.type === 'mc' ? answers[q.id] === q.correct : evalResults[q.id]?.grade === 'correct'
            const partial  = q.type === 'written' && evalResults[q.id]?.grade === 'partial'
            const col      = correct ? C.green : partial ? C.gold : C.red
            return (
              <div key={q.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderLeft: `3px solid ${col}`, borderRadius: '0 10px 10px 0', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, flexShrink: 0, minWidth: 20 }}>#{i+1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: typeColor[q.type], background: `${typeColor[q.type]}14`, border: `1px solid ${typeColor[q.type]}28`, borderRadius: 20, padding: '1px 7px' }}>{typeLabel[q.type]}</span>
                    {correct ? <CheckCircle2 size={13} style={{ color: C.green }}/> : partial ? <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>Partial</span> : <XCircle size={13} style={{ color: C.red }}/>}
                  </div>
                  <p style={{ fontSize: 12, color: t.textSub, lineHeight: 1.4 }}>{q.q}</p>
                  {q.type === 'written' && evalResults[q.id] && <p style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>{evalResults[q.id].feedback}</p>}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onEnd} style={{ flex: 1, padding: '13px', background: C.accent, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <RotateCcw size={14}/> New exam
          </button>
          <button onClick={onEnd} style={{ flex: 1, padding: '13px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: t.text, fontFamily: "'DM Sans',system-ui" }}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px 120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 3, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${((idx + 1) / questions.length) * 100}%`, height: '100%', background: C.accent, borderRadius: 99, transition: 'width .4s cubic-bezier(0.22,1,0.36,1)' }}/>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, whiteSpace: 'nowrap' }}>{idx+1}/{questions.length}</span>
        {showTimer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: timeLeft < 120 ? C.redBg : t.surface2, border: `1px solid ${timeLeft < 120 ? C.red + '40' : t.border}`, borderRadius: 8, padding: '4px 10px', transition: 'all .3s' }}>
            <Clock size={12} style={{ color: timerColor }}/>
            <span style={{ fontSize: 13, fontWeight: 800, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(timeLeft)}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: t.textMuted }}>{answeredCount}/{questions.length} answered</span>
        {flaggedCount > 0 && <span style={{ fontSize: 11, color: C.gold, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Flag size={10}/>{flaggedCount} flagged</span>}
      </div>

      <div key={q.id} style={{ ...phaseStyle, transition: phaseTr }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.7px', color: typeColor[q.type] }}>{typeLabel[q.type]}</span>
                <span style={{ fontSize: 10, color: t.textMuted }}>{q.section}</span>
              </div>
              <button onClick={() => setFlagged(p => ({ ...p, [q.id]: !p[q.id] }))} style={{ background: isFlagged ? C.goldBg : 'none', border: `1px solid ${isFlagged ? C.gold + '50' : t.border}`, borderRadius: 7, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: isFlagged ? C.gold : t.textMuted, fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                <Flag size={11}/>{isFlagged ? 'Flagged' : 'Flag'}
              </button>
            </div>
            <h2 style={{ fontFamily: "'Lora',serif", fontSize: 18, fontWeight: 700, lineHeight: 1.48, color: t.text }}>{q.q}</h2>
          </div>
          <div style={{ padding: '18px 20px' }}>
            {q.type === 'mc' && <McQuestion q={q} answer={answers[q.id]} onAnswer={v => setAnswers(p => ({ ...p, [q.id]: v }))} submitted={false} t={t}/>}
            {q.type === 'written' && <WrittenQuestion q={q} answer={answers[q.id]} onAnswer={v => setAnswers(p => ({ ...p, [q.id]: v }))} submitted={false} evalResult={null} t={t}/>}
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: t.bg, borderTop: `1px solid ${t.border}`, padding: '12px 20px 20px', zIndex: 95 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', gap: 10 }}>
          <button onClick={() => navTo(-1)} disabled={idx === 0} style={{ width: 48, height: 48, borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, cursor: idx === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSub, opacity: idx === 0 ? 0.35 : 1, flexShrink: 0 }}>
            <ChevronLeft size={18}/>
          </button>
          {idx < questions.length - 1 ? (
            <button onClick={() => navTo(1)} style={{ flex: 1, height: 48, background: C.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentHov}
              onMouseLeave={e => e.currentTarget.style.background = C.accent}>
              Next <ChevronRight size={16}/>
            </button>
          ) : (
            <button onClick={handleSubmitAll} style={{ flex: 1, height: 48, background: C.green, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <CheckCircle2 size={16}/> Submit exam
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ExamSim({ subjectId }) {
  const t = useTheme()
  const [rawQuestions, setRawQuestions] = useState(null)
  const [phase,  setPhase]  = useState('config')
  const [config, setConfig] = useState(null)

  useEffect(() => {
    if (!subjectId) return
    fetch(`/api/questions/${subjectId}`)
      .then(r => r.json())
      .then(data => setRawQuestions(data.map(mapQuestion)))
      .catch(() => setRawQuestions([]))
  }, [subjectId])

  if (rawQuestions === null) {
    return <div style={{ textAlign: 'center', padding: '60px 24px', color: t.textMuted }}>Loading…</div>
  }

  if (rawQuestions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <p style={{ color: t.textMuted, fontSize: 14 }}>No questions available for this subject.</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes examFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes examFadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        details summary::-webkit-details-marker{display:none}
      `}</style>
      {phase === 'config' && <Configurator rawQuestions={rawQuestions} onStart={cfg => { setConfig(cfg); setPhase('exam') }} t={t}/>}
      {phase === 'exam'   && <ExamSession config={config} onEnd={() => setPhase('config')} t={t}/>}
    </>
  )
}

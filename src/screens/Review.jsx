'use client'
import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Check, HelpCircle,
  Bookmark, BookmarkCheck, Eye, EyeOff, Tag,
} from 'lucide-react'
import { useTheme, navigate } from '../store'
import { C } from '../theme'

function Hl({ children }) {
  const parts = String(children).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <mark key={i} style={{ background: `${C.accent}18`, color: C.accent, borderBottom: `2px solid ${C.accent}`, borderRadius: '3px 3px 0 0', padding: '1px 3px', fontWeight: 700 }}>{p.slice(2, -2)}</mark>
        if (p.startsWith('*') && p.endsWith('*'))
          return <mark key={i} style={{ background: `${C.blue}11`, color: C.blue, borderBottom: `2px solid ${C.blue}`, borderRadius: '3px 3px 0 0', padding: '1px 3px', fontWeight: 600 }}>{p.slice(1, -1)}</mark>
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

const DIFF_COLORS = {
  core:     { label: 'Core',     color: C.blue,   bg: `${C.blue}14`   },
  advanced: { label: 'Advanced', color: C.purple, bg: `${C.purple}14` },
}

export default function Review({ subjectId }) {
  const t = useTheme()
  const [questions, setQuestions] = useState([])
  const [topics, setTopics]       = useState(['All'])
  const [topic, setTopic]         = useState('All')
  const [showSaved, setShowSaved] = useState(false)
  const [idx, setIdx]             = useState(0)
  const [phase, setPhase]         = useState('idle')
  const [knows, setKnows]         = useState({})
  const [saved, setSaved]         = useState(() => {
    try { return JSON.parse(localStorage.getItem(`reviewSaved:${subjectId}`) || '{}') } catch { return {} }
  })
  const [showAnswer, setShowAnswer] = useState({})

  useEffect(() => {
    if (!subjectId) return
    fetch(`/api/questions/${subjectId}`)
      .then(r => r.json())
      .then(data => {
        const mapped = data.map(q => ({
          ...q,
          topic: q.section,
          concept: q.q?.split(' ').slice(0, 4).join(' ') + '…',
          explanation: q.explain ?? '',
          keyPoints: q.keywords ?? [],
          options: q.options ?? [],
          related: [],
        }))
        setQuestions(mapped)
        const secs = ['All', ...Array.from(new Set(mapped.map(q => q.section)))]
        setTopics(secs)
      })
      .catch(() => {})
  }, [subjectId])

  useEffect(() => {
    if (subjectId) localStorage.setItem(`reviewSaved:${subjectId}`, JSON.stringify(saved))
  }, [saved, subjectId])

  const pool = questions.filter(q => {
    const matchTopic = topic === 'All' || q.topic === topic
    const matchSaved = !showSaved || saved[q.id]
    return matchTopic && matchSaved
  })
  const safeIdx = Math.min(idx, Math.max(0, pool.length - 1))
  const q       = pool[safeIdx]

  const navTo = (dir) => {
    const next = safeIdx + dir
    if (next < 0 || next >= pool.length) return
    const exitPhase = dir > 0 ? 'out-left' : 'out-right'
    setPhase(exitPhase)
    setTimeout(() => {
      setIdx(next)
      setPhase('in')
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase('idle')))
    }, 200)
  }

  const toggleSaved  = (id) => setSaved(p => ({ ...p, [id]: !p[id] }))
  const toggleKnow   = (id, val) => setKnows(p => ({ ...p, [id]: p[id] === val ? null : val }))
  const toggleAnswer = (id) => setShowAnswer(p => ({ ...p, [id]: !p[id] }))

  const savedCount = Object.values(saved).filter(Boolean).length
  const knownCount = Object.values(knows).filter(v => v === 'know').length

  const phaseStyle = {
    idle:       { opacity: 1, transform: 'translateX(0) scale(1)' },
    'out-left': { opacity: 0, transform: 'translateX(-52px) scale(0.96)' },
    'out-right':{ opacity: 0, transform: 'translateX(52px) scale(0.96)' },
    in:         { opacity: 0, transform: 'translateX(0) scale(0.98)' },
  }[phase] || {}
  const phaseTr = phase === 'idle'
    ? 'opacity 0.28s ease, transform 0.32s cubic-bezier(0.22,1,0.36,1)'
    : phase === 'in' ? 'none'
    : 'opacity 0.18s ease, transform 0.2s ease'

  const dc           = q ? DIFF_COLORS[q.difficulty] : null
  const isBookmarked = q ? !!saved[q.id] : false
  const knowState    = q ? (knows[q.id] || null) : null
  const answerShown  = q ? !!showAnswer[q.id] : false

  if (!questions.length) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: t.textMuted }}>Loading…</div>
  }

  return (
    <>
      <style>{`
        @keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .ans-in{animation:fadeDown 0.22s ease both}
        .nav-btn{display:flex;align-items:center;justify-content:center;gap:7px;border:none;border-radius:12px;cursor:pointer;font-family:'DM Sans',system-ui;font-weight:700;font-size:14px;transition:transform 150ms cubic-bezier(0.34,1.56,0.64,1),background 120ms,opacity 150ms}
        .nav-btn:hover:not(:disabled){transform:translateY(-2px)}
        .nav-btn:active:not(:disabled){transform:scale(0.97)}
        .nav-btn:disabled{opacity:0.28;cursor:not-allowed}
        .chip-btn{display:inline-flex;align-items:center;gap:5px;border-radius:20px;cursor:pointer;font-family:'DM Sans',system-ui;font-weight:700;font-size:12px;transition:all 0.13s}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)' }}>

        {/* Topic chips */}
        <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: '10px 20px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {topics.map(tp => (
            <button key={tp} onClick={() => { setTopic(tp); setIdx(0) }} className="chip-btn" style={{
              padding: '5px 13px', border: `1px solid ${topic === tp ? C.accent : t.border}`,
              background: topic === tp ? C.accent : t.surface2,
              color: topic === tp ? '#fff' : t.textSub,
            }}>{tp}</button>
          ))}
          <button
            onClick={() => { setShowSaved(s => !s); setIdx(0) }}
            className="chip-btn"
            style={{
              padding: '5px 11px', marginLeft: 'auto',
              border: `1px solid ${showSaved ? C.accent + '55' : t.border}`,
              background: showSaved ? `${C.accent}16` : 'transparent',
              color: showSaved ? C.accent : t.textSub,
            }}
          >
            <Bookmark size={11} style={{ fill: showSaved ? C.accent : 'none' }} />
            Saved {savedCount > 0 && `(${savedCount})`}
          </button>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 640, width: '100%', margin: '0 auto', padding: '28px 20px 0' }}>

          {pool.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: t.textMuted }}>
              <Bookmark size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>{showSaved ? 'No saved questions yet' : 'No questions in this topic'}</p>
              <button onClick={() => { setShowSaved(false); setTopic('All') }} style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: t.textSub, fontFamily: "'DM Sans',system-ui" }}>Clear filters</button>
            </div>
          ) : q && (
            <>
              {/* Progress */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted }}>{safeIdx + 1} / {pool.length}</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>✓ {knownCount} known</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Bookmark size={10} style={{ fill: C.accent }} /> {savedCount}
                    </span>
                  </div>
                </div>
                <div style={{ height: 3, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${((safeIdx + 1) / pool.length) * 100}%`, height: '100%', background: C.accent, borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)' }} />
                </div>
              </div>

              {/* Card */}
              <div style={{ ...phaseStyle, transition: phaseTr, flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 120 }}>
                <div style={{ background: t.surface, border: `1px solid ${isBookmarked ? C.accent + '50' : t.border}`, borderRadius: 18, overflow: 'hidden' }}>

                  {/* Card header */}
                  <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.6px', color: t.textMuted }}>{q.topic?.toUpperCase()}</span>
                        {dc && <span style={{ fontSize: 10, fontWeight: 800, color: dc.color, background: dc.bg, border: `1px solid ${dc.color}30`, borderRadius: 20, padding: '2px 8px' }}>{dc.label}</span>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {[
                          { id: 'know',   icon: Check,       label: 'Know it', color: C.green, bg: `${C.green}14` },
                          { id: 'unsure', icon: HelpCircle,  label: 'Unsure',  color: C.gold,  bg: `${C.gold}14`  },
                        ].map(({ id, icon: Icon, label, color, bg }) => {
                          const active = knowState === id
                          return (
                            <button key={id} onClick={() => toggleKnow(q.id, id)} className="chip-btn" style={{ padding: '4px 10px', fontSize: 11, border: `1px solid ${active ? color + '55' : t.border}`, background: active ? bg : 'transparent', color: active ? color : t.textMuted }}>
                              <Icon size={11} />{label}
                            </button>
                          )
                        })}

                        <button
                          onClick={() => toggleSaved(q.id)}
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: isBookmarked ? `${C.accent}16` : t.surface2,
                            border: `1px solid ${isBookmarked ? C.accent + '50' : t.border}`,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                          }}
                        >
                          {isBookmarked
                            ? <BookmarkCheck size={15} style={{ color: C.accent }} />
                            : <Bookmark size={15} style={{ color: t.textMuted }} />
                          }
                        </button>
                      </div>
                    </div>

                    <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 18, fontWeight: 700, lineHeight: 1.45, color: t.text }}>{q.q}</h2>
                  </div>

                  {/* Explanation */}
                  <div style={{ padding: '18px 20px' }}>
                    {q.explanation && (
                      <>
                        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', color: t.textMuted, marginBottom: 12 }}>EXPLANATION</p>
                        <div style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 14.5, lineHeight: 1.82, color: t.textSub }}>
                          {q.explanation.split('\n\n').map((para, i, arr) => (
                            <p key={i} style={{ marginBottom: i < arr.length - 1 ? 14 : 0 }}><Hl>{para}</Hl></p>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Key points */}
                    {q.keyPoints?.length > 0 && (
                      <div style={{ marginTop: 18, background: t.surface2, borderRadius: 10, padding: '12px 14px' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 8 }}>KEY POINTS</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {q.keyPoints.map((pt, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, flexShrink: 0, marginTop: 7 }} />
                              <span style={{ fontSize: 13, color: t.textSub, lineHeight: 1.5 }}>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quiz question reveal */}
                    {q.options?.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <button
                          onClick={() => toggleAnswer(q.id)}
                          style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: t.textMuted, fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color 0.15s, color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}
                        >
                          {answerShown ? <EyeOff size={12} /> : <Eye size={12} />}
                          {answerShown ? 'Hide quiz question' : 'See as quiz question'}
                        </button>

                        {answerShown && (
                          <div className="ans-in" style={{ marginTop: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                              {q.options.map((opt, oi) => {
                                const ok = oi === q.correct
                                return (
                                  <div key={oi} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, background: ok ? `${C.green}14` : t.surface2, border: `1px solid ${ok ? C.green + '45' : t.border}` }}>
                                    <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: ok ? C.green : t.surface, color: ok ? '#fff' : t.textMuted, border: ok ? 'none' : `1px solid ${t.border}` }}>
                                      {['A', 'B', 'C', 'D'][oi]}
                                    </span>
                                    <span style={{ fontSize: 13, color: ok ? t.text : t.textSub, fontWeight: ok ? 600 : 400, lineHeight: 1.5 }}>
                                      {opt}{ok && <span style={{ marginLeft: 6, fontSize: 11, color: C.green, fontWeight: 700 }}>← correct</span>}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom nav */}
        {pool.length > 0 && (
          <div style={{ background: t.bg, borderTop: `1px solid ${t.border}`, padding: '16px 20px 28px', position: 'sticky', bottom: 0 }}>
            <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', gap: 10 }}>
              <button className="nav-btn" disabled={safeIdx === 0} onClick={() => navTo(-1)} style={{ flex: '0 0 auto', width: 52, height: 52, background: t.surface, border: `1px solid ${t.border}`, color: t.textSub }}>
                <ChevronLeft size={20} />
              </button>
              <button className="nav-btn" disabled={safeIdx >= pool.length - 1} onClick={() => navTo(1)} style={{ flex: 1, height: 52, background: safeIdx < pool.length - 1 ? C.accent : t.border, color: safeIdx < pool.length - 1 ? '#fff' : t.textMuted }}>
                {safeIdx < pool.length - 1 ? <>Next <ChevronRight size={16} /></> : 'Last question'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

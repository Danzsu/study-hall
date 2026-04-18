'use client'
import { useState, useEffect } from 'react'
import { Check, X, RotateCcw } from 'lucide-react'
import { useTheme, useStore } from '../store'
import { C } from '../theme'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Card({ card, flipped, phase, onFlip, t }) {
  const frontColor = card.type === 'abbr' ? C.accent : C.blue
  const backColor  = C.green

  const phaseStyles = {
    idle:         { transform: 'translateX(0)   translateY(0)   rotate(0deg) scale(1)',    opacity: 1, transition: 'transform 400ms cubic-bezier(0.22,1,0.36,1), opacity 350ms ease' },
    'exit-right': { transform: 'translateX(120%) translateY(-8px) rotate(7deg) scale(0.93)', opacity: 0, transition: 'transform 360ms cubic-bezier(0.55,0,1,0.7), opacity 320ms ease' },
    'exit-down':  { transform: 'translateX(0)   translateY(56px) rotate(-1deg) scale(0.93)', opacity: 0, transition: 'transform 320ms cubic-bezier(0.55,0,1,0.8), opacity 280ms ease' },
    incoming:     { transform: 'translateX(0)   translateY(0)   rotate(0deg) scale(1)',    opacity: 1, transition: 'none' },
  }
  const ps = phaseStyles[phase] || phaseStyles.idle

  return (
    <div onClick={onFlip} style={{ width: '100%', height: 300, perspective: 1100, cursor: 'pointer', ...ps }}>
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 500ms cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* FRONT */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '44px 36px', textAlign: 'center',
        }}>
          <span style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            fontSize: 10, fontWeight: 700, letterSpacing: '1px',
            color: frontColor, whiteSpace: 'nowrap', fontFamily: "'DM Sans', system-ui",
          }}>
            {card.type === 'abbr' ? 'ABBREVIATION' : 'TERM'}
          </span>
          <p style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: (card.abbr || card.full).length > 18 ? 26 : 40,
            fontWeight: 700, lineHeight: 1.15, color: t.text, letterSpacing: '-0.5px',
          }}>
            {card.abbr || card.full}
          </p>
          <span style={{
            position: 'absolute', bottom: 18, fontSize: 11, color: t.textMuted,
            fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="5.5" r="4.75" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5.5 3.5v3M5.5 8v.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            tap to reveal
          </span>
        </div>

        {/* BACK */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: t.surface, border: `1px solid ${backColor}50`, borderRadius: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '44px 36px', textAlign: 'center',
          boxShadow: `0 0 0 4px ${backColor}0c`,
        }}>
          <span style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            fontSize: 10, fontWeight: 700, letterSpacing: '1px',
            color: backColor, whiteSpace: 'nowrap', fontFamily: "'DM Sans', system-ui",
          }}>
            {card.type === 'abbr' ? 'FULL NAME' : 'DEFINITION'}
          </span>
          <span style={{
            position: 'absolute', top: 16, right: 18,
            fontSize: 10, fontWeight: 600, color: backColor,
            background: `${backColor}14`, border: `1px solid ${backColor}30`,
            borderRadius: 20, padding: '3px 10px', fontFamily: "'DM Sans', system-ui", letterSpacing: '0.2px',
          }}>
            {card.topic}
          </span>
          {card.abbr && (
            <p style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: card.full.length > 26 ? 18 : 23,
              fontWeight: 700, lineHeight: 1.3, color: t.text, marginBottom: 14,
              letterSpacing: '-0.3px', maxWidth: 360,
            }}>
              {card.full}
            </p>
          )}
          <p style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 14.5, color: t.textSub, lineHeight: 1.75, fontStyle: 'italic', maxWidth: 360,
          }}>
            {card.def}
          </p>
          <span style={{
            position: 'absolute', bottom: 18, fontSize: 11, color: t.textMuted, fontFamily: "'DM Sans', system-ui",
          }}>
            tap to flip back
          </span>
        </div>
      </div>
    </div>
  )
}

function Ghosts({ t }) {
  return (
    <>
      {[2, 1].map(i => (
        <div key={i} style={{
          position: 'absolute', top: i * 7, left: i * 4, right: -(i * 4), height: 300,
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20,
          opacity: 0.38 - i * 0.12, zIndex: -i,
        }} />
      ))}
    </>
  )
}

function Dots({ total, current, known, retry, t }) {
  return (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
      {Array.from({ length: total }, (_, i) => {
        const s = i < current
          ? (known.has(i) ? 'known' : 'retry')
          : i === current ? 'active' : 'future'
        const bg = { known: C.green, retry: C.red, active: C.accent, future: t.border }[s]
        return (
          <div key={i} style={{
            width: s === 'active' ? 22 : 7, height: 7,
            borderRadius: 99, background: bg,
            opacity: s === 'future' ? 0.3 : 1,
            transition: 'width 0.32s cubic-bezier(0.34,1.56,0.64,1), background 0.22s, opacity 0.22s',
          }} />
        )
      })}
    </div>
  )
}

function ResultOverlay({ result }) {
  if (!result) return null
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 20,
      pointerEvents: 'none', zIndex: 5,
      background: result === 'known' ? `${C.green}18` : `${C.red}14`,
      animation: 'rfade 380ms ease forwards',
    }} />
  )
}

export default function Flashcard({ subjectId }) {
  const t = useTheme()
  const s = useStore()
  const subjectName = s.params.name || null
  const [rawCards, setRawCards] = useState([])
  const [cards, setCards]       = useState([])
  const [idx, setIdx]           = useState(0)
  const [flipped, setFlipped]   = useState(false)
  const [phase, setPhase]       = useState('idle')
  const [known, setKnown]       = useState(new Set())
  const [retry, setRetry]       = useState(new Set())
  const [flash, setFlash]       = useState(null)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    if (!subjectId) return
    fetch(`/api/flashcards/${subjectId}`)
      .then(r => r.json())
      .then(data => {
        const mapped = data.map(f => ({
          id:    f.id ?? f.slug,
          abbr:  f.abbr ?? null,
          full:  f.front ?? f.full ?? '',
          def:   f.back  ?? f.def  ?? '',
          topic: f.section ?? f.topic ?? '',
          type:  f.abbr ? 'abbr' : 'def',
        }))
        const shuffled = shuffle(mapped)
        setRawCards(mapped)
        setCards(shuffled)
      })
      .catch(() => {})
  }, [subjectId])

  const card = cards[idx]
  const busy = phase !== 'idle'

  const handleFlip = () => { if (!busy) setFlipped(f => !f) }

  const advance = (result) => {
    if (busy || !flipped) return
    const exit   = result === 'known' ? 'exit-right' : 'exit-down'
    const exitMs = result === 'known' ? 380 : 340

    if (result === 'known') setKnown(p => new Set([...p, idx]))
    else                    setRetry(p => new Set([...p, idx]))

    setFlash(result)
    setTimeout(() => setFlash(null), 360)
    setPhase(exit)

    setTimeout(() => {
      const next = idx + 1
      if (next >= cards.length) { setDone(true); return }
      setPhase('incoming')
      setFlipped(false)
      setIdx(next)
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase('idle')))
    }, exitMs + 30)
  }

  const restart = () => {
    setCards(shuffle(rawCards))
    setDone(false)
    setIdx(0)
    setFlipped(false)
    setKnown(new Set())
    setRetry(new Set())
    setPhase('idle')
  }

  if (!cards.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: t.textMuted }}>
        Loading…
      </div>
    )
  }

  if (done) {
    const pct = Math.round((known.size / cards.length) * 100)
    return (
      <>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}.fu{animation:fadeUp .38s ease both}`}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="fu" style={{ textAlign: 'center', maxWidth: 380, padding: '0 28px' }}>
            <div style={{ fontSize: 46, marginBottom: 14 }}>{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
            <h2 style={{ fontFamily: "'Lora',serif", fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 6 }}>Session complete</h2>
            <p style={{ color: t.textSub, fontSize: 14, marginBottom: 36 }}>{cards.length} cards reviewed</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
              {[
                { label: 'Got it', count: known.size, color: C.green,  bg: `${C.green}14`  },
                { label: 'Review', count: retry.size, color: C.red,    bg: `${C.red}10`    },
                { label: 'Score',  count: pct + '%',  color: C.accent, bg: `${C.accent}10` },
              ].map(({ label, count, color, bg }) => (
                <div key={label} style={{ background: bg, borderRadius: 14, padding: '16px 20px', minWidth: 82 }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{count}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color, marginTop: 4 }}>{label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={restart}
              style={{
                background: C.accent, color: '#fff', border: 'none', borderRadius: 10,
                padding: '12px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
              }}
            >
              <RotateCcw size={14} /> Play again
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes rfade { 0%{opacity:1} 100%{opacity:0} }
        @keyframes cardDrop { from{opacity:0;transform:translateY(-20px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .card-drop { animation: cardDrop 400ms cubic-bezier(0.22,1,0.36,1) both; }
        .abtn {
          flex:1; padding:14px 12px; border-radius:12px; border:none;
          font-size:14px; font-weight:700; font-family:'DM Sans',system-ui;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px;
          transition: transform 180ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 180ms ease, opacity 150ms ease;
        }
        .abtn:hover:not(:disabled)  { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.12); }
        .abtn:active:not(:disabled) { transform:scale(0.97); box-shadow:none; }
        .abtn:disabled              { opacity:.25; cursor:not-allowed; }
        .btns { display:flex; gap:12px; transition: opacity 260ms ease, transform 280ms cubic-bezier(0.22,1,0.36,1); }
        .btns.off { opacity:0; transform:translateY(10px); pointer-events:none; }
        .btns.on  { opacity:1; transform:translateY(0);    pointer-events:auto; }
      `}</style>

      <main style={{ maxWidth: 500, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Subject context */}
        {subjectName && (
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', color: t.textMuted, marginBottom: 16, textAlign: 'center' }}>
            {subjectName.toUpperCase()} · {cards.length} CARDS
          </p>
        )}
        {/* Progress bar */}
        <div style={{ height: 2, background: t.border, borderRadius: 99, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{
            width: `${(idx / cards.length) * 100}%`, height: '100%',
            background: C.accent, borderRadius: 99,
            transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>

        {/* Score row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, height: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.green, opacity: known.size ? 1 : 0, transition: 'opacity 0.3s' }}>
            ✓ {known.size} got it
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: t.textMuted }}>{idx + 1} / {cards.length}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.red, opacity: retry.size ? 1 : 0, transition: 'opacity 0.3s' }}>
            ↻ {retry.size} review
          </span>
        </div>

        {/* Stack */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Ghosts t={t} />
          <div className={phase === 'idle' && idx > 0 ? 'card-drop' : ''} key={idx} style={{ position: 'relative' }}>
            <Card card={card} flipped={flipped} phase={phase} onFlip={handleFlip} t={t} />
            <ResultOverlay result={flash} />
          </div>
        </div>

        {/* Dots */}
        <div style={{ marginBottom: 28 }}>
          <Dots total={cards.length} current={idx} known={known} retry={retry} t={t} />
        </div>

        {/* Buttons */}
        <div className={`btns ${flipped && phase === 'idle' ? 'on' : 'off'}`}>
          <button className="abtn" disabled={!flipped || busy} onClick={() => advance('retry')}
            style={{ background: t.surface, border: `1px solid ${C.red}40`, color: C.red }}>
            <X size={16} /> Still learning
          </button>
          <button className="abtn" disabled={!flipped || busy} onClick={() => advance('known')}
            style={{ background: C.accent, color: '#fff' }}>
            <Check size={16} /> Got it
          </button>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 12, color: t.textMuted, marginTop: 14,
          opacity: !flipped && phase === 'idle' ? 1 : 0, transition: 'opacity 0.22s ease',
        }}>
          Click the card to reveal
        </p>
      </main>
    </>
  )
}

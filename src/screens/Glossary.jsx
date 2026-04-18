'use client'
import { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronUp, Zap, Check, X } from 'lucide-react'
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

function TypeChip({ type }) {
  const map = {
    abbr: { label: 'Abbreviation', color: C.accent, bg: `${C.accent}14` },
    def:  { label: 'Definition',   color: C.blue,   bg: `${C.blue}14`   },
  }
  const s = map[type] ?? map.def
  return (
    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.6px', color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 20 }}>
      {s.label}
    </span>
  )
}

function FlashSession({ deck, t, onExit }) {
  const [cards]   = useState(() => shuffle(deck))
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(new Set())
  const [retry, setRetry] = useState(new Set())
  const [done, setDone]   = useState(false)

  const card = cards[idx]

  const advance = (result) => {
    if (result === 'known') setKnown(p => new Set([...p, card.id]))
    else                    setRetry(p => new Set([...p, card.id]))
    if (idx + 1 >= cards.length) setDone(true)
    else { setIdx(i => i + 1); setFlipped(false) }
  }

  if (done) {
    const pct = Math.round((known.size / cards.length) * 100)
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 26, fontWeight: 700, marginBottom: 8, color: t.text }}>Session Complete</h2>
        <p style={{ color: t.textSub, marginBottom: 36, fontSize: 15 }}>{cards.length} cards reviewed</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 40 }}>
          {[
            { val: known.size, label: 'Got it',       color: C.green, bg: `${C.green}14` },
            { val: retry.size, label: 'Needs review',  color: C.red,   bg: `${C.red}10`  },
            { val: pct + '%',  label: 'Score',         color: C.accent, bg: `${C.accent}10` },
          ].map(({ val, label, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 14, padding: '20px 28px' }}>
              <p style={{ fontSize: 32, fontWeight: 800, color }}>{val}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color }}>{label}</p>
            </div>
          ))}
        </div>
        <button onClick={onExit} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: t.text, fontFamily: "'DM Sans', system-ui" }}>
          Back to Glossary
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ flex: 1, height: 5, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${(idx / cards.length) * 100}%`, height: '100%', background: C.accent, borderRadius: 99, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: t.textMuted }}>{idx + 1} / {cards.length}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓ {known.size}</span>
          <span style={{ fontSize: 11, color: t.textMuted }}>·</span>
          <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>✗ {retry.size}</span>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <span style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: t.textMuted }}>{card.section ?? card.topic}</span>
        <TypeChip type={card.type} />
      </div>

      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          background: t.surface, border: `2px solid ${flipped ? C.accent : t.border}`, borderRadius: 20,
          padding: '48px 40px', minHeight: 260, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', position: 'relative',
          boxShadow: flipped ? `0 0 0 4px ${C.accent}14` : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1px', color: flipped ? C.accent : t.textMuted, marginBottom: 20 }}>
          {flipped ? (card.abbr ? 'FULL NAME + DEFINITION' : 'DEFINITION') : (card.abbr ? 'ABBREVIATION' : 'TERM')}
        </span>
        <p style={{ fontFamily: "'Lora',Georgia,serif", fontSize: flipped ? 18 : (card.abbr ?? card.full ?? '').length > 18 ? 24 : 36, fontWeight: 700, lineHeight: 1.4, color: t.text, marginBottom: flipped && card.def ? 14 : 0 }}>
          {flipped ? (card.abbr ? card.full : card.def) : (card.abbr || card.full)}
        </p>
        {flipped && card.abbr && card.def && (
          <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.65, fontFamily: "'Lora',Georgia,serif", fontStyle: 'italic', maxWidth: 420 }}>{card.def}</p>
        )}
        <span style={{ position: 'absolute', bottom: 16, fontSize: 11, color: t.textMuted }}>{flipped ? 'Click to see front' : 'Click to reveal'}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, opacity: flipped ? 1 : 0, pointerEvents: flipped ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
        <button onClick={() => advance('retry')} style={{ flex: 1, padding: '13px', border: `1px solid ${C.red}`, borderRadius: 10, background: `${C.red}10`, color: C.red, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'DM Sans', system-ui" }}>
          <X size={16} /> Still learning
        </button>
        <button onClick={() => advance('known')} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: 10, background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'DM Sans', system-ui" }}>
          <Check size={16} /> Got it
        </button>
      </div>
    </div>
  )
}

export default function Glossary({ subjectId }) {
  const t = useTheme()
  const [terms, setTerms]         = useState([])
  const [topics, setTopics]       = useState(['All'])
  const [topic, setTopic]         = useState('All')
  const [search, setSearch]       = useState('')
  const [open, setOpen]           = useState({})
  const [flashDeck, setFlashDeck] = useState(null)

  useEffect(() => {
    if (!subjectId) return
    fetch(`/api/glossary/${subjectId}`)
      .then(r => r.json())
      .then(data => {
        const mapped = data.map(g => ({
          ...g,
          full: g.full ?? g.term ?? '',
          def:  g.def  ?? g.definition ?? '',
          type: g.abbr ? 'abbr' : 'def',
          topic: g.section ?? g.category ?? 'General',
        }))
        setTerms(mapped)
        const secs = ['All', ...Array.from(new Set(mapped.map(t => t.topic)))]
        setTopics(secs)
      })
      .catch(() => {})
  }, [subjectId])

  const filtered = terms.filter(term => {
    const matchTopic = topic === 'All' || term.topic === topic
    const q = search.toLowerCase()
    const matchSearch = !q || (term.abbr ?? '').toLowerCase().includes(q) || (term.full ?? '').toLowerCase().includes(q) || (term.def ?? '').toLowerCase().includes(q)
    return matchTopic && matchSearch
  })

  const toggle = (id) => setOpen(p => ({ ...p, [id]: !p[id] }))

  if (flashDeck) return <FlashSession deck={flashDeck} t={t} onExit={() => setFlashDeck(null)} />

  return (
    <>
      <style>{`@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search terms…"
            style={{
              width: '100%', paddingLeft: 40, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
              background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10,
              fontSize: 14, color: t.text, fontFamily: "'DM Sans', system-ui", outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = t.border}
          />
        </div>

        {/* Topic chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {topics.map(tp => (
            <button key={tp} onClick={() => setTopic(tp)} style={{
              padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: topic === tp ? C.accent : t.surface2,
              color: topic === tp ? '#fff' : t.textSub,
              border: `1px solid ${topic === tp ? C.accent : t.border}`,
              fontFamily: "'DM Sans', system-ui", transition: 'all 0.13s',
            }}>{tp}</button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 18px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted }}>{filtered.length} term{filtered.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setFlashDeck(filtered)}
            disabled={filtered.length === 0}
            style={{
              background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 700, cursor: filtered.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'DM Sans', system-ui", opacity: filtered.length > 0 ? 1 : 0.4,
            }}
            onMouseEnter={e => { if (filtered.length) e.currentTarget.style.background = C.accentHov }}
            onMouseLeave={e => { e.currentTarget.style.background = C.accent }}
          >
            <Zap size={14} /> Practice as Flashcards
          </button>
        </div>

        {/* Term list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map(term => (
            <div key={term.id} style={{ borderBottom: `1px solid ${t.border}` }}>
              <div
                onClick={() => toggle(term.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 4px', cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = t.surface2}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ minWidth: 56, fontSize: 14, fontWeight: 800, color: C.accent, fontFamily: "'DM Sans', system-ui", letterSpacing: '-0.3px' }}>
                  {term.abbr || <span style={{ color: t.border2 }}>—</span>}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: term.abbr ? 500 : 600, color: t.text }}>{term.full}</span>
                <TypeChip type={term.type} />
                <span style={{ color: t.textMuted, marginLeft: 8 }}>
                  {open[term.id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </span>
              </div>
              {open[term.id] && (
                <div style={{ padding: '0 4px 16px 72px', fontSize: 14, lineHeight: 1.7, color: t.textSub, fontFamily: "'Lora', Georgia, serif", animation: 'fadeDown 0.18s ease' }}>
                  <p>{term.def}</p>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, background: t.surface2, padding: '3px 8px', borderRadius: 20, border: `1px solid ${t.border}` }}>{term.topic}</span>
                    <button
                      onClick={e => { e.stopPropagation(); setFlashDeck([term]) }}
                      style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: C.accent, display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'DM Sans', system-ui" }}
                    >
                      <Zap size={11} /> Flash this
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: t.textMuted }}>
              <p style={{ fontSize: 14 }}>No terms found.</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

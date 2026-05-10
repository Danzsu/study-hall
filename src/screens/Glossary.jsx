'use client'
import { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronUp, Zap, Check, X, Layers, Network } from 'lucide-react'
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

function resolveSessionMode(card, mode) {
  if (mode === 'abbr-to-full' && card.abbr) return 'abbr-to-full'
  if (mode === 'full-to-def') return 'full-to-def'
  if (card.abbr && Math.random() > 0.5) return 'abbr-to-full'
  return 'full-to-def'
}

function FlashSession({ deck, mode, t, onExit }) {
  const [cards] = useState(() => shuffle(deck).map(card => ({
    ...card,
    sessionMode: resolveSessionMode(card, mode),
  })))
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(new Set())
  const [retry, setRetry] = useState(new Set())
  const [done, setDone]   = useState(false)

  const card = cards[idx]
  const asksAbbr = card.sessionMode === 'abbr-to-full'
  const frontText = asksAbbr ? (card.abbr || card.full) : card.full
  const backHeading = asksAbbr ? card.full : card.def
  const backDetail = asksAbbr ? card.def : ''

  const advance = (result) => {
    if (result === 'known') setKnown(p => new Set([...p, card.id]))
    else                    setRetry(p => new Set([...p, card.id]))
    if (idx + 1 >= cards.length) setDone(true)
    else { setIdx(i => i + 1); setFlipped(false) }
  }

  if (done) {
    const pct = Math.round((known.size / cards.length) * 100)
    return (
      <div className="page-wrap" style={{ '--pw': '520px', paddingTop: 60, paddingBottom: 24, textAlign: 'center' }}>
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
    <div className="page-wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
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
        <span style={{ background: `${C.purple}14`, border: `1px solid ${C.purple}35`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: C.purple }}>
          {asksAbbr ? 'abbr -> full' : 'term -> definition'}
        </span>
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
          {flipped ? (asksAbbr ? 'FULL NAME + DEFINITION' : 'DEFINITION') : (asksAbbr ? 'ABBREVIATION' : 'TERM')}
        </span>
        <p style={{ fontFamily: "'Lora',Georgia,serif", fontSize: flipped ? 18 : (card.abbr ?? card.full ?? '').length > 18 ? 24 : 36, fontWeight: 700, lineHeight: 1.4, color: t.text, marginBottom: flipped && card.def ? 14 : 0 }}>
          {flipped ? backHeading : frontText}
        </p>
        {flipped && backDetail && (
          <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.65, fontFamily: "'Lora',Georgia,serif", fontStyle: 'italic', maxWidth: 420 }}>{backDetail}</p>
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

function buildClusters(terms) {
  const grouped = new Map()
  for (const term of terms) {
    const key = term.topic || 'General'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(term)
  }

  return [...grouped.entries()]
    .map(([topic, items]) => ({
      topic,
      items,
      abbrCount: items.filter(item => item.abbr).length,
      defCount: items.filter(item => !item.abbr).length,
    }))
    .sort((a, b) => b.items.length - a.items.length || a.topic.localeCompare(b.topic))
}

function ClusterView({ clusters, t, onOpenTopic, onFlashCluster }) {
  const palette = [C.accent, C.blue, C.green, C.gold, C.purple, C.red]

  if (!clusters.length) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: t.textMuted }}>
        <p style={{ fontSize: 14 }}>No clusters found.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
      {clusters.map((cluster, i) => {
        const color = palette[i % palette.length]
        const sample = cluster.items.slice(0, 6)
        return (
          <section key={cluster.topic} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '16px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Layers size={15} style={{ color }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: t.text, lineHeight: 1.3, marginBottom: 4 }}>{cluster.topic}</h3>
                <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 700 }}>
                  {cluster.items.length} terms · {cluster.abbrCount} abbr · {cluster.defCount} definitions
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {sample.map(term => (
                <span key={term.id} style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}28`, borderRadius: 20, padding: '4px 8px' }}>
                  {term.abbr || term.full}
                </span>
              ))}
              {cluster.items.length > sample.length && (
                <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 20, padding: '4px 8px' }}>
                  +{cluster.items.length - sample.length}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onOpenTopic(cluster.topic)}
                style={{ flex: 1, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer', color: t.textSub, fontFamily: "'DM Sans', system-ui" }}
              >
                Open
              </button>
              <button
                onClick={() => onFlashCluster(cluster.items)}
                style={{ flex: 1, background: color, border: 'none', borderRadius: 8, padding: '8px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer', color: '#fff', fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Zap size={12} /> Flash
              </button>
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ConceptMapView({ clusters, t, onOpenTopic, onFlashCluster }) {
  const palette = [C.accent, C.blue, C.green, C.gold, C.purple, C.red]
  const visible = clusters.slice(0, 9)
  const totalTerms = clusters.reduce((sum, cluster) => sum + cluster.items.length, 0)

  if (!visible.length) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: t.textMuted }}>
        <p style={{ fontSize: 14 }}>No map nodes found.</p>
      </div>
    )
  }

  const nodes = visible.map((cluster, i) => {
    const angle = (-Math.PI / 2) + (i / visible.length) * Math.PI * 2
    return {
      ...cluster,
      color: palette[i % palette.length],
      x: 50 + Math.cos(angle) * 36,
      y: 50 + Math.sin(angle) * 32,
    }
  })

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `${C.blue}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Network size={16} style={{ color: C.blue }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Concept map</p>
            <p style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{visible.length} topic nodes from {totalTerms} filtered terms</p>
          </div>
        </div>
        <button
          onClick={() => onFlashCluster(clusters.flatMap(cluster => cluster.items))}
          style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Zap size={13} /> Flash map
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ position: 'relative', minWidth: 620, height: 430, background: t.surface2 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {nodes.map((node) => (
              <line key={`center-${node.topic}`} x1="50" y1="50" x2={node.x} y2={node.y} stroke={node.color} strokeWidth="0.32" opacity="0.42" />
            ))}
            {nodes.map((node, i) => {
              const next = nodes[(i + 1) % nodes.length]
              if (!next || nodes.length < 3) return null
              return <line key={`ring-${node.topic}`} x1={node.x} y1={node.y} x2={next.x} y2={next.y} stroke={t.border2} strokeWidth="0.22" opacity="0.45" />
            })}
          </svg>

          <button
            onClick={() => onOpenTopic('All')}
            style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 120, minHeight: 72, background: t.surface, border: `2px solid ${C.accent}`, borderRadius: 16, color: t.text, cursor: 'pointer', boxShadow: `0 12px 28px ${C.accent}18`, fontFamily: "'DM Sans', system-ui", padding: '10px 12px' }}
          >
            <span style={{ display: 'block', fontSize: 11, fontWeight: 900, color: C.accent, letterSpacing: '0.7px' }}>ALL TERMS</span>
            <span style={{ display: 'block', fontSize: 22, fontWeight: 900, marginTop: 2 }}>{totalTerms}</span>
          </button>

          {nodes.map((node) => (
            <div
              key={node.topic}
              style={{ position: 'absolute', left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)', width: 138 }}
            >
              <button
                onClick={() => onOpenTopic(node.topic)}
                style={{ width: '100%', minHeight: 82, background: t.surface, border: `1.5px solid ${node.color}66`, borderRadius: 12, padding: '10px 11px', cursor: 'pointer', color: t.text, boxShadow: `0 10px 24px ${node.color}14`, fontFamily: "'DM Sans', system-ui", textAlign: 'left' }}
              >
                <span style={{ display: 'block', width: 18, height: 4, borderRadius: 99, background: node.color, marginBottom: 8 }} />
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 12, fontWeight: 850, lineHeight: 1.25 }}>{node.topic}</span>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: t.textMuted, marginTop: 6 }}>{node.items.length} terms</span>
              </button>
              <button
                onClick={() => onFlashCluster(node.items)}
                style={{ marginTop: 6, width: '100%', background: `${node.color}14`, border: `1px solid ${node.color}45`, borderRadius: 8, color: node.color, cursor: 'pointer', padding: '6px 8px', fontSize: 11, fontWeight: 850, fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                <Zap size={11} /> Practice node
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
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
  const [flashMode, setFlashMode] = useState('mixed')
  const [viewMode, setViewMode]   = useState('list')

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

  const searchFiltered = terms.filter(term => {
    const q = search.toLowerCase()
    return !q || (term.abbr ?? '').toLowerCase().includes(q) || (term.full ?? '').toLowerCase().includes(q) || (term.def ?? '').toLowerCase().includes(q)
  })
  const filtered = searchFiltered.filter(term => topic === 'All' || term.topic === topic)
  const clusters = buildClusters(topic === 'All' ? searchFiltered : filtered)

  const toggle = (id) => setOpen(p => ({ ...p, [id]: !p[id] }))
  const openTopic = (nextTopic) => {
    setTopic(nextTopic)
    setSearch('')
    setViewMode('list')
  }

  if (flashDeck) return <FlashSession deck={flashDeck} mode={flashMode} t={t} onExit={() => setFlashDeck(null)} />

  return (
    <>
      <style>{`@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
      <main className="page-wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0 18px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted }}>{filtered.length} term{filtered.length !== 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', gap: 4, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 10, padding: 3 }}>
            {[
              { key: 'list', label: 'List' },
              { key: 'clusters', label: 'Clusters' },
              { key: 'map', label: 'Map' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setViewMode(item.key)}
                style={{ border: 'none', borderRadius: 7, padding: '6px 10px', background: viewMode === item.key ? C.blue : 'transparent', color: viewMode === item.key ? '#fff' : t.textSub, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', system-ui" }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 10, padding: 3 }}>
            {[
              { key: 'abbr-to-full', label: 'Abbr' },
              { key: 'full-to-def', label: 'Def' },
              { key: 'mixed', label: 'Mixed' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFlashMode(item.key)}
                style={{ border: 'none', borderRadius: 7, padding: '6px 10px', background: flashMode === item.key ? C.accent : 'transparent', color: flashMode === item.key ? '#fff' : t.textSub, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', system-ui" }}
              >
                {item.label}
              </button>
            ))}
          </div>
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

        {viewMode === 'map' ? (
          <ConceptMapView clusters={clusters} t={t} onOpenTopic={openTopic} onFlashCluster={setFlashDeck} />
        ) : viewMode === 'clusters' ? (
          <ClusterView clusters={clusters} t={t} onOpenTopic={openTopic} onFlashCluster={setFlashDeck} />
        ) : (
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
        )}
      </main>
    </>
  )
}

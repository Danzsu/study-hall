'use client'
import { useState, useEffect } from 'react'
import {
  Circle, ChevronDown, ChevronLeft, ChevronRight,
  ChevronUp, Layers, Play, Menu, Clock,
  AlertTriangle, Info, Lightbulb, FileText, Eye,
} from 'lucide-react'
import { useTheme, navigate } from '../store'
import { C } from '../theme'
import katex from 'katex'

const CALLOUTS = {
  NOTE: { label: 'Note', color: C.blue, bg: C.blueBg, Icon: Info },
  INFO: { label: 'Note', color: C.blue, bg: C.blueBg, Icon: Info },
  TIP: { label: 'Tip', color: C.green, bg: C.greenBg, Icon: Lightbulb },
  WARNING: { label: 'Warning', color: C.gold, bg: C.goldBg, Icon: AlertTriangle },
  IMPORTANT: { label: 'Important', color: C.accent, bg: C.accentBg, Icon: AlertTriangle },
  EXAMPLE: { label: 'Example', color: C.purple, bg: C.purpleBg, Icon: Lightbulb },
}

function Callout({ type = 'NOTE', children, t }) {
  const spec = CALLOUTS[type] ?? CALLOUTS.NOTE
  const Icon = spec.Icon
  return (
    <div style={{ border: `1px solid ${spec.color}55`, borderLeft: `4px solid ${spec.color}`, background: spec.bg, borderRadius: '0 10px 10px 0', padding: '16px 20px', margin: '28px 0', display: 'flex', gap: 14 }}>
      <Icon size={18} style={{ color: spec.color, flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: spec.color, marginBottom: 5, textTransform: 'uppercase' }}>{spec.label}</p>
        <div style={{ fontSize: 14.5, lineHeight: 1.7, color: t.text, fontFamily: "'Lora', Georgia, serif" }}>{children}</div>
      </div>
    </div>
  )
}

function renderContent(raw, t) {
  const lines = raw.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('$$')) {
      const mathLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('$$')) {
        mathLines.push(lines[i])
        i++
      }
      elements.push(<MathBlock key={i} value={mathLines.join('\n')} t={t} />)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 28, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.5px', marginBottom: 12, marginTop: 36, color: t.text }}>{line.slice(2)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontFamily: "'DM Sans',system-ui", fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 12, marginTop: 32, color: t.text }}>{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontFamily: "'DM Sans',system-ui", fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 24, color: t.text }}>{line.slice(4)}</h3>)
    } else if (line.startsWith('> ')) {
      const quoteLines = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      const marker = quoteLines[0]?.match(/^\[!(NOTE|INFO|TIP|WARNING|IMPORTANT|EXAMPLE)\]\s*$/i)
      const type = marker ? marker[1].toUpperCase() : 'IMPORTANT'
      const body = marker ? quoteLines.slice(1) : quoteLines
      elements.push(
        <Callout key={`callout-${i}`} type={type} t={t}>
          {body.map((part, idx) => (
            <p key={idx} style={{ margin: idx === 0 ? 0 : '8px 0 0' }}>{inlineFormat(part, t)}</p>
          ))}
        </Callout>
      )
      continue
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(<li key={i} style={{ marginBottom: 6 }}>{inlineFormat(lines[i].slice(2), t)}</li>)
        i++
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: 24, marginBottom: 20, lineHeight: 1.75, color: t.text }}>{items}</ul>)
      continue
    } else if (/^\d+\. /.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: 6 }}>{inlineFormat(lines[i].replace(/^\d+\. /, ''), t)}</li>)
        i++
      }
      elements.push(<ol key={`ol-${i}`} style={{ paddingLeft: 24, marginBottom: 20, lineHeight: 1.75, color: t.text }}>{items}</ol>)
      continue
    } else if (line.startsWith('```')) {
      const lang = line.slice(3)
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 10, padding: '16px 18px', margin: '24px 0', overflowX: 'auto', fontSize: 13, lineHeight: 1.6, color: t.text, fontFamily: "'JetBrains Mono', monospace" }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
    } else if (line.trim() === '' || line.trim() === '---') {
      // skip
    } else {
      elements.push(<p key={i} style={{ marginBottom: 20, lineHeight: 1.8 }}>{inlineFormat(line, t)}</p>)
    }
    i++
  }

  return elements
}

function inlineFormat(text, t) {
  // Split by bold/italic/code markers and render as spans
  const parts = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/)
    const codeMatch = remaining.match(/`(.+?)`/)
    const mathMatch = remaining.match(/\$([^$\n]+?)\$/)

    const candidates = [boldMatch, italicMatch, codeMatch, mathMatch].filter(Boolean)
    if (candidates.length === 0) {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    const first = candidates.reduce((a, b) => a.index < b.index ? a : b)
    if (first.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, first.index)}</span>)
    }

    if (first === boldMatch) {
      parts.push(<strong key={key++}>{first[1]}</strong>)
      remaining = remaining.slice(first.index + first[0].length)
    } else if (first === italicMatch) {
      parts.push(<em key={key++}>{first[1]}</em>)
      remaining = remaining.slice(first.index + first[0].length)
    } else if (first === codeMatch) {
      parts.push(<code key={key++} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 4, padding: '1px 5px', fontSize: '0.9em', fontFamily: "'JetBrains Mono', monospace" }}>{first[1]}</code>)
      remaining = remaining.slice(first.index + first[0].length)
    } else {
      parts.push(<MathInline key={key++} value={first[1]} />)
      remaining = remaining.slice(first.index + first[0].length)
    }
  }

  return parts
}

function MathInline({ value }) {
  try {
    return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(value, { throwOnError: false }) }} />
  } catch {
    return <code>{value}</code>
  }
}

function MathBlock({ value, t }) {
  try {
    return (
      <div style={{ overflowX: 'auto', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 10, padding: '16px 18px', margin: '24px 0' }}
        dangerouslySetInnerHTML={{ __html: katex.renderToString(value, { throwOnError: false, displayMode: true }) }}
      />
    )
  } catch {
    return <pre>{value}</pre>
  }
}

function RecallCards({ items, t }) {
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState({})
  const [revealed, setRevealed] = useState({})
  const [ratings, setRatings] = useState({})
  if (!items?.length) return null
  const item = items[idx]
  const doneCount = Object.keys(ratings).length
  const confidence = items.length > 0 ? Math.round((Object.values(ratings).filter(v => v === 'correct').length / items.length) * 100) : 0

  return (
    <section style={{ marginTop: 48, paddingTop: 28, borderTop: `1px solid ${t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <img src="/assets/mascot-clipboard.png" alt="" style={{ width: 46, height: 46, objectFit: 'contain' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: t.textMuted }}>ACTIVE RECALL</p>
          <p style={{ fontSize: 13, color: t.textSub, marginTop: 3 }}>Type first, reveal second, then rate your confidence.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {items.map((_, i) => {
          const r = ratings[i]
          const color = r === 'correct' ? C.green : r === 'partial' ? C.gold : r === 'wrong' ? C.red : i === idx ? C.accent : t.border
          return (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Recall question ${i + 1}`}
              style={{ flex: 1, height: 5, borderRadius: 99, background: color, border: 'none', cursor: 'pointer' }}
            />
          )
        })}
      </div>

      <div style={{ background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: 14, padding: '28px 30px' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: t.textMuted, letterSpacing: '1px' }}>QUESTION {idx + 1} OF {items.length}</span>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginTop: 12, marginBottom: 18, color: t.text }}>
          {item.question}
        </p>
        <textarea
          value={typed[idx] || ''}
          onChange={e => setTyped(p => ({ ...p, [idx]: e.target.value }))}
          placeholder="Type your answer here, then reveal the model answer..."
          style={{ width: '100%', minHeight: 84, resize: 'vertical', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, color: t.text, fontFamily: "'DM Sans',system-ui", lineHeight: 1.5, outline: 'none' }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = t.border}
        />
        {revealed[idx] ? (
          <div style={{ marginTop: 18, padding: '16px 18px', background: `${C.accent}10`, borderLeft: `3px solid ${C.accent}`, borderRadius: '0 10px 10px 0' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1px', color: C.accent }}>MODEL ANSWER</span>
            <p style={{ fontSize: 14, color: t.text, lineHeight: 1.7, marginTop: 6, fontFamily: "'Lora', Georgia, serif" }}>{item.answer}</p>
            <p style={{ fontSize: 12, color: t.textSub, marginTop: 12, fontWeight: 700 }}>How well did you know this?</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { key: 'wrong', label: 'Forgot', color: C.red },
                { key: 'partial', label: 'Partial', color: C.gold },
                { key: 'correct', label: 'Confident', color: C.green },
              ].map(b => (
                <button
                  key={b.key}
                  onClick={() => setRatings(p => ({ ...p, [idx]: b.key }))}
                  style={{ flex: '1 1 120px', padding: '10px', borderRadius: 8, background: ratings[idx] === b.key ? b.color : t.surface, color: ratings[idx] === b.key ? '#fff' : b.color, border: `1.5px solid ${b.color}`, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", fontSize: 13, fontWeight: 700 }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setRevealed(p => ({ ...p, [idx]: true }))}
            style={{ marginTop: 14, background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            <Eye size={14} /> Reveal answer
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          style={{ opacity: idx === 0 ? 0.4 : 1, background: t.surface, border: `1px solid ${t.border}`, color: t.textSub, borderRadius: 8, padding: '8px 13px', fontSize: 13, fontWeight: 700, cursor: idx === 0 ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',system-ui" }}
        >
          Previous
        </button>
        <span style={{ fontSize: 12, color: t.textMuted }}>{doneCount} of {items.length} marked - {confidence}% confident</span>
        <button
          onClick={() => setIdx(Math.min(items.length - 1, idx + 1))}
          disabled={idx === items.length - 1}
          style={{ opacity: idx === items.length - 1 ? 0.4 : 1, background: C.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 13px', fontSize: 13, fontWeight: 700, cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',system-ui" }}
        >
          Next
        </button>
      </div>
    </section>
  )
}

function SourceDisclaimer({ sources, t }) {
  const [open, setOpen] = useState(false)
  if (!sources?.length) return null
  return (
    <section style={{ marginTop: 36, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '14px 20px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',system-ui" }}
      >
        <FileText size={16} style={{ color: t.textMuted, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>AI-generated content - verify before exam</p>
          <p style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>Grounded in {sources.length} source{sources.length > 1 ? 's' : ''} from your notes.</p>
        </div>
        {open ? <ChevronUp size={16} style={{ color: t.textMuted }} /> : <ChevronDown size={16} style={{ color: t.textMuted }} />}
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${t.border}`, padding: '16px 20px 18px', background: t.surface }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 12 }}>SOURCES</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sources.map((src, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: t.textSub, padding: '8px 10px', borderRadius: 8, background: t.surface2 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.accent, background: `${C.accent}14`, padding: '2px 6px', borderRadius: 4, minWidth: 22, textAlign: 'center', flexShrink: 0, marginTop: 1 }}>{idx + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: t.text }}>{src.title ?? 'Source material'}</p>
                  {(src.author || src.year) && <p style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{[src.author, src.year].filter(Boolean).join(' - ')}</p>}
                </div>
                {src.type && <span style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, flexShrink: 0 }}>{src.type}</span>}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: t.textMuted, marginTop: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
            Explanations and definitions were generated with AI from the listed materials. For high-stakes exam prep, cross-check formulas and definitions against the original source.
          </p>
        </div>
      )}
    </section>
  )
}

function StudyProgressPill({ current, total, t }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 20, padding: '5px 12px', marginLeft: 'auto' }}>
      <div style={{ width: 60, height: 4, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: C.accent }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: t.textSub }}>{current}/{total}</span>
    </div>
  )
}

function Sidebar({ lessons, activeSlug, subjectId, sidebarOpen, t }) {
  const sections = {}
  for (const l of lessons) {
    if (!sections[l.section]) sections[l.section] = []
    sections[l.section].push(l)
  }
  const [expanded, setExpanded] = useState(() => {
    const active = lessons.find(l => l.slug === activeSlug)
    return active ? { [active.section]: true } : {}
  })

  const toggle = (sec) => setExpanded(p => ({ ...p, [sec]: !p[sec] }))

  return (
    <aside style={{
      width: sidebarOpen ? 268 : 0,
      background: t.surface,
      borderRight: `1px solid ${t.border}`,
      overflowY: 'auto', overflowX: 'hidden',
      position: 'sticky', top: 56,
      height: 'calc(100vh - 56px)',
      flexShrink: 0,
      transition: 'width 0.28s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <div style={{ width: 268, padding: '16px 0' }}>
        <div style={{ padding: '0 18px 16px', borderBottom: `1px solid ${t.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: t.textMuted, marginBottom: 4 }}>COURSE</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Study notes</p>
        </div>
        <nav style={{ paddingTop: 8 }}>
          {Object.entries(sections).map(([sec, items]) => (
            <div key={sec}>
              <button
                onClick={() => toggle(sec)}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  padding: '8px 18px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', cursor: 'pointer', color: t.textMuted,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1px' }}>{sec.toUpperCase()}</span>
                <ChevronDown size={12} style={{ transform: expanded[sec] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {expanded[sec] && items.map(lesson => {
                const isActive = lesson.slug === activeSlug
                return (
                  <div
                    key={lesson.slug}
                    onClick={() => navigate('/study', { id: subjectId, lesson: lesson.slug })}
                    style={{
                      padding: '9px 18px 9px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
                      cursor: 'pointer',
                      background: isActive ? `${C.accent}14` : 'transparent',
                      borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.surface2 }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <Circle size={14} style={{ color: isActive ? C.accent : t.border2, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: isActive ? 700 : 500,
                        color: isActive ? C.accent : t.text,
                        lineHeight: 1.35, marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{lesson.title}</p>
                      <p style={{ fontSize: 11, color: t.textMuted }}>{lesson.time ?? `${lesson.lesson * 2 + 8} min`}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default function Study({ subjectId, lesson: lessonProp }) {
  const t = useTheme()
  const [lessons, setLessons]         = useState([])
  const [activeSlug, setActiveSlug]   = useState(lessonProp ?? null)
  const [content, setContent]         = useState(null)
  const [frontmatter, setFrontmatter] = useState({})
  const [activeRecall, setActiveRecall] = useState([])
  const [sources, setSources] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading]         = useState(false)

  // Fetch lessons list
  useEffect(() => {
    if (!subjectId) return
    fetch(`/api/notes/${subjectId}`)
      .then(r => r.json())
      .then(data => {
        setLessons(data)
        if (!activeSlug && data.length > 0) setActiveSlug(data[0].slug)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  // Fetch active lesson content
  useEffect(() => {
    if (!subjectId || !activeSlug) return
    setLoading(true)
    fetch(`/api/notes/${subjectId}/${activeSlug}`)
      .then(r => r.json())
      .then(data => {
        setContent(data.content ?? '')
        setFrontmatter(data.frontmatter ?? {})
        setActiveRecall(data.activeRecall ?? [])
        setSources(data.sources ?? data.frontmatter?.sources ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [subjectId, activeSlug])

  // Sync lessonProp → activeSlug when navigated from outside
  useEffect(() => {
    if (lessonProp) setActiveSlug(lessonProp)
  }, [lessonProp])

  const activeIdx  = lessons.findIndex(l => l.slug === activeSlug)
  const prevLesson = lessons[activeIdx - 1] ?? null
  const nextLesson = lessons[activeIdx + 1] ?? null
  const active     = lessons[activeIdx] ?? null
  const lessonProgress = activeIdx >= 0 ? activeIdx + 1 : 0

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        .article-body { animation: fadeUp 0.36s ease both; }
        .study-sidebar-link:hover { background: var(--surface2) !important; }
      `}</style>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        <Sidebar
          lessons={lessons}
          activeSlug={activeSlug}
          subjectId={subjectId}
          sidebarOpen={sidebarOpen}
          t={t}
        />

        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
            borderBottom: `1px solid ${t.border}`, background: t.surface,
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            <button
              onClick={() => setSidebarOpen(s => !s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textSub, display: 'flex', padding: 4 }}
            >
              <Menu size={18} />
            </button>
            {active && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: `${C.accent}14`, color: C.accent,
                  fontSize: 10, fontWeight: 800, letterSpacing: '1px',
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  {frontmatter.section ?? active.section}
                </span>
                <span style={{ fontSize: 12, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={11} /> {active.time ?? `${active.lesson * 2 + 8} min`}
                </span>
              </div>
            )}
            <StudyProgressPill current={lessonProgress} total={lessons.length} t={t} />
          </div>

          <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 40px 80px' }}>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: t.textMuted }}>
                Loading…
              </div>
            )}

            {!loading && content !== null && (
              <div className="article-body">
                {/* Lesson header */}
                <div style={{ marginBottom: 36, paddingBottom: 28, borderBottom: `1px solid ${t.border}` }}>
                  <h1 style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: 30, fontWeight: 700, lineHeight: 1.25,
                    letterSpacing: '-0.5px', marginBottom: 12, color: t.text,
                  }}>
                    {frontmatter.title ?? active?.title ?? ''}
                  </h1>
                  {frontmatter.description && (
                    <p style={{ fontSize: 16, color: t.textSub, lineHeight: 1.6, fontFamily: "'Lora', Georgia, serif", fontStyle: 'italic' }}>
                      {frontmatter.description}
                    </p>
                  )}
                </div>

                {/* Body */}
                <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 15.5, lineHeight: 1.8, color: t.text }}>
                  {renderContent(content, t)}
                </div>

                <RecallCards items={activeRecall} t={t} />
                <SourceDisclaimer sources={sources} t={t} />

                {/* Bottom nav */}
                <div style={{
                  marginTop: 56, paddingTop: 28, borderTop: `1px solid ${t.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}>
                  <button
                    onClick={() => prevLesson && setActiveSlug(prevLesson.slug)}
                    disabled={!prevLesson}
                    style={{
                      background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8,
                      color: prevLesson ? t.text : t.textMuted, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                      cursor: prevLesson ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', system-ui",
                      display: 'inline-flex', alignItems: 'center', gap: 6, opacity: prevLesson ? 1 : 0.4,
                    }}
                  >
                    <ChevronLeft size={16} /> {prevLesson?.title ?? 'Previous'}
                  </button>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => navigate('/flashcards', { id: subjectId })}
                      style={{
                        background: `${C.accent}14`, border: `1px solid ${C.accent}40`,
                        borderRadius: 8, color: C.accent, padding: '8px 14px', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', fontFamily: "'DM Sans', system-ui",
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Layers size={14} /> Flashcards
                    </button>
                    <button
                      onClick={() => navigate('/quiz', { id: subjectId })}
                      style={{
                        background: C.accent, border: 'none',
                        borderRadius: 8, color: '#fff', padding: '8px 14px', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', fontFamily: "'DM Sans', system-ui",
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = C.accentHov}
                      onMouseLeave={e => e.currentTarget.style.background = C.accent}
                    >
                      <Play size={14} /> Quiz
                    </button>
                  </div>

                  <button
                    onClick={() => nextLesson && setActiveSlug(nextLesson.slug)}
                    disabled={!nextLesson}
                    style={{
                      background: nextLesson ? C.accent : t.surface,
                      border: nextLesson ? 'none' : `1px solid ${t.border}`,
                      borderRadius: 8,
                      color: nextLesson ? '#fff' : t.textMuted,
                      padding: '8px 16px', fontSize: 13, fontWeight: 700,
                      cursor: nextLesson ? 'pointer' : 'not-allowed',
                      fontFamily: "'DM Sans', system-ui",
                      display: 'inline-flex', alignItems: 'center', gap: 6, opacity: nextLesson ? 1 : 0.4,
                    }}
                    onMouseEnter={e => { if (nextLesson) e.currentTarget.style.background = C.accentHov }}
                    onMouseLeave={e => { if (nextLesson) e.currentTarget.style.background = nextLesson ? C.accent : t.surface }}
                  >
                    {nextLesson?.title ?? 'Next'} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {!loading && content === null && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: t.textMuted }}>
                Select a lesson from the sidebar
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

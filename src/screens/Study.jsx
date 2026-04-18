'use client'
import { useState, useEffect } from 'react'
import {
  CheckCircle2, Circle, ChevronDown, ChevronLeft, ChevronRight,
  Layers, Play, Menu, X, Clock,
} from 'lucide-react'
import { useTheme, navigate } from '../store'
import { C } from '../theme'
import katex from 'katex'

// Simple markdown → HTML converter for lesson content
function mdToHtml(md) {
  if (!md) return ''
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>')
    .replace(/(<oli>.*<\/oli>\n?)+/g, m => `<ol>${m.replace(/<\/?oli>/g, m2 => m2 === '<oli>' ? '<li>' : '</li>')}</ol>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^([^<\n].+)$/gm, (line) => {
      if (line.startsWith('<')) return line
      return line
    })
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
      elements.push(
        <div key={i} style={{ borderLeft: `4px solid ${C.accent}`, background: `${C.accent}10`, borderRadius: '0 10px 10px 0', padding: '14px 18px', margin: '24px 0' }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: t.textSub, fontStyle: 'italic' }}>{inlineFormat(line.slice(2), t)}</p>
        </div>
      )
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
  const [open, setOpen] = useState({})
  if (!items?.length) return null
  return (
    <section style={{ marginTop: 44, paddingTop: 28, borderTop: `1px solid ${t.border}` }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: t.textMuted, marginBottom: 12 }}>ACTIVE RECALL</p>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item, idx) => {
          const active = !!open[idx]
          return (
            <button
              key={idx}
              onClick={() => setOpen(p => ({ ...p, [idx]: !p[idx] }))}
              style={{
                textAlign: 'left',
                background: active ? `${C.accent}12` : t.surface,
                border: `1px solid ${active ? C.accent + '50' : t.border}`,
                borderRadius: 12,
                padding: '14px 16px',
                cursor: 'pointer',
                fontFamily: "'DM Sans', system-ui",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: '0.6px' }}>Q{idx + 1}</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: t.text, marginTop: 5, lineHeight: 1.45 }}>{item.question}</p>
              {active && <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.65, marginTop: 10, fontFamily: "'Lora', Georgia, serif" }}>{item.answer}</p>}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function SourcesBlock({ sources, t }) {
  if (!sources?.length) return null
  return (
    <section style={{ marginTop: 36, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: '16px 18px' }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: t.textMuted, marginBottom: 10 }}>SOURCES</p>
      <div style={{ display: 'grid', gap: 6 }}>
        {sources.map((src, idx) => (
          <p key={idx} style={{ fontSize: 12, color: t.textSub, lineHeight: 1.55 }}>
            <strong style={{ color: t.text }}>{src.title ?? 'Forras'}</strong>
            {src.author ? ` - ${src.author}` : ''}
            {src.year ? ` (${src.year})` : ''}
            {src.type ? ` · ${src.type}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}

function Sidebar({ lessons, activeSlug, subjectId, sidebarOpen, onClose, t }) {
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
                <SourcesBlock sources={sources} t={t} />

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

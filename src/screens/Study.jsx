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
import MarkdownText from '../components/MarkdownText'
import { themes } from '../../lib/courseTheme'
import { MermaidDiagram } from '../components/study/MermaidDiagram'
import { Callout as StudyCallout, MarginNote as StudyMarginNote, SectionHeading } from '../components/study/index.jsx'
import { appendActivity } from '../lib/activityLog'

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
        <div style={{ fontSize: 14.5, lineHeight: 1.7, color: t.text, fontFamily: "var(--font-serif, 'Lora', Georgia, serif)" }}>{children}</div>
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
      const after = line.slice(2)
      const mathLines = []
      if (after.endsWith('$$')) {
        // Single-line format: $$formula$$
        mathLines.push(after.slice(0, -2))
      } else {
        if (after.trim()) mathLines.push(after) // content on same line as opening $$
        i++
        while (i < lines.length && !lines[i].startsWith('$$')) {
          mathLines.push(lines[i])
          i++
        }
      }
      elements.push(<MathBlock key={i} value={mathLines.join('\n').trim()} t={t} />)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontFamily: "var(--font-serif, 'Lora', Georgia, serif)", fontSize: 28, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.5px', marginBottom: 12, marginTop: 36, color: t.text }}>{line.slice(2)}</h1>)
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
    } else if (/^!\[([^\]]*)\]\(([^)]+)\)\s*$/.test(line)) {
      const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
      elements.push(
        <figure key={i} style={{ margin: '24px 0', textAlign: 'center' }}>
          <img
            src={imgMatch[2]}
            alt={imgMatch[1]}
            style={{
              maxWidth: '100%',
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          />
          {imgMatch[1] && (
            <figcaption style={{
              marginTop: 8, fontSize: 13, color: t.textSub,
              fontStyle: 'italic', fontFamily: "var(--font-serif, 'Lora', Georgia, serif)",
            }}>
              {imgMatch[1]}
            </figcaption>
          )}
        </figure>
      )
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      if (lang === 'mermaid') {
        elements.push(<MermaidDiagram key={i} code={codeLines.join('\n')} t={t} />)
      } else {
        elements.push(
          <pre key={i} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 10, padding: '16px 18px', margin: '24px 0', overflowX: 'auto', fontSize: 13, lineHeight: 1.6, color: t.text, fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        )
      }
    } else if (/^<Callout\b/i.test(line.trim())) {
      const openMatch = line.match(/<Callout\b([^>]*)>/i)
      const attrs = openMatch ? parseTagAttributes(openMatch[1]) : {}
      const bodyLines = []
      if (!/<\/Callout>/i.test(line)) {
        i++
        while (i < lines.length && !/<\/Callout>/i.test(lines[i])) {
          bodyLines.push(lines[i])
          i++
        }
      } else {
        const inner = line.replace(/<Callout\b[^>]*>/i, '').replace(/<\/Callout>/i, '').trim()
        if (inner) bodyLines.push(inner)
      }
      const xmlVariantMap = { insight: 'insight', important: 'important', warning: 'warning', note: 'note', example: 'insight', tip: 'note' }
      const variant = xmlVariantMap[String(attrs.variant || '').toLowerCase()] ?? 'note'
      elements.push(
        <StudyCallout key={`cv-${i}`} variant={variant}>
          {bodyLines.map((part, idx) => (
            <p key={idx} style={{ margin: idx === 0 ? 0 : '8px 0 0' }}>{inlineFormat(part.trim(), t)}</p>
          ))}
        </StudyCallout>
      )
    } else if (/^<MarginNote\b/i.test(line.trim())) {
      const openMatch = line.match(/<MarginNote\b([^>]*)>/i)
      const attrs = openMatch ? parseTagAttributes(openMatch[1]) : {}
      const bodyLines = []
      if (!/<\/MarginNote>/i.test(line)) {
        i++
        while (i < lines.length && !/<\/MarginNote>/i.test(lines[i])) {
          bodyLines.push(lines[i])
          i++
        }
      }
      elements.push(
        <StudyMarginNote key={`mn-${i}`} label={attrs.label || 'Side note'}>
          {bodyLines.map((part, idx) => (
            <p key={idx} style={{ margin: idx === 0 ? 0 : '6px 0 0' }}>{inlineFormat(part.trim(), t)}</p>
          ))}
        </StudyMarginNote>
      )
    } else if (/^<SectionHeading\b/i.test(line.trim())) {
      const openMatch = line.match(/<SectionHeading\b([^>]*)>/i)
      const shAttrs = openMatch ? parseTagAttributes(openMatch[1]) : {}
      const shLines = []
      if (!/<\/SectionHeading>/i.test(line)) {
        i++
        while (i < lines.length && !/<\/SectionHeading>/i.test(lines[i])) {
          shLines.push(lines[i]); i++
        }
      } else {
        const inner = line.replace(/<SectionHeading\b[^>]*>/i, '').replace(/<\/SectionHeading>/i, '').trim()
        if (inner) shLines.push(inner)
      }
      const lvl = parseInt(shAttrs.level ?? '2', 10)
      elements.push(
        <SectionHeading key={`sh-${i}`} level={isNaN(lvl) ? 2 : Math.max(2, Math.min(3, lvl))}>
          {inlineFormat(shLines.join(' ').trim(), t)}
        </SectionHeading>
      )
    } else if (line.trim() === '' || line.trim() === '---') {
      // skip
    } else if (/^<\/?[a-zA-Z][a-zA-Z0-9-]*(\s[^>]*)?>?\s*$/.test(line.trim()) && !/^<[HT]\s/i.test(line)) {
      // skip standalone HTML block tag lines (details, summary, etc.)
    } else {
      elements.push(<p key={i} style={{ marginBottom: 20, lineHeight: 1.8 }}>{inlineFormat(line, t)}</p>)
    }
    i++
  }

  return elements
}

function inlineFormat(text, t) {
  return renderInlineNodes(text, t)
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
      <div style={{
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        background: t.surface2, border: `1px solid ${t.border}`,
        borderRadius: 10, padding: '16px 18px', margin: '24px 0',
        maxWidth: '100%',
      }}
        dangerouslySetInnerHTML={{ __html: katex.renderToString(value, { throwOnError: false, displayMode: true, fleqn: false }) }}
      />
    )
  } catch {
    return <pre style={{ overflowX: 'auto', padding: '16px 18px' }}>{value}</pre>
  }
}

function normalizeNotePayload(data) {
  const payload = data && typeof data === 'object' ? data : {}
  const frontmatter = payload.frontmatter && typeof payload.frontmatter === 'object' ? payload.frontmatter : {}

  return {
    content: String(payload.content ?? payload.contentMdx ?? payload.body ?? '').replace(/\r\n/g, '\n'),
    frontmatter,
    activeRecall: normalizeRecallItems(payload.activeRecall ?? frontmatter.activeRecall ?? []),
    sources: normalizeSources(payload.sources ?? frontmatter.sources ?? []),
  }
}

function normalizeSources(value) {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  return list.filter(item => item && typeof item === 'object')
}

function normalizeRecallItems(value) {
  if (!Array.isArray(value)) return []
  return value
    .map(item => {
      if (!item || typeof item !== 'object') return null
      const question = String(item.question ?? item.q ?? '').trim()
      const answer = String(item.answer ?? item.a ?? '').trim()
      if (!question && !answer) return null
      return { question, answer }
    })
    .filter(Boolean)
}

function parseTagAttributes(raw = '') {
  const attrs = {}
  const attrPattern = /([A-Za-z_:][A-Za-z0-9_:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  let match
  while ((match = attrPattern.exec(String(raw))) !== null) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? ''
  }
  return attrs
}

function resolveToneColor(value) {
  const token = String(value || '').trim().toLowerCase()
  if (!token) return C.accent
  if (C[token]) return C[token]
  if (/^#|^rgb|^hsl/.test(token)) return value
  return C.accent
}

function transparentTone(color) {
  const value = String(color || '').trim()
  const shortHex = value.match(/^#([0-9a-f]{3})$/i)
  if (shortHex) {
    const expanded = shortHex[1].split('').map(ch => ch + ch).join('')
    return `#${expanded}1e`
  }
  if (/^#[0-9a-f]{6}$/i.test(value)) return `${value}1e`
  return `color-mix(in srgb, ${value} 12%, transparent)`
}

function InlineHighlight({ color = C.accent, type = 'plain', children, t }) {
  const tone = resolveToneColor(color)
  const bg   = transparentTone(tone)

  if (type === 'marker') {
    return (
      <span style={{ position: 'relative', display: 'inline', zIndex: 0 }}>
        <span aria-hidden="true" style={{
          position: 'absolute', inset: '1px -5px',
          background: bg, border: `1.5px solid ${tone}`,
          borderRadius: 3, zIndex: -1,
          filter: 'url(#study-roughen)', transform: 'rotate(-0.4deg)',
        }} />
        {children}
      </span>
    )
  }
  if (type === 'gradient') {
    return (
      <span style={{
        backgroundImage: `linear-gradient(transparent 58%, ${bg} 58%)`,
        display: 'inline', padding: '0 2px',
      }}>
        {children}
      </span>
    )
  }
  return (
    <mark style={{ background: bg, borderBottom: `2px solid ${tone}`, borderRadius: 4, color: t.text, padding: '0 3px', margin: '0 1px' }}>
      {children}
    </mark>
  )
}

function InlineTooltip({ label, definition, t }) {
  const [open, setOpen] = useState(false)
  const safeLabel = String(label || '').trim()
  const safeDefinition = String(definition || safeLabel || '').trim()

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'baseline', verticalAlign: 'baseline' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      title={safeDefinition || safeLabel}
    >
      <span style={{ borderBottom: `1px dotted ${C.blue}`, color: t.text, cursor: safeDefinition ? 'help' : 'default', paddingBottom: 1 }}>
        {safeLabel}
      </span>
      {open && safeDefinition && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 8px)',
            zIndex: 20,
            width: 'max-content',
            maxWidth: 'min(320px, 72vw)',
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
            padding: '10px 12px',
            color: t.text,
            fontFamily: "'DM Sans',system-ui",
            fontSize: 12.5,
            lineHeight: 1.5,
          }}
        >
          <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', color: C.blue, marginBottom: 4 }}>
            GLOSSARY
          </span>
          {safeDefinition}
        </span>
      )}
    </span>
  )
}

function parseTooltipContent(attrs, inner) {
  const attrMap = parseTagAttributes(attrs)
  const rawInner = String(inner || '').trim()
  const pipeMatch = rawInner.match(/^(.+?)\s*[|:]\s*(.+)$/s)

  const label = attrMap.term || attrMap.label || attrMap.text || attrMap.value || (pipeMatch ? pipeMatch[1].trim() : rawInner)
  const definition = attrMap.definition || attrMap.def || attrMap.tooltip || attrMap.title || attrMap.gloss || attrMap.description || (pipeMatch ? pipeMatch[2].trim() : rawInner)

  return { label, definition }
}

function renderInlineNodes(text, t) {
  let remaining = String(text ?? '')
  const nodes = []
  let key = 0

  while (remaining.length > 0) {
    const candidates = []
    const push = (kind, match, priority, build) => {
      if (match && typeof match.index === 'number' && match.index >= 0) {
        candidates.push({ kind, match, priority, build })
      }
    }

    push('highlightTag', remaining.match(/<H\b([^>]*)>([\s\S]*?)<\/H>/i), 1, (match) => {
      const attrs = parseTagAttributes(match[1])
      return <InlineHighlight key={key++} color={attrs.color || attrs.tone || C.accent} type={attrs.type || 'plain'} t={t}>{renderInlineNodes(match[2], t)}</InlineHighlight>
    })

    push('tooltipTag', remaining.match(/<T\b([^>]*)>([\s\S]*?)<\/T>/i), 2, (match) => {
      const { label, definition } = parseTooltipContent(match[1], match[2])
      return <InlineTooltip key={key++} label={label} definition={definition} t={t} />
    })

    push('highlightSyntax', remaining.match(/==([\s\S]+?)==\{([A-Za-z0-9_#-]+)(?::([a-z]+))?\}/), 3, (match) => {
      return <InlineHighlight key={key++} color={match[2] || C.accent} type={match[3] || 'plain'} t={t}>{renderInlineNodes(match[1], t)}</InlineHighlight>
    })

    push('tooltipSyntax', remaining.match(/\{([^{}]+?)\}\[([^\[\]]+?)\]/), 4, (match) => {
      return <InlineTooltip key={key++} label={match[1]} definition={match[2]} t={t} />
    })

    push('bold', remaining.match(/\*\*(.+?)\*\*/), 10, (match) => {
      return <strong key={key++}>{renderInlineNodes(match[1], t)}</strong>
    })

    push('italic', remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/), 11, (match) => {
      return <em key={key++}>{renderInlineNodes(match[1], t)}</em>
    })

    push('code', remaining.match(/`(.+?)`/), 12, (match) => {
      return <code key={key++} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 4, padding: '1px 5px', fontSize: '0.9em', fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}>{match[1]}</code>
    })

    push('math', remaining.match(/\$([^$\n]+?)\$/), 13, (match) => {
      return <MathInline key={key++} value={match[1]} />
    })

    push('customTag', remaining.match(/<([A-Za-z][A-Za-z0-9]*)\b([^>]*)>([\s\S]*?)<\/\1>/), 20, (match) => {
      const tagName = String(match[1] || '').toUpperCase()
      if (tagName === 'H' || tagName === 'T') return null
      return <span key={key++}>{renderInlineNodes(match[3], t)}</span>
    })

    if (!candidates.length) {
      nodes.push(<span key={key++}>{remaining}</span>)
      break
    }

    const selected = candidates.reduce((best, item) => {
      if (!best) return item
      if (item.match.index < best.match.index) return item
      if (item.match.index > best.match.index) return best
      return item.priority < best.priority ? item : best
    }, null)

    if (selected.match.index > 0) {
      nodes.push(<span key={key++}>{remaining.slice(0, selected.match.index)}</span>)
    }

    const rendered = selected.build(selected.match)
    if (rendered !== null) nodes.push(rendered)

    const consumed = selected.match.index + selected.match[0].length
    remaining = remaining.slice(consumed)
  }

  return nodes
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
        <p style={{ fontFamily: "var(--font-serif, 'Lora', Georgia, serif)", fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginTop: 12, marginBottom: 18, color: t.text }}>
          <MarkdownText text={item.question} />
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
            <p style={{ fontSize: 14, color: t.text, lineHeight: 1.7, marginTop: 6, fontFamily: "var(--font-serif, 'Lora', Georgia, serif)" }}><MarkdownText text={item.answer} /></p>
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
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  const [loading, setLoading]         = useState(false)

  const [accentVars, setAccentVars] = useState({})
  const [subjectName, setSubjectName] = useState('')

  useEffect(() => {
    if (!subjectId) return
    fetch('/api/subjects')
      .then(r => r.json())
      .then(data => {
        const subject = Array.isArray(data) ? data.find(s => s.id === subjectId || s.slug === subjectId) : null
        if (subject?.name) setSubjectName(subject.name)
        const color = subject?.color
        if (!color) return
        const theme = Object.values(themes).find(t => t.accent.toLowerCase() === color.toLowerCase())
        if (theme) {
          setAccentVars({
            '--accent':        theme.accent,
            '--accent-dark':   theme.accentDark,
            '--accent-darker': theme.accentDarker,
            '--accent-light':  theme.accentLight,
            '--accent-faded':  theme.accentFaded,
          })
        }
      })
      .catch(() => {})
  }, [subjectId])

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
        const normalized = normalizeNotePayload(data)
        setContent(normalized.content)
        setFrontmatter(normalized.frontmatter)
        setActiveRecall(normalized.activeRecall)
        setSources(normalized.sources)
        setLoading(false)
        appendActivity({ type: 'study', subjectId, subjectName: subjectName || subjectId, color: accentVars['--accent'] || '#E07355', durationSecs: 0, score: null, total: null })
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '48px clamp(16px, 4vw, 60px) 80px', ...accentVars }}>
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
                    fontFamily: "var(--font-serif, 'Lora', Georgia, serif)",
                    fontSize: 30, fontWeight: 700, lineHeight: 1.25,
                    letterSpacing: '-0.5px', marginBottom: 12, color: t.text,
                  }}>
                    {frontmatter.title ?? active?.title ?? ''}
                  </h1>
                  {frontmatter.description && (
                    <p style={{ fontSize: 16, color: t.textSub, lineHeight: 1.6, fontFamily: "var(--font-serif, 'Lora', Georgia, serif)", fontStyle: 'italic' }}>
                      {frontmatter.description}
                    </p>
                  )}
                </div>

                {/* Body */}
                <div style={{ fontFamily: "var(--font-serif, 'Lora', Georgia, serif)", fontSize: 15.5, lineHeight: 1.8, color: t.text }}>
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

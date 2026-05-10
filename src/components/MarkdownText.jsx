'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '../store'

function KaTeXSpan({ latex, display = false }) {
  const [html, setHtml] = useState('')
  useEffect(() => {
    try {
      const katex = require('katex')
      setHtml(katex.renderToString(latex, { throwOnError: false, displayMode: display }))
    } catch {
      setHtml('')
    }
  }, [latex, display])
  if (!html) return <span>{latex}</span>
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// Parses inline markdown+math into React nodes.
// Handles: **bold**, *italic*, `code`, $math$
function renderInline(text, t, keyPrefix = '') {
  const nodes = []
  let remaining = String(text ?? '')
  let k = 0

  const patterns = [
    { name: 'math',   re: /\$([^$\n]+?)\$/ },
    { name: 'bold',   re: /\*\*(.+?)\*\*/ },
    { name: 'italic', re: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/ },
    { name: 'code',   re: /`(.+?)`/ },
  ]

  while (remaining.length > 0) {
    let best = null
    for (const { name, re } of patterns) {
      const m = remaining.match(re)
      if (m && m.index >= 0 && (!best || m.index < best.index)) {
        best = { name, match: m }
      }
    }

    if (!best) {
      nodes.push(<span key={`${keyPrefix}t${k++}`}>{remaining}</span>)
      break
    }

    if (best.match.index > 0) {
      nodes.push(<span key={`${keyPrefix}t${k++}`}>{remaining.slice(0, best.match.index)}</span>)
    }

    const inner = best.match[1]
    const key = `${keyPrefix}${best.name}${k++}`
    if (best.name === 'math') {
      nodes.push(<KaTeXSpan key={key} latex={inner} />)
    } else if (best.name === 'bold') {
      nodes.push(<strong key={key}>{renderInline(inner, t, key)}</strong>)
    } else if (best.name === 'italic') {
      nodes.push(<em key={key}>{renderInline(inner, t, key)}</em>)
    } else if (best.name === 'code') {
      nodes.push(
        <code key={key} style={{ background: t?.surface2, border: `1px solid ${t?.border}`, borderRadius: 4, padding: '1px 5px', fontSize: '0.9em', fontFamily: "'JetBrains Mono', monospace" }}>
          {inner}
        </code>
      )
    }

    remaining = remaining.slice(best.match.index + best.match[0].length)
  }

  return nodes
}

// Renders a block of text that may contain display math ($$...$$) and inline markdown.
function renderBlock(text, t) {
  const elements = []
  const lines = String(text ?? '').split('\n')
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('$$')) {
      const mathLines = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('$$')) {
        mathLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={k++} style={{ overflowX: 'auto', margin: '8px 0' }}>
          <KaTeXSpan latex={mathLines.join('\n')} display />
        </div>
      )
    } else if (line.trim()) {
      elements.push(<span key={k++}>{renderInline(line, t, `b${k}`)}</span>)
    }
    i++
  }

  return elements.length === 1 ? elements[0] : <>{elements}</>
}

// ── Public API ─────────────────────────────────────────────────────────────────

// <MarkdownText text="Some **bold** and $x^2$ math" />
// <MarkdownText block text={"First line\n$$\nx^2\n$$\nmore text"} />
export default function MarkdownText({ text, block = false, style }) {
  const t = useTheme()
  const content = block ? renderBlock(text, t) : renderInline(text, t)
  return <span style={style}>{content}</span>
}

// Convenience: use as a hook to get rendered nodes directly
export function useMarkdown(text) {
  const t = useTheme()
  return renderInline(text, t)
}

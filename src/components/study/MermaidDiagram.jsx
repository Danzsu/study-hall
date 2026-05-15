'use client'
import { useEffect, useState } from 'react'

let mermaidPromise = null

function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(m => {
      const mermaid = m.default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: 'rgba(224,115,85,0.10)',
          primaryBorderColor: '#E07355',
          primaryTextColor: '#1A1A1A',
          lineColor: '#3A3A3A',
          fontSize: '14px',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        },
      })
      return mermaid
    })
  }
  return mermaidPromise
}

export function MermaidDiagram({ code, t }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mermaid = await getMermaid()
        const id = `mermaid-${Math.random().toString(36).slice(2)}`
        const { svg: rendered } = await mermaid.render(id, code)
        if (!cancelled) setSvg(rendered)
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    }
    render()
    return () => { cancelled = true }
  }, [code])

  if (error) {
    return (
      <pre style={{
        background: t?.surface2 ?? '#f5f5f5',
        border: `1px solid ${t?.border ?? '#e4ddd4'}`,
        borderRadius: 8, padding: '12px 16px',
        fontSize: 13, color: t?.textSub ?? '#6B6560',
        margin: '16px 0', overflowX: 'auto',
      }}>
        {code}
      </pre>
    )
  }

  if (!svg) return null

  return (
    <figure style={{ margin: '20px 0', textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-block',
          background: t?.surface ?? '#ffffff',
          border: `1px solid ${t?.border ?? '#e4ddd4'}`,
          borderRadius: 10,
          padding: '16px 24px',
          maxWidth: '100%',
          overflowX: 'auto',
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </figure>
  )
}

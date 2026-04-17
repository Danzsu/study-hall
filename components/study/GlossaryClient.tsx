'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import type { GlossaryTerm } from '@/lib/content'

export function GlossaryClient({ terms }: Readonly<{ terms: GlossaryTerm[] }>) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const categories = Array.from(new Set(terms.map((t) => t.category)))

  const filtered = terms.filter((t) => {
    const matchQuery =
      !query ||
      t.term.toLowerCase().includes(query.toLowerCase()) ||
      t.definition.toLowerCase().includes(query.toLowerCase())
    const matchCat = !activeCategory || t.category === activeCategory
    return matchQuery && matchCat
  })

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={14} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <input
          type="text"
          placeholder="Fogalom keresése..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
            fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, outline: 'none', color: 'var(--text)',
            fontFamily: "'DM Sans', system-ui",
          }}
        />
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: !activeCategory ? 'var(--accent)' : 'var(--surface2)',
            color: !activeCategory ? '#fff' : 'var(--text-sub)',
            fontSize: 12, fontWeight: 600, transition: 'all .15s',
          }}
        >
          Összes
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: activeCategory === cat ? 'var(--accent)' : 'var(--surface2)',
              color: activeCategory === cat ? '#fff' : 'var(--text-sub)',
              fontSize: 12, fontWeight: 600, transition: 'all .15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        {filtered.length} fogalom
      </p>

      {/* Terms */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map((term) => (
          <div key={term.id} className="card" style={{ overflow: 'hidden' }}>
            <button
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
              }}
              onClick={() => setExpanded(expanded === term.id ? null : term.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                {/* Category color dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent)', opacity: 0.7,
                }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {term.term}
                </span>
                {!expanded || expanded !== term.id ? (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {term.definition.slice(0, 70)}…
                  </span>
                ) : null}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                  background: 'var(--surface2)', borderRadius: 20, padding: '2px 8px',
                }}>
                  {term.category}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}>
                  {expanded === term.id ? '−' : '+'}
                </span>
              </div>
            </button>
            {expanded === term.id && (
              <div style={{ padding: '0 16px 16px' }} className="animate-fade-in">
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65, marginBottom: 10 }}>
                  {term.definition}
                </p>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: 'var(--accent)', background: 'var(--accent-bg)',
                  border: '1px solid rgba(224,115,85,0.2)',
                  borderRadius: 20, padding: '3px 10px',
                }}>
                  {term.category}
                </span>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 14 }}>
            Nincs találat a keresésre.
          </p>
        )}
      </div>
    </div>
  )
}

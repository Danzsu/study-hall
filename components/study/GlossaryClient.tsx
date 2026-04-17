'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import type { GlossaryTerm } from '@/lib/content'

export function GlossaryClient({ terms }: { terms: GlossaryTerm[] }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const categories = ['All', ...Array.from(new Set(terms.map((t) => t.category)))]

  const filtered = terms.filter((t) => {
    const matchQuery =
      !query ||
      t.term.toLowerCase().includes(query.toLowerCase()) ||
      t.definition.toLowerCase().includes(query.toLowerCase())
    const matchCat = !activeCategory || activeCategory === 'All' || t.category === activeCategory
    return matchQuery && matchCat
  })

  return (
    <div className="pb-12">
      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="text"
          placeholder="Search terms..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg outline-none focus:border-accent text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === 'All' ? null : cat)}
            className={`chip ${(!activeCategory && cat === 'All') || activeCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-[var(--muted)] mb-4">{filtered.length} terms</p>

      {/* Terms */}
      <div className="space-y-1">
        {filtered.map((term) => (
          <div key={term.id} className="card overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setExpanded(expanded === term.id ? null : term.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-semibold text-sm text-accent shrink-0">{term.term}</span>
                <span className="text-xs text-[var(--muted)] truncate">{term.definition.slice(0, 60)}…</span>
              </div>
              <span className="text-[var(--muted)] ml-2 shrink-0 text-lg leading-none">
                {expanded === term.id ? '−' : '+'}
              </span>
            </button>
            {expanded === term.id && (
              <div className="px-4 pb-4 animate-fade-in">
                <p className="text-sm text-[var(--foreground)] leading-relaxed mb-2">
                  {term.definition}
                </p>
                <span className="chip text-xs">{term.category}</span>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-[var(--muted)] py-8 text-sm">No terms match your search.</p>
        )}
      </div>
    </div>
  )
}

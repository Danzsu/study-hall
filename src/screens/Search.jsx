'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Search as SearchIcon, X, BookOpen, Layers, AlignLeft,
  ChevronRight, Hash, FileText, Zap, Brain, RotateCcw,
} from 'lucide-react'
import { useTheme, navigate } from '../store'
import { C, FONT_SERIF } from '../theme'

const RECENT_KEY = 'studyHall:recentSearches'

const KIND = {
  question: { label: 'Question', Icon: FileText, color: C.accent },
  term: { label: 'Term', Icon: Hash, color: C.gold },
  lesson: { label: 'Lesson', Icon: BookOpen, color: C.blue },
  flashcard: { label: 'Flashcard', Icon: Layers, color: C.green },
}

function highlightParts(text, query) {
  if (!query) return [text]
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return String(text || '').split(new RegExp(`(${escaped})`, 'gi'))
}

function Highlight({ text, query }) {
  const q = query.trim()
  return (
    <>
      {highlightParts(text, q).map((part, i) => {
        const match = q && part.toLowerCase() === q.toLowerCase()
        return match
          ? <mark key={i} style={{ background: C.accentBg2, color: C.accent, borderRadius: 3, padding: '0 2px', fontWeight: 800 }}>{part}</mark>
          : <span key={i}>{part}</span>
      })}
    </>
  )
}

function routeForItem(item, subjectId) {
  if (item.kind === 'lesson') return ['/study', { id: subjectId, lesson: item.lessonSlug }]
  if (item.kind === 'term') return ['/glossary', { id: subjectId }]
  if (item.kind === 'flashcard') return ['/flashcards', { id: subjectId }]
  return ['/review', { id: subjectId }]
}

function ResultItem({ item, query, t, subjectId, onPick }) {
  const kind = KIND[item.kind] || KIND.question
  const Icon = kind.Icon
  return (
    <button
      onClick={() => {
        onPick()
        const [path, params] = routeForItem(item, subjectId)
        navigate(path, params)
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '13px 18px',
        cursor: 'pointer',
        transition: 'background 0.12s',
        border: 'none',
        borderBottom: `1px solid ${t.border}`,
        background: 'transparent',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = t.surface2 }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        flexShrink: 0,
        marginTop: 1,
        background: `${kind.color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={14} style={{ color: kind.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: t.text, lineHeight: 1.3, marginBottom: 4 }}>
          <Highlight text={item.title} query={query} />
        </p>
        <p style={{
          fontSize: 12,
          color: t.textSub,
          lineHeight: 1.5,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          <Highlight text={item.body} query={query} />
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: kind.color, background: `${kind.color}14`, border: `1px solid ${kind.color}28`, borderRadius: 20, padding: '1px 7px' }}>
            {kind.label}
          </span>
          {item.section && <span style={{ fontSize: 10, color: t.textMuted }}>{item.section}</span>}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: t.textMuted, flexShrink: 0, marginTop: 8 }} />
    </button>
  )
}

function groupResults(results) {
  return results.reduce((acc, item) => {
    if (!acc[item.kind]) acc[item.kind] = []
    acc[item.kind].push(item)
    return acc
  }, {})
}

function runSearch(index, query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return index
    .map(item => {
      const hay = [
        item.title,
        item.body,
        item.section,
        item.kind,
        ...(item.tags || []),
      ].join(' ').toLowerCase()
      if (!hay.includes(q)) return null
      const titleHit = String(item.title || '').toLowerCase().includes(q) ? 0 : 1
      return { ...item, rank: titleHit }
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))
    .slice(0, 60)
}

function saveRecent(query) {
  const q = query.trim()
  if (!q) return
  try {
    const existing = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...existing.filter(item => item !== q)].slice(0, 8)))
  } catch {}
}

export default function SearchScreen({ subjectId }) {
  const t = useTheme()
  const inputRef = useRef(null)
  const [subject, setSubject] = useState(null)
  const [index, setIndex] = useState([])
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    inputRef.current?.focus()
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')) } catch {}
  }, [])

  useEffect(() => {
    if (!subjectId) return
    let cancelled = false
    setLoading(true)

    Promise.all([
      fetch(`/api/subjects/${subjectId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/questions/${subjectId}`).then(r => r.json()),
      fetch(`/api/glossary/${subjectId}`).then(r => r.json()),
      fetch(`/api/notes/${subjectId}`).then(r => r.json()),
      fetch(`/api/flashcards/${subjectId}`).then(r => r.json()),
    ])
      .then(([subjectData, questions, glossary, lessons, flashcards]) => {
        if (cancelled) return
        setSubject(subjectData)

        const next = [
          ...questions.map(q => ({
            id: q.id,
            kind: 'question',
            title: q.q || q.question,
            body: q.explain || q.explanation || q.ideal || q.idealAnswer || (q.options || []).join(' | '),
            section: q.section,
            tags: [q.difficulty, q.type, ...(q.keywords || [])].filter(Boolean),
          })),
          ...glossary.map(g => ({
            id: g.id,
            kind: 'term',
            title: g.term || g.abbr,
            body: g.definition || g.def,
            section: g.section || g.category,
            tags: [g.category, ...(g.aliases || [])].filter(Boolean),
          })),
          ...lessons.map(lesson => ({
            id: lesson.slug,
            kind: 'lesson',
            title: lesson.title,
            body: `${lesson.section || ''} ${lesson.time || ''}`,
            section: lesson.section,
            lessonSlug: lesson.slug,
            tags: ['study', 'notes', lesson.section].filter(Boolean),
          })),
          ...flashcards.slice(0, 300).map(card => ({
            id: card.id,
            kind: 'flashcard',
            title: card.front,
            body: card.back,
            section: card.section,
            tags: [card.type, card.abbr, card.full].filter(Boolean),
          })),
        ].filter(item => item.title && item.body)

        setIndex(next)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [subjectId])

  const results = runSearch(index, query)
  const grouped = groupResults(results)
  const suggestions = [
    { label: 'Wrong answers', icon: Zap, color: C.accent, action: () => navigate('/wrong-answers', { id: subjectId }) },
    { label: 'Glossary abbreviations', icon: Hash, color: C.blue, action: () => navigate('/glossary', { id: subjectId }) },
    { label: 'Study notes', icon: BookOpen, color: C.purple, action: () => navigate('/study', { id: subjectId }) },
    { label: 'Review questions', icon: Brain, color: C.gold, action: () => navigate('/review', { id: subjectId }) },
  ]

  const commitSearch = () => {
    saveRecent(query)
    setRecent(prev => [query.trim(), ...prev.filter(item => item !== query.trim())].filter(Boolean).slice(0, 8))
  }

  return (
    <>
      <style>{`
        @keyframes searchFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .search-card{animation:searchFade .26s ease both}
      `}</style>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '34px 24px 96px' }}>
        <div style={{ marginBottom: 26 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: t.textMuted, marginBottom: 8 }}>SEARCH</p>
          <h1 style={{ fontFamily: FONT_SERIF, fontSize: 30, fontWeight: 700, letterSpacing: '-0.5px', color: t.text, marginBottom: 6 }}>
            Find anything in {subject?.name || 'this subject'}
          </h1>
          <p style={{ color: t.textSub, fontSize: 14 }}>
            Search questions, notes, flashcards, glossary terms and exam prep material.
          </p>
        </div>

        <div className="search-card" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: `1px solid ${t.border}` }}>
            <SearchIcon size={18} style={{ color: query ? C.accent : t.textMuted }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitSearch() }}
              placeholder="Search for cryptography, XSS, authentication, malware..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: t.text,
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${t.border}`, background: t.surface2, color: t.textSub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {!query.trim() ? (
            <div style={{ padding: '22px 18px 24px' }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 12 }}>BROWSE</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 24 }}>
                {suggestions.map(({ label, icon: Icon, color, action }) => (
                  <button key={label} onClick={action} style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 12, padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', fontFamily: 'inherit' }}>
                    <Icon size={16} style={{ color }} />
                    <span style={{ color, fontSize: 13, fontWeight: 800 }}>{label}</span>
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 10 }}>RECENT SEARCHES</p>
              {recent.length ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {recent.map(item => (
                    <button key={item} onClick={() => setQuery(item)} style={{ border: `1px solid ${t.border}`, background: t.surface2, color: t.textSub, borderRadius: 20, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {item}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: t.textMuted }}>No recent searches yet.</p>
              )}
            </div>
          ) : loading ? (
            <div style={{ padding: 30, color: t.textMuted, textAlign: 'center' }}>Building search index...</div>
          ) : results.length ? (
            <div>
              <div style={{ padding: '11px 18px', background: t.surface2, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: t.textSub, fontWeight: 700 }}>{results.length} results</span>
                <button onClick={commitSearch} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: C.accent, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <RotateCcw size={12} /> save search
                </button>
              </div>
              {Object.entries(grouped).map(([kind, items]) => {
                const cfg = KIND[kind] || KIND.question
                return (
                  <section key={kind}>
                    <div style={{ padding: '10px 18px 8px', background: t.surface2, borderBottom: `1px solid ${t.border}` }}>
                      <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.8px', color: cfg.color }}>{cfg.label.toUpperCase()}S</p>
                    </div>
                    {items.map(item => (
                      <ResultItem key={`${item.kind}-${item.id}`} item={item} query={query} t={t} subjectId={subjectId} onPick={commitSearch} />
                    ))}
                  </section>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '34px 24px', textAlign: 'center' }}>
              <SearchIcon size={26} style={{ color: t.textMuted, marginBottom: 10 }} />
              <p style={{ fontSize: 15, fontWeight: 800, color: t.textSub, marginBottom: 6 }}>No results for &quot;{query}&quot;</p>
              <p style={{ fontSize: 13, color: t.textMuted }}>Try a section name, abbreviation, concept, or exam keyword.</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: `${index.filter(i => i.kind === 'question').length} questions`, color: C.accent },
            { label: `${index.filter(i => i.kind === 'term').length} terms`, color: C.gold },
            { label: `${index.filter(i => i.kind === 'lesson').length} lessons`, color: C.blue },
            { label: `${index.filter(i => i.kind === 'flashcard').length} cards`, color: C.green },
          ].map(item => (
            <span key={item.label} style={{ fontSize: 11, fontWeight: 800, color: item.color, background: `${item.color}12`, border: `1px solid ${item.color}28`, borderRadius: 20, padding: '5px 10px' }}>
              {item.label}
            </span>
          ))}
        </div>
      </main>
    </>
  )
}

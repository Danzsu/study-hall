'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Bookmark, BookmarkCheck } from 'lucide-react'
import type { Question } from '@/lib/content'

interface Props {
  questions: Question[]
}

function Hl({ children }: Readonly<{ children: string }>) {
  const parts = children.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return (
            <mark key={i} style={{
              background: 'rgba(224,115,85,0.18)', color: 'var(--accent)',
              borderBottom: '2px solid var(--accent)',
              borderRadius: '3px 3px 0 0', padding: '1px 3px', fontWeight: 700,
            }}>{p.slice(2, -2)}</mark>
          )
        }
        if (p.startsWith('*') && p.endsWith('*')) {
          return (
            <mark key={i} style={{
              background: 'rgba(74,127,193,0.11)', color: 'var(--blue)',
              borderBottom: '2px solid var(--blue)',
              borderRadius: '3px 3px 0 0', padding: '1px 3px', fontWeight: 600,
            }}>{p.slice(1, -1)}</mark>
          )
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

function difficultyBadge(section: string): { label: string; color: string; bg: string } {
  const advanced = ['deep learning', 'lstm', 'pca', 'roc', 'regularisation', 'hyperparameter']
  const isAdv = advanced.some((w) => section.toLowerCase().includes(w))
  if (isAdv) return { label: 'Haladó', color: 'var(--gold)', bg: 'var(--gold-bg)' }
  return { label: 'Alap', color: 'var(--blue)', bg: 'var(--blue-bg)' }
}

export function ReviewClient({ questions }: Readonly<Props>) {
  const [idx, setIdx] = useState(0)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [assessed, setAssessed] = useState<Record<string, 'know' | 'unsure'>>({})
  const [activeSection, setActiveSection] = useState('Összes')

  const sections = ['Összes', ...Array.from(new Set(questions.map((q) => q.section)))]
  const filtered = activeSection === 'Összes' ? questions : questions.filter((q) => q.section === activeSection)

  const q = filtered[idx]

  const goNext = useCallback(() => {
    setIdx((i) => Math.min(i + 1, filtered.length - 1))
  }, [filtered.length])

  const goPrev = useCallback(() => {
    setIdx((i) => Math.max(i - 1, 0))
  }, [])

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSectionChange = (sec: string) => {
    setActiveSection(sec)
    setIdx(0)
  }

  if (filtered.length === 0 || !q) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ebben a szekcióban nincsenek kérdések.</p>
      </div>
    )
  }

  const diff = difficultyBadge(q.section ?? '')
  const correctIdx = Array.isArray(q.correct) ? q.correct : [q.correct]
  const isSaved = saved.has(q.id)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px 80px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)' }}>
          {idx + 1} / {filtered.length}
        </span>
        {saved.size > 0 && (
          <span className="pill" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 11 }}>
            <Bookmark size={10} style={{ display: 'inline', marginRight: 4 }} />
            {saved.size} mentve
          </span>
        )}
      </div>

      {/* Section filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => handleSectionChange(sec)}
            style={{
              padding: '5px 12px', borderRadius: 20, border: 'none',
              background: activeSection === sec ? 'var(--accent)' : 'var(--surface2)',
              color: activeSection === sec ? '#fff' : 'var(--text-sub)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="progress-bar" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${((idx + 1) / filtered.length) * 100}%` }} />
      </div>

      {/* Card */}
      <div className="card animate-fade-up" style={{ padding: '24px 24px 20px' }}>
        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span className="pill" style={{ background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 11 }}>
            {q.section}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.6px',
            color: diff.color, background: diff.bg,
            padding: '2px 8px', borderRadius: 20,
          }}>
            {diff.label}
          </span>
          <button
            onClick={() => toggleSave(q.id)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: isSaved ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', padding: 4,
            }}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>

        {/* Question */}
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 17, fontWeight: 700, lineHeight: 1.5,
          color: 'var(--text)', marginBottom: 18,
        }}>
          {q.question}
        </p>

        {/* Explanation */}
        {q.explanation && (
          <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-sub)', marginBottom: 18 }}>
            <Hl>{q.explanation}</Hl>
          </div>
        )}

        {/* Options (correct highlighted) */}
        {q.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {q.options.map((opt, i) => {
              const isCorrect = correctIdx.includes(i)
              return (
                <div key={opt} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8,
                  background: isCorrect ? 'rgba(90,158,114,0.1)' : 'var(--surface2)',
                  border: `1.5px solid ${isCorrect ? 'var(--green)' : 'transparent'}`,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800,
                    background: isCorrect ? 'var(--green)' : 'var(--border)',
                    color: isCorrect ? '#fff' : 'var(--text-muted)',
                  }}>
                    {String.fromCodePoint(65 + i)}
                  </span>
                  <span style={{ fontSize: 13, color: isCorrect ? 'var(--text)' : 'var(--text-sub)', fontWeight: isCorrect ? 600 : 400 }}>
                    {opt}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Self-assessment */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setAssessed((prev) => ({ ...prev, [q.id]: 'know' }))}
            style={{
              flex: 1, padding: '9px', borderRadius: 8, border: 'none',
              background: assessed[q.id] === 'know' ? 'var(--green-bg)' : 'var(--surface2)',
              color: assessed[q.id] === 'know' ? 'var(--green)' : 'var(--text-sub)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
            }}
          >
            ✓ Tudom
          </button>
          <button
            onClick={() => setAssessed((prev) => ({ ...prev, [q.id]: 'unsure' }))}
            style={{
              flex: 1, padding: '9px', borderRadius: 8, border: 'none',
              background: assessed[q.id] === 'unsure' ? 'var(--gold-bg)' : 'var(--surface2)',
              color: assessed[q.id] === 'unsure' ? 'var(--gold)' : 'var(--text-sub)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
            }}
          >
            ? Nem biztos
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <button
          onClick={goPrev}
          disabled={idx === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text-sub)',
            fontSize: 13, fontWeight: 700, cursor: idx === 0 ? 'not-allowed' : 'pointer',
            opacity: idx === 0 ? 0.4 : 1,
          }}
        >
          <ChevronLeft size={14} /> Előző
        </button>
        <button
          onClick={goNext}
          disabled={idx === filtered.length - 1}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '9px 14px', borderRadius: 8, border: '1px solid var(--accent)',
            background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 700,
            cursor: idx === filtered.length - 1 ? 'not-allowed' : 'pointer',
            opacity: idx === filtered.length - 1 ? 0.4 : 1,
          }}
        >
          Következő <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

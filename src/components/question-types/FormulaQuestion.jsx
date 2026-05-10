'use client'
import { useState, useEffect } from 'react'
import { C } from '../../theme'

// Handles both formula_drag_drop and calc_input types.
// For formula_drag_drop: q.formulaText contains $...[field1]...$ with drop slots
// For calc_input: q.answer is the expected numeric/string result

function renderLatex(latex) {
  if (typeof window === 'undefined') return latex
  try {
    const katex = require('katex')
    return katex.renderToString(latex, { throwOnError: false, displayMode: false })
  } catch {
    return latex
  }
}

function KaTeXSpan({ latex, style }) {
  const [html, setHtml] = useState('')
  useEffect(() => { setHtml(renderLatex(latex)) }, [latex])
  if (!html) return <span style={style}>{latex}</span>
  return <span style={style} dangerouslySetInnerHTML={{ __html: html }} />
}

// ── formula_drag_drop ──────────────────────────────────────────────────────────

function FormulaDragDrop({ q, selected, onSelect, submitted, t }) {
  const placements = selected ?? {}
  const [clickSelected, setClickSelected] = useState(null)
  const [dragging, setDragging] = useState(null)

  const choices = q.choices ?? []
  const placedIds = new Set(Object.values(placements))

  function isCorrectPlacement(slotId) { return placements[slotId] === slotId }

  function getSlotColor(slotId) {
    if (!submitted) return placements[slotId] ? C.accent : t.border
    return isCorrectPlacement(slotId) ? C.green : C.red
  }

  function getChipLatex(identifier) {
    const chip = choices.find(c => c.identifier === identifier)
    return chip?.latex ?? chip?.label ?? identifier
  }

  function handleSlotClick(slotId) {
    if (submitted) return
    if (clickSelected) {
      const next = { ...placements }
      for (const [k, v] of Object.entries(next)) { if (v === clickSelected) delete next[k] }
      next[slotId] = clickSelected
      onSelect(next); setClickSelected(null)
    } else if (placements[slotId]) {
      const next = { ...placements }
      delete next[slotId]
      onSelect(next)
    }
  }

  function handleDrop(e, slotId) {
    e.preventDefault()
    const chipId = e.dataTransfer.getData('text/plain')
    if (!chipId) return
    const next = { ...placements }
    for (const [k, v] of Object.entries(next)) { if (v === chipId) delete next[k] }
    next[slotId] = chipId
    onSelect(next); setDragging(null)
  }

  // Parse formulaText: split on [fieldN] to render KaTeX in-between
  const formulaText = q.formulaText ?? ''
  const formulaParts = formulaText.split(/(\[field\d+\])/g)

  // Wrap entire formula in a display block
  const formulaEl = (
    <div style={{
      display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 2,
      padding: '0.75rem 1rem', borderRadius: 10, background: t.surface2,
      border: `1px solid ${t.border}`, marginBottom: 20, fontSize: '1.1rem',
    }}>
      {formulaParts.map((part, i) => {
        const match = part.match(/^\[(\w+)\]$/)
        if (!match) {
          // Remove outer $ signs for katex
          const latex = part.replace(/^\$/, '').replace(/\$$/, '')
          return <KaTeXSpan key={i} latex={latex} />
        }
        const slotId = match[1]
        const placed = placements[slotId]
        const slotColor = getSlotColor(slotId)
        return (
          <span
            key={i}
            onClick={() => handleSlotClick(slotId)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, slotId)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 64, padding: '2px 10px', margin: '0 2px',
              border: `2px dashed ${slotColor}`, borderRadius: 6,
              background: placed ? (submitted ? (isCorrectPlacement(slotId) ? `${C.green}18` : `${C.red}12`) : `${C.accent}20`) : 'transparent',
              cursor: submitted ? 'default' : 'pointer',
              fontWeight: 600, color: placed ? (submitted ? slotColor : C.accent) : t.textMuted,
            }}
          >
            {placed ? <KaTeXSpan latex={getChipLatex(placed)} /> : slotId}
          </span>
        )
      })}
    </div>
  )

  const bank = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {choices.filter(c => !placedIds.has(c.identifier)).map(c => (
        <div
          key={c.identifier}
          draggable={!submitted}
          onClick={() => setClickSelected(cs => cs === c.identifier ? null : c.identifier)}
          onDragStart={e => { setDragging(c.identifier); e.dataTransfer.setData('text/plain', c.identifier) }}
          onDragEnd={() => setDragging(null)}
          style={{
            padding: '5px 14px', borderRadius: 20,
            border: `2px solid ${clickSelected === c.identifier ? C.accent : t.border}`,
            background: clickSelected === c.identifier ? `${C.accent}18` : t.surface2,
            cursor: submitted ? 'default' : 'grab',
            opacity: dragging === c.identifier ? 0.5 : 1, transition: 'all 0.15s',
          }}
        >
          <KaTeXSpan latex={c.latex ?? c.label} />
        </div>
      ))}
    </div>
  )

  return <div style={{ marginBottom: 28 }}>{formulaEl}{bank}</div>
}

// ── calc_input ─────────────────────────────────────────────────────────────────

function CalcInput({ q, selected, onSelect, submitted, t }) {
  const value = typeof selected === 'object' && selected !== null ? selected.answer ?? '' : selected ?? ''
  const scratch = typeof selected === 'object' && selected !== null ? selected.scratch ?? '' : ''
  const chips = q.formulaChips ?? []

  const isCorrect = submitted && value.trim().toLowerCase() === String(q.answer ?? '').trim().toLowerCase()

  function update(patch) {
    onSelect({ answer: value, scratch, ...patch })
  }

  return (
    <div style={{ marginBottom: 28 }}>
      {chips.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.8rem', color: t.textMuted, marginBottom: 6 }}>Képletek:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={() => !submitted && update({ scratch: scratch + (scratch ? '\n' : '') + (chip.label || '') })}
                style={{
                  padding: '4px 12px', borderRadius: 16, border: `1px solid ${t.border}`,
                  background: t.surface2, cursor: submitted ? 'default' : 'pointer',
                  fontSize: '0.85rem', color: t.text,
                }}
              >
                <KaTeXSpan latex={chip.latex ?? chip.label} />
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={scratch}
        onChange={e => !submitted && update({ scratch: e.target.value })}
        disabled={submitted}
        placeholder="Levezetés (opcionális)..."
        rows={3}
        style={{
          width: '100%', padding: '0.6rem 0.8rem', borderRadius: 8, boxSizing: 'border-box',
          border: `1px solid ${t.border}`, background: t.surface2, color: t.text,
          fontSize: '0.85rem', resize: 'vertical', marginBottom: 10, outline: 'none',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: t.textSub, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Eredmény:</span>
        <input
          type="text"
          value={value}
          onChange={e => !submitted && update({ answer: e.target.value })}
          disabled={submitted}
          placeholder="pl. 1.43"
          style={{
            flex: 1, padding: '0.6rem 0.9rem', borderRadius: 8,
            border: `2px solid ${submitted ? (isCorrect ? C.green : C.red) : t.border}`,
            background: submitted ? (isCorrect ? `${C.green}14` : `${C.red}10`) : t.surface,
            color: t.text, fontSize: '0.95rem', outline: 'none',
          }}
        />
      </div>
      {submitted && (
        <div style={{
          marginTop: 8, fontSize: '0.875rem', fontWeight: 600,
          color: isCorrect ? C.green : C.red,
        }}>
          {isCorrect ? '✓ Helyes!' : `✗ A helyes válasz: ${q.answer}`}
        </div>
      )}
    </div>
  )
}

// ── Dispatcher ─────────────────────────────────────────────────────────────────

export default function FormulaQuestion({ q, selected, onSelect, submitted, t }) {
  if (q.type === 'formula_drag_drop') {
    return <FormulaDragDrop q={q} selected={selected} onSelect={onSelect} submitted={submitted} t={t} />
  }
  return <CalcInput q={q} selected={selected} onSelect={onSelect} submitted={submitted} t={t} />
}

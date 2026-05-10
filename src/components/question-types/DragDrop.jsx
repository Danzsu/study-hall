'use client'
import { useState } from 'react'
import { C } from '../../theme'

// q: { type:'drag_n_drop', question:'Text [field1] here', choices:[{identifier,label}] }
// selected: { field1: 'chip-identifier', field2: 'chip-identifier' }
// Distractor chips have identifiers starting with 'distractor'
export default function DragDrop({ q, selected, onSelect, submitted, t }) {
  const placements = selected ?? {}
  const [dragging, setDragging] = useState(null)
  const [clickSelected, setClickSelected] = useState(null)

  const choices = q.choices ?? []
  const fields = choices.filter(c => !c.identifier.startsWith('distractor'))
  const parts = String(q.question ?? '').split(/(\[field\d+\])/g)
  const placedIds = new Set(Object.values(placements))

  function isCorrectPlacement(slotId) {
    return placements[slotId] === slotId
  }

  function getSlotColor(slotId) {
    if (!submitted) return placements[slotId] ? C.accent : t.border
    return isCorrectPlacement(slotId) ? C.green : C.red
  }

  function handleChipClick(identifier) {
    if (submitted) return
    if (clickSelected === identifier) { setClickSelected(null); return }
    setClickSelected(identifier)
  }

  function handleSlotClick(slotId) {
    if (submitted) return
    if (clickSelected) {
      // Place selected chip into slot (or swap if slot already has chip)
      const newPlacements = { ...placements }
      // Remove chip from any existing slot
      for (const [k, v] of Object.entries(newPlacements)) {
        if (v === clickSelected) delete newPlacements[k]
      }
      newPlacements[slotId] = clickSelected
      onSelect(newPlacements)
      setClickSelected(null)
    } else if (placements[slotId]) {
      // Remove chip from slot
      const newPlacements = { ...placements }
      delete newPlacements[slotId]
      onSelect(newPlacements)
    }
  }

  function handleDragStart(e, identifier) {
    setDragging(identifier)
    e.dataTransfer.setData('text/plain', identifier)
  }

  function handleDrop(e, slotId) {
    e.preventDefault()
    const chipId = e.dataTransfer.getData('text/plain')
    if (!chipId) return
    const newPlacements = { ...placements }
    for (const [k, v] of Object.entries(newPlacements)) {
      if (v === chipId) delete newPlacements[k]
    }
    newPlacements[slotId] = chipId
    onSelect(newPlacements)
    setDragging(null)
  }

  function handleDragOver(e) { e.preventDefault() }
  function handleDragEnd() { setDragging(null) }

  function getChipLabel(identifier) {
    return choices.find(c => c.identifier === identifier)?.label ?? identifier
  }

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Question text with drop zones */}
      <div style={{ fontSize: '1rem', lineHeight: 2.2, color: t.text, marginBottom: 20 }}>
        {parts.map((part, i) => {
          const match = part.match(/^\[(\w+)\]$/)
          if (!match) return <span key={i}>{part}</span>
          const slotId = match[1]
          const placed = placements[slotId]
          const slotColor = getSlotColor(slotId)

          return (
            <span
              key={i}
              onClick={() => handleSlotClick(slotId)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, slotId)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 100, padding: '3px 12px', margin: '0 4px',
                border: `2px dashed ${slotColor}`, borderRadius: 8,
                background: placed ? (submitted ? (isCorrectPlacement(slotId) ? `${C.green}14` : `${C.red}10`) : C.accentBg2 || `${C.accent}18`) : t.surface2,
                cursor: submitted ? 'default' : 'pointer',
                fontWeight: placed ? 600 : 400,
                color: placed ? (submitted ? slotColor : C.accent) : t.textMuted,
                transition: 'all 0.15s',
              }}
            >
              {placed ? getChipLabel(placed) : slotId}
              {submitted && placed && !isCorrectPlacement(slotId) && (
                <span style={{ marginLeft: 6, fontSize: '0.75rem', color: C.green }}>
                  → {getChipLabel(slotId)}
                </span>
              )}
            </span>
          )
        })}
      </div>

      {/* Chip bank */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {choices.filter(c => !placedIds.has(c.identifier)).map(c => (
          <div
            key={c.identifier}
            draggable={!submitted}
            onClick={() => handleChipClick(c.identifier)}
            onDragStart={e => handleDragStart(e, c.identifier)}
            onDragEnd={handleDragEnd}
            style={{
              padding: '6px 14px', borderRadius: 20,
              border: `2px solid ${clickSelected === c.identifier ? C.accent : t.border}`,
              background: clickSelected === c.identifier ? (C.accentBg2 || `${C.accent}18`) : t.surface2,
              color: t.text, fontWeight: 500, fontSize: '0.875rem',
              cursor: submitted ? 'default' : 'grab',
              opacity: dragging === c.identifier ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
          >
            {c.label}
          </div>
        ))}
        {choices.filter(c => !placedIds.has(c.identifier)).length === 0 && !submitted && (
          <span style={{ color: t.textMuted, fontSize: '0.85rem', fontStyle: 'italic' }}>
            Minden elem elhelyezve
          </span>
        )}
      </div>
    </div>
  )
}

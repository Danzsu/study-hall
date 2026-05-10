'use client'
import { C } from '../../theme'

// q: { type:'fill_the_blanks', question:'Text [field1] here', blanks:[{identifier,answer}] }
// selected: { field1: 'value', field2: 'value' }
export default function FillTheBlanks({ q, selected, onSelect, submitted, t }) {
  const answers = selected ?? {}

  function updateField(id, value) {
    if (!submitted) onSelect({ ...answers, [id]: value })
  }

  // Split question text on [fieldN] placeholders
  const parts = String(q.question ?? '').split(/(\[field\d+\])/g)

  function getStatus(identifier) {
    const expected = (q.blanks ?? []).find(b => b.identifier === identifier)?.answer ?? ''
    const given = String(answers[identifier] ?? '').trim()
    if (!submitted) return 'idle'
    return given.toLowerCase() === expected.toLowerCase() ? 'correct' : 'wrong'
  }

  function getExpected(identifier) {
    return (q.blanks ?? []).find(b => b.identifier === identifier)?.answer ?? ''
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: '1rem', lineHeight: 2, color: t.text }}>
        {parts.map((part, i) => {
          const match = part.match(/^\[(\w+)\]$/)
          if (!match) return <span key={i}>{part}</span>

          const id = match[1]
          const status = getStatus(id)
          const inputBorderColor = status === 'correct' ? C.green : status === 'wrong' ? C.red : t.border
          const inputBg = status === 'correct' ? `${C.green}14` : status === 'wrong' ? `${C.red}10` : t.surface

          return (
            <span key={i} style={{ display: 'inline-flex', flexDirection: 'column', verticalAlign: 'bottom', margin: '0 4px' }}>
              <input
                type="text"
                value={answers[id] ?? ''}
                onChange={e => updateField(id, e.target.value)}
                disabled={submitted}
                placeholder={id}
                style={{
                  width: 120, padding: '2px 8px', borderRadius: 6,
                  border: `2px solid ${inputBorderColor}`, background: inputBg,
                  color: t.text, fontSize: '0.9rem', outline: 'none',
                }}
              />
              {submitted && status === 'wrong' && (
                <span style={{ fontSize: '0.72rem', color: C.green, fontWeight: 600 }}>
                  ✓ {getExpected(id)}
                </span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

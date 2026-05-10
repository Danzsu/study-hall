'use client'
import { C } from '../../theme'

// q: { type:'simple_input', question, answer:'expected' }
// selected: string (user's current input)
export default function SimpleInput({ q, selected, onSelect, submitted, t }) {
  const value = selected ?? ''
  const isCorrect = submitted && value.trim().toLowerCase() === String(q.answer ?? '').trim().toLowerCase()
  const isWrong = submitted && !isCorrect

  return (
    <div style={{ marginBottom: 28 }}>
      <input
        type="text"
        value={value}
        onChange={e => !submitted && onSelect(e.target.value)}
        disabled={submitted}
        placeholder="Írd be a választ..."
        style={{
          width: '100%', padding: '0.75rem 1rem', borderRadius: 10, boxSizing: 'border-box',
          border: `2px solid ${submitted ? (isCorrect ? C.green : C.red) : t.border}`,
          background: submitted ? (isCorrect ? `${C.green}14` : `${C.red}10`) : t.surface,
          color: t.text, fontSize: '0.95rem',
          outline: 'none', transition: 'border-color 0.18s',
        }}
      />
      {submitted && (
        <div style={{
          marginTop: 10, padding: '0.6rem 0.9rem', borderRadius: 8,
          background: isCorrect ? `${C.green}14` : `${C.red}10`,
          color: isCorrect ? C.green : C.red, fontSize: '0.875rem', fontWeight: 600,
        }}>
          {isCorrect ? '✓ Helyes!' : `✗ A helyes válasz: ${q.answer}`}
        </div>
      )}
    </div>
  )
}

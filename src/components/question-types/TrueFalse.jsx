'use client'
import { C } from '../../theme'

// q: { type:'true_false', question, answer:'true'|'false' }
// selected: 'true'|'false'|null
// onSelect(value) called when user picks
export default function TrueFalse({ q, selected, onSelect, submitted, t }) {
  const options = [
    { value: 'true',  label: 'Igaz',  icon: '✓' },
    { value: 'false', label: 'Hamis', icon: '✗' },
  ]

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
      {options.map(({ value, label, icon }) => {
        const isSelected = selected === value
        const isCorrect = value === q.answer
        let bg = t.surface2
        let border = t.border
        let color = t.text

        if (submitted) {
          if (isCorrect) { bg = `${C.green}18`; border = C.green; color = C.green }
          else if (isSelected && !isCorrect) { bg = `${C.red}14`; border = C.red; color = C.red }
        } else if (isSelected) {
          bg = C.accentBg2 || `${C.accent}28`
          border = C.accent
          color = C.accent
        }

        return (
          <button
            key={value}
            onClick={() => !submitted && onSelect(value)}
            disabled={submitted}
            style={{
              flex: 1, padding: '1.1rem 0.75rem', borderRadius: 12,
              border: `2px solid ${border}`, background: bg, color,
              fontWeight: 700, fontSize: '1.05rem', cursor: submitted ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.18s ease',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            {label}
          </button>
        )
      })}
    </div>
  )
}

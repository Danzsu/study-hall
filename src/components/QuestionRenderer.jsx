'use client'
import TrueFalse from './question-types/TrueFalse'
import SimpleInput from './question-types/SimpleInput'
import FillTheBlanks from './question-types/FillTheBlanks'
import DragDrop from './question-types/DragDrop'
import FormulaQuestion from './question-types/FormulaQuestion'

// Central dispatcher for all 7 question types.
// Props:
//   q        — question object (type, question, options, correct, answer, blanks, choices, etc.)
//   selected — current user answer (format depends on type)
//   onSelect — callback(newValue)
//   submitted — boolean
//   t        — theme object from useTheme()
// MCQ/multi and written are NOT handled here — they stay in Quiz.jsx and Written.jsx inline.

export default function QuestionRenderer({ q, selected, onSelect, submitted, t }) {
  switch (q.type) {
    case 'true_false':
      return <TrueFalse q={q} selected={selected} onSelect={onSelect} submitted={submitted} t={t} />
    case 'fill_the_blanks':
      return <FillTheBlanks q={q} selected={selected} onSelect={onSelect} submitted={submitted} t={t} />
    case 'drag_n_drop':
      return <DragDrop q={q} selected={selected} onSelect={onSelect} submitted={submitted} t={t} />
    case 'simple_input':
      return <SimpleInput q={q} selected={selected} onSelect={onSelect} submitted={submitted} t={t} />
    case 'formula_drag_drop':
    case 'calc_input':
      return <FormulaQuestion q={q} selected={selected} onSelect={onSelect} submitted={submitted} t={t} />
    default:
      return null
  }
}

// Helper: evaluate if an answer is correct (type-aware)
export function evaluateAnswer(q, selected) {
  switch (q.type) {
    case 'mcq':
      return selected === q.correct
    case 'multi': {
      const sel = Array.isArray(selected) ? [...selected].sort() : []
      const cor = Array.isArray(q.correctMultiple) ? [...q.correctMultiple].sort() : []
      return sel.join(',') === cor.join(',')
    }
    case 'true_false':
      return selected === q.answer
    case 'simple_input':
      return String(selected ?? '').trim().toLowerCase() === String(q.answer ?? '').trim().toLowerCase()
    case 'fill_the_blanks': {
      const answers = selected ?? {}
      return (q.blanks ?? []).every(b =>
        String(answers[b.identifier] ?? '').trim().toLowerCase() === String(b.answer ?? '').trim().toLowerCase()
      )
    }
    case 'drag_n_drop':
    case 'formula_drag_drop': {
      const placements = selected ?? {}
      const fields = (q.choices ?? []).filter(c => !c.identifier.startsWith('distractor'))
      return fields.length > 0 && fields.every(c => placements[c.identifier] === c.identifier)
    }
    case 'calc_input': {
      const ans = typeof selected === 'object' && selected !== null ? selected.answer : selected
      return String(ans ?? '').trim().toLowerCase() === String(q.answer ?? '').trim().toLowerCase()
    }
    case 'written':
      return null // written answers are AI-graded, no local correct/wrong
    default:
      return false
  }
}

// Helper: check if a question has a valid selection (for enabling Submit button)
export function hasValidSelection(q, selected) {
  switch (q.type) {
    case 'mcq':
      return selected !== null && selected !== undefined
    case 'multi':
      return Array.isArray(selected) && selected.length > 0
    case 'true_false':
      return selected === 'true' || selected === 'false'
    case 'simple_input':
      return String(selected ?? '').trim().length > 0
    case 'fill_the_blanks': {
      const answers = selected ?? {}
      return (q.blanks ?? []).every(b => String(answers[b.identifier] ?? '').trim().length > 0)
    }
    case 'drag_n_drop':
    case 'formula_drag_drop': {
      const placements = selected ?? {}
      const fields = (q.choices ?? []).filter(c => !c.identifier.startsWith('distractor'))
      return fields.length > 0 && fields.every(c => placements[c.identifier])
    }
    case 'calc_input': {
      const ans = typeof selected === 'object' && selected !== null ? selected.answer : selected
      return String(ans ?? '').trim().length > 0
    }
    case 'written':
      return String(selected ?? '').trim().length >= 10
    default:
      return false
  }
}

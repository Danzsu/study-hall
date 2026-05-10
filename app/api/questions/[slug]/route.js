import { getQuestions } from '@/lib/content'

const VALID_TYPES = new Set([
  'mcq', 'multi', 'written',
  'true_false', 'fill_the_blanks', 'drag_n_drop',
  'simple_input', 'formula_drag_drop', 'calc_input',
])

export async function GET(req, { params }) {
  const { searchParams } = new URL(req.url)
  const section = searchParams.get('section')
  const type = searchParams.get('type')
  const questions = getQuestions(params.slug).filter(q => {
    const sectionOk = !section || q.section === section
    const typeOk = !type || q.type === type || (type === 'mc' && (q.type === 'mcq' || q.type === 'multi'))
    return sectionOk && typeOk
  })
  const result = questions.map(q => ({
    id: q.id,
    type: q.type,
    section: q.section,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    correct: q.correct,
    correctMultiple: q.correctMultiple,
    explanation: q.explanation,
    idealAnswer: q.idealAnswer,
    keywords: q.keywords,
    // New type-specific fields
    answer: q.answer,
    blanks: q.blanks,
    choices: q.choices,
    formulaText: q.formulaText,
    formulaChips: q.formulaChips,
    // Legacy aliases
    q: q.question,
    explain: q.explanation,
    ideal: q.idealAnswer,
  }))
  return Response.json(result)
}

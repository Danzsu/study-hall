import { requireAdmin } from '@/lib/auth-middleware'

const ALL_ENABLED_TYPES = ['multi_choice', 'true_false', 'fill_the_blanks', 'drag_n_drop', 'simple_input', 'formula_drag_drop', 'calc_input']

function optionsObjectToArray(optionsObj) {
  if (Array.isArray(optionsObj)) return optionsObj
  if (!optionsObj || typeof optionsObj !== 'object') return []
  return Object.values(optionsObj)
}

function answerKeysToIndices(answerKeys, optionsObj) {
  if (!Array.isArray(answerKeys) || !optionsObj || typeof optionsObj !== 'object') return []
  const keys = Object.keys(optionsObj)
  return answerKeys.map(k => keys.indexOf(k)).filter(i => i !== -1)
}

function convertToStudyHallFormat(quizAuraQuestions, sectionName) {
  const result = []
  for (const q of quizAuraQuestions) {
    const qt = q.question_type
    const base = { section: sectionName || 'General', difficulty: q.difficulty || 'medium' }

    if (qt === 'multi_choice') {
      const optionsArr = optionsObjectToArray(q.options)
      const correctIndices = answerKeysToIndices(q.answer ?? [], q.options)
      if (correctIndices.length === 1) {
        result.push({ ...base, type: 'mcq', question: q.question_title ?? '', options: optionsArr, correct: correctIndices[0], explanation: q.explanation ?? '' })
      } else {
        result.push({ ...base, type: 'multi', question: q.question_title ?? '', options: optionsArr, correctMultiple: correctIndices, explanation: q.explanation ?? '' })
      }
    } else if (qt === 'true_false') {
      result.push({ ...base, type: 'true_false', question: q.question_title ?? '', answer: q.answer ?? 'false' })
    } else if (qt === 'fill_the_blanks') {
      const blank = q.blank ?? []
      const blanks = Array.isArray(blank) ? blank : [blank]
      result.push({ ...base, type: 'fill_the_blanks', question: q.text ?? q.question_title ?? '', blanks })
    } else if (qt === 'drag_n_drop') {
      result.push({ ...base, type: 'drag_n_drop', question: q.text ?? q.question_title ?? '', choices: q.choices ?? [] })
    } else if (qt === 'simple_input') {
      result.push({ ...base, type: 'simple_input', question: q.question_title ?? '', answer: q.answer ?? '' })
    } else if (qt === 'formula_drag_drop') {
      result.push({ ...base, type: 'formula_drag_drop', question: q.question_title ?? '', formulaText: q.text ?? '', choices: q.choices ?? [] })
    } else if (qt === 'calc_input') {
      const entry = { ...base, type: 'calc_input', question: q.question_title ?? '', answer: q.answer ?? '' }
      if (q.formula_chips?.length) entry.formulaChips = q.formula_chips
      result.push(entry)
    }
  }
  return result
}

export async function POST(req) {
  const admin = await requireAdmin(req)
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { facts, config } = body
  if (!Array.isArray(facts) || facts.length === 0) return Response.json({ error: 'facts array required' }, { status: 400 })

  const { generateQuiz } = await import('../../../../scripts/llm-service.js')
  const { parseMarkdownToQuiz } = await import('../../../../scripts/markdown-parser.js')

  const quizConfig = {
    subject: config?.subject || 'Általános',
    type: 'Synthetic Questionnaire',
    year: new Date().getFullYear().toString(),
    difficulty: config?.difficulty || 'medium',
    questionCount: Math.min(60, Math.max(10, config?.questionCount || 40)),
    enabledTypes: config?.enabledTypes || ALL_ENABLED_TYPES,
    requirementsContext: config?.requirementsContext || 'Nincs megadva.',
  }

  try {
    const markdown = await generateQuiz(facts, quizConfig)
    const { questions: rawQuestions } = parseMarkdownToQuiz(markdown)
    const questions = convertToStudyHallFormat(rawQuestions, config?.section || quizConfig.subject)
    questions.forEach((q, i) => { q.id = `q${i + 1}` })
    return Response.json({ questions, count: questions.length })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 })
  }
}

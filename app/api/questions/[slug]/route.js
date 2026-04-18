import { getQuestions } from '@/lib/content'

export async function GET(req, { params }) {
  const questions = getQuestions(params.slug)
  const result = questions.map(q => ({
    id: q.id,
    section: q.section,
    difficulty: q.difficulty,
    type: q.type === 'written' ? 'written' : 'mc',
    q: q.question,
    options: q.options,
    correct: Array.isArray(q.correct) ? q.correct[0] : q.correct,
    explain: q.explanation,
    keywords: q.key_points,
    ideal: q.model_answer,
  }))
  return Response.json(result)
}

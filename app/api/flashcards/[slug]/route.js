import { getFlashcards } from '@/lib/content'

export async function GET(req, { params }) {
  const cards = getFlashcards(params.slug)
  const result = cards.map(c => ({
    id: c.id,
    front: c.question,
    back: c.answer,
    explanation: c.explanation,
    tags: c.tags,
  }))
  return Response.json(result)
}

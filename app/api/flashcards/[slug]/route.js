import { getFlashcards } from '@/lib/content'

export async function GET(req, { params }) {
  const cards = getFlashcards(params.slug)
  const result = cards.map(c => ({
    id: c.id,
    front: c.front,
    back: c.back,
    section: c.section,
    type: c.type,
    abbr: c.abbr,
    full: c.full,
  }))
  return Response.json(result)
}

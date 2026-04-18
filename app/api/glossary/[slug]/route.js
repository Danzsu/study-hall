import { getGlossary } from '@/lib/content'

export async function GET(req, { params }) {
  const terms = getGlossary(params.slug)
  const result = terms.map(t => ({
    term: t.term,
    abbr: t.abbr ?? '',
    def: t.definition,
    section: t.category,
  }))
  return Response.json(result)
}

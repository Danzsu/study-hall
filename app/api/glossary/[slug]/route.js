import { getGlossary } from '@/lib/content'

export async function GET(req, { params }) {
  const terms = getGlossary(params.slug)
  const result = terms.map(t => ({
    id: t.id,
    term: t.term,
    abbr: t.abbr ?? '',
    def: t.definition,
    definition: t.definition,
    section: t.category,
    category: t.category,
    aliases: t.aliases,
  }))
  return Response.json(result)
}

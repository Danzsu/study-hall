import { getSubjects, searchContent } from '@/lib/content'

const VALID_TYPES = new Set(['notes', 'questions', 'glossary', 'flashcards'])

function parseList(searchParams, key) {
  return searchParams.getAll(key)
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean)
}

function normalizeTypes(rawTypes) {
  if (!rawTypes.length) return []

  const types = []
  for (const type of rawTypes) {
    const normalized = type.toLowerCase()
    if (normalized === 'note') {
      types.push('notes')
      continue
    }
    if (normalized === 'question') {
      types.push('questions')
      continue
    }
    if (!VALID_TYPES.has(normalized)) return null
    types.push(normalized)
  }

  return [...new Set(types)]
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const query = String(searchParams.get('q') || '').trim()
  if (query.length < 2) {
    return Response.json({ error: 'q must be at least 2 characters' }, { status: 400 })
  }

  const subjects = getSubjects()
  const subjectSlugs = parseList(searchParams, 'subject')
  const types = normalizeTypes(parseList(searchParams, 'type'))
  if (types === null) {
    return Response.json({ error: 'type must be notes, questions, glossary, or flashcards' }, { status: 400 })
  }

  let slugs = subjects.map((subject) => subject.slug)
  if (subjectSlugs.length) {
    const known = new Set(slugs)
    if (subjectSlugs.some((slug) => !known.has(slug))) {
      return Response.json({ error: 'Unknown subject' }, { status: 400 })
    }
    slugs = [...new Set(subjectSlugs)]
  }

  const results = searchContent(query, slugs, types).slice(0, 60)
  return Response.json(results)
}

import { getSubjectSummary } from '@/lib/content'

export async function GET(req, { params }) {
  const subject = getSubjectSummary(params.slug)
  if (!subject) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(subject)
}

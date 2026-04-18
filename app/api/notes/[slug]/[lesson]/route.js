import { getNoteContent } from '@/lib/content'

export async function GET(req, { params }) {
  const data = getNoteContent(params.slug, params.lesson)
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(data)
}

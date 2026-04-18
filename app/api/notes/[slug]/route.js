import { getNotesLessons } from '@/lib/content'

export async function GET(req, { params }) {
  return Response.json(getNotesLessons(params.slug))
}

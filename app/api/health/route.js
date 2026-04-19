import { getSubjects } from '@/lib/content'

export async function GET() {
  let status = 'ok'
  let subjects = []

  try {
    subjects = getSubjects()
  } catch {
    status = 'degraded'
  }

  return Response.json({
    status,
    subjects: subjects.length,
    timestamp: new Date().toISOString(),
    env: {
      groq: !!process.env.GROQ_API_KEY,
    },
  })
}

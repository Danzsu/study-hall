import { getSubjectSummary, getSubjects } from '@/lib/content'

export async function GET() {
  const subjects = getSubjects()
  const result = subjects.map((s) => {
    const summary = getSubjectSummary(s.slug) ?? s
    return {
      id: s.slug,
      name: s.name,
      desc: s.description,
      color: s.color,
      icon: s.icon,
      questions: summary.questionCount ?? s.questionCount ?? 0,
      lessons: summary.lessonCount ?? s.lessonCount ?? 0,
      flashcardCount: summary.flashcardCount ?? 0,
      glossaryCount: summary.glossaryCount ?? 0,
      sections: (summary.sections ?? []).map((sec, i) => ({
        id: 's' + (i + 1),
        name: sec.name,
        q: sec.total,
        done: 0, // client tracks progress via localStorage
      })),
    }
  })
  return Response.json(result)
}

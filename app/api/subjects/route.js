import { getSubjects, getSubjectSectionInfos } from '@/lib/content'

export async function GET() {
  const subjects = getSubjects()
  const result = subjects.map((s, si) => ({
    id: s.slug,
    name: s.name,
    desc: s.description,
    color: s.color,
    icon: s.icon,
    questions: s.questionCount,
    lessons: s.lessonCount,
    flashcardCount: s.flashcardCount ?? 0,
    glossaryCount: s.glossaryCount ?? 0,
    sections: getSubjectSectionInfos(s.slug).map((sec, i) => ({
      id: 's' + (i + 1),
      name: sec.name,
      q: sec.total,
      done: 0, // client tracks progress via localStorage
    })),
  }))
  return Response.json(result)
}

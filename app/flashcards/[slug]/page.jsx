import RouteShell from '@/src/RouteShell'
import Flashcard from '@/src/screens/Flashcard'
import { getSubject } from '@/lib/content'

export default function Page({ params }) {
  const subject = getSubject(params.slug)
  return (
    <RouteShell route="/flashcards" slug={params.slug} subjectName={subject?.name}>
      <Flashcard subjectId={params.slug} />
    </RouteShell>
  )
}

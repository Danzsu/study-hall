import RouteShell from '@/src/RouteShell'
import WrongAnswers from '@/src/screens/WrongAnswers'
import { getSubject } from '@/lib/content'

export default function Page({ params }) {
  const subject = getSubject(params.slug)
  return (
    <RouteShell route="/wrong-answers" slug={params.slug} subjectName={subject?.name}>
      <WrongAnswers subjectId={params.slug} />
    </RouteShell>
  )
}

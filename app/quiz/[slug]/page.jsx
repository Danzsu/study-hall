import RouteShell from '@/src/RouteShell'
import Quiz from '@/src/screens/Quiz'
import { getSubject } from '@/lib/content'

export default function Page({ params, searchParams }) {
  const subject = getSubject(params.slug)
  return (
    <RouteShell route="/quiz" slug={params.slug} subjectName={subject?.name} section={searchParams?.section}>
      <Quiz subjectId={params.slug} section={searchParams?.section} />
    </RouteShell>
  )
}

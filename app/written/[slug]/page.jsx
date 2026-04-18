import RouteShell from '@/src/RouteShell'
import Written from '@/src/screens/Written'
import { getSubject } from '@/lib/content'

export default function Page({ params }) {
  const subject = getSubject(params.slug)
  return (
    <RouteShell route="/written" slug={params.slug} subjectName={subject?.name}>
      <Written subjectId={params.slug} />
    </RouteShell>
  )
}

import RouteShell from '@/src/RouteShell'
import Subject from '@/src/screens/Subject'
import { getSubject } from '@/lib/content'

export default function Page({ params }) {
  const subject = getSubject(params.slug)
  return (
    <RouteShell route="/subject" slug={params.slug} subjectName={subject?.name}>
      <Subject subjectId={params.slug} />
    </RouteShell>
  )
}

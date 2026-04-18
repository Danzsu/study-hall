import RouteShell from '@/src/RouteShell'
import Review from '@/src/screens/Review'
import { getSubject } from '@/lib/content'

export default function Page({ params }) {
  const subject = getSubject(params.slug)
  return (
    <RouteShell route="/review" slug={params.slug} subjectName={subject?.name}>
      <Review subjectId={params.slug} />
    </RouteShell>
  )
}

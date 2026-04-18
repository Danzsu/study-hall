import RouteShell from '@/src/RouteShell'
import Study from '@/src/screens/Study'
import { getSubject } from '@/lib/content'

export default function Page({ params, searchParams }) {
  const subject = getSubject(params.slug)
  return (
    <RouteShell route="/study" slug={params.slug} subjectName={subject?.name} lesson={searchParams?.lesson}>
      <Study subjectId={params.slug} lesson={searchParams?.lesson} />
    </RouteShell>
  )
}

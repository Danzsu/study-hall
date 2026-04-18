import RouteShell from '@/src/RouteShell'
import Glossary from '@/src/screens/Glossary'
import { getSubject } from '@/lib/content'

export default function Page({ params }) {
  const subject = getSubject(params.slug)
  return (
    <RouteShell route="/glossary" slug={params.slug} subjectName={subject?.name}>
      <Glossary subjectId={params.slug} />
    </RouteShell>
  )
}

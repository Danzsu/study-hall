import RouteShell from '@/src/RouteShell'
import ExamSim from '@/src/screens/ExamSim'
import { getSubject } from '@/lib/content'

export default function Page({ params }) {
  const subject = getSubject(params.slug)
  return (
    <RouteShell route="/exam" slug={params.slug} subjectName={subject?.name}>
      <ExamSim subjectId={params.slug} />
    </RouteShell>
  )
}

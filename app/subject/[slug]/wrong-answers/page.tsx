import { notFound } from 'next/navigation'
import { getSubject, getQuestions } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { WrongAnswersClient } from '@/components/study/WrongAnswersClient'

interface Props { params: { slug: string } }

export default function WrongAnswersPage({ params }: Props) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const allQuestions = getQuestions(params.slug).filter(
    (q) => q.type === 'mcq' || q.type === 'multi'
  )

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header backHref={`/subject/${params.slug}`} backLabel="Back" title={subject.name} />
      <WrongAnswersClient allQuestions={allQuestions} subjectSlug={params.slug} />
    </div>
  )
}

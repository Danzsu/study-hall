import { notFound } from 'next/navigation'
import { getSubject, getQuestions } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { QuizClient } from '@/components/study/QuizClient'

interface Props { params: { slug: string } }

export default function QuizPage({ params }: Props) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const questions = getQuestions(params.slug).filter(
    (q) => q.type === 'mcq' || q.type === 'multi'
  )

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header backHref={`/subject/${params.slug}`} backLabel="Back" title={subject.name} />
      <QuizClient questions={questions} subjectSlug={params.slug} />
    </div>
  )
}

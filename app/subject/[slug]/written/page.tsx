import { notFound } from 'next/navigation'
import { getSubject, getQuestions } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { WrittenTestClient } from '@/components/study/WrittenTestClient'

interface Props { params: { slug: string } }

export default function WrittenTestPage({ params }: Props) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const questions = getQuestions(params.slug).filter((q) => q.type === 'written')

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header backHref={`/subject/${params.slug}`} backLabel="Back" title={subject.name} />
      <WrittenTestClient questions={questions} subjectSlug={params.slug} />
    </div>
  )
}

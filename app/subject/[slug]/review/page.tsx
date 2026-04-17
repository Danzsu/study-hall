import { notFound } from 'next/navigation'
import { getSubject, getQuestions } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/layout/TabBar'
import { ReviewClient } from '@/components/study/ReviewClient'

interface Props { params: { slug: string } }

export default function ReviewPage({ params }: Readonly<Props>) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const questions = getQuestions(params.slug).filter(
    (q) => q.type === 'mcq' || q.type === 'multi'
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 90 }}>
      <Header crumbs={[
        { label: 'Tantárgyak', href: '/' },
        { label: subject.name, href: `/subject/${params.slug}` },
        { label: 'Áttekintés' },
      ]} />
      <ReviewClient questions={questions} />
      <TabBar />
    </div>
  )
}

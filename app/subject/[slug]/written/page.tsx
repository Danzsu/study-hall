import { notFound } from 'next/navigation'
import { getSubject, getQuestions } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/layout/TabBar'
import { WrittenTestClient } from '@/components/study/WrittenTestClient'

interface Props { params: { slug: string } }

export default function WrittenTestPage({ params }: Readonly<Props>) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const questions = getQuestions(params.slug).filter((q) => q.type === 'written')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 90 }}>
      <Header crumbs={[
        { label: 'Tantárgyak', href: '/' },
        { label: subject.name, href: `/subject/${params.slug}` },
        { label: 'Írásbeli teszt' },
      ]} />
      <WrittenTestClient questions={questions} subjectSlug={params.slug} />
      <TabBar />
    </div>
  )
}

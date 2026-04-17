import { notFound } from 'next/navigation'
import { getSubject, getFlashcards } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/layout/TabBar'
import { FlashcardClient } from '@/components/study/FlashcardClient'

interface Props { params: { slug: string } }

export default function FlashcardsPage({ params }: Readonly<Props>) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const cards = getFlashcards(params.slug)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 90 }}>
      <Header crumbs={[
        { label: 'Tantárgyak', href: '/' },
        { label: subject.name, href: `/subject/${params.slug}` },
        { label: 'Flashkártyák' },
      ]} />
      <FlashcardClient cards={cards} />
      <TabBar />
    </div>
  )
}

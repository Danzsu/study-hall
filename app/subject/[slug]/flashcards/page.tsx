import { notFound } from 'next/navigation'
import { getSubject, getFlashcards } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { FlashcardClient } from '@/components/study/FlashcardClient'

interface Props { params: { slug: string } }

export default function FlashcardsPage({ params }: Props) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const cards = getFlashcards(params.slug)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header backHref={`/subject/${params.slug}`} backLabel="Back" title={subject.name} />
      <FlashcardClient cards={cards} />
    </div>
  )
}

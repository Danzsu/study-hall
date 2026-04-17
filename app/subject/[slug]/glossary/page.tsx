import { notFound } from 'next/navigation'
import { getSubject, getGlossary } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { GlossaryClient } from '@/components/study/GlossaryClient'

interface Props { params: { slug: string } }

export default function GlossaryPage({ params }: Props) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const terms = getGlossary(params.slug)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header backHref={`/subject/${params.slug}`} backLabel="Back" />
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Glossary</h1>
          <span className="text-xs text-[var(--muted)]">{terms.length} terms</span>
        </div>
        <GlossaryClient terms={terms} />
      </div>
    </div>
  )
}

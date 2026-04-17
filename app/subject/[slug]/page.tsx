import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { getSubject, getSubjectSections, getQuestions } from '@/lib/content'
import { ModeSelectorGrid } from '@/components/study/ModeSelectorGrid'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const { getSubjects } = await import('@/lib/content')
  return getSubjects().map((s) => ({ slug: s.slug }))
}

export default function SubjectPage({ params }: Props) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const sections = getSubjectSections(params.slug)
  const questions = getQuestions(params.slug)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header
        backHref="/"
        backLabel="Back"
        title={subject.name}
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Subject meta */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{subject.name}</h1>
          <p className="text-sm text-[var(--muted)] mt-1">{subject.description}</p>
        </div>

        {/* Mode grid */}
        <ModeSelectorGrid slug={params.slug} />

        {/* Sections */}
        {sections.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
              Exam Sections
            </p>
            <div className="flex flex-wrap gap-2">
              {sections.map((section, i) => (
                <span key={section} className="chip">
                  {i + 1} {section}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

import Link from 'next/link'
import { Flame } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { getSubjects } from '@/lib/content'
import { SubjectCard } from '@/components/study/SubjectCard'
import { StreakBadge } from '@/components/study/StreakBadge'

export default function StudyHall() {
  const subjects = getSubjects()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Streak banner */}
        <StreakBadge />

        {/* Subjects */}
        <section className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <SubjectCard key={subject.slug} subject={subject} />
            ))}

            {subjects.length === 0 && (
              <div className="col-span-3 text-center py-16 text-[var(--muted)]">
                <p className="text-sm">No subjects yet.</p>
                <p className="text-xs mt-1">
                  Run{' '}
                  <code className="bg-[var(--surface-muted)] px-1 rounded text-[var(--foreground)]">
                    python pipeline/process.py file.pdf --subject my-subject
                  </code>{' '}
                  to add content.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pb-4 text-center text-xs text-[var(--muted)]">
          {subjects.length > 0 && (
            <p>
              {subjects.reduce((s, sub) => s + sub.questionCount, 0)} questions ·{' '}
              {subjects.length} subjects
            </p>
          )}
        </footer>
      </main>
    </div>
  )
}

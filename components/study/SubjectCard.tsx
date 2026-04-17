import Link from 'next/link'
import type { Subject } from '@/lib/content'

const SUBJECT_ICONS: Record<string, string> = {
  brain: '🧠',
  chart: '📊',
  code: '💻',
  book: '📖',
  flask: '🔬',
  math: '📐',
  network: '🌐',
  default: '📚',
}

export function SubjectCard({ subject }: { subject: Subject }) {
  const icon = SUBJECT_ICONS[subject.icon] ?? SUBJECT_ICONS.default

  return (
    <Link href={`/subject/${subject.slug}`}>
      <div
        className="subject-card p-5 group"
        style={{ borderLeftColor: subject.color }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">{icon}</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[var(--foreground)] group-hover:text-accent transition-colors truncate">
              {subject.name}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">
              {subject.description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-xs text-[var(--muted)]">
          <span>{subject.questionCount} questions</span>
          <span>·</span>
          <span>{subject.lessonCount} lessons</span>
          {subject.flashcardCount != null && (
            <>
              <span>·</span>
              <span>{subject.flashcardCount} cards</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

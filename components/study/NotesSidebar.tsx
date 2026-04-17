import Link from 'next/link'
import type { NoteLesson } from '@/lib/content'

interface Props {
  lessons: NoteLesson[]
  activeLessonSlug: string | undefined
  subjectSlug: string
}

export function NotesSidebar({ lessons, activeLessonSlug, subjectSlug }: Props) {
  return (
    <aside className="w-48 shrink-0 hidden md:block">
      <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
        Lessons
      </p>
      <nav className="space-y-1">
        {lessons.map((lesson) => (
          <Link
            key={lesson.slug}
            href={`/subject/${subjectSlug}/study?lesson=${lesson.slug}`}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
              activeLessonSlug === lesson.slug
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
            }`}
          >
            <span className="text-xs mr-2 opacity-60">{lesson.lesson}.</span>
            {lesson.title}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

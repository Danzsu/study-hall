import { notFound } from 'next/navigation'
import { getSubject, getNotesLessons, getNoteContent } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { NoteViewer } from '@/components/study/NoteViewer'
import { NotesSidebar } from '@/components/study/NotesSidebar'

interface Props {
  params: { slug: string }
  searchParams: { lesson?: string }
}

export default function StudyPage({ params, searchParams }: Props) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const lessons = getNotesLessons(params.slug)
  const activeLessonSlug = searchParams.lesson ?? lessons[0]?.slug

  const noteData = activeLessonSlug
    ? getNoteContent(params.slug, activeLessonSlug)
    : null

  const activeLesson = lessons.find((l) => l.slug === activeLessonSlug)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header
        backHref={`/subject/${params.slug}`}
        backLabel="Back"
        title={subject.name}
        rightSlot={
          <span className="text-xs text-[var(--muted)]">
            {activeLesson ? `${activeLesson.lesson} / ${lessons.length}` : ''}
          </span>
        }
      />

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        {lessons.length > 1 && (
          <NotesSidebar
            lessons={lessons}
            activeLessonSlug={activeLessonSlug}
            subjectSlug={params.slug}
          />
        )}

        {/* Content */}
        <main className="flex-1 min-w-0">
          {noteData ? (
            <NoteViewer
              content={noteData.content}
              frontmatter={noteData.frontmatter}
              currentLesson={activeLesson?.lesson ?? 1}
              totalLessons={lessons.length}
              lessons={lessons}
              subjectSlug={params.slug}
            />
          ) : (
            <div className="text-center py-16 text-[var(--muted)]">
              <p className="text-sm">No notes available yet.</p>
              <p className="text-xs mt-1">
                Run the pipeline to generate study notes from your materials.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

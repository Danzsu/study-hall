import { notFound } from 'next/navigation'
import { getSubject, getNotesLessons, getNoteContent } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/layout/TabBar'
import { NoteViewer } from '@/components/study/NoteViewer'
import { NotesSidebar } from '@/components/study/NotesSidebar'

interface Props {
  params: { slug: string }
  searchParams: { lesson?: string }
}

export default function StudyPage({ params, searchParams }: Readonly<Props>) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const lessons = getNotesLessons(params.slug)
  const activeLessonSlug = searchParams.lesson ?? lessons[0]?.slug

  const noteData = activeLessonSlug
    ? getNoteContent(params.slug, activeLessonSlug)
    : null

  const activeLesson = lessons.find((l) => l.slug === activeLessonSlug)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header crumbs={[
        { label: 'Tantárgyak', href: '/' },
        { label: subject.name, href: `/subject/${params.slug}` },
        { label: activeLesson?.title ?? 'Tanulás' },
      ]} />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        {lessons.length > 1 && (
          <NotesSidebar
            lessons={lessons}
            activeLessonSlug={activeLessonSlug}
            subjectSlug={params.slug}
            subjectName={subject.name}
          />
        )}

        <main style={{ flex: 1, minWidth: 0, paddingBottom: 90 }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 8 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Még nincsenek jegyzetek ehhez a tantárgyhoz.</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Futtasd a pipeline-t a tartalom generálásához.</p>
            </div>
          )}
        </main>
      </div>
      <TabBar />
    </div>
  )
}

import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import type { NoteLesson } from '@/lib/content'

interface Props {
  lessons: NoteLesson[]
  activeLessonSlug: string | undefined
  subjectSlug: string
  subjectName?: string
}

/** Group lessons by section */
function groupBySection(lessons: NoteLesson[]): { section: string; lessons: NoteLesson[] }[] {
  const map = new Map<string, NoteLesson[]>()
  for (const l of lessons) {
    const existing = map.get(l.section) ?? []
    existing.push(l)
    map.set(l.section, existing)
  }
  return Array.from(map.entries()).map(([section, items]) => ({ section, lessons: items }))
}

export function NotesSidebar({ lessons, activeLessonSlug, subjectSlug, subjectName }: Readonly<Props>) {
  const groups = groupBySection(lessons)

  return (
    <aside style={{
      width: 272, flexShrink: 0,
      background: 'var(--sidebar)', borderRight: '1px solid var(--sidebar-border)',
      padding: '20px 0', overflowY: 'auto',
      position: 'sticky', top: 56,
      height: 'calc(100vh - 56px)',
    }}>
      {/* Course header */}
      <div style={{ padding: '0 22px 20px', borderBottom: '1px solid var(--border)' }}>
        <span className="section-label" style={{ display: 'block', marginBottom: 6 }}>Tanfolyam</span>
        <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, color: 'var(--text)' }}>
          {subjectName ?? 'Leckék'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 4 }}>
          {lessons.length} lecke
        </p>
      </div>

      {/* Lessons nav */}
      <nav style={{ padding: '12px 0' }}>
        {groups.map(({ section, lessons: sLessons }) => (
          <div key={section}>
            {/* Section header */}
            <div style={{ padding: '8px 22px' }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '1px',
                color: 'var(--text-muted)', textTransform: 'uppercase',
              }}>
                {section}
              </span>
            </div>

            {/* Lesson items */}
            {sLessons.map((lesson) => {
              const isActive = activeLessonSlug === lesson.slug
              return (
                <Link
                  key={lesson.slug}
                  href={`/subject/${subjectSlug}/study?lesson=${lesson.slug}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 22px 10px 18px',
                    textDecoration: 'none',
                    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                    background: isActive ? 'var(--accent-bg2)' : 'transparent',
                    transition: 'background .15s',
                  }}
                >
                  {isActive
                    ? <Circle size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    : <CheckCircle2 size={15} style={{ color: 'var(--border2)', flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: isActive ? 700 : 500, lineHeight: 1.3,
                      color: isActive ? 'var(--accent)' : 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {lesson.title}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

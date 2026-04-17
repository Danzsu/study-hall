import Link from 'next/link'

function sourceIcon(type: string): string {
  if (type === 'pdf') return '📄'
  if (type === 'book') return '📚'
  return '📝'
}
import { ChevronLeft, ChevronRight, Layers, Play } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { NoteLesson } from '@/lib/content'

interface Source {
  type: string
  title: string
  author?: string
  year?: number
  chapter?: string
}

interface Props {
  content: string
  frontmatter: Record<string, unknown>
  currentLesson: number
  totalLessons: number
  lessons: NoteLesson[]
  subjectSlug: string
}

export function NoteViewer({ content, frontmatter, currentLesson, totalLessons, lessons, subjectSlug }: Readonly<Props>) {
  const sources = frontmatter.sources as Source[] | undefined
  const section = frontmatter.section as string | undefined
  const title = frontmatter.title as string | undefined

  const currentIndex = lessons.findIndex((l) => l.lesson === currentLesson)
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  return (
    <article style={{ maxWidth: 780, margin: '0 auto', padding: '36px 32px 60px' }}>

      {/* Section badge + lesson counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {section && (
          <span className="pill pill-accent" style={{ fontSize: 11 }}>{section}</span>
        )}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          Lecke {currentLesson} / {totalLessons}
        </span>
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 28, fontWeight: 700, lineHeight: 1.25,
        letterSpacing: '-0.5px', color: 'var(--text)',
        marginBottom: 32,
      }}>
        {title}
      </h1>

      {/* MDX Content */}
      <div style={{
        fontSize: 15, lineHeight: 1.8, color: 'var(--text)',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
        className="note-content"
      >
        <MDXRemote
          source={content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkMath],
              rehypePlugins: [rehypeKatex as never],
            },
          }}
        />
      </div>

      {/* Sources disclaimer */}
      {sources && sources.length > 0 && (
        <details style={{ marginTop: 40 }}>
          <summary style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '1px',
            color: 'var(--text-muted)', textTransform: 'uppercase',
            cursor: 'pointer', userSelect: 'none',
            borderTop: '1px solid var(--border)', paddingTop: 16,
          }}>
            Források · {sources.length}
          </summary>
          <div style={{ paddingTop: 12 }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sources.map((src) => (
                <li key={src.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-sub)' }}>
                  <span style={{ flexShrink: 0 }}>
                    {sourceIcon(src.type)}
                  </span>
                  <span>
                    {src.title}
                    {src.author && ` — ${src.author}`}
                    {src.year && ` (${src.year})`}
                    {src.chapter && `, ${src.chapter}`}
                  </span>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>
              Ez az összefoglaló a fenti forrásokból lett generálva személyes tanulási célra.
            </p>
          </div>
        </details>
      )}

      {/* Bottom navigation */}
      <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        {/* Prev */}
        <div>
          {prevLesson ? (
            <Link
              href={`/subject/${subjectSlug}/study?lesson=${prevLesson.slug}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 8,
                background: 'var(--surface)', border: '1px solid var(--border)',
                fontSize: 13, fontWeight: 600, color: 'var(--text-sub)',
                textDecoration: 'none',
              }}
            >
              <ChevronLeft size={14} /> {prevLesson.title}
            </Link>
          ) : <div />}
        </div>

        {/* Center: quick links */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/subject/${subjectSlug}/flashcards`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 8,
              background: 'var(--accent-bg)', border: '1px solid rgba(224,115,85,0.25)',
              fontSize: 13, fontWeight: 600, color: 'var(--accent)',
              textDecoration: 'none',
            }}
          >
            <Layers size={13} /> Flashkártyák
          </Link>
          <Link
            href={`/subject/${subjectSlug}/quiz`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 8,
              background: 'var(--accent)', border: '1px solid var(--accent)',
              fontSize: 13, fontWeight: 600, color: '#fff',
              textDecoration: 'none',
            }}
          >
            <Play size={13} /> Kvíz
          </Link>
        </div>

        {/* Next */}
        <div>
          {nextLesson ? (
            <Link
              href={`/subject/${subjectSlug}/study?lesson=${nextLesson.slug}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 8,
                background: 'var(--surface)', border: '1px solid var(--border)',
                fontSize: 13, fontWeight: 600, color: 'var(--text-sub)',
                textDecoration: 'none',
              }}
            >
              {nextLesson.title} <ChevronRight size={14} />
            </Link>
          ) : <div />}
        </div>
      </div>
    </article>
  )
}

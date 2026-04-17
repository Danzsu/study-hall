import Link from 'next/link'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
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

export function NoteViewer({ content, frontmatter, currentLesson, totalLessons, lessons, subjectSlug }: Props) {
  const sources = frontmatter.sources as Source[] | undefined
  const section = frontmatter.section as string | undefined

  const currentIndex = lessons.findIndex((l) => l.lesson === currentLesson)
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  return (
    <article>
      {/* Section badge */}
      {section && (
        <p className="text-xs font-medium text-accent uppercase tracking-widest mb-1">
          {section}
        </p>
      )}

      {/* Title */}
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        {frontmatter.title as string}
      </h1>

      {/* MDX Content */}
      <div className="prose prose-sm max-w-none text-[var(--foreground)]
        prose-headings:text-[var(--foreground)] prose-headings:font-semibold
        prose-p:leading-relaxed prose-p:text-[var(--foreground)]
        prose-strong:text-[var(--foreground)]
        prose-code:bg-[var(--surface-muted)] prose-code:px-1 prose-code:rounded prose-code:text-sm
        prose-ul:text-[var(--foreground)] prose-ol:text-[var(--foreground)]
        prose-li:leading-relaxed prose-blockquote:border-accent
      ">
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
        <div className="mt-10 pt-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted)] mb-2 font-medium uppercase tracking-wide">
            Sources
          </p>
          <ul className="space-y-1">
            {sources.map((src, i) => (
              <li key={i} className="text-xs text-[var(--muted)] flex items-start gap-2">
                <span className="shrink-0">
                  {src.type === 'pdf' ? '📄' : src.type === 'book' ? '📚' : '📝'}
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
          <p className="text-xs text-[var(--muted)] mt-2 italic">
            This summary was generated from the above sources for personal study purposes.
          </p>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div className="mt-10 flex items-center justify-between gap-4">
        <div>
          {prevLesson && (
            <Link
              href={`/subject/${subjectSlug}/study?lesson=${prevLesson.slug}`}
              className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <ChevronLeft size={16} /> {prevLesson.title}
            </Link>
          )}
        </div>
        <div className="text-right">
          {nextLesson && (
            <Link
              href={`/subject/${subjectSlug}/study?lesson=${nextLesson.slug}`}
              className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {nextLesson.title} <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

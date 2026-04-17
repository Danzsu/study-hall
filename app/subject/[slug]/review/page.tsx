import { notFound } from 'next/navigation'
import { getSubject, getQuestions } from '@/lib/content'
import { Header } from '@/components/layout/Header'

interface Props { params: { slug: string } }

export default function ReviewPage({ params }: Props) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const questions = getQuestions(params.slug).filter(
    (q) => q.type === 'mcq' || q.type === 'multi'
  )

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header backHref={`/subject/${params.slug}`} backLabel="Back" />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Review</h1>
          <span className="text-xs text-[var(--muted)]">{questions.length} questions</span>
        </div>

        <div className="space-y-4 animate-fade-in">
          {questions.map((q, i) => (
            <div key={q.id} className="card p-5">
              {/* Section badge */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                  {q.type === 'multi' ? 'Select multiple' : 'Multiple choice'}
                </span>
                <span className="text-xs text-accent shrink-0">{q.section}</span>
              </div>

              {/* Question */}
              <p className="text-sm font-medium text-[var(--foreground)] mb-4 leading-relaxed">
                {q.question}
              </p>

              {/* Options */}
              {q.options && (
                <div className="space-y-2 mb-4">
                  {q.options.map((opt, oi) => {
                    const correct = Array.isArray(q.correct)
                      ? q.correct.includes(oi)
                      : q.correct === oi
                    return (
                      <div
                        key={oi}
                        className={`flex items-start gap-3 px-3 py-2 rounded-lg text-sm border ${
                          correct
                            ? 'border-green-400 bg-green-50 dark:bg-green-950/30 text-[var(--foreground)]'
                            : 'border-[var(--border)] text-[var(--muted)]'
                        }`}
                      >
                        <span className={`font-medium text-xs mt-0.5 ${correct ? 'text-green-600 dark:text-green-400' : ''}`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-xs font-medium text-accent mb-1 uppercase tracking-wide">Explanation</p>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}

          {questions.length === 0 && (
            <p className="text-center text-[var(--muted)] py-12 text-sm">
              No questions yet. Run the pipeline to generate content.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

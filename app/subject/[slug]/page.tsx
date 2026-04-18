import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Play, BookOpen, Layers, PenLine, RotateCcw,
  ClipboardList, ArrowRight, Clock, Target, ChevronRight, GraduationCap,
} from 'lucide-react'
import { getSubject, getSubjectSectionInfos, getNotesLessons } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/layout/TabBar'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const { getSubjects } = await import('@/lib/content')
  return getSubjects().map((s) => ({ slug: s.slug }))
}

const MODES = [
  { key: 'quiz',          label: 'Kvíz',           sub: 'Pontozva · 10 kérdés',          icon: Play,          color: 'var(--accent)' },
  { key: 'study',         label: 'Tanulás',         sub: 'Jegyzetek és magyarázatok',      icon: BookOpen,      color: 'var(--blue)' },
  { key: 'flashcards',    label: 'Flashkártyák',    sub: 'Koppints a megfordításhoz',      icon: Layers,        color: 'var(--green)' },
  { key: 'written',       label: 'Írásbeli teszt',  sub: 'AI értékeli a válaszod',         icon: PenLine,       color: 'var(--purple)' },
  { key: 'wrong-answers', label: 'Hibás válaszok',  sub: 'Gyakorold a hibákat',            icon: RotateCcw,     color: 'var(--gold)' },
  { key: 'review',           label: 'Áttekintés',         sub: 'Minden kérdés böngészése',       icon: ClipboardList,  color: 'var(--red)' },
  { key: 'exam-simulation',  label: 'Vizsga szimulátor',  sub: 'Időzített, konfigurálható vizsga', icon: GraduationCap, color: 'var(--purple)' },
] as const

export default function SubjectPage({ params }: Readonly<Props>) {
  const subject = getSubject(params.slug)
  if (!subject) notFound()

  const sections = getSubjectSectionInfos(params.slug)
  const lessons = getNotesLessons(params.slug)

  const circ = 2 * Math.PI * 48
  // pct starts at 0 – real progress tracked client-side via localStorage
  const pct = 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 90 }}>
      <Header crumbs={[{ label: 'Tantárgyak', href: '/' }, { label: subject.name }]} />

      <main style={{ maxWidth: 980, margin: '0 auto', padding: '32px 28px 20px' }}>

        {/* Hero */}
        <div
          className="animate-fade-up"
          style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, marginBottom: 24 }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: subject.color }} />
              <span className="section-label">TANTÁRGY</span>
            </div>
            <h1 style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 36, fontWeight: 700, letterSpacing: '-.8px', lineHeight: 1.1, marginBottom: 8,
              color: 'var(--text)',
            }}>
              {subject.name}
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-sub)', maxWidth: 580, lineHeight: 1.55 }}>
              {subject.description}. {sections.length} szekcióra bontva interaktív leckékkel, kvízekkel és flashkártyákkal.
            </p>
            <div style={{ display: 'flex', gap: 20, marginTop: 16, color: 'var(--text-sub)', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={13} /> {subject.lessonCount} lecke
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={13} /> {subject.questionCount} kérdés
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} /> ~{Math.ceil(subject.lessonCount * 12 / 60)} óra
              </span>
              {subject.flashcardCount != null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={13} /> {subject.flashcardCount} kártya
                </span>
              )}
            </div>
          </div>

          {/* Circular progress + CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={55} cy={55} r={48} fill="none" stroke="var(--surface2)" strokeWidth={7} />
                <circle
                  cx={55} cy={55} r={48} fill="none"
                  stroke={subject.color} strokeWidth={7}
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px' }}>{pct}%</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px' }}>
                  haladás
                </span>
              </div>
            </div>
            <Link
              href={`/subject/${subject.slug}/study`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 8,
                background: subject.color, color: '#fff', border: `1px solid ${subject.color}`,
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <ArrowRight size={14} /> Lecke folytatása
            </Link>
          </div>
        </div>

        {/* Mode grid */}
        <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>Módok</span>
        <div
          className="animate-fade-up"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}
        >
          {MODES.map(({ key, label, sub, icon: Icon, color }) => (
            <Link
              key={key}
              href={`/subject/${subject.slug}/${key}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="mode-card"
                style={{
                  padding: '18px 18px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${color}1a`, color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Curriculum / sections */}
        {sections.length > 0 && (
          <>
            <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>
              Tananyag · {sections.length} szekció
            </span>
            <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sections.map((sec, i) => {
                const secColor = [
                  subject.color, 'var(--blue)', 'var(--green)', 'var(--gold)', 'var(--purple)',
                ][i % 5]
                return (
                  <div
                    key={sec.name}
                    className="card"
                    style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: secColor, border: '3px solid var(--surface)',
                      boxShadow: `0 0 0 2px ${secColor}`, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: secColor, letterSpacing: '1.5px' }}>
                            S{i + 1}
                          </span>
                          <p style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: 'var(--text)' }}>{sec.name}</p>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sec.total} kérdés</span>
                      </div>
                      <div className="progress-bar" style={{ marginTop: 10 }}>
                        <div className="progress-fill" style={{ width: '0%', background: secColor }} />
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Lessons list */}
        {lessons.length > 0 && (
          <>
            <span className="section-label" style={{ display: 'block', marginTop: 28, marginBottom: 12 }}>
              Leckék · {lessons.length}
            </span>
            <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lessons.map((lesson) => (
                <Link
                  key={lesson.slug}
                  href={`/subject/${subject.slug}/study?lesson=${lesson.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="card"
                    style={{
                      padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--surface2)', border: '1.5px solid var(--border2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      fontSize: 11, fontWeight: 800, color: 'var(--text-muted)',
                    }}>
                      {lesson.lesson}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{lesson.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lesson.section}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
      <TabBar />
    </div>
  )
}

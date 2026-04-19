'use client'
import { useState, useEffect } from 'react'
import {
  BookOpen, Play, PenLine, RotateCcw,
  Layers, AlignLeft, ArrowRight,
  Clock, ChevronDown, ChevronUp,
  CheckCircle2, Circle, Target,
  GraduationCap,
} from 'lucide-react'
import { useTheme, navigate } from '../store'
import { C } from '../theme'

const SECTION_COLORS = [C.accent, C.blue, C.green, C.gold, C.purple]

function StatusIcon({ status, color, size = 18 }) {
  if (status === 'complete') return <CheckCircle2 size={size} style={{ color: C.green }} />
  if (status === 'active') return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
    </div>
  )
  return <Circle size={size} style={{ color: '#9B9590' }} />
}

function LessonRow({ lesson, i, total, t, subjectId }) {
  return (
    <div
      key={lesson.id ?? i}
      onClick={() => navigate('/study', { id: subjectId, lesson: lesson.slug ?? lesson.id })}
      style={{
        padding: '11px 18px 11px 68px', borderBottom: i < total - 1 ? `1px solid ${t.border}` : 'none',
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        background: lesson.active ? `${C.accent}10` : 'transparent',
        borderLeft: lesson.active ? `3px solid ${C.accent}` : '3px solid transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!lesson.active) e.currentTarget.style.background = t.surface2 }}
      onMouseLeave={e => { e.currentTarget.style.background = lesson.active ? `${C.accent}10` : 'transparent' }}
    >
      {lesson.done
        ? <CheckCircle2 size={15} style={{ color: C.green, flexShrink: 0 }} />
        : <Circle size={15} style={{ color: lesson.active ? C.accent : t.border2, flexShrink: 0 }} />
      }
      <span style={{ flex: 1, fontSize: 13, fontWeight: lesson.active ? 700 : 500, color: lesson.active ? C.accent : lesson.done ? t.textMuted : t.text }}>
        {lesson.title}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock size={10} />{lesson.time ?? ''}
        </span>
        {lesson.active && (
          <span style={{ fontSize: 10, fontWeight: 800, color: C.accent, background: `${C.accent}18`, border: `1px solid ${C.accent}35`, borderRadius: 20, padding: '2px 8px' }}>
            START
          </span>
        )}
      </div>
    </div>
  )
}

function SectionActions({ sec, t, subjectId }) {
  return (
    <div style={{ padding: '12px 18px', background: t.surface2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        onClick={() => navigate('/quiz', { id: subjectId, name: sec.name, section: sec.name })}
        style={{ background: sec.color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <Play size={11} /> {sec.quizScore != null ? 'Retake quiz' : 'Section quiz'}
      </button>
      <button
        onClick={() => navigate('/flashcards', { id: subjectId, name: sec.name })}
        style={{ background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: t.textSub, fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <Layers size={11} /> Flashcards
      </button>
      {sec.quizScore != null && (
        <button
          onClick={() => navigate('/wrong-answers', { id: subjectId, name: sec.name })}
          style={{ background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: t.textSub, fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <RotateCcw size={11} /> Wrong answers
        </button>
      )}
    </div>
  )
}

function SectionHeader({ sec, t, open, onToggle }) {
  const doneLessons = (sec.lessons ?? []).filter(l => l.done).length
  const lessonPct = sec.lessons?.length > 0 ? Math.round((doneLessons / sec.lessons.length) * 100) : 0
  const qPct = sec.q > 0 ? Math.round((sec.done / sec.q) * 100) : 0
  const upcoming = sec.status === 'upcoming'
  const status = sec.status ?? (qPct === 100 ? 'complete' : qPct > 0 ? 'active' : 'upcoming')
  const metaText = sec.lessons?.length > 0 ? `${sec.lessons.length} lessons · ${sec.q}q` : `${sec.q}q`
  const progressLabel = upcoming
    ? 'Not started'
    : sec.lessons?.length > 0
      ? `${doneLessons}/${sec.lessons.length} · ${sec.done ?? 0}/${sec.q}q`
      : `${sec.done ?? 0}/${sec.q}q`

  return (
    <div
      onClick={onToggle}
      style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
      onMouseEnter={e => e.currentTarget.style.background = t.surface2}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: upcoming ? t.surface2 : `${sec.color}18`, border: `1px solid ${upcoming ? t.border : sec.color + '35'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: upcoming ? t.textMuted : sec.color }}>{sec.id}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: upcoming ? t.textSub : t.text }}>{sec.name}</p>
            <StatusIcon status={status} color={sec.color} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {sec.quizScore != null && (
              <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: `${C.green}14`, border: `1px solid ${C.green}30`, borderRadius: 20, padding: '2px 8px' }}>
                Quiz {sec.quizScore}%
              </span>
            )}
            <span style={{ fontSize: 11, color: t.textMuted }}>{metaText}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {sec.lessons?.length > 0 && (
            <div style={{ flex: 1, height: 3, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${lessonPct}%`, height: '100%', background: sec.color, borderRadius: 99, opacity: 0.6, transition: 'width 0.5s' }} />
            </div>
          )}
          <div style={{ flex: 1, height: 3, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${qPct}%`, height: '100%', background: sec.color, borderRadius: 99, transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: 10, color: t.textMuted, marginLeft: 4, flexShrink: 0 }}>{progressLabel}</span>
        </div>
      </div>
      {open ? <ChevronUp size={14} style={{ color: t.textMuted, flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: t.textMuted, flexShrink: 0 }} />}
    </div>
  )
}

function SectionCard({ sec, t, open, onToggle, subjectId, isNext }) {
  const borderColor = open ? sec.color + '50' : isNext ? C.accent + '50' : t.border

  return (
    <div style={{ background: t.surface, border: `1px solid ${borderColor}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      {isNext && !open && (
        <div style={{ background: `${C.accent}20`, borderBottom: `1px solid ${C.accent}30`, padding: '6px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowRight size={11} style={{ color: C.accent }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>Continue here</span>
        </div>
      )}
      <SectionHeader sec={sec} t={t} open={open} onToggle={onToggle} />

      {open && (
        <div style={{ borderTop: `1px solid ${t.border}`, animation: 'fadeDown 0.2s ease both' }}>
          {(sec.lessons ?? []).map((lesson, i) => (
            <LessonRow key={lesson.id ?? i} lesson={lesson} i={i} total={(sec.lessons ?? []).length} t={t} subjectId={subjectId} />
          ))}

          <SectionActions sec={sec} t={t} subjectId={subjectId} />
        </div>
      )}
    </div>
  )
}

const MODES = [
  { icon: Play,          label: 'Quiz',          sub: 'Scored · auto-advance',     color: C.accent,  route: '/quiz' },
  { icon: BookOpen,      label: 'Study',         sub: 'Notes & explanations',      color: C.blue,   route: '/study' },
  { icon: Layers,        label: 'Flashcards',    sub: 'Tap to flip',               color: C.green,  route: '/flashcards' },
  { icon: PenLine,       label: 'Written Test',  sub: 'AI evaluates your answer',  color: C.purple, route: '/written' },
  { icon: RotateCcw,     label: 'Wrong Answers', sub: 'Practice mistakes',         color: C.gold,   route: '/wrong-answers' },
  { icon: AlignLeft,     label: 'Glossary',      sub: 'Terms & abbreviations',     color: C.blue,   route: '/glossary' },
  { icon: GraduationCap, label: 'Exam Sim',      sub: 'Timed, configurable exam',  color: C.purple, route: '/exam' },
]

function ModesGrid({ subjectId, subject, t }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 12 }}>STUDY MODES</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {MODES.map((m, i) => (
          <button
            key={i}
            onClick={() => navigate(m.route, { id: subjectId, name: subject.name })}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s', fontFamily: "'DM Sans',system-ui" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = m.color + '70'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${m.color}18` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <m.icon size={18} style={{ color: m.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 2 }}>{m.label}</p>
              <p style={{ fontSize: 12, color: t.textSub, lineHeight: 1.4 }}>{m.sub}</p>
            </div>
            <ArrowRight size={14} style={{ color: t.textMuted, flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Subject({ subjectId }) {
  const t = useTheme()
  const [subject, setSubject] = useState(null)
  const [openSec, setOpenSec] = useState({})

  useEffect(() => {
    if (!subjectId) return
    fetch('/api/subjects')
      .then(r => r.json())
      .then(data => {
        const found = data.find(s => s.id === subjectId)
        if (!found) return
        // Merge sections with notes lessons if available
        const s = { ...found }
        s.sections = (s.sections ?? []).map((sec, i) => ({
          ...sec,
          color: SECTION_COLORS[i % 5],
          status: sec.done === sec.q ? 'complete' : sec.done > 0 ? 'active' : 'upcoming',
          lessons: [],
        }))
        setSubject(s)
        // Open first non-complete section
        const activeIdx = s.sections.findIndex(sec => sec.status !== 'complete')
        if (activeIdx >= 0) setOpenSec({ ['s' + (activeIdx + 1)]: true })
      })
  }, [subjectId])

  // Also fetch lessons to populate section lesson lists
  useEffect(() => {
    if (!subjectId) return
    fetch(`/api/notes/${subjectId}`)
      .then(r => r.json())
      .then(lessons => {
        setSubject(prev => {
          if (!prev) return prev
          const updated = { ...prev }
          updated.sections = updated.sections.map(sec => ({
            ...sec,
            lessons: lessons.filter(l => l.section === sec.name).map(l => ({
              ...l, id: l.slug, title: l.title, time: `${l.lesson * 2 + 8} min`, done: false,
            })),
          }))
          return updated
        })
      })
      .catch(() => {})
  }, [subjectId])

  if (!subject) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: t.textMuted }}>Loading…</div>
  }



  const doneQ = subject.sections.reduce((a, s) => a + (s.done ?? 0), 0)
  const pct   = subject.questions > 0 ? Math.round((doneQ / subject.questions) * 100) : 0
  const circ  = 2 * Math.PI * 48
  const dash  = (pct / 100) * circ
  const activeSection = subject.sections.find(s => s.status === 'active')

  return (
    <>
    <style>{`@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* HERO */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: '24px', marginBottom: 20, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: subject.color }} />
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: t.textMuted }}>SUBJECT</p>
          </div>
          <h1 style={{ fontFamily: "'Lora',serif", fontSize: 36, fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1.1, marginBottom: 8, color: t.text }}>{subject.name}</h1>
          <p style={{ fontSize: 14, color: t.textSub, lineHeight: 1.6, marginBottom: 18 }}>{subject.desc}</p>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {[
              { Icon: BookOpen,   val: `${subject.lessons} lessons` },
              { Icon: Target,     val: `${subject.questions} questions` },
              { Icon: Clock,      val: `~${Math.ceil(subject.lessons * 12 / 60)}h total` },
            ].map(({ Icon, val }, i) => (
              <span key={i} style={{ fontSize: 12, color: t.textSub, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon size={12} style={{ color: t.textMuted }} />{val}
              </span>
            ))}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={55} cy={55} r={48} fill="none" stroke={t.surface2} strokeWidth={7} />
              <circle cx={55} cy={55} r={48} fill="none" stroke={subject.color} strokeWidth={7}
                strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
                style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-1px' }}>{pct}%</span>
              <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 600 }}>{doneQ}/{subject.questions}</span>
            </div>
          </div>
          {activeSection && (
            <button
              onClick={() => navigate('/study', { id: subjectId, name: subject.name })}
              style={{ background: subject.color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowRight size={14} /> Continue lesson
            </button>
          )}
        </div>
      </div>

      <ModesGrid subjectId={subjectId} subject={subject} t={t} />

      {/* LEARNING PATH */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted }}>LEARNING PATH</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ color: C.green, label: 'Lessons' }, { color: C.accent, label: 'Questions' }].map(it => (
              <span key={it.label} style={{ fontSize: 10, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 18, height: 3, borderRadius: 99, background: it.color, opacity: 0.7 }} />
                {it.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {subject.sections.map((sec, i) => (
            <SectionCard
              key={sec.id} sec={sec} t={t} subjectId={subjectId}
              open={!!openSec[sec.id]}
              onToggle={() => setOpenSec(p => ({ ...p, [sec.id]: !p[sec.id] }))}
              isNext={sec.status === 'active' && !openSec[sec.id]}
            />
          ))}
        </div>
      </div>

    </main>
    </>
  )
}

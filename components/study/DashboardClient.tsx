'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Flame, ChevronRight, ArrowRight, Play, Layers, Plus } from 'lucide-react'
import type { Subject } from '@/lib/content'
import type { SectionInfo } from '@/lib/content'

// ── Types ────────────────────────────────────────────────────────────────────
interface SubjectWithSections extends Subject {
  sections: SectionInfo[]
}

interface LocalProgress {
  done: number
  sessions: number
  avgScore: number
  streak: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function readProgress(slug: string): LocalProgress {
  if (typeof window === 'undefined') return { done: 0, sessions: 0, avgScore: 0, streak: 0 }
  try {
    const raw = localStorage.getItem(`progress:${slug}`)
    return raw ? JSON.parse(raw) : { done: 0, sessions: 0, avgScore: 0, streak: 0 }
  } catch { return { done: 0, sessions: 0, avgScore: 0, streak: 0 } }
}

function readStreak(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem('streak')
    if (!raw) return 0
    const { count, lastDate } = JSON.parse(raw)
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    return (lastDate === today || lastDate === yesterday) ? (count as number) : 0
  } catch { return 0 }
}

function readActivity(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('activityLog')
    const log: Record<string, number> = raw ? JSON.parse(raw) : {}
    // last 15 weeks × 7 days = 105 days, flat array newest last
    return Array.from({ length: 105 }, (_, i) => {
      const d = new Date(Date.now() - (104 - i) * 86400000)
      const key = d.toISOString().split('T')[0]
      return log[key] ?? 0
    })
  } catch { return Array(105).fill(0) }
}

// ── Activity Heatmap ─────────────────────────────────────────────────────────
function Heatmap() {
  const [data, setData] = useState<number[]>([])
  useEffect(() => setData(readActivity()), [])

  const W = 15
  const DAYS = ['M', '', 'W', '', 'F', '', '']
  const lightBg = ['#EDE9E3', '#F5C4B3', '#F0A088', '#E07355', '#C85E40']
  const darkBg  = ['#252525', '#4A1F10', '#7A3020', '#B04428', '#E07355']

  const weeks = useMemo(() => {
    const filled = data.length === 105 ? data : Array(105).fill(0)
    return Array.from({ length: W }, (_, wi) =>
      Array.from({ length: 7 }, (__, di) => filled[wi * 7 + di])
    )
  }, [data])

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '18px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="section-label">Aktivitás — 15 hét</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Kevés</span>
          {lightBg.map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c }} className="dark:[background:var(--dark-c)]" />
          ))}
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sok</span>
        </div>
      </div>
      <div style={{ padding: '0 22px 20px', display: 'flex', gap: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 18, marginRight: 3 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{ height: 11, fontSize: 8, color: 'var(--text-muted)', fontWeight: 600, lineHeight: '11px' }}>{d}</div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((v, di) => {
                  const idx = Math.min(4, Math.floor(v / 10))
                  return (
                    <div
                      key={di}
                      style={{ height: 11, borderRadius: 2, background: lightBg[idx] }}
                      title={v > 0 ? `${v} perc` : 'Nincs aktivitás'}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Week Bars ─────────────────────────────────────────────────────────────────
function WeekBars() {
  const DAYS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']
  const [mins, setMins] = useState<number[]>(Array(7).fill(0))

  useEffect(() => {
    try {
      const raw = localStorage.getItem('activityLog')
      const log: Record<string, number> = raw ? JSON.parse(raw) : {}
      const today = new Date()
      const dayOfWeek = (today.getDay() + 6) % 7 // Mon=0
      setMins(Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - dayOfWeek + i)
        return log[d.toISOString().split('T')[0]] ?? 0
      }))
    } catch { /* ignore */ }
  }, [])

  const max = Math.max(...mins, 1)
  const total = mins.reduce((a, b) => a + b, 0)
  const todayIdx = (new Date().getDay() + 6) % 7

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '18px 22px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="section-label">Ez a hét</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{total} perc</span>
      </div>
      <div style={{ padding: '0 22px 20px', display: 'flex', gap: 6, alignItems: 'flex-end', height: 68 }}>
        {mins.map((m, i) => {
          const h = m > 0 ? Math.max(6, (m / max) * 55) : 4
          const isToday = i === todayIdx
          return (
            <div key={DAYS[i]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%', height: h, borderRadius: 4, transition: 'height .5s',
                background: m === 0 ? 'var(--border)' : isToday ? 'var(--accent)' : 'rgba(224,115,85,0.45)',
              }} />
              <span style={{ fontSize: 9, fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--accent)' : 'var(--text-muted)' }}>
                {DAYS[i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Subject Row ───────────────────────────────────────────────────────────────
function SubjectRow({ subject, sections }: { subject: Subject; sections: SectionInfo[] }) {
  const [open, setOpen] = useState(false)
  const [prog, setProg] = useState<LocalProgress>({ done: 0, sessions: 0, avgScore: 0, streak: 0 })

  useEffect(() => setProg(readProgress(subject.slug)), [subject.slug])

  const pct = subject.questionCount > 0 ? Math.round((prog.done / subject.questionCount) * 100) : 0
  const borderColor = open ? `${subject.color}45` : 'var(--border)'

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'border-color .2s',
      }}
    >
      {/* Header row */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: subject.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{subject.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subject.description}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {prog.streak > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Flame size={11} />{prog.streak}n
                </span>
              )}
              <span style={{ fontSize: 15, fontWeight: 800, color: subject.color }}>{pct}%</span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%`, background: subject.color }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {prog.done} / {subject.questionCount} kérdés · {subject.lessonCount} lecke
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Átlag <b style={{ color: 'var(--text-sub)' }}>{prog.avgScore > 0 ? `${prog.avgScore}%` : '—'}</b>
            </span>
          </div>
        </div>
        <ChevronRight
          size={15}
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform .2s',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Accordion: sections */}
      {open && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '16px 22px 18px',
            animation: 'fadeUp .18s ease both',
          }}
        >
          <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>Szekciók</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sections.map((sec) => (
              <div key={sec.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-sub)', minWidth: 130 }}>{sec.name}</span>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: '0%', background: subject.color }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>
                  {sec.total}k
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Link
              href={`/subject/${subject.slug}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 8,
                background: subject.color, color: '#fff', border: `1px solid ${subject.color}`,
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <ArrowRight size={14} /> Megnyitás
            </Link>
            <Link
              href={`/subject/${subject.slug}/quiz`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 8,
                background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <Play size={14} /> Gyors kvíz
            </Link>
            <Link
              href={`/subject/${subject.slug}/flashcards`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 8,
                background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <Layers size={14} /> Kártyák
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function DashboardClient({ subjects }: Readonly<{ subjects: SubjectWithSections[] }>) {
  const router = useRouter()
  const [streak, setStreak] = useState(0)
  const [totalDone, setTotalDone] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('onboardingDone')) {
      router.push('/onboarding')
      return
    }
    setStreak(readStreak())
    const done = subjects.reduce((sum, s) => sum + readProgress(s.slug).done, 0)
    setTotalDone(done)
  }, [subjects, router])

  const totalQ = subjects.reduce((s, x) => s + x.questionCount, 0)
  const pctTotal = totalQ > 0 ? Math.round((totalDone / totalQ) * 100) : 0
  const circ = 2 * Math.PI * 34
  const dash = (pctTotal / 100) * circ

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 90 }}>
      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 28px 20px' }}>

        {/* Hero */}
        <div
          className="animate-fade-up"
          style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 28, alignItems: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18,
            padding: '26px 28px', marginBottom: 20,
          }}
        >
          {/* Circular progress */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={40} cy={40} r={34} fill="none" stroke="var(--surface2)" strokeWidth={6} />
              <circle
                cx={40} cy={40} r={34} fill="none" stroke="var(--accent)" strokeWidth={6}
                strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{pctTotal}%</span>
            </div>
          </div>

          {/* Text */}
          <div>
            <h1 style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 26, fontWeight: 700, letterSpacing: '-.5px', marginBottom: 6,
            }}>
              {streak > 0 ? `${streak} napos streak 🔥` : 'Kezdd el a sorozatot!'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>
              {totalDone} / {totalQ} kérdés megválaszolva · {subjects.length} tantárgy. Folytasd, ahol abbahagytad!
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {subjects[0] && (
                <Link
                  href={`/subject/${subjects[0].slug}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '9px 16px', borderRadius: 8,
                    background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)',
                    fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  <ArrowRight size={14} /> Tanulás folytatása
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 28 }}>
            {[
              { label: 'Tantárgyak', value: subjects.length, color: 'var(--blue)' },
              { label: 'Kérdések', value: totalQ, color: 'var(--green)' },
              { label: 'Streak', value: `${streak}n`, color: 'var(--accent)' },
            ].map((x) => (
              <div key={x.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: x.color, letterSpacing: '-.5px', lineHeight: 1 }}>{x.value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600, letterSpacing: '.4px', textTransform: 'uppercase' }}>{x.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity row */}
        <div
          className="animate-fade-up"
          style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14, marginBottom: 22 }}
        >
          <WeekBars />
          <Heatmap />
        </div>

        {/* Subjects list */}
        <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>Tantárgyak</span>
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {subjects.map((s) => (
            <SubjectRow key={s.slug} subject={s} sections={s.sections} />
          ))}

          {/* Add subject */}
          <div
            style={{
              border: '2px dashed var(--border2)', borderRadius: 14, padding: '22px',
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
              color: 'var(--text-muted)', background: 'transparent',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={16} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)' }}>Új tantárgy hozzáadása</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Töltsd fel a jegyzeteidet — mi leckékre, kártyákra és kvízekre bontjuk.
              </p>
            </div>
            <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Empty state */}
        {subjects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>Még nincs tantárgy.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Futtasd a pipeline-t PDF/PPT anyagokból a tartalom generálásához.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

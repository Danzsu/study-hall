'use client'
import { useState, useEffect } from 'react'
import {
  Flame, TrendingUp,
  ChevronRight, Award, Zap,
  BarChart2, CheckCircle2, Play,
  Timer, Plus, ArrowRight, Layers,
} from 'lucide-react'
import { useTheme, navigate } from '../store'
import { C } from '../theme'

// ── HEATMAP ───────────────────────────────────────────────────────────────────
const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']

function buildHeatmap() {
  const W = 15
  return Array.from({ length: W }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const age = (W - w) * 7 - d
      const p = age < 7 ? 0.82 : age < 21 ? 0.55 : 0.3
      return Math.random() < p ? Math.ceil(Math.random() * 4) : 0
    })
  )
}
const HMAP = buildHeatmap()

function Heatmap({ t }) {
  const bg = t.dark
    ? ['#252525', '#4A1F10', '#7A3020', '#B04428', '#E07355']
    : ['#EDE9E3', '#F5C4B3', '#F0A088', '#E07355', '#C85E40']
  const DAYS = ['M', '', 'W', '', 'F', '', '']
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '18px 20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted }}>ACTIVITY — 15 WEEKS</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: t.textMuted }}>Less</span>
          {bg.map((c, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />)}
          <span style={{ fontSize: 10, color: t.textMuted }}>More</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 18, marginRight: 3 }}>
          {DAYS.map((d, i) => <div key={i} style={{ height: 11, fontSize: 8, color: t.textMuted, fontWeight: 600, lineHeight: '11px' }}>{d}</div>)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', marginBottom: 4 }}>
            {MONTHS.map((m, i) => <div key={i} style={{ flex: 1, fontSize: 8, fontWeight: 600, color: t.textMuted }}>{m}</div>)}
            <div style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {HMAP.map((week, wi) => (
              <div key={wi} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((v, di) => (
                  <div key={di} style={{ height: 11, borderRadius: 2, background: bg[v], cursor: v > 0 ? 'pointer' : 'default' }}
                    title={v > 0 ? `${v * 10} min` : 'No activity'} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WeekBars({ t, week }) {
  const max = Math.max(...week.map(d => d.mins), 1)
  const total = week.reduce((a, d) => a + d.mins, 0)
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '18px 20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted }}>THIS WEEK</p>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{total} min</span>
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 60 }}>
        {week.map((d, i) => {
          const h = d.mins > 0 ? Math.max(5, (d.mins / max) * 52) : 3
          const today = i === new Date().getDay() - 1
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: '100%', height: h, borderRadius: 4, background: d.mins === 0 ? t.border : today ? C.accent : `${C.accent}50`, transition: 'height 0.4s cubic-bezier(0.22,1,0.36,1)' }} />
              <span style={{ fontSize: 9, fontWeight: today ? 700 : 500, color: today ? C.accent : t.textMuted }}>{d.day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SubjectRow({ s, t, open, onToggle }) {
  const pct = s.questions > 0 ? Math.round((s.done / s.questions) * 100) : 0
  return (
    <div style={{ background: t.surface, border: `1px solid ${open ? s.color + '45' : t.border}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <div
        onClick={onToggle}
        style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
        onMouseEnter={e => e.currentTarget.style.background = t.surface2}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{s.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {s.streak > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Flame size={11} />{s.streak}d
                </span>
              )}
              <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{pct}%</span>
            </div>
          </div>
          <div style={{ height: 4, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 99, transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 11, color: t.textMuted }}>{s.done} / {s.questions} questions - {s.lessons} lessons</span>
            <span style={{ fontSize: 11, color: t.textMuted }}>Avg <b style={{ color: t.textSub }}>{s.avgScore ?? '—'}%</b></span>
          </div>
        </div>
        <ChevronRight size={14} style={{ color: t.textMuted, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${t.border}`, padding: '14px 18px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 11 }}>SECTIONS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(s.sections ?? []).map((sec, i) => {
              const sp = sec.q > 0 ? Math.round((sec.done / sec.q) * 100) : 0
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: t.textSub, minWidth: 112, flexShrink: 0 }}>{sec.name}</span>
                  <div style={{ flex: 1, height: 4, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${sp}%`, height: '100%', background: sp === 100 ? C.green : s.color, borderRadius: 99, opacity: sp === 0 ? 0.25 : 1, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sp === 100 ? C.green : sp > 0 ? s.color : t.textMuted, minWidth: 28, textAlign: 'right' }}>
                    {sp === 100 ? '✓' : sp > 0 ? `${sp}%` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={() => navigate('/subject', { id: s.id, name: s.name })}
              style={{ flex: 1, padding: '8px', background: s.color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <ArrowRight size={11} /> Open subject
            </button>
            <button
              onClick={() => navigate('/quiz', { id: s.id, name: s.name })}
              style={{ flex: 1, padding: '8px', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: t.textSub, fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <Play size={11} /> Quick quiz
            </button>
            <button
              onClick={() => navigate('/flashcards', { id: s.id, name: s.name })}
              style={{ flex: 1, padding: '8px', background: `${s.color}14`, border: `1px solid ${s.color}45`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: s.color, fontFamily: "'DM Sans',system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <Layers size={11} /> Flashcards
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const WEEK_TEMPLATE = [
  { day: 'Mon', mins: 0 }, { day: 'Tue', mins: 18 }, { day: 'Wed', mins: 32 },
  { day: 'Thu', mins: 25 }, { day: 'Fri', mins: 14 }, { day: 'Sat', mins: 40 },
  { day: 'Sun', mins: 0 },
]

const ACHIEVEMENTS = [
  { Icon: Flame,     label: '7-day streak',  desc: 'Study 7 days in a row',    done: false, progress: 5,  total: 7  },
  { Icon: TrendingUp, label: 'Perfect score', desc: 'Get 10/10 on a quiz',      done: false, progress: 8,  total: 10 },
  { Icon: Award,     label: '50 questions',  desc: 'Answer 50 questions',      done: true,  progress: 50, total: 50 },
  { Icon: BarChart2, label: 'All subjects',  desc: 'Study 3+ subjects',        done: true,  progress: 3,  total: 3  },
  { Icon: Zap,       label: 'Speed runner',  desc: 'Complete quiz in < 5 min', done: false, progress: 0,  total: 1  },
]

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const t = useTheme()
  const [subjects, setSubjects] = useState([])
  const [open, setOpen] = useState({})
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    try {
      setSessions(JSON.parse(localStorage.getItem('recentSessions') ?? '[]'))
    } catch {
      setSessions([])
    }

    fetch('/api/subjects')
      .then(r => r.json())
      .then(data => {
        // Merge with localStorage progress
        const result = data.map(s => {
          const progress = JSON.parse(localStorage.getItem(`progress:${s.id}`) ?? '{}')
          const done = progress.done ?? 0
          return { ...s, done, avgScore: progress.avgScore ?? null, streak: progress.streak ?? 0 }
        })
        setSubjects(result)
        if (result.length > 0) setOpen({ [result[0].id]: true })
      })
      .catch(() => {})
  }, [])

  const totalDone = subjects.reduce((a, s) => a + (s.done ?? 0), 0)
  const totalQ    = subjects.reduce((a, s) => a + s.questions, 0)
  const pctTotal  = totalQ > 0 ? Math.round((totalDone / totalQ) * 100) : 0
  const streak    = subjects.length > 0 ? Math.max(...subjects.map(s => s.streak ?? 0)) : 0
  const avgScore  = subjects.length > 0 ? Math.round(subjects.filter(s => s.avgScore).reduce((a, s) => a + s.avgScore, 0) / (subjects.filter(s => s.avgScore).length || 1)) : 0

  const circ = 2 * Math.PI * 30
  const dash = (pctTotal / 100) * circ

  return (
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* SUMMARY BANNER */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: '24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={36} cy={36} r={30} fill="none" stroke={t.surface2} strokeWidth={5} />
            <circle cx={36} cy={36} r={30} fill="none" stroke={C.accent} strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: t.text, letterSpacing: '-0.5px' }}>{pctTotal}%</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Lora',serif", fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>
            {streak > 0 ? `${streak}-day streak` : 'Start your streak today'}
          </h1>
          <p style={{ fontSize: 13, color: t.textSub }}>
            {totalDone} of {totalQ} questions answered across {subjects.length} subjects
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => subjects[0] && navigate('/study', { id: subjects[0].id, name: subjects[0].name })}
              disabled={!subjects.length}
              style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: subjects.length ? 'pointer' : 'not-allowed', opacity: subjects.length ? 1 : 0.55, fontFamily: "'DM Sans',system-ui", display: 'inline-flex', alignItems: 'center', gap: 7 }}
            >
              <Play size={13} /> Continue learning
            </button>
            <button
              onClick={() => navigate('/pomodoro')}
              style={{ background: t.surface2, color: t.textSub, border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", display: 'inline-flex', alignItems: 'center', gap: 7 }}
            >
              <Timer size={13} /> Start pomodoro
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
          {[
            { label: 'Avg score', value: avgScore > 0 ? `${avgScore}%` : '—', color: C.blue },
            { label: 'Sessions',  value: sessions.length, color: C.green },
            { label: 'Streak',    value: `${streak}d`,    color: C.accent },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVITY ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14, marginBottom: 20 }}>
        <WeekBars t={t} week={WEEK_TEMPLATE} />
        <Heatmap t={t} />
      </div>

      {/* SUBJECTS */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 12 }}>SUBJECTS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {subjects.map(s => (
            <SubjectRow
              key={s.id} s={s} t={t}
              open={!!open[s.id]}
              onToggle={() => setOpen(p => ({ ...p, [s.id]: !p[s.id] }))}
            />
          ))}
          <div
            onClick={() => navigate('/onboarding')}
            style={{ border: `2px dashed ${t.border2}`, borderRadius: 14, padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', color: t.textMuted, background: t.surface }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: t.textSub }}>Add a new subject</p>
              <p style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                Upload notes or paste a syllabus and turn it into lessons, flashcards and quizzes.
              </p>
            </div>
            <ArrowRight size={14} style={{ color: t.textMuted, flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Recent sessions */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${t.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted }}>RECENT SESSIONS</p>
          </div>
          {sessions.length === 0 ? (
            <p style={{ padding: '18px', fontSize: 12, color: t.textMuted, textAlign: 'center' }}>No sessions yet — start studying!</p>
          ) : sessions.slice(0, 5).map((s, i) => {
            const pct = Math.round((s.score / s.total) * 100)
            const scoreColor = pct >= 80 ? C.green : pct >= 60 ? C.gold : C.accent
            return (
              <div key={i} style={{ padding: '11px 18px', borderBottom: i < sessions.length - 1 ? `1px solid ${t.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color ?? C.accent, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{s.type}</p>
                  <p style={{ fontSize: 11, color: t.textMuted }}>{s.subject}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: scoreColor }}>{s.score}/{s.total}</p>
                  <p style={{ fontSize: 10, color: t.textMuted }}>{s.time}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Achievements */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${t.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted }}>ACHIEVEMENTS</p>
          </div>
          <div style={{ padding: '12px 18px 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
            {ACHIEVEMENTS.map((a, i) => {
              const pct = Math.min(100, Math.round((a.progress / a.total) * 100))
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, opacity: a.done ? 1 : 0.75 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: a.done ? C.goldBg : t.surface2, border: `1px solid ${a.done ? C.gold + '40' : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <a.Icon size={13} style={{ color: a.done ? C.gold : t.textMuted }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: a.done ? t.text : t.textSub }}>{a.label}</p>
                      {a.done
                        ? <CheckCircle2 size={13} style={{ color: C.green }} />
                        : <span style={{ fontSize: 10, color: t.textMuted }}>{a.progress}/{a.total}</span>
                      }
                    </div>
                    <div style={{ height: 3, background: t.border, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: a.done ? C.green : C.gold, borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}

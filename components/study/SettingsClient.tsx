'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, Flame, Download, Trash2, Check,
  Volume2, Clock, BookOpen, Moon, Sun,
} from 'lucide-react'
import type { Subject } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/layout/TabBar'

interface SubjectState {
  id: string
  name: string
  color: string
  active: boolean
  level: string
}

interface OnboardingData {
  subjects: string[]
  level: string
  semester: string
  pomodoroPreset: string
}

const SEMESTERS = [
  '1st semester', '2nd semester', '3rd semester', '4th semester',
  '5th semester', '6th semester', '7th semester', '8th semester',
  'Postgraduate', 'Exam prep',
]

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     'var(--green)',
  Intermediate: 'var(--blue)',
  Advanced:     'var(--accent)',
  Expert:       'var(--purple)',
}

function Toggle({ checked, onChange, color = 'var(--accent)' }: Readonly<{ checked: boolean; onChange: (v: boolean) => void; color?: string }>) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
      style={{
        width: 40, height: 22, borderRadius: 99,
        background: checked ? color : '#C4BDB5',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
  )
}

function SectionLabel({ label }: Readonly<{ label: string }>) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 800, letterSpacing: '0.8px',
      color: 'var(--text-muted)', marginBottom: 8, marginTop: 20,
      paddingLeft: 4, textTransform: 'uppercase',
    }}>
      {label}
    </p>
  )
}

function Row({ icon: Icon, iconBg, iconColor, label, sub, right, onClick, danger = false }: Readonly<{
  icon: React.ElementType; iconBg: string; iconColor: string
  label: string; sub?: string; right?: React.ReactNode
  onClick?: () => void; danger?: boolean
}>) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', cursor: onClick ? 'pointer' : 'default', transition: 'background 0.12s' }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} style={{ color: danger ? 'var(--red)' : iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: danger ? 'var(--red)' : 'var(--text)', lineHeight: 1.2 }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</p>}
      </div>
      {right !== undefined
        ? <div style={{ flexShrink: 0 }}>{right}</div>
        : onClick && <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', marginLeft: 61 }} />
}

function SemesterRow({ value, onChange }: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', cursor: 'pointer', transition: 'background 0.12s' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={15} style={{ color: 'var(--blue)' }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>Semester</p>
        <span style={{ fontSize: 13, color: 'var(--text-sub)', marginRight: 6 }}>{value}</span>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', maxHeight: 220, overflowY: 'auto' }}>
          {SEMESTERS.map((s) => (
            <div
              key={s}
              onClick={() => { onChange(s); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px 10px 61px', cursor: 'pointer',
                background: s === value ? 'var(--accent-bg)' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (s !== value) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)' }}
              onMouseLeave={(e) => { if (s !== value) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <span style={{ fontSize: 13, color: s === value ? 'var(--accent)' : 'var(--text-sub)', fontWeight: s === value ? 700 : 400 }}>{s}</span>
              {s === value && <Check size={13} style={{ color: 'var(--accent)' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SubjectsPanel({ subjects, onChange }: Readonly<{ subjects: SubjectState[]; onChange: (s: SubjectState[]) => void }>) {
  const [openLevel, setOpenLevel] = useState<string | null>(null)

  const toggleActive = (id: string) => {
    const active = subjects.filter((s) => s.active)
    if (active.length === 1 && subjects.find((s) => s.id === id)?.active) return
    onChange(subjects.map((s) => s.id === id ? { ...s, active: !s.active } : s))
  }

  const setLevel = (id: string, level: string) => {
    onChange(subjects.map((s) => s.id === id ? { ...s, level } : s))
    setOpenLevel(null)
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      {subjects.map((s, i) => {
        const lvlColor = LEVEL_COLORS[s.level] ?? 'var(--blue)'
        const isLevelOpen = openLevel === s.id
        return (
          <div key={s.id} style={{ borderBottom: i < subjects.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.active ? s.color : 'var(--border2)', flexShrink: 0, transition: 'background 0.2s' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: s.active ? 'var(--text)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                {s.name}
              </span>
              {s.active && (
                <button
                  onClick={() => setOpenLevel(isLevelOpen ? null : s.id)}
                  style={{
                    fontSize: 11, fontWeight: 700, color: lvlColor,
                    background: `${lvlColor === 'var(--green)' ? 'var(--green-bg)' : lvlColor === 'var(--blue)' ? 'var(--blue-bg)' : lvlColor === 'var(--accent)' ? 'var(--accent-bg)' : 'var(--purple-bg)'}`,
                    border: `1px solid ${lvlColor}35`,
                    borderRadius: 20, padding: '3px 9px',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 4,
                    transition: 'all 0.15s',
                  }}
                >
                  {s.level}
                  <ChevronRight size={10} style={{ transform: isLevelOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s' }} />
                </button>
              )}
              <Toggle checked={s.active} onChange={() => toggleActive(s.id)} color={s.color} />
            </div>
            {isLevelOpen && s.active && (
              <div style={{ padding: '0 16px 10px 28px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {LEVELS.map((lvl) => {
                  const lc = LEVEL_COLORS[lvl] ?? 'var(--blue)'
                  const sel = s.level === lvl
                  return (
                    <button
                      key={lvl}
                      onClick={() => setLevel(s.id, lvl)}
                      style={{
                        fontSize: 11, fontWeight: 700,
                        color: sel ? '#fff' : 'var(--text-sub)',
                        background: sel ? lc : 'var(--surface2)',
                        border: `1px solid ${sel ? lc : 'var(--border)'}`,
                        borderRadius: 20, padding: '4px 12px',
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {sel && <Check size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />}
                      {lvl}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {subjects.filter((s) => s.active).length} active subject{subjects.filter((s) => s.active).length !== 1 ? 's' : ''}
          <span style={{ marginLeft: 8, opacity: 0.6 }}>· toggle to add or remove</span>
        </p>
      </div>
    </div>
  )
}

export function SettingsClient({ subjects: allSubjects }: Readonly<{ subjects: Subject[] }>) {
  const router = useRouter()
  const [semester, setSemester] = useState('5th semester')
  const [subjects, setSubjects] = useState<SubjectState[]>([])
  const [subjectsOpen, setSubjectsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [pomodoro, setPomodoro] = useState(true)
  const [sound, setSound] = useState(true)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const raw = localStorage.getItem('onboardingDone')
    const data: OnboardingData | null = raw ? JSON.parse(raw) : null
    if (data) {
      setSemester(data.semester ?? '5th semester')
      setSubjects(allSubjects.map((s) => ({
        id: s.slug,
        name: s.name,
        color: s.color,
        active: data.subjects?.includes(s.slug) ?? true,
        level: data.level ?? 'Beginner',
      })))
    } else {
      setSubjects(allSubjects.map((s) => ({ id: s.slug, name: s.name, color: s.color, active: true, level: 'Beginner' })))
    }
    setIsDark(document.documentElement.classList.contains('dark'))
    const streakData = JSON.parse(localStorage.getItem('streak') ?? '0')
    setStreak(typeof streakData === 'number' ? streakData : 0)
  }, [allSubjects])

  const save = (updates: Partial<{ semester: string; subjectIds: string[]; level: string }>) => {
    const raw = localStorage.getItem('onboardingDone')
    const existing = raw ? JSON.parse(raw) : {}
    localStorage.setItem('onboardingDone', JSON.stringify({ ...existing, ...updates }))
  }

  const handleSemesterChange = (v: string) => {
    setSemester(v)
    save({ semester: v })
  }

  const handleSubjectsChange = (updated: SubjectState[]) => {
    setSubjects(updated)
    save({ subjectIds: updated.filter((s) => s.active).map((s) => s.id) })
  }

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const exportData = () => {
    const data: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) data[key] = JSON.parse(localStorage.getItem(key) ?? 'null')
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'study-hall-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetAll = () => {
    if (!window.confirm('Reset all progress? This cannot be undone.')) return
    localStorage.clear()
    router.push('/onboarding')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 90 }}>
      <Header crumbs={[{ label: 'Tantárgyak', href: '/' }, { label: 'Beállítások' }]} />

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px' }} className="animate-fade-up">

        {/* ── PROFILE / STREAK ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flame size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{streak}-day streak</span>
            {streak > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 2 }}>· keep it up</span>}
          </div>
        </div>

        {/* ── STUDY ── */}
        <SectionLabel label="Study" />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
          <SemesterRow value={semester} onChange={handleSemesterChange} />
          <Divider />
          <div>
            <div
              onClick={() => setSubjectsOpen((o) => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={15} style={{ color: 'var(--green)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Subjects &amp; levels</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  {subjects.filter((s) => s.active).length} active · tap to manage
                </p>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', transform: subjectsOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {subjectsOpen && <SubjectsPanel subjects={subjects} onChange={handleSubjectsChange} />}
          </div>
        </div>

        {/* ── APPEARANCE ── */}
        <SectionLabel label="Appearance" />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
          <Row
            icon={isDark ? Sun : Moon}
            iconBg="rgba(196,154,60,0.11)"
            iconColor="var(--gold)"
            label="Dark mode"
            right={<Toggle checked={isDark} onChange={toggleDark} color="var(--gold)" />}
            onClick={toggleDark}
          />
        </div>

        {/* ── TIMER & SOUND ── */}
        <SectionLabel label="Timer &amp; Sound" />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
          <Row
            icon={Clock}
            iconBg="var(--accent-bg)"
            iconColor="var(--accent)"
            label="Pomodoro timer"
            sub="Show timer widget in the top bar"
            right={<Toggle checked={pomodoro} onChange={setPomodoro} />}
            onClick={() => setPomodoro((p) => !p)}
          />
          <Divider />
          <Row
            icon={Volume2}
            iconBg="var(--purple-bg)"
            iconColor="var(--purple)"
            label="Sound effects"
            sub="Audio feedback on correct answers"
            right={<Toggle checked={sound} onChange={setSound} color="var(--purple)" />}
            onClick={() => setSound((s) => !s)}
          />
        </div>

        {/* ── ACCOUNT ── */}
        <SectionLabel label="Account" />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
          <Row
            icon={Download}
            iconBg="var(--green-bg)"
            iconColor="var(--green)"
            label="Export progress"
            sub="Download your data as JSON"
            onClick={exportData}
          />
          <Divider />
          <Row
            icon={Trash2}
            iconBg="var(--red-bg)"
            iconColor="var(--red)"
            label="Reset all progress"
            sub="Cannot be undone"
            danger
            onClick={resetAll}
          />
        </div>

      </main>
      <TabBar />
    </div>
  )
}

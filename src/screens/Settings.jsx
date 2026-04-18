'use client'
import { useState, useEffect } from 'react'
import { Moon, Sun, ChevronRight, Download, Trash2, Check, Volume2, Clock, BookOpen } from 'lucide-react'
import { useTheme, useStore, store, navigate } from '../store'
import { C } from '../theme'

const SEMESTERS = [
  '1st semester','2nd semester','3rd semester','4th semester',
  '5th semester','6th semester','7th semester','8th semester',
  'Postgraduate','Exam prep',
]

const LEVELS = ['Beginner','Intermediate','Advanced','Expert']
const LEVEL_COLORS = {
  Beginner: C.green, Intermediate: C.blue, Advanced: C.accent, Expert: C.purple,
}

function Toggle({ checked, onChange, color = C.accent }) {
  return (
    <div onClick={e => { e.stopPropagation(); onChange(!checked) }} style={{
      width: 40, height: 22, borderRadius: 99,
      background: checked ? color : '#C4BDB5',
      position: 'relative', cursor: 'pointer', flexShrink: 0,
      transition: 'background .2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left .2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }}/>
    </div>
  )
}

function Card({ children, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
      {children}
    </div>
  )
}

function Divider({ t }) {
  return <div style={{ height: 1, background: t.border, marginLeft: 61 }}/>
}

function SectionLabel({ label }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: '#9B9590', marginBottom: 8, marginTop: 16, paddingLeft: 4 }}>
      {label}
    </p>
  )
}

function Row({ icon: Icon, iconColor, label, sub, right, onClick, danger, t }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', cursor: onClick ? 'pointer' : 'default', transition: 'background .12s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = t.surface2 }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: danger ? C.redBg : `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} style={{ color: danger ? C.red : iconColor }}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: danger ? C.red : t.text, lineHeight: 1.2 }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>{sub}</p>}
      </div>
      {right !== undefined
        ? <div style={{ flexShrink: 0 }}>{right}</div>
        : onClick && <ChevronRight size={14} style={{ color: t.textMuted, flexShrink: 0 }}/>
      }
    </div>
  )
}

function SemesterRow({ value, onChange, t }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', cursor: 'pointer', transition: 'background .12s' }}
        onMouseEnter={e => e.currentTarget.style.background = t.surface2}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${C.blue}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={15} style={{ color: C.blue }}/>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.text, flex: 1 }}>Semester</p>
        <span style={{ fontSize: 13, color: t.textSub, marginRight: 6 }}>{value}</span>
        <ChevronRight size={14} style={{ color: t.textMuted, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}/>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${t.border}`, maxHeight: 220, overflowY: 'auto', animation: 'stFadeDown .18s ease both' }}>
          {SEMESTERS.map(s => (
            <div key={s} onClick={() => { onChange(s); setOpen(false) }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px 10px 61px', cursor: 'pointer',
              background: s === value ? `${C.accent}14` : 'transparent', transition: 'background .1s',
            }}
              onMouseEnter={e => { if (s !== value) e.currentTarget.style.background = t.surface2 }}
              onMouseLeave={e => { if (s !== value) e.currentTarget.style.background = 'transparent' }}>
              <span style={{ fontSize: 13, color: s === value ? C.accent : t.textSub, fontWeight: s === value ? 700 : 400 }}>{s}</span>
              {s === value && <Check size={13} style={{ color: C.accent }}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SubjectsPanel({ subjects, onChange, t }) {
  const [openLevel, setOpenLevel] = useState(null)

  const toggleActive = (id) => {
    const active = subjects.filter(s => s.active)
    if (active.length === 1 && subjects.find(s => s.id === id)?.active) return
    onChange(subjects.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const setLevel = (id, level) => {
    onChange(subjects.map(s => s.id === id ? { ...s, level } : s))
    setOpenLevel(null)
  }

  return (
    <div style={{ borderTop: `1px solid ${t.border}`, animation: 'stFadeDown .2s ease both' }}>
      {subjects.map((s, i) => {
        const lvlColor = LEVEL_COLORS[s.level] || C.blue
        const isLevelOpen = openLevel === s.id
        return (
          <div key={s.id} style={{ borderBottom: i < subjects.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.active ? C.accent : t.border2, flexShrink: 0, transition: 'background .2s' }}/>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: s.active ? t.text : t.textMuted, transition: 'color .2s' }}>{s.name}</span>
              {s.active && (
                <button onClick={() => setOpenLevel(isLevelOpen ? null : s.id)} style={{
                  fontSize: 11, fontWeight: 700, color: lvlColor, background: `${lvlColor}14`,
                  border: `1px solid ${lvlColor}35`, borderRadius: 20, padding: '3px 9px',
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {s.level}
                  <ChevronRight size={10} style={{ transform: isLevelOpen ? 'rotate(90deg)' : 'none', transition: 'transform .18s' }}/>
                </button>
              )}
              <Toggle checked={s.active} onChange={() => toggleActive(s.id)} color={C.accent}/>
            </div>
            {isLevelOpen && s.active && (
              <div style={{ padding: '0 16px 10px 28px', display: 'flex', gap: 6, flexWrap: 'wrap', animation: 'stFadeDown .15s ease both' }}>
                {LEVELS.map(lvl => {
                  const lc = LEVEL_COLORS[lvl]
                  const sel = s.level === lvl
                  return (
                    <button key={lvl} onClick={() => setLevel(s.id, lvl)} style={{
                      fontSize: 11, fontWeight: 700, color: sel ? '#fff' : t.textSub,
                      background: sel ? lc : t.surface2, border: `1px solid ${sel ? lc : t.border}`,
                      borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      {sel && <Check size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }}/>}
                      {lvl}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${t.border}` }}>
        <p style={{ fontSize: 11, color: t.textMuted }}>
          {subjects.filter(s => s.active).length} active subject{subjects.filter(s => s.active).length !== 1 ? 's' : ''}
          <span style={{ marginLeft: 8, opacity: 0.6 }}>· toggle to add or remove</span>
        </p>
      </div>
    </div>
  )
}

function loadStoredSettings() {
  try {
    const d = JSON.parse(localStorage.getItem('onboardingDone') || '{}')
    return { semester: d.semester || '5th semester', subjects: d.subjects || [] }
  } catch { return { semester: '5th semester', subjects: [] } }
}

function patchStored(patch) {
  try {
    const d = JSON.parse(localStorage.getItem('onboardingDone') || '{}')
    localStorage.setItem('onboardingDone', JSON.stringify({ ...d, ...patch }))
  } catch {}
}

export default function Settings() {
  const t = useTheme()
  const s = useStore()
  const [semester, setSemester]         = useState('5th semester')
  const [subjects, setSubjects]         = useState([])
  const [subjectsOpen, setSubjectsOpen] = useState(false)

  useEffect(() => {
    const stored = loadStoredSettings()
    setSemester(stored.semester)
    fetch('/api/subjects')
      .then(r => r.json())
      .then(data => {
        const storedSubs = stored.subjects || []
        setSubjects(data.map(sub => {
          const id = sub.slug || sub.id
          const found = storedSubs.find(ss => ss.id === id)
          return { id, name: sub.name, active: found?.active !== false, level: found?.level || 'Intermediate' }
        }))
      })
      .catch(() => {})
  }, [])

  const handleSemesterChange = (val) => {
    setSemester(val)
    patchStored({ semester: val })
  }

  const handleSubjectsChange = (newSubs) => {
    setSubjects(newSubs)
    patchStored({ subjects: newSubs.map(s => ({ id: s.id, active: s.active, level: s.level })) })
  }

  const handleExport = () => {
    const data = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      try { data[key] = JSON.parse(localStorage.getItem(key)) }
      catch { data[key] = localStorage.getItem(key) }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'study-hall-export.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    if (window.confirm('Reset all progress? This cannot be undone.')) {
      localStorage.clear()
      navigate('/onboarding')
    }
  }

  return (
    <>
      <style>{`
        @keyframes stFadeDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
        @keyframes stFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .st-fu{animation:stFadeUp .3s ease both}
      `}</style>
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px 80px' }} className="st-fu">

        <SectionLabel label="STUDY"/>
        <Card t={t}>
          <SemesterRow value={semester} onChange={handleSemesterChange} t={t}/>
          <Divider t={t}/>
          <div>
            <div onClick={() => setSubjectsOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', cursor: 'pointer', transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = t.surface2}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${C.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={15} style={{ color: C.green }}/>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Subjects & levels</p>
                <p style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>
                  {subjects.filter(s => s.active).length} active · tap to manage
                </p>
              </div>
              <ChevronRight size={14} style={{ color: t.textMuted, transform: subjectsOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}/>
            </div>
            {subjectsOpen && <SubjectsPanel subjects={subjects} onChange={handleSubjectsChange} t={t}/>}
          </div>
        </Card>

        <SectionLabel label="APPEARANCE"/>
        <Card t={t}>
          <Row
            icon={s.dark ? Sun : Moon} iconColor={C.gold}
            label="Dark mode"
            right={<Toggle checked={s.dark} onChange={() => store.set({ dark: !s.dark })} color={C.gold}/>}
            onClick={() => store.set({ dark: !s.dark })} t={t}
          />
        </Card>

        <SectionLabel label="TIMER & SOUND"/>
        <Card t={t}>
          <Row icon={Clock} iconColor={C.accent} label="Pomodoro timer" sub="Focus & break session timer" onClick={() => navigate('/pomodoro')} t={t}/>
          <Divider t={t}/>
          <Row icon={Volume2} iconColor={C.purple} label="Sound effects" sub="Audio feedback on correct answers"
            right={<Toggle checked={false} onChange={() => {}} color={C.purple}/>}
            onClick={() => {}} t={t}
          />
        </Card>

        <SectionLabel label="DATA"/>
        <Card t={t}>
          <Row icon={Download} iconColor={C.green} label="Export progress" sub="Download your data as JSON" onClick={handleExport} t={t}/>
          <Divider t={t}/>
          <Row icon={Trash2} iconColor={C.red} label="Reset all progress" danger onClick={handleReset} t={t}/>
        </Card>

      </main>
    </>
  )
}

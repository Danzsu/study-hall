'use client'
import { useState, useEffect } from 'react'
import {
  BookOpen, Brain, BarChart2, Code2,
  ChevronRight, ChevronLeft, Check,
  Flame, Zap, Sparkles,
} from 'lucide-react'
import { useTheme, navigate, store } from '../store'
import { C } from '../theme'

const LEVELS = [
  { id: 'beginner',     icon: BookOpen,  label: 'Beginner',     desc: 'New to the subject — start from fundamentals', color: C.green  },
  { id: 'intermediate', icon: Brain,     label: 'Intermediate', desc: 'Familiar with basics, want to go deeper',       color: C.blue   },
  { id: 'advanced',     icon: BarChart2, label: 'Advanced',     desc: 'Solid knowledge — exam prep & edge cases',      color: C.accent },
  { id: 'expert',       icon: Code2,     label: 'Expert',       desc: 'Working practitioner — fill specific gaps',     color: '#9B6DD9' },
]

const SEMESTERS = [
  { id: 1, label: '1st semester', desc: 'Just getting started', color: C.green  },
  { id: 2, label: '2nd semester', desc: 'Building foundations',  color: C.green  },
  { id: 3, label: '3rd semester', desc: 'Core concepts',         color: C.blue   },
  { id: 4, label: '4th semester', desc: 'Deepening knowledge',   color: C.blue   },
  { id: 5, label: '5th semester', desc: 'Advanced topics',       color: C.accent },
  { id: 6, label: '6th semester', desc: 'Specialisation',        color: C.accent },
  { id: 7, label: '7th semester', desc: 'Pre-graduation',        color: '#9B6DD9' },
  { id: 8, label: '8th semester', desc: 'Final year',            color: '#9B6DD9' },
  { id: 9, label: 'Postgraduate', desc: 'MSc / PhD level',       color: C.gold   },
  { id: 10, label: 'Exam prep',   desc: 'Certification focus',   color: C.gold, highlight: true },
]

const POMODORO_PRESETS = [
  { id: 'classic',  label: 'Classic',   focus: 25, brk: 5,  desc: '25 min focus · 5 min break',  recommended: true },
  { id: 'deepwork', label: 'Deep work', focus: 50, brk: 10, desc: '50 min focus · 10 min break'  },
  { id: 'sprint',   label: 'Sprint',    focus: 15, brk: 3,  desc: '15 min focus · 3 min break'   },
]

function StepDots({ total, current, t }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 40 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          height: 4, borderRadius: 99,
          width: i === current ? 24 : i < current ? 16 : 12,
          background: i <= current ? C.accent : t.border,
          opacity: i < current ? 0.5 : 1,
          transition: 'all 0.32s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      ))}
    </div>
  )
}

function StepWelcome({ t, onNext }) {
  return (
    <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: `${C.accent}16`, border: `1.5px solid ${C.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
        <BookOpen size={32} style={{ color: C.accent }} />
      </div>
      <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 34, fontWeight: 700, letterSpacing: '-0.6px', marginBottom: 14, lineHeight: 1.2, color: t.text }}>
        Welcome to<br /><span style={{ color: C.accent }}>Study Hall</span>
      </h1>
      <p style={{ fontSize: 16, color: t.textSub, lineHeight: 1.65, maxWidth: 380, margin: '0 auto 40px' }}>
        A focused space to study, quiz yourself, and actually remember what you learn.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto 44px', textAlign: 'left' }}>
        {[
          { icon: Brain,    color: C.blue,   text: 'Adaptive quizzes that track your weak spots' },
          { icon: Zap,      color: C.accent, text: 'Flashcards, written tests & glossary in one place' },
          { icon: Flame,    color: C.gold,   text: 'Daily streaks to keep your momentum going' },
          { icon: Sparkles, color: '#9B6DD9', text: 'AI-evaluated written answers for deeper retention' },
        ].map(({ icon: Icon, color, text }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={15} style={{ color }} />
            </div>
            <span style={{ fontSize: 13, color: t.textSub, lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>
      <button onClick={onNext} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '15px 40px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', system-ui", display: 'inline-flex', alignItems: 'center', gap: 9, transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = C.accentHov}
        onMouseLeave={e => e.currentTarget.style.background = C.accent}
      >
        Get started <ChevronRight size={16} />
      </button>
    </div>
  )
}

function StepSubjects({ subjects, selected, onToggle, t }) {
  return (
    <div style={{ animation: 'slideIn 0.36s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 8, color: t.text }}>What are you studying?</h2>
        <p style={{ fontSize: 14, color: t.textSub }}>Pick one or more subjects to get started.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
        {subjects.map(s => {
          const isSel = selected.includes(s.id)
          return (
            <button key={s.id} onClick={() => onToggle(s.id)} style={{
              background: isSel ? `${s.color}14` : t.surface,
              border: `1.5px solid ${isSel ? s.color + '60' : t.border}`,
              borderRadius: 14, padding: '16px 14px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 6, position: 'relative',
              transition: 'all 0.18s ease', transform: isSel ? 'scale(1.01)' : 'scale(1)',
            }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.borderColor = s.color + '50' }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.borderColor = t.border }}
            >
              {isSel && (
                <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={10} color="#fff" strokeWidth={3} />
                </div>
              )}
              <span style={{ fontSize: 22 }}>{s.emoji ?? '📚'}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: isSel ? s.color : t.text, marginBottom: 2 }}>{s.name}</p>
                <p style={{ fontSize: 11, color: t.textSub, lineHeight: 1.4 }}>{s.desc ?? ''}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: isSel ? s.color : t.textMuted }}>{s.questions ?? 0} questions</span>
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p style={{ fontSize: 12, color: t.textMuted, textAlign: 'center', marginTop: 8, animation: 'fadeUp 0.2s ease both' }}>
          {selected.length} subject{selected.length > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}

function StepLevel({ level, onSelect, t }) {
  return (
    <div style={{ animation: 'slideIn 0.36s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 8, color: t.text }}>What&apos;s your current level?</h2>
        <p style={{ fontSize: 14, color: t.textSub }}>We&apos;ll adjust question difficulty and pacing to match.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LEVELS.map(l => {
          const isSel = level === l.id
          const Icon = l.icon
          return (
            <button key={l.id} onClick={() => onSelect(l.id)} style={{
              background: isSel ? `${l.color}14` : t.surface,
              border: `1.5px solid ${isSel ? l.color + '60' : t.border}`,
              borderRadius: 14, padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.18s ease',
              transform: isSel ? 'translateX(4px)' : 'translateX(0)',
            }}
              onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = l.color + '45'; e.currentTarget.style.background = t.surface2 } }}
              onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface } }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: isSel ? l.color + '28' : t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={19} style={{ color: isSel ? l.color : t.textMuted }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: isSel ? l.color : t.text, marginBottom: 3 }}>{l.label}</p>
                <p style={{ fontSize: 13, color: t.textSub }}>{l.desc}</p>
              </div>
              {isSel && <div style={{ width: 22, height: 22, borderRadius: '50%', background: l.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={11} color="#fff" strokeWidth={3} /></div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepFinish({ semester, setSemester, pomodoroPreset, setPomodoroPreset, t }) {
  return (
    <div style={{ animation: 'slideIn 0.36s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 8, color: t.text }}>Almost there!</h2>
        <p style={{ fontSize: 14, color: t.textSub }}>Choose your semester and preferred study timer.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
        {SEMESTERS.map(s => {
          const isSel = semester === s.id
          return (
            <button key={s.id} onClick={() => setSemester(s.id)} style={{
              background: isSel ? `${s.color}14` : t.surface,
              border: `1.5px solid ${isSel ? s.color + '55' : t.border}`,
              borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s', position: 'relative',
            }}
              onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = s.color + '40'; e.currentTarget.style.background = t.surface2 } }}
              onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface } }}
            >
              {s.highlight && <span style={{ position: 'absolute', top: -1, right: -1, background: C.gold, color: '#fff', fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: '0 10px 0 7px' }}>POPULAR</span>}
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: isSel ? s.color + '28' : t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: isSel ? s.color : t.textMuted }}>{s.id <= 8 ? s.id : s.id === 9 ? 'PG' : '✦'}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: isSel ? s.color : t.text, marginBottom: 1 }}>{s.label}</p>
                <p style={{ fontSize: 11, color: t.textSub }}>{s.desc}</p>
              </div>
              {isSel && <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={9} color="#fff" strokeWidth={3} /></div>}
            </button>
          )
        })}
      </div>

      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 12 }}>POMODORO PRESET</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {POMODORO_PRESETS.map(p => {
          const isSel = pomodoroPreset === p.id
          return (
            <button key={p.id} onClick={() => setPomodoroPreset(p.id)} style={{
              background: isSel ? `${C.accent}10` : t.surface,
              border: `1.5px solid ${isSel ? C.accent + '55' : t.border}`,
              borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = C.accent + '40'; e.currentTarget.style.background = t.surface2 } }}
              onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface } }}
            >
              <span style={{ fontSize: 20 }}>🍅</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: isSel ? C.accent : t.text }}>{p.label}</p>
                  {p.recommended && <span style={{ fontSize: 9, fontWeight: 800, color: C.green, background: `${C.green}14`, border: `1px solid ${C.green}30`, borderRadius: 20, padding: '1px 6px' }}>POPULAR</span>}
                </div>
                <p style={{ fontSize: 12, color: t.textSub }}>{p.desc}</p>
              </div>
              {isSel && <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="#fff" strokeWidth={3} /></div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Onboarding() {
  const t = useTheme()
  const [step, setStep]                 = useState(0)
  const [apiSubjects, setApiSubjects]   = useState([])
  const [subjects, setSubjects]         = useState([])
  const [level, setLevel]               = useState(null)
  const [semester, setSemester]         = useState(null)
  const [pomodoroPreset, setPomodoroPreset] = useState('classic')

  useEffect(() => {
    fetch('/api/subjects')
      .then(r => r.json())
      .then(data => setApiSubjects(data.map(s => ({ id: s.id, name: s.name, desc: s.desc, questions: s.questions, color: s.color ?? C.accent }))))
      .catch(() => {})
  }, [])

  const toggleSubject = (id) => setSubjects(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const canNext = () => {
    if (step === 0) return true
    if (step === 1) return subjects.length > 0
    if (step === 2) return !!level
    if (step === 3) return !!semester
    return false
  }

  const handleFinish = () => {
    const preset = POMODORO_PRESETS.find(p => p.id === pomodoroPreset) ?? POMODORO_PRESETS[0]
    localStorage.setItem('onboardingDone', JSON.stringify({ subjects, level, semester, pomodoroPreset }))
    store.set({ pomodoro: { ...store.get().pomodoro, secondsLeft: preset.focus * 60 } })
    navigate('/home')
  }

  const TOTAL = 4

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
      `}</style>
      <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'DM Sans', system-ui", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <StepDots total={TOTAL} current={step} t={t} />

          {step === 0 && <StepWelcome t={t} onNext={() => setStep(1)} />}
          {step === 1 && <StepSubjects subjects={apiSubjects} selected={subjects} onToggle={toggleSubject} t={t} />}
          {step === 2 && <StepLevel level={level} onSelect={setLevel} t={t} />}
          {step === 3 && <StepFinish semester={semester} setSemester={setSemester} pomodoroPreset={pomodoroPreset} setPomodoroPreset={setPomodoroPreset} t={t} />}

          {step > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              <button
                onClick={() => setStep(s => s - 1)}
                style={{ padding: '13px 20px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: t.textSub, fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ChevronLeft size={15} /> Back
              </button>
              <button
                onClick={() => step < TOTAL - 1 ? setStep(s => s + 1) : handleFinish()}
                disabled={!canNext()}
                style={{
                  flex: 1, padding: '13px 20px', background: canNext() ? C.accent : t.border,
                  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  cursor: canNext() ? 'pointer' : 'not-allowed', color: canNext() ? '#fff' : t.textMuted,
                  fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (canNext()) e.currentTarget.style.background = C.accentHov }}
                onMouseLeave={e => { if (canNext()) e.currentTarget.style.background = C.accent }}
              >
                {step < TOTAL - 1 ? <>Continue <ChevronRight size={15} /></> : <>Get started <ChevronRight size={15} /></>}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

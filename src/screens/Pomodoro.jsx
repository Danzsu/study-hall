'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Settings, RotateCcw, Coffee, BookOpen, Plus, Minus } from 'lucide-react'
import { useTheme, store } from '../store'
import { C } from '../theme'
import { playSound } from '../sounds'

function pad(n) { return String(n).padStart(2, '0') }
function fmt(s) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}` }

function Ring({ pct, phase, size = 260, stroke = 7, children }) {
  const R = (size - stroke) / 2
  const circ = 2 * Math.PI * R
  const dash = pct * circ
  const color = phase === 'focus' ? C.accent : C.green
  const trackColor = phase === 'focus' ? `${C.accent}1f` : `${C.green}1f`
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={trackColor} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.4s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function RoundDots({ total, current, t }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} style={{
            width: active ? 10 : done ? 8 : 7,
            height: active ? 10 : done ? 8 : 7,
            borderRadius: '50%',
            background: (done || active) ? C.accent : t.border2,
            opacity: done ? 0.45 : active ? 1 : 0.3,
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            border: active ? `2px solid ${C.accent}` : 'none',
            boxSizing: 'border-box',
          }}/>
        )
      })}
    </div>
  )
}

function Stepper({ label, value, unit, min, max, onChange, t, accentColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: t.surface2, borderRadius: 16, padding: '18px 20px', border: `1px solid ${t.border}` }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', color: t.textMuted }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 32, height: 32, borderRadius: '50%', background: t.surface, border: `1px solid ${t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSub }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSub }}>
          <Minus size={13}/>
        </button>
        <div style={{ textAlign: 'center', minWidth: 48 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: accentColor, letterSpacing: '-1px', fontFamily: "'DM Sans', system-ui" }}>{value}</span>
          <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 4 }}>{unit}</span>
        </div>
        <button onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 32, height: 32, borderRadius: '50%', background: t.surface, border: `1px solid ${t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSub }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSub }}>
          <Plus size={13}/>
        </button>
      </div>
    </div>
  )
}

function PomodoroSettings({ focusMins: initFocus, breakMins: initBreak, totalRounds: initRounds, onSave, onBack, t }) {
  const [fm, setFm] = useState(initFocus)
  const [bm, setBm] = useState(initBreak)
  const [tr, setTr] = useState(initRounds)

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
        <Stepper label="FOCUS" value={fm} unit="min" min={5} max={90} onChange={setFm} t={t} accentColor={C.accent}/>
        <Stepper label="BREAK" value={bm} unit="min" min={1} max={30} onChange={setBm} t={t} accentColor={C.green}/>
        <Stepper label="ROUNDS" value={tr} unit="×" min={1} max={8} onChange={setTr} t={t} accentColor={C.blue}/>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', color: t.textMuted, marginBottom: 14 }}>SESSION PREVIEW</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: tr }, (_, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, minWidth: 20 }}>#{i+1}</span>
              <div style={{ flex: fm, height: 8, background: C.accent, borderRadius: 3, opacity: 0.85 }}/>
              {i < tr - 1 && <div style={{ flex: bm, height: 8, background: C.green, borderRadius: 3, opacity: 0.6 }}/>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          {[{ color: C.accent, label: `${fm}′ focus` }, { color: C.green, label: `${bm}′ break` }].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }}/>
              <span style={{ fontSize: 11, color: t.textSub }}>{label}</span>
            </div>
          ))}
          <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 'auto' }}>
            Total: {Math.round(fm * tr + bm * (tr - 1))} min
          </span>
        </div>
      </div>

      <button onClick={() => onSave(fm, bm, tr)} style={{ width: '100%', padding: '14px', background: C.accent, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", marginBottom: 12 }}
        onMouseEnter={e => e.currentTarget.style.background = C.accentHov}
        onMouseLeave={e => e.currentTarget.style.background = C.accent}>
        Save & start
      </button>
      <button onClick={onBack} style={{ width: '100%', padding: '12px', background: 'none', border: `1px solid ${t.border}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: t.textSub, fontFamily: "'DM Sans',system-ui" }}>
        Cancel
      </button>
    </div>
  )
}

function loadPomSettings() {
  try { return JSON.parse(localStorage.getItem('pomodoroSettings') || '{}') } catch { return {} }
}

export default function Pomodoro() {
  const t = useTheme()
  const [view, setView] = useState('timer')

  const s = loadPomSettings()
  const [focusMins,   setFocusMins]   = useState(s.focusMins   || 25)
  const [breakMins,   setBreakMins]   = useState(s.breakMins   || 5)
  const [totalRounds, setTotalRounds] = useState(s.totalRounds || 4)

  const [phase,    setPhase]    = useState('focus')
  const [running,  setRunning]  = useState(false)
  const [round,    setRound]    = useState(0)
  const [timeLeft, setTimeLeft] = useState((s.focusMins || 25) * 60)
  const [done,     setDone]     = useState(false)
  const intervalRef = useRef(null)

  const totalSecs  = phase === 'focus' ? focusMins * 60 : breakMins * 60
  const pct        = timeLeft / totalSecs
  const phaseColor = phase === 'focus' ? C.accent : C.green

  const doReset = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false); setPhase('focus'); setRound(0)
    setTimeLeft(focusMins * 60); setDone(false)
    store.set({ pomodoro: { mode: 'focus', secondsLeft: focusMins * 60, running: false, completedPomodoros: 0 } })
  }, [focusMins])

  // Sync to global store for TopBar widget
  useEffect(() => {
    store.set({ pomodoro: { ...store.get().pomodoro, mode: phase, secondsLeft: timeLeft, running } })
  }, [phase, timeLeft, running])

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          if (phase === 'focus') {
            if (round + 1 >= totalRounds) {
              playSound('pomodoroBlockFinished')
              setRunning(false); setDone(true)
              store.set({ pomodoro: { ...store.get().pomodoro, completedPomodoros: store.get().pomodoro.completedPomodoros + 1 } })
              return 0
            }
            playSound('pomodoroTimeUp')
            setPhase('break'); setRunning(false)
            return breakMins * 60
          } else {
            playSound('pomodoroTimeUp')
            setPhase('focus'); setRound(r => r + 1); setRunning(false)
            return focusMins * 60
          }
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, phase, round, totalRounds, focusMins, breakMins])

  const toggle = () => { if (!done) setRunning(r => !r) }

  const skipPhase = () => {
    clearInterval(intervalRef.current); setRunning(false)
    if (phase === 'focus') {
      if (round + 1 >= totalRounds) { playSound('pomodoroBlockFinished'); setDone(true); return }
      playSound('pomodoroTimeUp')
      setPhase('break'); setTimeLeft(breakMins * 60)
    } else {
      playSound('pomodoroTimeUp')
      setPhase('focus'); setRound(r => r + 1); setTimeLeft(focusMins * 60)
    }
  }

  const saveSettings = (fm, bm, tr) => {
    localStorage.setItem('pomodoroSettings', JSON.stringify({ focusMins: fm, breakMins: bm, totalRounds: tr }))
    setFocusMins(fm); setBreakMins(bm); setTotalRounds(tr)
    setTimeLeft(fm * 60); setPhase('focus'); setRound(0); setRunning(false); setDone(false)
    setView('timer')
  }

  if (view === 'settings') {
    return <PomodoroSettings focusMins={focusMins} breakMins={breakMins} totalRounds={totalRounds} onSave={saveSettings} onBack={() => setView('timer')} t={t}/>
  }

  return (
    <>
      <style>{`
        @keyframes completePop { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes pomFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        .pomo-main-btn { border:none; cursor:pointer; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:transform 160ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 160ms ease; }
        .pomo-main-btn:hover { transform:scale(1.05); }
        .pomo-main-btn:active { transform:scale(0.96); }
        .pomo-ghost { background:none; cursor:pointer; border-radius:10px; padding:9px 16px; font-size:12px; font-weight:700; font-family:'DM Sans',system-ui; display:flex; align-items:center; gap:6px; transition:border-color .15s, color .15s; }
        .pomo-ghost:hover { border-color:${C.accent}!important; color:${C.accent}!important; }
      `}</style>
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', minHeight: 'calc(100vh - 140px)' }}>
        {done ? (
          <div style={{ textAlign: 'center', animation: 'completePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: "'Lora',serif", fontSize: 26, fontWeight: 700, marginBottom: 8, color: t.text }}>Session complete!</h2>
            <p style={{ color: t.textSub, fontSize: 14, marginBottom: 8 }}>
              {totalRounds} rounds · {focusMins * totalRounds} minutes of focus
            </p>
            <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 36 }}>
              That&apos;s {focusMins * totalRounds} minutes you can&apos;t un-learn.
            </p>
            <button onClick={doReset} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',system-ui", display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentHov}
              onMouseLeave={e => e.currentTarget.style.background = C.accent}>
              <RotateCcw size={15}/> Start again
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, animation: 'pomFadeUp .36s ease both' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: phaseColor, boxShadow: running ? `0 0 0 3px ${phaseColor}30` : 'none', transition: 'box-shadow 0.3s' }}/>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.2px', color: phaseColor, textTransform: 'uppercase' }}>
                  {phase === 'focus' ? 'Focus' : 'Break'}
                </span>
              </div>
              <RoundDots total={totalRounds} current={round} t={t}/>
            </div>

            <Ring pct={pct} phase={phase} size={260} stroke={7}>
              <span style={{ fontFamily: "'DM Sans',system-ui", fontSize: 58, fontWeight: 800, letterSpacing: '-3px', color: t.text, lineHeight: 1, animation: running && timeLeft <= 10 ? 'pulse 1s ease infinite' : 'none' }}>
                {fmt(timeLeft)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, marginTop: 6 }}>
                Round {round + 1} of {totalRounds}
              </span>
            </Ring>

            <button className="pomo-main-btn" onClick={toggle} style={{ width: 72, height: 72, background: phaseColor, color: '#fff', boxShadow: `0 8px 28px ${phaseColor}45` }}>
              {running ? (
                <div style={{ display: 'flex', gap: 5 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: '#fff' }}/>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: '#fff' }}/>
                </div>
              ) : (
                <div style={{ width: 0, height: 0, borderTop: '11px solid transparent', borderBottom: '11px solid transparent', borderLeft: '18px solid #fff', marginLeft: 4 }}/>
              )}
            </button>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="pomo-ghost" style={{ border: `1px solid ${t.border}`, color: t.textSub }} onClick={skipPhase}>
                {phase === 'focus' ? <><Coffee size={13}/> Skip to break</> : <><BookOpen size={13}/> Skip to focus</>}
              </button>
              <button className="pomo-ghost" style={{ border: `1px solid ${t.border}`, color: t.textSub }} onClick={doReset}>
                <RotateCcw size={13}/> Reset
              </button>
              <button className="pomo-ghost" style={{ border: `1px solid ${t.border}`, color: t.textSub }} onClick={() => setView('settings')}>
                <Settings size={13}/> Settings
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

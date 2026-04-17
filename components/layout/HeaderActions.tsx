'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function HeaderActions() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [pomSeconds, setPomSeconds] = useState(25 * 60)
  const [pomRunning, setPomRunning] = useState(false)
  const [pomMode, setPomMode] = useState<'focus' | 'break'>('focus')

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!pomRunning) return
    const id = setInterval(() => {
      setPomSeconds((s) => {
        if (s <= 1) {
          setPomRunning(false)
          const next = pomMode === 'focus' ? 'break' : 'focus'
          setPomMode(next)
          return next === 'focus' ? 25 * 60 : 5 * 60
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [pomRunning, pomMode])

  const total = pomMode === 'focus' ? 25 * 60 : 5 * 60
  const pomPct = 1 - pomSeconds / total
  const circ = 50.27 // 2 * π * 8

  if (!mounted) return <div style={{ width: 120, height: 32 }} />

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Pomodoro mini-timer */}
      <button
        onClick={() => setPomRunning((r) => !r)}
        title={pomRunning ? 'Pause pomodoro' : 'Start pomodoro'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: pomRunning ? 'var(--accent-bg)' : 'var(--surface2)',
          border: `1px solid ${pomRunning ? 'rgba(224,115,85,0.4)' : 'var(--border)'}`,
          borderRadius: 20, padding: '5px 10px 5px 6px', cursor: 'pointer',
          color: pomRunning ? 'var(--accent)' : 'var(--text-sub)',
          fontSize: 12, fontWeight: 700,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <svg width={20} height={20} viewBox="0 0 20 20" style={{ display: 'block', flexShrink: 0 }}>
          <circle cx={10} cy={10} r={8} fill="none" stroke="var(--border)" strokeWidth={2} />
          <circle
            cx={10} cy={10} r={8} fill="none"
            stroke="var(--accent)" strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={`${pomPct * circ} ${circ}`}
            transform="rotate(-90 10 10)"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
          {fmt(pomSeconds)}
        </span>
      </button>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="icon-btn"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </div>
  )
}

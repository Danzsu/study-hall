'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Home, Layers, AlertTriangle, BookOpen,
  Search, Moon, Sun, Settings, GraduationCap,
} from 'lucide-react'
import { useStore, useTheme, navigate, store } from './store'
import { FONT_SANS, FONT_MONO } from './theme'

// ── HELPERS ───────────────────────────────────────────────────────────────────
export function fmtTime(s) {
  const m = Math.floor(s / 60), ss = s % 60
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function iconBtn(t) {
  return {
    background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 20,
    width: 32, height: 32, cursor: 'pointer', color: t.textSub,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit',
  }
}

// ── TOP BAR ───────────────────────────────────────────────────────────────────
function readPreferredSubjectId() {
  try {
    const raw = localStorage.getItem('onboardingDone')
    if (!raw) return ''
    const data = JSON.parse(raw)
    if (!Array.isArray(data?.subjects)) return ''
    const first = data.subjects.find(item => typeof item === 'string' || item?.active !== false)
    return typeof first === 'string' ? first : first?.id || ''
  } catch {
    return ''
  }
}

const SUBJECT_ROUTES = /^\/(?:subject|study|quiz|review|wrong-answers|flashcards|written|glossary|exam|search)\/([^/?]+)/

function readSubjectFromUrl() {
  if (typeof window === 'undefined') return ''
  const m = window.location.pathname.match(SUBJECT_ROUTES)
  return m ? decodeURIComponent(m[1]) : ''
}

function usePreferredSubjectId(params) {
  const [fallbackSubjectId, setFallbackSubjectId] = useState(() =>
    readPreferredSubjectId() || readSubjectFromUrl()
  )

  useEffect(() => {
    if (fallbackSubjectId) return
    let cancelled = false
    fetch('/api/subjects')
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setFallbackSubjectId(data?.[0]?.id || data?.[0]?.slug || '')
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [fallbackSubjectId])

  return params?.id || params?.slug || fallbackSubjectId
}

const NAV_TABS = [
  { path: '/home',          label: 'Home',        Icon: Home },
  { path: '/subject',       label: 'Study Hall',  Icon: GraduationCap },
  { path: '/review',        label: 'Review',      Icon: Layers },
  { path: '/wrong-answers', label: 'Mistakes',    Icon: AlertTriangle },
  { path: '/glossary',      label: 'Glossary',    Icon: BookOpen },
]

export function TopBar({ crumbs = [], right }) {
  const t = useTheme()
  const s = useStore()
  const subjectId = usePreferredSubjectId(s.params)
  const pom = s.pomodoro
  const navRef = useRef(null)
  const [pill, setPill] = useState(null)

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const active = nav.querySelector('[data-active="true"]')
    if (!active) { setPill(null); return }
    setPill({ left: active.offsetLeft, width: active.offsetWidth })
  }, [s.route])
  const pomPct = pom.mode === 'focus'
    ? (1 - pom.secondsLeft / (25 * 60))
    : (1 - pom.secondsLeft / (5 * 60))

  return (
    <header style={{
      background: t.surface, borderBottom: `1px solid ${t.border}`,
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 14, position: 'sticky', top: 0, zIndex: 100,
      fontFamily: FONT_SANS,
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/home')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
      >
        <img src="/assets/mascot-plain.png" alt="" style={{ width: 96, height: 96, objectFit: 'contain' }} />
        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px', color: t.text }}>
          Study Hall
        </span>
      </div>

      {/* Center nav */}
      <nav ref={navRef} className="topbar-nav" style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 2,
        background: t.surface2, border: `1px solid ${t.border}`,
        borderRadius: 99, padding: '3px',
      }}>
        {pill && (
          <div style={{
            position: 'absolute', top: 3, bottom: 3,
            left: pill.left, width: pill.width,
            background: t.surface, borderRadius: 99,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            transition: 'left .22s cubic-bezier(0.22,1,0.36,1), width .22s cubic-bezier(0.22,1,0.36,1)',
            pointerEvents: 'none',
          }} />
        )}
        {NAV_TABS.map(({ path, label, Icon }) => {
          const on = s.route === path || s.route.startsWith(path + '/')
          const disabled = path !== '/home' && !subjectId
          return (
            <button
              key={path}
              data-active={on ? 'true' : null}
              onClick={() => !disabled && navigate(path, subjectId ? { id: subjectId } : {})}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 99,
                border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: on ? t.accent : t.textSub,
                opacity: disabled ? 0.4 : 1,
                fontWeight: on ? 700 : 500, fontSize: 12.5, fontFamily: FONT_SANS,
                position: 'relative', zIndex: 1,
                transition: 'color .15s',
              }}
            >
              <Icon size={13} />
              <span className="nav-label">{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Right icons */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {right}
        {crumbs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: t.border2, fontSize: 14 }}>›</span>}
                <span
                  onClick={c.href ? () => navigate(c.href) : undefined}
                  style={{
                    fontSize: 12, color: i === crumbs.length - 1 ? t.text : t.textSub,
                    fontWeight: i === crumbs.length - 1 ? 600 : 500,
                    cursor: c.href ? 'pointer' : 'default',
                  }}
                >{c.label}</span>
              </span>
            ))}
          </div>
        )}
        <button
          onClick={() => navigate('/pomodoro')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: pom.running ? t.accentBg : t.surface2,
            border: `1px solid ${pom.running ? t.accent + '55' : t.border}`,
            borderRadius: 20, padding: '5px 10px 5px 6px', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, color: pom.running ? t.accent : t.textSub,
            fontFamily: 'inherit',
          }}
        >
          <svg width={20} height={20} viewBox="0 0 20 20">
            <circle cx={10} cy={10} r={8} fill="none" stroke={t.border} strokeWidth={2} />
            <circle cx={10} cy={10} r={8} fill="none" stroke={t.accent} strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={`${pomPct * 50.26} 50.26`}
              transform="rotate(-90 10 10)"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <span style={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' }}>
            {fmtTime(pom.secondsLeft)}
          </span>
        </button>
        <button onClick={() => navigate('/search', subjectId ? { id: subjectId } : {})} style={iconBtn(t)}><Search size={14} /></button>
        <button onClick={() => store.set({ dark: !s.dark })} style={iconBtn(t)}>
          {s.dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button onClick={() => navigate('/settings')} style={iconBtn(t)}><Settings size={14} /></button>
      </div>
    </header>
  )
}

// ── BOTTOM TAB BAR ────────────────────────────────────────────────────────────
export function TabBar() {
  const t = useTheme()
  const s = useStore()
  const targetSubjectId = usePreferredSubjectId(s.params)
  const tabs = [
    { path: '/home',         label: 'Home',     Icon: Home },
    { path: '/review',       label: 'Review',   Icon: Layers },
    { path: '/wrong-answers', label: 'Mistakes', Icon: AlertTriangle },
    { path: '/glossary',     label: 'Glossary', Icon: BookOpen },
  ]
  return (
    <nav style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 99, padding: '6px', display: 'flex', gap: 4,
      boxShadow: '0 8px 28px rgba(0,0,0,0.08)', zIndex: 90,
    }}>
      {tabs.map(({ path, label, Icon }) => {
        const on = s.route === path || s.route.startsWith(path + '/')
        const disabled = path !== '/home' && !targetSubjectId
        return (
          <button
            key={path}
            onClick={() => disabled ? navigate('/home') : navigate(path, targetSubjectId ? { id: targetSubjectId } : {})}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 99,
              border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
              background: on ? t.accent : 'transparent',
              color: on ? '#fff' : t.textSub,
              opacity: disabled ? 0.45 : 1,
              fontWeight: 700, fontSize: 12.5, fontFamily: FONT_SANS,
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}

// ── SHARED UI PRIMITIVES ──────────────────────────────────────────────────────
export function Card({ children, style = {}, pad = 20, ...rest }) {
  const t = useTheme()
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: pad, ...style,
    }} {...rest}>{children}</div>
  )
}

export function Btn({ children, variant = 'primary', style = {}, disabled, ...rest }) {
  const t = useTheme()
  const variants = {
    primary: { bg: t.accent,    color: '#fff',      border: t.accent },
    ghost:   { bg: t.surface,   color: t.text,      border: t.border },
    soft:    { bg: t.surface2,  color: t.textSub,   border: t.border },
    accent:  { bg: t.accentBg,  color: t.accent,    border: t.accent + '55' },
  }
  const v = variants[variant] || variants.primary
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 16px', borderRadius: 8,
        background: v.bg, color: v.color, border: `1px solid ${v.border}`,
        fontSize: 13, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: FONT_SANS,
        transition: 'transform .08s, background .15s',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Pill({ children, color = 'accent' }) {
  const t = useTheme()
  const map = {
    accent: { bg: t.accentBg,                      color: t.accent },
    blue:   { bg: 'rgba(74,127,193,0.11)',          color: '#4A7FC1' },
    green:  { bg: 'rgba(90,158,114,0.11)',          color: '#5A9E72' },
    gold:   { bg: 'rgba(196,154,60,0.11)',          color: '#C49A3C' },
    red:    { bg: 'rgba(192,80,74,0.10)',           color: '#C0504A' },
    purple: { bg: 'rgba(155,109,217,0.11)',         color: '#9B6DD9' },
    muted:  { bg: t.surface2,                      color: t.textSub },
  }[color] || { bg: t.accentBg, color: t.accent }
  return (
    <span style={{
      display: 'inline-block',
      background: map.bg, color: map.color,
      fontSize: 10, fontWeight: 800, letterSpacing: '1px',
      padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase',
    }}>{children}</span>
  )
}

export function SectionLabel({ children, style = {} }) {
  const t = useTheme()
  return (
    <p style={{
      fontSize: 11, fontWeight: 800, letterSpacing: '0.8px',
      color: t.textMuted, textTransform: 'uppercase', margin: 0, ...style,
    }}>{children}</p>
  )
}

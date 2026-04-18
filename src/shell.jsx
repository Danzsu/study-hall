'use client'
import {
  Home, Layers, AlertTriangle, BookOpen,
  Search, Moon, Sun, Settings,
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
export function TopBar({ crumbs = [], right }) {
  const t = useTheme()
  const s = useStore()
  const pom = s.pomodoro
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
      <div
        onClick={() => navigate('/home')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
      >
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', color: t.text }}>
          Study Hall
        </span>
      </div>

      {crumbs.length > 0 && <>
        <span style={{ color: t.border2, fontSize: 16 }}>›</span>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              onClick={c.href ? () => navigate(c.href) : undefined}
              style={{
                fontSize: 13,
                color: i === crumbs.length - 1 ? t.text : t.textSub,
                fontWeight: i === crumbs.length - 1 ? 600 : 500,
                cursor: c.href ? 'pointer' : 'default',
              }}
            >{c.label}</span>
            {i < crumbs.length - 1 && <span style={{ color: t.border2, fontSize: 16 }}>›</span>}
          </span>
        ))}
      </>}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {right}
        {/* Pomodoro mini */}
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
        <button onClick={() => navigate('/search')} style={iconBtn(t)}><Search size={14} /></button>
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
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 99,
              border: 'none', cursor: 'pointer',
              background: on ? t.accent : 'transparent',
              color: on ? '#fff' : t.textSub,
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

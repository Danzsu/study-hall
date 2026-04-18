'use client'
import { useReducer, useEffect } from 'react'
import { LIGHT, DARK, ACCENT_MAP } from './theme'

// ── SINGLETON STORE ───────────────────────────────────────────────────────────
let storeState = {
  route: '/home',
  params: {},
  dark: false,
  density: 'comfortable',
  accent: 'coral',
  pomodoro: { mode: 'focus', secondsLeft: 25 * 60, running: false, completedPomodoros: 0 },
  route_history: ['/home'],
}
const listeners = new Set()

export const store = {
  get: () => storeState,
  set: (patch) => {
    storeState = { ...storeState, ...patch }
    listeners.forEach(l => l())
  },
  sub: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
}

// ── HASH ROUTER ───────────────────────────────────────────────────────────────
export function parseHash() {
  if (typeof window === 'undefined') return { path: '/home', params: {} }
  const h = (location.hash || '#/home').replace(/^#/, '')
  const [path, query = ''] = h.split('?')
  const params = {}
  query.split('&').forEach(kv => {
    if (!kv) return
    const [k, v] = kv.split('=')
    params[decodeURIComponent(k)] = decodeURIComponent(v || '')
  })
  return { path: path || '/home', params }
}

export function navigate(path, params = {}) {
  const query = Object.keys(params)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')
  if (typeof window !== 'undefined') {
    location.hash = query ? `${path}?${query}` : path
  }
}

// ── HOOKS ─────────────────────────────────────────────────────────────────────
export function useStore() {
  const [, force] = useReducer(x => x + 1, 0)
  useEffect(() => store.sub(force), [])
  return store.get()
}

export function useTheme() {
  const s = useStore()
  const palette = ACCENT_MAP[s.accent] || ACCENT_MAP.coral
  const base = s.dark ? DARK : LIGHT
  return { ...base, ...palette, dark: s.dark, density: s.density }
}

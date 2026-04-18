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
  const href = routeHref(path, params)
  if (typeof window !== 'undefined') window.location.href = href
}

export function routeHref(path, params = {}) {
  let cleanPath = path
  let inlineParams = {}

  if (path.includes('?')) {
    const [p, query = ''] = path.split('?')
    cleanPath = p
    query.split('&').forEach(kv => {
      if (!kv) return
      const [k, v = ''] = kv.split('=')
      inlineParams[decodeURIComponent(k)] = decodeURIComponent(v)
    })
  }

  const merged = { ...store.get().params, ...inlineParams, ...params }
  const id = merged.id || merged.slug || ''
  const lesson = merged.lesson || ''
  const map = {
    '/home': '/',
    '/subject': id ? `/subject/${encodeURIComponent(id)}` : '/subject',
    '/study': id ? `/study/${encodeURIComponent(id)}${lesson ? `?lesson=${encodeURIComponent(lesson)}` : ''}` : '/study',
    '/quiz': id ? `/quiz/${encodeURIComponent(id)}${merged.section ? `?section=${encodeURIComponent(merged.section)}` : ''}` : '/quiz',
    '/flashcards': id ? `/flashcards/${encodeURIComponent(id)}` : '/flashcards',
    '/written': id ? `/written/${encodeURIComponent(id)}` : '/written',
    '/review': id ? `/review/${encodeURIComponent(id)}` : '/review',
    '/wrong-answers': id ? `/wrong-answers/${encodeURIComponent(id)}` : '/wrong-answers',
    '/glossary': id ? `/glossary/${encodeURIComponent(id)}` : '/glossary',
    '/exam': id ? `/exam/${encodeURIComponent(id)}` : '/exam',
    '/settings': '/settings',
    '/onboarding': '/onboarding',
    '/pomodoro': '/pomodoro',
    '/search': id ? `/search/${encodeURIComponent(id)}` : '/',
  }

  if (map[cleanPath]) return map[cleanPath]

  const query = Object.keys(params)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')
  return query ? `${cleanPath}?${query}` : cleanPath
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

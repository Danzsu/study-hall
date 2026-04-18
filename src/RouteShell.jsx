'use client'

import { useEffect } from 'react'
import { TopBar, TabBar } from './shell'
import { useStore, useTheme, store } from './store'
import { FONT_SANS } from './theme'

function makeCrumbs(route, slug, label) {
  const subject = label || slug
  if (route === '/home') return []
  if (route === '/settings') return [{ label: 'Settings' }]
  if (route === '/onboarding') return [{ label: 'Onboarding' }]
  if (route === '/pomodoro') return [{ label: 'Pomodoro' }]
  if (route === '/subject') return subject ? [{ label: subject }] : []
  const leaf = {
    '/study': 'Study',
    '/quiz': 'Quiz',
    '/flashcards': 'Flashcards',
    '/written': 'Written Test',
    '/review': 'Review',
    '/wrong-answers': 'Mistakes',
    '/glossary': 'Glossary',
    '/search': 'Search',
    '/exam': 'Exam',
  }[route]
  return leaf && subject
    ? [{ label: subject, href: `/subject?id=${slug}` }, { label: leaf }]
    : leaf ? [{ label: leaf }] : []
}

function hasCompletedOnboarding() {
  try {
    const raw = localStorage.getItem('onboardingDone')
    if (!raw) return false
    const data = JSON.parse(raw)
    return !!data && typeof data === 'object' && Array.isArray(data.subjects) && data.subjects.length > 0
  } catch {
    return false
  }
}

export default function RouteShell({ route = '/home', slug, subjectName, lesson, section, children, noChrome = false }) {
  const s = useStore()
  const t = useTheme()

  useEffect(() => {
    store.set({
      route,
      params: {
        id: slug,
        slug,
        name: subjectName,
        lesson,
        section,
      },
    })
  }, [route, slug, subjectName, lesson, section])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', s.dark)
  }, [s.dark])

  useEffect(() => {
    if (route === '/onboarding') return
    if (!hasCompletedOnboarding()) window.location.href = '/onboarding'
  }, [route])

  const crumbs = makeCrumbs(route, slug, subjectName)

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: FONT_SANS, transition: 'background .3s, color .3s' }}>
      {!noChrome && <TopBar crumbs={crumbs} />}
      <div style={{ paddingBottom: noChrome ? 0 : 80 }}>
        {children}
      </div>
      {!noChrome && <TabBar />}
    </div>
  )
}

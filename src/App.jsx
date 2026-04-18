'use client'
import { useEffect, lazy, Suspense } from 'react'
import { useStore, useTheme, store, parseHash, navigate } from './store'
import { TopBar, TabBar } from './shell'
import { FONT_SANS } from './theme'

const Home        = lazy(() => import('./screens/Home'))
const Subject     = lazy(() => import('./screens/Subject'))
const Quiz        = lazy(() => import('./screens/Quiz'))
const Flashcard   = lazy(() => import('./screens/Flashcard'))
const Study       = lazy(() => import('./screens/Study'))
const Written     = lazy(() => import('./screens/Written'))
const Review      = lazy(() => import('./screens/Review'))
const WrongAnswers = lazy(() => import('./screens/WrongAnswers'))
const Glossary    = lazy(() => import('./screens/Glossary'))
const Settings    = lazy(() => import('./screens/Settings'))
const ExamSim     = lazy(() => import('./screens/ExamSim'))
const Onboarding  = lazy(() => import('./screens/Onboarding'))
const Pomodoro    = lazy(() => import('./screens/Pomodoro'))

function Loader() {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: t.textMuted, fontFamily: FONT_SANS }}>
      Loading…
    </div>
  )
}

function Screen({ route, params }) {
  if (route === '/home')         return <Home />
  if (route === '/subject')      return <Subject subjectId={params.id} />
  if (route === '/quiz')         return <Quiz subjectId={params.id} />
  if (route === '/flashcards')   return <Flashcard subjectId={params.id} />
  if (route === '/study')        return <Study subjectId={params.id} lesson={params.lesson} />
  if (route === '/written')      return <Written subjectId={params.id} />
  if (route === '/review')       return <Review subjectId={params.id} />
  if (route === '/wrong-answers') return <WrongAnswers subjectId={params.id} />
  if (route === '/glossary')     return <Glossary subjectId={params.id} />
  if (route === '/settings')     return <Settings />
  if (route === '/exam')         return <ExamSim subjectId={params.id} />
  if (route === '/onboarding')   return <Onboarding />
  if (route === '/pomodoro')     return <Pomodoro />
  return <Home />
}

function getCrumbs(route, params, subjectName) {
  if (route === '/home')         return []
  if (route === '/settings')     return [{ label: 'Settings' }]
  if (route === '/review')       return subjectName ? [{ label: subjectName, href: '/subject?id=' + params.id }, { label: 'Review' }] : [{ label: 'Review' }]
  if (route === '/wrong-answers') return subjectName ? [{ label: subjectName, href: '/subject?id=' + params.id }, { label: 'Mistakes' }] : [{ label: 'Mistakes' }]
  if (route === '/glossary')     return subjectName ? [{ label: subjectName, href: '/subject?id=' + params.id }, { label: 'Glossary' }] : [{ label: 'Glossary' }]
  if (route === '/subject')      return subjectName ? [{ label: subjectName }] : []
  if (route === '/quiz')         return subjectName ? [{ label: subjectName, href: '/subject?id=' + params.id }, { label: 'Quiz' }] : []
  if (route === '/flashcards')   return subjectName ? [{ label: subjectName, href: '/subject?id=' + params.id }, { label: 'Flashcards' }] : []
  if (route === '/study')        return subjectName ? [{ label: subjectName, href: '/subject?id=' + params.id }, { label: 'Study' }] : []
  if (route === '/written')      return subjectName ? [{ label: subjectName, href: '/subject?id=' + params.id }, { label: 'Written Test' }] : []
  if (route === '/exam')         return subjectName ? [{ label: subjectName, href: '/subject?id=' + params.id }, { label: 'Exam' }] : []
  return []
}

export default function App() {
  const s = useStore()
  const t = useTheme()

  // Hash routing init + listener
  useEffect(() => {
    const { path, params } = parseHash()
    store.set({ route: path, params })

    const onHash = () => {
      const { path, params } = parseHash()
      const hist = [...store.get().route_history]
      if (hist[hist.length - 1] !== path) hist.push(path)
      if (hist.length > 20) hist.shift()
      store.set({ route: path, params, route_history: hist })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Pomodoro timer (skip when on the dedicated Pomodoro screen — it manages its own timer)
  useEffect(() => {
    const interval = setInterval(() => {
      const cur = store.get()
      if (!cur.pomodoro.running || cur.route === '/pomodoro') return
      const left = cur.pomodoro.secondsLeft - 1
      if (left <= 0) {
        const nextMode = cur.pomodoro.mode === 'focus' ? 'break' : 'focus'
        store.set({ pomodoro: { mode: nextMode, secondsLeft: nextMode === 'focus' ? 25*60 : 5*60, running: false, completedPomodoros: cur.pomodoro.completedPomodoros + (cur.pomodoro.mode === 'focus' ? 1 : 0) } })
      } else {
        store.set({ pomodoro: { ...cur.pomodoro, secondsLeft: left } })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Sync dark mode with HTML class (for CSS variable overrides in globals.css)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', s.dark)
  }, [s.dark])

  // Onboarding redirect
  useEffect(() => {
    if (s.route !== '/onboarding' && !localStorage.getItem('onboardingDone')) {
      navigate('/onboarding')
    }
  }, [s.route])

  const subjectName = s.params.name || null
  const crumbs = getCrumbs(s.route, s.params, subjectName)
  const noChrome = s.route === '/onboarding'

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: FONT_SANS, transition: 'background .3s, color .3s' }}>
      {!noChrome && <TopBar crumbs={crumbs} />}
      <div style={{ paddingBottom: noChrome ? 0 : 80 }}>
        <Suspense fallback={<Loader />}>
          <Screen route={s.route} params={s.params} />
        </Suspense>
      </div>
      {!noChrome && <TabBar />}
    </div>
  )
}

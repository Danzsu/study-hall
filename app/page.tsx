import { getSubjects, getSubjectSectionInfos } from '@/lib/content'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/layout/TabBar'
import { DashboardClient } from '@/components/study/DashboardClient'

export default function StudyHall() {
  const rawSubjects = getSubjects()

  const subjects = rawSubjects.map((s) => ({
    ...s,
    sections: getSubjectSectionInfos(s.slug),
  }))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      <DashboardClient subjects={subjects} />
      <TabBar />
    </div>
  )
}

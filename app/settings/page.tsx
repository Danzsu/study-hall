import { getSubjects } from '@/lib/content'
import { SettingsClient } from '@/components/study/SettingsClient'

export default function SettingsPage() {
  const subjects = getSubjects()
  return <SettingsClient subjects={subjects} />
}

import { getSubjects } from '@/lib/content'
import { OnboardingClient } from '@/components/study/OnboardingClient'

export default function OnboardingPage() {
  const subjects = getSubjects()
  return <OnboardingClient subjects={subjects} />
}

import RouteShell from '@/src/RouteShell'
import Onboarding from '@/src/screens/Onboarding'

export default function Page() {
  return (
    <RouteShell route="/onboarding" noChrome>
      <Onboarding />
    </RouteShell>
  )
}

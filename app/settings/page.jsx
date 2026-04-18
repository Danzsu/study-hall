import RouteShell from '@/src/RouteShell'
import Settings from '@/src/screens/Settings'

export default function Page() {
  return (
    <RouteShell route="/settings">
      <Settings />
    </RouteShell>
  )
}

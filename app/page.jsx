import RouteShell from '@/src/RouteShell'
import Home from '@/src/screens/Home'

export default function Page() {
  return (
    <RouteShell route="/home">
      <Home />
    </RouteShell>
  )
}

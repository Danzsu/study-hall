import RouteShell from '@/src/RouteShell'
import Pomodoro from '@/src/screens/Pomodoro'

export default function Page() {
  return (
    <RouteShell route="/pomodoro">
      <Pomodoro />
    </RouteShell>
  )
}

import RouteShell from '@/src/RouteShell'
import SearchScreen from '@/src/screens/Search'

export default function Page({ params }) {
  return (
    <RouteShell route="/search" slug={params.slug}>
      <SearchScreen subjectId={params.slug} />
    </RouteShell>
  )
}

import { useState } from 'react'
import { AppShell, type ViewId } from './components/layout/AppShell'
import { PathfindingView } from './components/pathfinding/PathfindingView'
import { SortingView } from './components/sorting/SortingView'

export default function App() {
  const [view, setView] = useState<ViewId>('pathfinding')

  return (
    <AppShell view={view} onViewChange={setView}>
      {view === 'pathfinding' ? <PathfindingView /> : <SortingView />}
    </AppShell>
  )
}

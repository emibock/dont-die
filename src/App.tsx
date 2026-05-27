import { useEffect, useState } from 'react'
import { useTaskStore } from './stores/useTaskStore.ts'
import { useGameStore } from './stores/useGameStore.ts'
import { TaskList } from './components/TaskList.tsx'
import { GamificationBar } from './components/GamificationBar.tsx'
import { ArchiveView } from './components/ArchiveView.tsx'
import { ExportImport } from './components/ExportImport.tsx'

function App() {
  const [isHydrated, setIsHydrated] = useState(false)
  const hydrateTaskStore = useTaskStore(state => state.hydrate)
  const hydrateGameStore = useGameStore(state => state.hydrate)
  const resetDay = useGameStore(state => state.resetDay)

  // Hydrate stores on app load and check for new day
  useEffect(() => {
    const hydrate = async () => {
      await Promise.all([
        hydrateTaskStore(),
        hydrateGameStore(),
      ])
      // Check for new day after hydration
      await resetDay()
      setIsHydrated(true)
    }
    hydrate()
  }, [hydrateTaskStore, hydrateGameStore, resetDay])

  // Check for new day on hourly interval
  useEffect(() => {
    const intervalId = setInterval(async () => {
      await resetDay()
    }, 60 * 60 * 1000) // 1 hour in milliseconds

    return () => clearInterval(intervalId)
  }, [resetDay])

  if (!isHydrated) {
    return (
      <div className="app">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Don't Die</h1>
        <p className="tagline">A gamified to-do list to keep your little guy from drowning in lava.</p>
      </header>

      <main className="app-main">
        <GamificationBar />
        <TaskList />
        <ArchiveView />
        <ExportImport />
      </main>
    </div>
  )
}

export default App

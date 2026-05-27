import { useEffect, useState } from 'react'
import { useTaskStore } from './stores/useTaskStore.ts'
import { useGameStore } from './stores/useGameStore.ts'
import { TaskList } from './components/TaskList.tsx'
import { GamificationBar } from './components/GamificationBar.tsx'

function App() {
  const [isHydrated, setIsHydrated] = useState(false)
  const hydrateTaskStore = useTaskStore(state => state.hydrate)
  const hydrateGameStore = useGameStore(state => state.hydrate)

  useEffect(() => {
    const hydrate = async () => {
      await Promise.all([
        hydrateTaskStore(),
        hydrateGameStore(),
      ])
      setIsHydrated(true)
    }
    hydrate()
  }, [hydrateTaskStore, hydrateGameStore])

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
      </main>
    </div>
  )
}

export default App

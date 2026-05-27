import { useEffect, useState } from 'react'
import { useTaskStore } from './stores/useTaskStore.ts'
import { useGameStore } from './stores/useGameStore.ts'

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
      <h1>Don't Die</h1>
      <p>A gamified to-do list to keep your little guy from drowning in lava.</p>
    </div>
  )
}

export default App

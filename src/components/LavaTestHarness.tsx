import { useState } from 'react'
import { useGameStore } from '../stores/useGameStore.ts'

export function LavaTestHarness() {
  const [isOpen, setIsOpen] = useState(false)
  const consecutiveZeroDays = useGameStore(state => state.consecutiveZeroDays)

  const setConsecutiveZeroDays = (days: number) => {
    useGameStore.setState({ consecutiveZeroDays: days })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          padding: '0.5rem 1rem',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        🧪 Test Lava States
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        padding: '1rem',
        background: 'white',
        border: '2px solid #2563eb',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        minWidth: '250px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>🧪 Lava Test Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
        Current: <strong>{consecutiveZeroDays} days</strong>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          onClick={() => setConsecutiveZeroDays(0)}
          style={{
            padding: '0.5rem',
            background: consecutiveZeroDays === 0 ? '#10b981' : '#e5e7eb',
            color: consecutiveZeroDays === 0 ? 'white' : '#1a1a1a',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          🟢 Safe (0 days) - No lava
        </button>

        <button
          onClick={() => setConsecutiveZeroDays(5)}
          style={{
            padding: '0.5rem',
            background: consecutiveZeroDays === 5 ? '#f59e0b' : '#e5e7eb',
            color: consecutiveZeroDays === 5 ? 'white' : '#1a1a1a',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          🟡 Warning (5 days) - 30% lava
        </button>

        <button
          onClick={() => setConsecutiveZeroDays(8)}
          style={{
            padding: '0.5rem',
            background: consecutiveZeroDays === 8 ? '#ef4444' : '#e5e7eb',
            color: consecutiveZeroDays === 8 ? 'white' : '#1a1a1a',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          🔴 Danger (8 days) - 60% lava
        </button>

        <button
          onClick={() => setConsecutiveZeroDays(10)}
          style={{
            padding: '0.5rem',
            background: consecutiveZeroDays === 10 ? '#991b1b' : '#e5e7eb',
            color: consecutiveZeroDays === 10 ? 'white' : '#1a1a1a',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          💀 Drowning (10 days) - 95% lava
        </button>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
        Click a state to test the lava rendering and character expressions
      </div>
    </div>
  )
}

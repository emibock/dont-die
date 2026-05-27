import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App.tsx'
import { useGameStore } from './stores/useGameStore.ts'
import { useTaskStore } from './stores/useTaskStore.ts'
import { db } from './db/schema.ts'

describe('App', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    await db.gamification.clear()
    await db.dailyProgress.clear()

    useTaskStore.setState({
      tasks: [],
      expandedTaskId: null,
    })

    useGameStore.setState({
      consecutiveZeroDays: 0,
      lastActivityDate: null,
      totalPoints: 0,
    })
  })

  afterEach(async () => {
    await db.tasks.clear()
    await db.gamification.clear()
    await db.dailyProgress.clear()
  })

  it('renders app after hydration', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Don\'t Die')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<App />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('calls resetDay on app load after hydration', async () => {
    const resetDaySpy = vi.spyOn(useGameStore.getState(), 'resetDay')

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Don\'t Die')).toBeInTheDocument()
    })

    expect(resetDaySpy).toHaveBeenCalledTimes(1)

    resetDaySpy.mockRestore()
  })

  it('sets up hourly interval for resetDay', async () => {
    // This test verifies the interval is set up by checking setInterval was called
    // Testing the actual interval firing is complex with fake timers and async DB operations
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Don\'t Die')).toBeInTheDocument()
    })

    // Verify setInterval was called with 1 hour timeout
    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      60 * 60 * 1000
    )

    setIntervalSpy.mockRestore()
  })

  it('cleans up interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const { unmount } = render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Don\'t Die')).toBeInTheDocument()
    })

    const callCountBeforeUnmount = clearIntervalSpy.mock.calls.length

    // Unmount the component
    unmount()

    // Verify clearInterval was called (cleanup happened)
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(callCountBeforeUnmount)

    clearIntervalSpy.mockRestore()
  })

  it('renders GamificationBar and TaskList after hydration', async () => {
    render(<App />)

    // Wait for hydration first
    await waitFor(() => {
      expect(screen.getByText('Don\'t Die')).toBeInTheDocument()
    })

    // Then check for components
    expect(screen.getByText('Total Points')).toBeInTheDocument()
    expect(screen.getByText('Today\'s Progress')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })
})

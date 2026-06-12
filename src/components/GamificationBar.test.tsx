import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { GamificationBar } from './GamificationBar.tsx'
import { useGameStore } from '../stores/useGameStore.ts'
import { db } from '../db/schema.ts'
import { DAILY_GOAL } from '../types/game.ts'

describe('GamificationBar', () => {
  beforeEach(async () => {
    await db.gamification.clear()
    await db.dailyProgress.clear()

    useGameStore.setState({
      consecutiveZeroDays: 0,
      lastActivityDate: null,
      totalPoints: 0,
    })

    await useGameStore.getState().hydrate()
  })

  afterEach(async () => {
    await db.gamification.clear()
    await db.dailyProgress.clear()
  })

  it('renders total points', async () => {
    useGameStore.setState({ totalPoints: 42 })
    render(<GamificationBar />)

    expect(screen.getByText('Total Points')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('displays today\'s progress toward daily goal', async () => {
    const today = new Date().toISOString().split('T')[0]
    await db.dailyProgress.add({
      date: today,
      pointsEarned: 3,
      tasksCompleted: [],
    })

    render(<GamificationBar />)

    await waitFor(() => {
      expect(screen.getByText(`3 / ${DAILY_GOAL}`)).toBeInTheDocument()
    })
  })

  it('shows progress bar with correct percentage', async () => {
    const today = new Date().toISOString().split('T')[0]
    await db.dailyProgress.add({
      date: today,
      pointsEarned: 3,
      tasksCompleted: [],
    })

    render(<GamificationBar />)

    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '3')
      expect(progressBar).toHaveAttribute('aria-valuemax', String(DAILY_GOAL))
    })
  })

  it('displays goal met message when daily goal reached', async () => {
    const today = new Date().toISOString().split('T')[0]
    await db.dailyProgress.add({
      date: today,
      pointsEarned: DAILY_GOAL,
      tasksCompleted: [],
    })

    render(<GamificationBar />)

    await waitFor(() => {
      expect(screen.getByText(/Daily goal achieved!/i)).toBeInTheDocument()
      // Status now shows lava warning level instead of "Goal Met!"
      expect(screen.getByText('Safe')).toBeInTheDocument()
    })
  })

  it('displays points remaining message when goal not met', async () => {
    const today = new Date().toISOString().split('T')[0]
    await db.dailyProgress.add({
      date: today,
      pointsEarned: 2,
      tasksCompleted: [],
    })

    render(<GamificationBar />)

    await waitFor(() => {
      expect(screen.getByText(/3 more points to reach daily goal/i)).toBeInTheDocument()
    })
  })

  it('shows safe status when no consecutive zero days', () => {
    useGameStore.setState({ consecutiveZeroDays: 0 })
    render(<GamificationBar />)

    expect(screen.getByText(/Your little guy is safe!/i)).toBeInTheDocument()
  })

  it('shows warning when consecutive zero days is 4-6', () => {
    useGameStore.setState({ consecutiveZeroDays: 5 })
    render(<GamificationBar />)

    expect(screen.getByText(/5 days until drowning!/i)).toBeInTheDocument()
    expect(screen.getByText(/5 consecutive days with zero points/i)).toBeInTheDocument()
  })

  it('shows danger when consecutive zero days is 7-9', () => {
    useGameStore.setState({ consecutiveZeroDays: 8 })
    render(<GamificationBar />)

    expect(screen.getByText(/2 days until drowning!/i)).toBeInTheDocument()
    expect(screen.getByText(/8 consecutive days with zero points/i)).toBeInTheDocument()
  })

  it('shows drowning message when at 10 consecutive zero days', () => {
    useGameStore.setState({ consecutiveZeroDays: 10 })
    render(<GamificationBar />)

    expect(screen.getByText(/Your little guy has drowned!/i)).toBeInTheDocument()
    expect(screen.getByText('Drowning!')).toBeInTheDocument()
  })

  it('renders lava guy SVG with correct alt text based on warning level', () => {
    useGameStore.setState({ consecutiveZeroDays: 5 })
    render(<GamificationBar />)

    const lavaGuyImg = screen.getByAltText(/Little guy is warning/i)
    expect(lavaGuyImg).toBeInTheDocument()
    expect(lavaGuyImg).toHaveAttribute('src', '/lava-guy-warning.svg')
  })

  it('meets accessibility standards', async () => {
    const { container } = render(<GamificationBar />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards when goal is met', async () => {
    const today = new Date().toISOString().split('T')[0]
    await db.dailyProgress.add({
      date: today,
      pointsEarned: DAILY_GOAL,
      tasksCompleted: [],
    })

    const { container } = render(<GamificationBar />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards when drowning', async () => {
    useGameStore.setState({ consecutiveZeroDays: 10 })
    const { container } = render(<GamificationBar />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

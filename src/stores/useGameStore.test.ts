import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useGameStore } from './useGameStore.ts'
import { LAVA_COUNTDOWN_DAYS } from '../types/game.ts'
import { db } from '../db/schema.ts'

describe('useGameStore', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await db.gamification.clear()
    await db.dailyProgress.clear()

    // Reset the store state
    useGameStore.setState({
      consecutiveZeroDays: 0,
      lastActivityDate: null,
      totalPoints: 0,
    })
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.gamification.clear()
    await db.dailyProgress.clear()
  })

  describe('getLavaState', () => {
    it('returns safe state when no zero days', () => {
      useGameStore.setState({ consecutiveZeroDays: 0 })
      const state = useGameStore.getState().getLavaState()

      expect(state.warningLevel).toBe('safe')
      expect(state.isDrowning).toBe(false)
      expect(state.daysUntilDrowning).toBe(LAVA_COUNTDOWN_DAYS)
    })

    it('returns warning state at 4-6 consecutive zero days', () => {
      useGameStore.setState({ consecutiveZeroDays: 5 })
      const state = useGameStore.getState().getLavaState()

      expect(state.warningLevel).toBe('warning')
      expect(state.isDrowning).toBe(false)
      expect(state.daysUntilDrowning).toBe(5)
    })

    it('returns danger state at 7-9 consecutive zero days', () => {
      useGameStore.setState({ consecutiveZeroDays: 8 })
      const state = useGameStore.getState().getLavaState()

      expect(state.warningLevel).toBe('danger')
      expect(state.isDrowning).toBe(false)
      expect(state.daysUntilDrowning).toBe(2)
    })

    it('returns drowning state at 10+ consecutive zero days', () => {
      useGameStore.setState({ consecutiveZeroDays: LAVA_COUNTDOWN_DAYS })
      const state = useGameStore.getState().getLavaState()

      expect(state.warningLevel).toBe('drowning')
      expect(state.isDrowning).toBe(true)
      expect(state.daysUntilDrowning).toBe(0)
    })
  })

  describe('hydrate', () => {
    it('initializes state when no record exists', async () => {
      await useGameStore.getState().hydrate()

      const state = useGameStore.getState()
      expect(state.consecutiveZeroDays).toBe(0)
      expect(state.totalPoints).toBe(0)
      expect(state.lastActivityDate).toBe(null)

      // Verify DB record was created
      const dbState = await db.gamification.get(1)
      expect(dbState).toBeDefined()
      expect(dbState?.consecutiveZeroDays).toBe(0)
    })

    it('loads existing state from database', async () => {
      // Pre-populate database
      await db.gamification.add({
        id: 1,
        consecutiveZeroDays: 3,
        totalPoints: 42,
        lastActivityDate: '2026-05-20',
      })

      await useGameStore.getState().hydrate()

      const state = useGameStore.getState()
      expect(state.consecutiveZeroDays).toBe(3)
      expect(state.totalPoints).toBe(42)
      expect(state.lastActivityDate).toBe('2026-05-20')
    })
  })

  describe('addPoints', () => {
    it('awards points and resets zero day countdown', async () => {
      await useGameStore.getState().hydrate()
      useGameStore.setState({ consecutiveZeroDays: 5 })

      await useGameStore.getState().addPoints(1, 'task-123')

      const state = useGameStore.getState()
      expect(state.consecutiveZeroDays).toBe(0) // Reset on earning points
      expect(state.totalPoints).toBe(1)

      // Verify daily progress was recorded
      const today = new Date().toISOString().split('T')[0]
      const progress = await db.dailyProgress.get(today)
      expect(progress?.pointsEarned).toBe(1)
      expect(progress?.tasksCompleted).toContain('task-123')
    })

    it('accumulates points across multiple tasks', async () => {
      await useGameStore.getState().hydrate()

      await useGameStore.getState().addPoints(1, 'task-1')
      await useGameStore.getState().addPoints(1, 'task-2')
      await useGameStore.getState().addPoints(1, 'task-3')

      const state = useGameStore.getState()
      expect(state.totalPoints).toBe(3)

      const today = new Date().toISOString().split('T')[0]
      const progress = await db.dailyProgress.get(today)
      expect(progress?.pointsEarned).toBe(3)
      expect(progress?.tasksCompleted).toHaveLength(3)
    })
  })

  describe('checkLavaStatus', () => {
    it('increments consecutive zero days', async () => {
      await useGameStore.getState().hydrate()
      useGameStore.setState({ consecutiveZeroDays: 2 })

      await useGameStore.getState().checkLavaStatus()

      const state = useGameStore.getState()
      expect(state.consecutiveZeroDays).toBe(3)

      // Verify DB was updated
      const dbState = await db.gamification.get(1)
      expect(dbState?.consecutiveZeroDays).toBe(3)
    })
  })
})

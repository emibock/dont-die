import { create } from 'zustand'
import type { TaskId } from '../types/task.ts'
import type { GamificationState, LavaState } from '../types/game.ts'
import { POINTS_PER_TASK, DAILY_GOAL, LAVA_COUNTDOWN_DAYS } from '../types/game.ts'
import { db } from '../db/schema.ts'

interface GameStore extends GamificationState {
  // Lifecycle
  hydrate: () => Promise<void>

  // Actions
  addPoints: (points: number, taskId: TaskId) => Promise<void>
  resetDay: () => Promise<void>
  checkLavaStatus: () => Promise<void>

  // Selectors
  getTodayPoints: () => Promise<number>
  getLavaState: () => LavaState
}

// Helper to get today's date as YYYY-MM-DD
const getToday = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Helper to get yesterday's date as YYYY-MM-DD
const getYesterday = (): string => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

// Calculate lava state based on consecutive zero days
const calculateLavaState = (consecutiveZeroDays: number): LavaState => {
  if (consecutiveZeroDays >= LAVA_COUNTDOWN_DAYS) {
    return {
      isDrowning: true,
      warningLevel: 'drowning',
      daysUntilDrowning: 0,
    }
  }

  const daysUntilDrowning = LAVA_COUNTDOWN_DAYS - consecutiveZeroDays

  if (consecutiveZeroDays === 0) {
    return { isDrowning: false, warningLevel: 'safe', daysUntilDrowning }
  }

  if (consecutiveZeroDays >= 7) {
    return { isDrowning: false, warningLevel: 'danger', daysUntilDrowning }
  }

  if (consecutiveZeroDays >= 4) {
    return { isDrowning: false, warningLevel: 'warning', daysUntilDrowning }
  }

  return { isDrowning: false, warningLevel: 'safe', daysUntilDrowning }
}

export const useGameStore = create<GameStore>((set, get) => ({
  consecutiveZeroDays: 0,
  lastActivityDate: null,
  totalPoints: 0,

  // Load gamification state from IndexedDB
  hydrate: async () => {
    const state = await db.gamification.get(1)
    if (state) {
      set({
        consecutiveZeroDays: state.consecutiveZeroDays,
        lastActivityDate: state.lastActivityDate,
        totalPoints: state.totalPoints,
      })
    } else {
      // Initialize gamification state if it doesn't exist
      const initialState = {
        id: 1,
        consecutiveZeroDays: 0,
        lastActivityDate: null,
        totalPoints: 0,
      }
      await db.gamification.add(initialState)
    }
  },

  // Award points for completing a task
  addPoints: async (points, taskId) => {
    const today = getToday()

    // Get or create today's progress
    let todayProgress = await db.dailyProgress.get(today)
    if (!todayProgress) {
      todayProgress = {
        date: today,
        pointsEarned: 0,
        tasksCompleted: [],
      }
    }

    // Update today's progress
    todayProgress.pointsEarned += points
    todayProgress.tasksCompleted.push(taskId)
    await db.dailyProgress.put(todayProgress)

    // Update gamification state
    const newTotalPoints = get().totalPoints + points
    const updates = {
      totalPoints: newTotalPoints,
      lastActivityDate: today,
      consecutiveZeroDays: 0, // Reset countdown when earning points
    }

    await db.gamification.update(1, updates)
    set(updates)
  },

  // Check if we need to reset for a new day
  resetDay: async () => {
    const today = getToday()
    const todayProgress = await db.dailyProgress.get(today)

    if (!todayProgress) {
      // New day detected - check if yesterday had zero points
      const yesterday = getYesterday()
      const yesterdayProgress = await db.dailyProgress.get(yesterday)

      if (!yesterdayProgress || yesterdayProgress.pointsEarned === 0) {
        // Increment lava countdown
        await get().checkLavaStatus()
      }

      // Create today's progress record
      await db.dailyProgress.add({
        date: today,
        pointsEarned: 0,
        tasksCompleted: [],
      })
    }
  },

  // Increment consecutive zero days (called when a day passes with 0 points)
  checkLavaStatus: async () => {
    const newCount = get().consecutiveZeroDays + 1
    await db.gamification.update(1, { consecutiveZeroDays: newCount })
    set({ consecutiveZeroDays: newCount })
  },

  // Get today's points
  getTodayPoints: async () => {
    const today = getToday()
    const todayProgress = await db.dailyProgress.get(today)
    return todayProgress?.pointsEarned ?? 0
  },

  // Get current lava state
  getLavaState: () => {
    return calculateLavaState(get().consecutiveZeroDays)
  },
}))

export interface GamificationState {
  consecutiveZeroDays: number // Track lava countdown
  lastActivityDate: string | null // YYYY-MM-DD
  totalPoints: number
}

export type LavaWarningLevel = 'safe' | 'warning' | 'danger' | 'drowning'

export interface LavaState {
  isDrowning: boolean
  warningLevel: LavaWarningLevel
  daysUntilDrowning: number
}

export const POINTS_PER_TASK = 1
export const DAILY_GOAL = 5
export const LAVA_COUNTDOWN_DAYS = 10

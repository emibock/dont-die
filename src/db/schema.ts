import Dexie, { type EntityTable } from 'dexie'
import type { Task, DailyProgress } from '../types/task.ts'
import type { GamificationState } from '../types/game.ts'

// Database interfaces - match the type definitions exactly
export interface TaskDB extends Task {}
export interface DailyProgressDB extends DailyProgress {}
export interface GamificationDB extends GamificationState {
  id: number // Singleton record (always id: 1)
}

export class AppDatabase extends Dexie {
  tasks!: EntityTable<TaskDB, 'id'>
  dailyProgress!: EntityTable<DailyProgressDB, 'date'>
  gamification!: EntityTable<GamificationDB, 'id'>

  constructor() {
    super('dont-die-todo')
    this.version(1).stores({
      tasks: 'id, parentId, orderIndex, completed, completedAt',
      dailyProgress: 'date',
      gamification: 'id',
    })
  }
}

// Export singleton database instance
export const db = new AppDatabase()

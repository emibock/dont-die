// TaskId is a UUID v4 string
export type TaskId = string

export interface Task {
  id: TaskId
  content: string // Task title
  notes: string // Notepad content (expandable)
  links: string[] // URLs extracted from notes
  completed: boolean
  completedAt: number | null // Unix timestamp (ms)
  createdAt: number
  updatedAt: number
  parentId: TaskId | null // null = root-level task
  orderIndex: number // Float for drag-and-drop ordering
}

export interface DailyProgress {
  date: string // YYYY-MM-DD (ISO date string)
  pointsEarned: number
  tasksCompleted: TaskId[]
}

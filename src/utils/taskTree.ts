import type { Task, TaskId } from '../types/task.ts'

/**
 * Check if targetId is a descendant of ancestorId in the task tree
 */
export function isDescendant(
  tasks: Task[],
  targetId: TaskId,
  ancestorId: TaskId
): boolean {
  const target = tasks.find(t => t.id === targetId)
  if (!target || !target.parentId) return false

  if (target.parentId === ancestorId) return true

  return isDescendant(tasks, target.parentId, ancestorId)
}

/**
 * Get the depth of a task in the tree (0 = root level)
 */
export function getTaskDepth(tasks: Task[], taskId: TaskId): number {
  const task = tasks.find(t => t.id === taskId)
  if (!task || !task.parentId) return 0

  return 1 + getTaskDepth(tasks, task.parentId)
}

/**
 * Calculate new orderIndex when inserting task between two siblings
 * Returns midpoint, or appropriate value if at start/end
 */
export function calculateNewOrderIndex(
  prevOrderIndex: number | null,
  nextOrderIndex: number | null
): number {
  // Insert at start
  if (prevOrderIndex === null && nextOrderIndex !== null) {
    return nextOrderIndex - 1.0
  }

  // Insert at end
  if (prevOrderIndex !== null && nextOrderIndex === null) {
    return prevOrderIndex + 1.0
  }

  // Insert between two items
  if (prevOrderIndex !== null && nextOrderIndex !== null) {
    return (prevOrderIndex + nextOrderIndex) / 2
  }

  // Empty list
  return 1.0
}

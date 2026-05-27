import { create } from 'zustand'
import type { Task, TaskId } from '../types/task.ts'
import { db } from '../db/schema.ts'
import { isDescendant, getTaskDepth, calculateNewOrderIndex } from '../utils/taskTree.ts'
import { useGameStore } from './useGameStore.ts'
import { POINTS_PER_TASK } from '../types/game.ts'

interface TaskStore {
  tasks: Task[]
  expandedTaskId: TaskId | null

  // Lifecycle
  hydrate: () => Promise<void>

  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TaskId>
  updateTask: (id: TaskId, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: TaskId) => Promise<void>
  toggleComplete: (id: TaskId) => Promise<void>
  reorderTasks: (taskId: TaskId, newParentId: TaskId | null, prevTaskId: TaskId | null, nextTaskId: TaskId | null) => Promise<void>

  // UI state
  expandTask: (id: TaskId | null) => void

  // Selectors (will be added as getters)
  getRootTasks: () => Task[]
  getSubTasks: (parentId: TaskId) => Task[]
  getTaskById: (id: TaskId) => Task | undefined
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  expandedTaskId: null,

  // Load tasks from IndexedDB on app init
  hydrate: async () => {
    const tasks = await db.tasks.toArray()
    set({ tasks })
  },

  // Add task: persist to IndexedDB first, then update Zustand
  addTask: async (task) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(), // Secure random UUID
      createdAt: Date.now(),
      updatedAt: Date.now(),
      links: [], // Initialize empty links array
    }

    await db.tasks.add(newTask)
    set((state) => ({ tasks: [...state.tasks, newTask] }))

    return newTask.id
  },

  // Update task: persist to DB, update Zustand
  updateTask: async (id, updates) => {
    const updated = { ...updates, updatedAt: Date.now() }
    await db.tasks.update(id, updated)

    set((state) => ({
      tasks: state.tasks.map(t =>
        t.id === id ? { ...t, ...updated } : t
      ),
    }))
  },

  // Delete task: remove from DB and Zustand
  deleteTask: async (id) => {
    await db.tasks.delete(id)
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id),
    }))
  },

  // Toggle complete: mark task, move to archive, update timestamps, award points
  toggleComplete: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return

    const completed = !task.completed
    const updates: Partial<Task> = {
      completed,
      completedAt: completed ? Date.now() : null,
      updatedAt: Date.now(),
    }

    await db.tasks.update(id, updates)
    set((state) => ({
      tasks: state.tasks.map(t =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }))

    // Award points when task is completed
    if (completed) {
      await useGameStore.getState().addPoints(POINTS_PER_TASK, id)
    }
  },

  // Reorder tasks: move task to new position, update parent and orderIndex
  reorderTasks: async (taskId, newParentId, prevTaskId, nextTaskId) => {
    const tasks = get().tasks
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Prevent moving task under itself or its descendants
    if (newParentId && isDescendant(tasks, newParentId, taskId)) {
      throw new Error('Cannot move task under itself or its descendants')
    }

    // Check depth constraint (max 3 levels)
    const newDepth = newParentId ? getTaskDepth(tasks, newParentId) + 1 : 0
    if (newDepth > 2) {
      throw new Error('Maximum nesting depth of 3 levels exceeded')
    }

    // Calculate new orderIndex based on siblings
    const prevTask = prevTaskId ? tasks.find(t => t.id === prevTaskId) : null
    const nextTask = nextTaskId ? tasks.find(t => t.id === nextTaskId) : null

    const newOrderIndex = calculateNewOrderIndex(
      prevTask?.orderIndex ?? null,
      nextTask?.orderIndex ?? null
    )

    // Update task with new parent and orderIndex
    const updates: Partial<Task> = {
      parentId: newParentId,
      orderIndex: newOrderIndex,
      updatedAt: Date.now(),
    }

    await db.tasks.update(taskId, updates)
    set((state) => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }))
  },

  // Expand/collapse task notepad
  expandTask: (id) => {
    set({ expandedTaskId: id })
  },

  // Selectors
  getRootTasks: () => {
    return get().tasks
      .filter(t => t.parentId === null && !t.completed)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  },

  getSubTasks: (parentId) => {
    return get().tasks
      .filter(t => t.parentId === parentId && !t.completed)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  },

  getTaskById: (id) => {
    return get().tasks.find(t => t.id === id)
  },
}))

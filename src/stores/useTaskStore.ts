import { create } from 'zustand'
import type { Task, TaskId } from '../types/task.ts'
import { db } from '../db/schema.ts'

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

  // Toggle complete: mark task, move to archive, update timestamps
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

    // TODO: Award points if completed (will integrate with useGameStore later)
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

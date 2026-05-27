import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTaskStore } from './useTaskStore.ts'
import { db } from '../db/schema.ts'

describe('useTaskStore', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await db.tasks.clear()

    // Reset the store state
    useTaskStore.setState({
      tasks: [],
      expandedTaskId: null,
    })
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.tasks.clear()
  })

  describe('addTask', () => {
    it('creates a new task with generated ID and timestamps', async () => {
      const taskId = await useTaskStore.getState().addTask({
        content: 'Test task',
        notes: '',
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      expect(taskId).toBeTruthy()
      expect(typeof taskId).toBe('string')

      const state = useTaskStore.getState()
      expect(state.tasks).toHaveLength(1)
      expect(state.tasks[0].content).toBe('Test task')
      expect(state.tasks[0].id).toBe(taskId)
      expect(state.tasks[0].createdAt).toBeGreaterThan(0)
      expect(state.tasks[0].updatedAt).toBeGreaterThan(0)
      expect(state.tasks[0].links).toEqual([])

      // Verify DB persistence
      const dbTask = await db.tasks.get(taskId)
      expect(dbTask).toBeDefined()
      expect(dbTask?.content).toBe('Test task')
    })

    it('creates task with parent ID for sub-tasks', async () => {
      const parentId = await useTaskStore.getState().addTask({
        content: 'Parent task',
        notes: '',
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      const childId = await useTaskStore.getState().addTask({
        content: 'Child task',
        notes: '',
        completed: false,
        completedAt: null,
        parentId,
        orderIndex: 1.0,
      })

      const state = useTaskStore.getState()
      const childTask = state.tasks.find(t => t.id === childId)

      expect(childTask?.parentId).toBe(parentId)
    })
  })

  describe('updateTask', () => {
    it('updates task content and timestamp', async () => {
      const taskId = await useTaskStore.getState().addTask({
        content: 'Original content',
        notes: '',
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      const originalUpdatedAt = useTaskStore.getState().tasks[0].updatedAt

      await useTaskStore.getState().updateTask(taskId, {
        content: 'Updated content',
      })

      const state = useTaskStore.getState()
      const task = state.tasks.find(t => t.id === taskId)

      expect(task?.content).toBe('Updated content')
      expect(task?.updatedAt).toBeGreaterThan(originalUpdatedAt)

      // Verify DB update
      const dbTask = await db.tasks.get(taskId)
      expect(dbTask?.content).toBe('Updated content')
    })
  })

  describe('deleteTask', () => {
    it('removes task from store and database', async () => {
      const taskId = await useTaskStore.getState().addTask({
        content: 'Task to delete',
        notes: '',
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      await useTaskStore.getState().deleteTask(taskId)

      const state = useTaskStore.getState()
      expect(state.tasks).toHaveLength(0)

      // Verify DB deletion
      const dbTask = await db.tasks.get(taskId)
      expect(dbTask).toBeUndefined()
    })
  })

  describe('toggleComplete', () => {
    it('marks incomplete task as complete with timestamp', async () => {
      const taskId = await useTaskStore.getState().addTask({
        content: 'Task to complete',
        notes: '',
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      await useTaskStore.getState().toggleComplete(taskId)

      const state = useTaskStore.getState()
      const task = state.tasks.find(t => t.id === taskId)

      expect(task?.completed).toBe(true)
      expect(task?.completedAt).toBeGreaterThan(0)

      // Verify DB update
      const dbTask = await db.tasks.get(taskId)
      expect(dbTask?.completed).toBe(true)
      expect(dbTask?.completedAt).toBeGreaterThan(0)
    })

    it('marks complete task as incomplete and clears timestamp', async () => {
      const taskId = await useTaskStore.getState().addTask({
        content: 'Completed task',
        notes: '',
        completed: true,
        completedAt: Date.now(),
        parentId: null,
        orderIndex: 1.0,
      })

      await useTaskStore.getState().toggleComplete(taskId)

      const state = useTaskStore.getState()
      const task = state.tasks.find(t => t.id === taskId)

      expect(task?.completed).toBe(false)
      expect(task?.completedAt).toBe(null)
    })
  })

  describe('selectors', () => {
    beforeEach(async () => {
      // Create a hierarchy of tasks
      const root1 = await useTaskStore.getState().addTask({
        content: 'Root 1',
        notes: '',
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      const root2 = await useTaskStore.getState().addTask({
        content: 'Root 2',
        notes: '',
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 2.0,
      })

      await useTaskStore.getState().addTask({
        content: 'Child 1 of Root 1',
        notes: '',
        completed: false,
        completedAt: null,
        parentId: root1,
        orderIndex: 1.0,
      })

      await useTaskStore.getState().addTask({
        content: 'Child 2 of Root 1',
        notes: '',
        completed: false,
        completedAt: null,
        parentId: root1,
        orderIndex: 2.0,
      })
    })

    it('getRootTasks returns only top-level tasks', () => {
      const rootTasks = useTaskStore.getState().getRootTasks()

      expect(rootTasks).toHaveLength(2)
      expect(rootTasks[0].content).toBe('Root 1')
      expect(rootTasks[1].content).toBe('Root 2')
    })

    it('getSubTasks returns children of a parent task', () => {
      const state = useTaskStore.getState()
      const root1 = state.tasks.find(t => t.content === 'Root 1')

      const subTasks = state.getSubTasks(root1!.id)

      expect(subTasks).toHaveLength(2)
      expect(subTasks[0].content).toBe('Child 1 of Root 1')
      expect(subTasks[1].content).toBe('Child 2 of Root 1')
    })

    it('getSubTasks sorts by orderIndex', () => {
      const state = useTaskStore.getState()
      const root1 = state.tasks.find(t => t.content === 'Root 1')

      const subTasks = state.getSubTasks(root1!.id)

      expect(subTasks[0].orderIndex).toBeLessThan(subTasks[1].orderIndex)
    })
  })

  describe('expandTask', () => {
    it('sets expandedTaskId', () => {
      const taskId = 'test-task-id'
      useTaskStore.getState().expandTask(taskId)

      expect(useTaskStore.getState().expandedTaskId).toBe(taskId)
    })

    it('clears expandedTaskId when passed null', () => {
      useTaskStore.setState({ expandedTaskId: 'some-task' })
      useTaskStore.getState().expandTask(null)

      expect(useTaskStore.getState().expandedTaskId).toBe(null)
    })
  })
})

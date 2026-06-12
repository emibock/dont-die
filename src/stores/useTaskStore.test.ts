import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTaskStore } from './useTaskStore.ts'
import { useGameStore } from './useGameStore.ts'
import { db } from '../db/schema.ts'
import { POINTS_PER_TASK } from '../types/game.ts'

describe('useTaskStore', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await db.tasks.clear()
    await db.gamification.clear()
    await db.dailyProgress.clear()

    // Reset the store state
    useTaskStore.setState({
      tasks: [],
      expandedTaskId: null,
    })

    // Initialize game store
    useGameStore.setState({
      consecutiveZeroDays: 0,
      lastActivityDate: null,
      totalPoints: 0,
    })
    await useGameStore.getState().hydrate()
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.tasks.clear()
    await db.gamification.clear()
    await db.dailyProgress.clear()
  })

  describe('addTask', () => {
    it('creates a new task with generated ID and timestamps', async () => {
      const taskId = await useTaskStore.getState().addTask({
        content: 'Test task',
        notes: '',
        links: [],
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
        links: [],
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      const childId = await useTaskStore.getState().addTask({
        content: 'Child task',
        notes: '',
        links: [],
        completed: false,
        completedAt: null,
        parentId,
        orderIndex: 1.0,
      })

      const state = useTaskStore.getState()
      const childTask = state.tasks.find(t => t.id === childId)

      expect(childTask?.parentId).toBe(parentId)
    })

    it('prevents creating a subtask under another subtask', async () => {
      // Create a top-level task
      const parentId = await useTaskStore.getState().addTask({
        content: 'Parent task',
        parentId: null,
      })

      // Create a first-level subtask (this should succeed)
      const subtaskId = await useTaskStore.getState().addTask({
        content: 'First-level subtask',
        parentId,
      })

      // Try to create a second-level subtask (this should fail)
      await expect(
        useTaskStore.getState().addTask({
          content: 'Second-level subtask',
          parentId: subtaskId,
        })
      ).rejects.toThrow('Cannot create a subtask under another subtask. Only top-level tasks can have subtasks.')
    })
  })

  describe('updateTask', () => {
    it('updates task content and timestamp', async () => {
      const taskId = await useTaskStore.getState().addTask({
        content: 'Original content',
        notes: '',
        links: [],
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
        links: [],
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
        links: [],
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
        links: [],
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

    it('awards points when task is completed', async () => {
      const taskId = await useTaskStore.getState().addTask({
        content: 'Task to complete',
        notes: '',
        links: [],
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      await useTaskStore.getState().toggleComplete(taskId)

      // Check total points updated
      const gameState = useGameStore.getState()
      expect(gameState.totalPoints).toBe(POINTS_PER_TASK)

      // Check daily progress recorded
      const today = new Date().toISOString().split('T')[0]
      const todayProgress = await db.dailyProgress.get(today)
      expect(todayProgress?.pointsEarned).toBe(POINTS_PER_TASK)
      expect(todayProgress?.tasksCompleted).toContain(taskId)

      // Check consecutive zero days reset
      expect(gameState.consecutiveZeroDays).toBe(0)
    })

    it('does not award points when task is uncompleted', async () => {
      const taskId = await useTaskStore.getState().addTask({
        content: 'Completed task',
        notes: '',
        links: [],
        completed: true,
        completedAt: Date.now(),
        parentId: null,
        orderIndex: 1.0,
      })

      // Manually set some initial points
      await useGameStore.getState().addPoints(5, 'other-task-id')

      await useTaskStore.getState().toggleComplete(taskId)

      // Points should remain unchanged (5 from initial, no deduction)
      const gameState = useGameStore.getState()
      expect(gameState.totalPoints).toBe(5)
    })

    it('persists points to database', async () => {
      const taskId = await useTaskStore.getState().addTask({
        content: 'Task to complete',
        notes: '',
        links: [],
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      await useTaskStore.getState().toggleComplete(taskId)

      // Check gamification state persisted
      const dbGamification = await db.gamification.get(1)
      expect(dbGamification?.totalPoints).toBe(POINTS_PER_TASK)
      expect(dbGamification?.consecutiveZeroDays).toBe(0)
      expect(dbGamification?.lastActivityDate).toBe(new Date().toISOString().split('T')[0])
    })
  })

  describe('selectors', () => {
    beforeEach(async () => {
      // Create a hierarchy of tasks
      const root1 = await useTaskStore.getState().addTask({
        content: 'Root 1',
        notes: '',
        links: [],
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      await useTaskStore.getState().addTask({
        content: 'Root 2',
        notes: '',
        links: [],
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 2.0,
      })

      await useTaskStore.getState().addTask({
        content: 'Child 1 of Root 1',
        notes: '',
        links: [],
        completed: false,
        completedAt: null,
        parentId: root1,
        orderIndex: 1.0,
      })

      await useTaskStore.getState().addTask({
        content: 'Child 2 of Root 1',
        notes: '',
        links: [],
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

  describe('reorderTasks', () => {
    let task1Id: string
    let task2Id: string
    let task3Id: string

    beforeEach(async () => {
      // Create tasks for reordering tests
      task1Id = await useTaskStore.getState().addTask({
        content: 'Task 1',
        notes: '',
        links: [],
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 1.0,
      })

      task2Id = await useTaskStore.getState().addTask({
        content: 'Task 2',
        notes: '',
        links: [],
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 2.0,
      })

      task3Id = await useTaskStore.getState().addTask({
        content: 'Task 3',
        notes: '',
        links: [],
        completed: false,
        completedAt: null,
        parentId: null,
        orderIndex: 3.0,
      })
    })

    it('reorders task between siblings', async () => {
      // Move task1 between task2 and task3
      await useTaskStore.getState().reorderTasks(task1Id, null, task2Id, task3Id)

      const task1 = useTaskStore.getState().getTaskById(task1Id)
      const task2 = useTaskStore.getState().getTaskById(task2Id)
      const task3 = useTaskStore.getState().getTaskById(task3Id)

      expect(task1!.orderIndex).toBeGreaterThan(task2!.orderIndex)
      expect(task1!.orderIndex).toBeLessThan(task3!.orderIndex)
    })

    it('prevents circular reference', async () => {
      // Create parent-child relationship
      await useTaskStore.getState().reorderTasks(task2Id, task1Id, null, null)

      // Try to move task1 under task2 (circular)
      await expect(
        useTaskStore.getState().reorderTasks(task1Id, task2Id, null, null)
      ).rejects.toThrow('Cannot move task under itself or its descendants')
    })

    it('prevents exceeding max depth', async () => {
      // Create depth 1: task2 under task1 (this is allowed)
      await useTaskStore.getState().reorderTasks(task2Id, task1Id, null, null)

      // Try to move task3 under task2 (would create a subtask under a subtask, which is not allowed)
      await expect(
        useTaskStore.getState().reorderTasks(task3Id, task2Id, null, null)
      ).rejects.toThrow('Cannot move task under a subtask. Only top-level tasks can have subtasks.')
    })

    it('moves task to new parent', async () => {
      await useTaskStore.getState().reorderTasks(task3Id, task1Id, null, null)

      const task3 = useTaskStore.getState().getTaskById(task3Id)
      expect(task3!.parentId).toBe(task1Id)
    })

    it('updates orderIndex when moving to end', async () => {
      // Move task1 to end (after task3)
      await useTaskStore.getState().reorderTasks(task1Id, null, task3Id, null)

      const task1 = useTaskStore.getState().getTaskById(task1Id)
      const task3 = useTaskStore.getState().getTaskById(task3Id)

      expect(task1!.orderIndex).toBeGreaterThan(task3!.orderIndex)
    })

    it('updates task in database', async () => {
      await useTaskStore.getState().reorderTasks(task1Id, task2Id, null, null)

      const dbTask = await db.tasks.get(task1Id)
      expect(dbTask?.parentId).toBe(task2Id)
    })
  })
})

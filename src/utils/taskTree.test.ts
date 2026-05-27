import { describe, it, expect } from 'vitest'
import { isDescendant, getTaskDepth, calculateNewOrderIndex } from './taskTree.ts'
import type { Task } from '../types/task.ts'

describe('taskTree utilities', () => {
  const mockTasks: Task[] = [
    {
      id: 'root-1',
      content: 'Root task 1',
      notes: '',
      links: [],
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parentId: null,
      orderIndex: 1.0,
    },
    {
      id: 'child-1-1',
      content: 'Child 1.1',
      notes: '',
      links: [],
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parentId: 'root-1',
      orderIndex: 1.0,
    },
    {
      id: 'grandchild-1-1-1',
      content: 'Grandchild 1.1.1',
      notes: '',
      links: [],
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parentId: 'child-1-1',
      orderIndex: 1.0,
    },
    {
      id: 'root-2',
      content: 'Root task 2',
      notes: '',
      links: [],
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parentId: null,
      orderIndex: 2.0,
    },
  ]

  describe('isDescendant', () => {
    it('returns true for direct child', () => {
      expect(isDescendant(mockTasks, 'child-1-1', 'root-1')).toBe(true)
    })

    it('returns true for grandchild', () => {
      expect(isDescendant(mockTasks, 'grandchild-1-1-1', 'root-1')).toBe(true)
    })

    it('returns false for unrelated tasks', () => {
      expect(isDescendant(mockTasks, 'root-2', 'root-1')).toBe(false)
    })

    it('returns false for parent checking against child', () => {
      expect(isDescendant(mockTasks, 'root-1', 'child-1-1')).toBe(false)
    })

    it('returns false for task checking against itself', () => {
      expect(isDescendant(mockTasks, 'root-1', 'root-1')).toBe(false)
    })
  })

  describe('getTaskDepth', () => {
    it('returns 0 for root task', () => {
      expect(getTaskDepth(mockTasks, 'root-1')).toBe(0)
    })

    it('returns 1 for direct child', () => {
      expect(getTaskDepth(mockTasks, 'child-1-1')).toBe(1)
    })

    it('returns 2 for grandchild', () => {
      expect(getTaskDepth(mockTasks, 'grandchild-1-1-1')).toBe(2)
    })
  })

  describe('calculateNewOrderIndex', () => {
    it('inserts at start when no previous item', () => {
      const result = calculateNewOrderIndex(null, 1.0)
      expect(result).toBe(0.0)
    })

    it('inserts at end when no next item', () => {
      const result = calculateNewOrderIndex(5.0, null)
      expect(result).toBe(6.0)
    })

    it('inserts between two items', () => {
      const result = calculateNewOrderIndex(1.0, 2.0)
      expect(result).toBe(1.5)
    })

    it('returns 1.0 for empty list', () => {
      const result = calculateNewOrderIndex(null, null)
      expect(result).toBe(1.0)
    })

    it('handles fractional indices', () => {
      const result = calculateNewOrderIndex(1.5, 2.5)
      expect(result).toBe(2.0)
    })
  })
})

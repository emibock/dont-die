import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { SubTaskList } from './SubTaskList.tsx'
import { useTaskStore } from '../stores/useTaskStore.ts'
import { db } from '../db/schema.ts'

describe('SubTaskList', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    useTaskStore.setState({ tasks: [], expandedTaskId: null })
    await useTaskStore.getState().hydrate()
  })

  afterEach(async () => {
    await db.tasks.clear()
  })

  it('does not render when there are no sub-tasks', () => {
    const { container } = render(<SubTaskList parentId="parent-id" />)
    expect(container.firstChild).toBeNull()
  })

  it('does not render when only completed sub-tasks exist', async () => {
    const parentId = await useTaskStore.getState().addTask({
      content: 'Parent task',
      parentId: null,
    })

    const subTaskId = await useTaskStore.getState().addTask({
      content: 'Completed sub-task',
      parentId,
    })

    await useTaskStore.getState().toggleComplete(subTaskId)

    const { container } = render(<SubTaskList parentId={parentId} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders sub-tasks for given parent', async () => {
    const parentId = await useTaskStore.getState().addTask({
      content: 'Parent task',
      parentId: null,
    })

    await useTaskStore.getState().addTask({
      content: 'Sub-task 1',
      parentId,
    })

    await useTaskStore.getState().addTask({
      content: 'Sub-task 2',
      parentId,
    })

    render(<SubTaskList parentId={parentId} />)

    expect(screen.getByText('Sub-task 1')).toBeInTheDocument()
    expect(screen.getByText('Sub-task 2')).toBeInTheDocument()
  })

  it('only renders sub-tasks for the specified parent', async () => {
    const parent1 = await useTaskStore.getState().addTask({
      content: 'Parent 1',
      parentId: null,
    })

    const parent2 = await useTaskStore.getState().addTask({
      content: 'Parent 2',
      parentId: null,
    })

    await useTaskStore.getState().addTask({
      content: 'Sub-task of parent 1',
      parentId: parent1,
    })

    await useTaskStore.getState().addTask({
      content: 'Sub-task of parent 2',
      parentId: parent2,
    })

    render(<SubTaskList parentId={parent1} />)

    expect(screen.getByText('Sub-task of parent 1')).toBeInTheDocument()
    expect(screen.queryByText('Sub-task of parent 2')).not.toBeInTheDocument()
  })

  it('renders add sub-task button for each sub-task', async () => {
    const parentId = await useTaskStore.getState().addTask({
      content: 'Parent task',
      parentId: null,
    })

    await useTaskStore.getState().addTask({
      content: 'Sub-task',
      parentId,
    })

    render(<SubTaskList parentId={parentId} />)

    expect(screen.getByRole('button', { name: /Add sub-task/i })).toBeInTheDocument()
  })

  it('renders nested sub-tasks (recursive)', async () => {
    const parent = await useTaskStore.getState().addTask({
      content: 'Parent',
      parentId: null,
    })

    const subTask = await useTaskStore.getState().addTask({
      content: 'Sub-task',
      parentId: parent,
    })

    await useTaskStore.getState().addTask({
      content: 'Sub-sub-task',
      parentId: subTask,
    })

    render(<SubTaskList parentId={parent} />)

    expect(screen.getByText('Sub-task')).toBeInTheDocument()
    expect(screen.getByText('Sub-sub-task')).toBeInTheDocument()
  })

  it('renders sub-tasks in order by orderIndex', async () => {
    const parentId = await useTaskStore.getState().addTask({
      content: 'Parent task',
      parentId: null,
    })

    // Add tasks with specific orderIndex
    await useTaskStore.getState().addTask({
      content: 'Third',
      parentId,
      orderIndex: 3.0,
    })

    await useTaskStore.getState().addTask({
      content: 'First',
      parentId,
      orderIndex: 1.0,
    })

    await useTaskStore.getState().addTask({
      content: 'Second',
      parentId,
      orderIndex: 2.0,
    })

    render(<SubTaskList parentId={parentId} />)

    const subTasks = screen.getAllByRole('checkbox')
    const parent = subTasks[0].closest('.subtask-list')
    const textContent = parent?.textContent || ''

    // Check order in the rendered text
    expect(textContent.indexOf('First')).toBeLessThan(textContent.indexOf('Second'))
    expect(textContent.indexOf('Second')).toBeLessThan(textContent.indexOf('Third'))
  })

  it('meets accessibility standards with sub-tasks', async () => {
    const parentId = await useTaskStore.getState().addTask({
      content: 'Parent task',
      parentId: null,
    })

    await useTaskStore.getState().addTask({
      content: 'Sub-task 1',
      parentId,
    })

    await useTaskStore.getState().addTask({
      content: 'Sub-task 2',
      parentId,
    })

    const { container } = render(<SubTaskList parentId={parentId} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards with nested sub-tasks', async () => {
    const parent = await useTaskStore.getState().addTask({
      content: 'Parent',
      parentId: null,
    })

    const subTask = await useTaskStore.getState().addTask({
      content: 'Sub-task',
      parentId: parent,
    })

    await useTaskStore.getState().addTask({
      content: 'Sub-sub-task',
      parentId: subTask,
    })

    const { container } = render(<SubTaskList parentId={parent} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { ArchiveView } from './ArchiveView.tsx'
import { useTaskStore } from '../stores/useTaskStore.ts'
import { db } from '../db/schema.ts'

describe('ArchiveView', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    useTaskStore.setState({ tasks: [], expandedTaskId: null })
    await useTaskStore.getState().hydrate()
  })

  afterEach(async () => {
    await db.tasks.clear()
  })

  it('does not render when there are no completed tasks', () => {
    const { container } = render(<ArchiveView />)
    expect(container.firstChild).toBeNull()
  })

  it('does not render when only incomplete tasks exist', async () => {
    await useTaskStore.getState().addTask({
      content: 'Active task',
      parentId: null,
    })

    const { container } = render(<ArchiveView />)
    expect(container.firstChild).toBeNull()
  })

  it('renders toggle button when completed tasks exist', async () => {
    const taskId = await useTaskStore.getState().addTask({
      content: 'Completed task',
      parentId: null,
    })
    await useTaskStore.getState().toggleComplete(taskId)

    render(<ArchiveView />)
    expect(screen.getByRole('button', { name: /Completed Tasks \(1\)/i })).toBeInTheDocument()
  })

  it('shows correct count of completed tasks', async () => {
    const task1 = await useTaskStore.getState().addTask({
      content: 'Task 1',
      parentId: null,
    })
    const task2 = await useTaskStore.getState().addTask({
      content: 'Task 2',
      parentId: null,
    })
    const task3 = await useTaskStore.getState().addTask({
      content: 'Task 3',
      parentId: null,
    })

    await useTaskStore.getState().toggleComplete(task1)
    await useTaskStore.getState().toggleComplete(task2)
    await useTaskStore.getState().toggleComplete(task3)

    render(<ArchiveView />)
    expect(screen.getByRole('button', { name: /Completed Tasks \(3\)/i })).toBeInTheDocument()
  })

  it('starts collapsed by default', async () => {
    const taskId = await useTaskStore.getState().addTask({
      content: 'Completed task',
      parentId: null,
    })
    await useTaskStore.getState().toggleComplete(taskId)

    render(<ArchiveView />)

    const button = screen.getByRole('button', { name: /Completed Tasks/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Completed task')).not.toBeInTheDocument()
  })

  it('expands to show completed tasks when clicked', async () => {
    const taskId = await useTaskStore.getState().addTask({
      content: 'Completed task',
      parentId: null,
    })
    await useTaskStore.getState().toggleComplete(taskId)

    const user = userEvent.setup()
    render(<ArchiveView />)

    const button = screen.getByRole('button', { name: /Completed Tasks/i })
    await user.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Completed task')).toBeInTheDocument()
  })

  it('collapses when clicked again', async () => {
    const taskId = await useTaskStore.getState().addTask({
      content: 'Completed task',
      parentId: null,
    })
    await useTaskStore.getState().toggleComplete(taskId)

    const user = userEvent.setup()
    render(<ArchiveView />)

    const button = screen.getByRole('button', { name: /Completed Tasks/i })

    // Expand
    await user.click(button)
    expect(screen.getByText('Completed task')).toBeInTheDocument()

    // Collapse
    await user.click(button)
    expect(screen.queryByText('Completed task')).not.toBeInTheDocument()
  })

  it('only shows root-level completed tasks', async () => {
    const parentId = await useTaskStore.getState().addTask({
      content: 'Parent task',
      parentId: null,
    })
    const childId = await useTaskStore.getState().addTask({
      content: 'Child task',
      parentId,
    })

    await useTaskStore.getState().toggleComplete(parentId)
    await useTaskStore.getState().toggleComplete(childId)

    const user = userEvent.setup()
    render(<ArchiveView />)

    const button = screen.getByRole('button', { name: /Completed Tasks \(1\)/i })
    await user.click(button)

    expect(screen.getByText('Parent task')).toBeInTheDocument()
    // Child task should not be directly visible in archive, but may be nested under parent
  })

  it('updates count when tasks are completed', async () => {
    const task1 = await useTaskStore.getState().addTask({
      content: 'Task 1',
      parentId: null,
    })
    await useTaskStore.getState().toggleComplete(task1)

    const { rerender } = render(<ArchiveView />)
    expect(screen.getByRole('button', { name: /Completed Tasks \(1\)/i })).toBeInTheDocument()

    // Complete another task
    const task2 = await useTaskStore.getState().addTask({
      content: 'Task 2',
      parentId: null,
    })
    await useTaskStore.getState().toggleComplete(task2)

    rerender(<ArchiveView />)
    expect(screen.getByRole('button', { name: /Completed Tasks \(2\)/i })).toBeInTheDocument()
  })

  it('meets accessibility standards when collapsed', async () => {
    const taskId = await useTaskStore.getState().addTask({
      content: 'Completed task',
      parentId: null,
    })
    await useTaskStore.getState().toggleComplete(taskId)

    const { container } = render(<ArchiveView />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards when expanded', async () => {
    const taskId = await useTaskStore.getState().addTask({
      content: 'Completed task',
      parentId: null,
    })
    await useTaskStore.getState().toggleComplete(taskId)

    const user = userEvent.setup()
    const { container } = render(<ArchiveView />)

    const button = screen.getByRole('button', { name: /Completed Tasks/i })
    await user.click(button)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

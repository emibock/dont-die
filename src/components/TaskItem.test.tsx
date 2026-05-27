import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { TaskItem } from './TaskItem.tsx'
import { useTaskStore } from '../stores/useTaskStore.ts'
import { db } from '../db/schema.ts'
import { DndContext } from '@dnd-kit/core'
import type { Task } from '../types/task.ts'

// Wrapper to provide DndContext for drag-and-drop
function DndWrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>
}

describe('TaskItem', () => {
  let mockTask: Task

  beforeEach(async () => {
    await db.tasks.clear()
    useTaskStore.setState({
      tasks: [],
      expandedTaskId: null,
    })

    mockTask = {
      id: 'test-task-1',
      content: 'Test Task',
      notes: '',
      links: [],
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parentId: null,
      orderIndex: 1.0,
    }

    await db.tasks.add(mockTask)
    useTaskStore.setState({ tasks: [mockTask] })
  })

  afterEach(async () => {
    await db.tasks.clear()
  })

  it('renders task content', () => {
    render(<TaskItem task={mockTask} />, { wrapper: DndWrapper })

    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('expands task when content is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={mockTask} />, { wrapper: DndWrapper })

    const taskContent = screen.getByText('Test Task')
    await user.click(taskContent)

    // Should now show expanded view
    expect(screen.getByLabelText('Notes for "Test Task"')).toBeInTheDocument()
    expect(screen.getByLabelText('Collapse notepad')).toBeInTheDocument()
  })

  it('expands task when Enter key is pressed on content', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={mockTask} />, { wrapper: DndWrapper })

    const taskContent = screen.getByText('Test Task')
    taskContent.focus()
    await user.keyboard('{Enter}')

    // Should now show expanded view
    expect(screen.getByLabelText('Notes for "Test Task"')).toBeInTheDocument()
  })

  it('expands task when Space key is pressed on content', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={mockTask} />, { wrapper: DndWrapper })

    const taskContent = screen.getByText('Test Task')
    taskContent.focus()
    await user.keyboard(' ')

    // Should now show expanded view
    expect(screen.getByLabelText('Notes for "Test Task"')).toBeInTheDocument()
  })

  it('collapses task when collapse button is clicked', async () => {
    const user = userEvent.setup()

    // Start with task expanded
    useTaskStore.setState({ expandedTaskId: mockTask.id })

    render(<TaskItem task={mockTask} />, { wrapper: DndWrapper })

    const collapseButton = screen.getByLabelText('Collapse notepad')
    await user.click(collapseButton)

    // Should now show compact view
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.queryByLabelText('Notes for "Test Task"')).not.toBeInTheDocument()
  })

  it('shows drag handle with accessible label', () => {
    render(<TaskItem task={mockTask} />, { wrapper: DndWrapper })

    expect(screen.getByLabelText('Drag to reorder "Test Task"')).toBeInTheDocument()
  })

  it('shows checkbox with accessible label', () => {
    render(<TaskItem task={mockTask} />, { wrapper: DndWrapper })

    const checkbox = screen.getByLabelText('Mark "Test Task" as complete')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it('shows delete button with accessible label', () => {
    render(<TaskItem task={mockTask} />, { wrapper: DndWrapper })

    expect(screen.getByLabelText('Delete "Test Task"')).toBeInTheDocument()
  })

  it('meets accessibility standards in compact view', async () => {
    const { container } = render(<TaskItem task={mockTask} />, { wrapper: DndWrapper })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards in expanded view', async () => {
    useTaskStore.setState({ expandedTaskId: mockTask.id })

    const { container } = render(<TaskItem task={mockTask} />, { wrapper: DndWrapper })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

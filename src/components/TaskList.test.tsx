import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { TaskList } from './TaskList.tsx'
import { useTaskStore } from '../stores/useTaskStore.ts'
import { db } from '../db/schema.ts'

describe('TaskList', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    useTaskStore.setState({
      tasks: [],
      expandedTaskId: null,
    })
  })

  afterEach(async () => {
    await db.tasks.clear()
  })

  it('renders empty state when no tasks exist', () => {
    render(<TaskList />)

    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('No tasks yet. Add one to get started!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument()
  })

  it('shows add task form when button is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskList />)

    const addButton = screen.getByRole('button', { name: /add task/i })
    await user.click(addButton)

    expect(screen.getByPlaceholderText('Task name...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('creates a new task when form is submitted', async () => {
    const user = userEvent.setup()
    render(<TaskList />)

    // Click add button
    const addButton = screen.getByRole('button', { name: /add task/i })
    await user.click(addButton)

    // Fill in task name
    const input = screen.getByPlaceholderText('Task name...')
    await user.type(input, 'My first task')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /^add$/i })
    await user.click(submitButton)

    // Verify task appears
    await waitFor(() => {
      expect(screen.getByText('My first task')).toBeInTheDocument()
    })

    // Verify empty state is gone
    expect(screen.queryByText('No tasks yet. Add one to get started!')).not.toBeInTheDocument()
  })

  it('cancels task creation when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskList />)

    // Click add button
    const addButton = screen.getByRole('button', { name: /add task/i })
    await user.click(addButton)

    // Fill in task name
    const input = screen.getByPlaceholderText('Task name...')
    await user.type(input, 'My first task')

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Verify form is hidden
    expect(screen.queryByPlaceholderText('Task name...')).not.toBeInTheDocument()

    // Verify task was not created
    expect(screen.queryByText('My first task')).not.toBeInTheDocument()
  })

  it('toggles task completion when checkbox is clicked', async () => {
    const user = userEvent.setup()

    // Pre-populate with a task
    await useTaskStore.getState().addTask({
      content: 'Test task',
      notes: '',
      links: [],
      completed: false,
      completedAt: null,
      parentId: null,
      orderIndex: 1.0,
    })

    render(<TaskList />)

    // Find checkbox
    const checkbox = screen.getByRole('checkbox', { name: /mark "test task" as complete/i })
    expect(checkbox).not.toBeChecked()

    // Toggle completion
    await user.click(checkbox)

    // Verify task is removed from active list (completed tasks are filtered out)
    await waitFor(() => {
      expect(screen.queryByText('Test task')).not.toBeInTheDocument()
      expect(screen.getByText('No tasks yet. Add one to get started!')).toBeInTheDocument()
    })

    // Verify task is actually marked as complete in the store
    const completedTask = useTaskStore.getState().tasks.find(t => t.content === 'Test task')
    expect(completedTask?.completed).toBe(true)
    expect(completedTask?.completedAt).toBeTruthy()
  })

  it('meets accessibility standards', async () => {
    render(<TaskList />)
    const results = await axe(screen.getByRole('heading', { name: 'Tasks' }).parentElement!)
    expect(results).toHaveNoViolations()
  })
})

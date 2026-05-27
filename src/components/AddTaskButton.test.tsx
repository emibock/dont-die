import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { AddTaskButton } from './AddTaskButton.tsx'
import { useTaskStore } from '../stores/useTaskStore.ts'
import { db } from '../db/schema.ts'

describe('AddTaskButton', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    useTaskStore.setState({ tasks: [], expandedTaskId: null })
    await useTaskStore.getState().hydrate()
  })

  afterEach(async () => {
    await db.tasks.clear()
  })

  it('renders add task button by default', () => {
    render(<AddTaskButton />)
    expect(screen.getByRole('button', { name: /Add task/i })).toBeInTheDocument()
  })

  it('renders add sub-task button when parentId is provided', () => {
    render(<AddTaskButton parentId="parent-id" />)
    expect(screen.getByRole('button', { name: /Add sub-task/i })).toBeInTheDocument()
  })

  it('shows form when add button is clicked', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    expect(screen.getByLabelText(/Task name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  it('adds task when form is submitted', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const input = screen.getByLabelText(/Task name/i)
    await user.type(input, 'New task')

    const submitButton = screen.getByRole('button', { name: /Add/i })
    await user.click(submitButton)

    await waitFor(() => {
      const tasks = useTaskStore.getState().tasks
      expect(tasks).toHaveLength(1)
      expect(tasks[0].content).toBe('New task')
    })
  })

  it('adds sub-task with correct parentId', async () => {
    const parentId = await useTaskStore.getState().addTask({
      content: 'Parent task',
      parentId: null,
    })

    const user = userEvent.setup()
    render(<AddTaskButton parentId={parentId} />)

    const addButton = screen.getByRole('button', { name: /Add sub-task/i })
    await user.click(addButton)

    const input = screen.getByLabelText(/Sub-task name/i)
    await user.type(input, 'Sub task')

    const submitButton = screen.getByRole('button', { name: /Add/i })
    await user.click(submitButton)

    await waitFor(() => {
      const tasks = useTaskStore.getState().tasks
      const subTask = tasks.find(t => t.content === 'Sub task')
      expect(subTask).toBeDefined()
      expect(subTask?.parentId).toBe(parentId)
    })
  })

  it('trims whitespace from task content', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const input = screen.getByLabelText(/Task name/i)
    await user.type(input, '  Task with spaces  ')

    const submitButton = screen.getByRole('button', { name: /Add/i })
    await user.click(submitButton)

    await waitFor(() => {
      const tasks = useTaskStore.getState().tasks
      expect(tasks[0].content).toBe('Task with spaces')
    })
  })

  it('does not submit if content is empty', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const submitButton = screen.getByRole('button', { name: /Add/i })
    await user.click(submitButton)

    // Should still be in form mode
    expect(screen.getByLabelText(/Task name/i)).toBeInTheDocument()
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('does not submit if content is only whitespace', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const input = screen.getByLabelText(/Task name/i)
    await user.type(input, '   ')

    const submitButton = screen.getByRole('button', { name: /Add/i })
    await user.click(submitButton)

    // Should still be in form mode
    expect(screen.getByLabelText(/Task name/i)).toBeInTheDocument()
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('disables submit button when input is empty', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const submitButton = screen.getByRole('button', { name: /Add/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when input has content', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const input = screen.getByLabelText(/Task name/i)
    const submitButton = screen.getByRole('button', { name: /Add/i })

    expect(submitButton).toBeDisabled()

    await user.type(input, 'New task')
    expect(submitButton).not.toBeDisabled()
  })

  it('cancels and returns to button view', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const input = screen.getByLabelText(/Task name/i)
    await user.type(input, 'Some content')

    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelButton)

    // Should be back to button view
    expect(screen.getByRole('button', { name: /Add task/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Task name/i)).not.toBeInTheDocument()
  })

  it('clears input when cancelled', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const input = screen.getByLabelText(/Task name/i)
    await user.type(input, 'Some content')

    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelButton)

    // Open form again
    const addButtonAgain = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButtonAgain)

    // Input should be empty
    const inputAgain = screen.getByLabelText(/Task name/i)
    expect(inputAgain).toHaveValue('')
  })

  it('clears input after successful submission', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const input = screen.getByLabelText(/Task name/i)
    await user.type(input, 'First task')

    const submitButton = screen.getByRole('button', { name: /Add/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add task/i })).toBeInTheDocument()
    })

    // Open form again
    const addButtonAgain = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButtonAgain)

    // Input should be empty
    const inputAgain = screen.getByLabelText(/Task name/i)
    expect(inputAgain).toHaveValue('')
  })

  it('focuses input when form opens', async () => {
    const user = userEvent.setup()
    render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const input = screen.getByLabelText(/Task name/i)
    expect(input).toHaveFocus()
  })

  it('meets accessibility standards in button mode', async () => {
    const { container } = render(<AddTaskButton />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards in form mode', async () => {
    const user = userEvent.setup()
    const { container } = render(<AddTaskButton />)

    const addButton = screen.getByRole('button', { name: /Add task/i })
    await user.click(addButton)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards for sub-task button', async () => {
    const { container } = render(<AddTaskButton parentId="parent-id" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

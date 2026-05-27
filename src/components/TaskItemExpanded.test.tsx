import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { TaskItemExpanded } from './TaskItemExpanded.tsx'
import { useTaskStore } from '../stores/useTaskStore.ts'
import { db } from '../db/schema.ts'
import type { Task } from '../types/task.ts'

describe('TaskItemExpanded', () => {
  let mockTask: Task
  const mockOnCollapse = vi.fn()

  beforeEach(async () => {
    await db.tasks.clear()
    useTaskStore.setState({
      tasks: [],
      expandedTaskId: null,
    })

    mockTask = {
      id: 'test-task-1',
      content: 'Test Task',
      notes: 'Initial notes',
      links: [],
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parentId: null,
      orderIndex: 1.0,
    }

    // Add task to store and DB
    await db.tasks.add(mockTask)
    useTaskStore.setState({ tasks: [mockTask] })
  })

  afterEach(async () => {
    await db.tasks.clear()
    mockOnCollapse.mockClear()
  })

  it('renders task title and notes textarea', () => {
    render(<TaskItemExpanded task={mockTask} onCollapse={mockOnCollapse} />)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes for "Test Task"')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Initial notes')).toBeInTheDocument()
  })

  it('calls onCollapse when collapse button is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskItemExpanded task={mockTask} onCollapse={mockOnCollapse} />)

    const collapseButton = screen.getByLabelText('Collapse notepad')
    await user.click(collapseButton)

    expect(mockOnCollapse).toHaveBeenCalledTimes(1)
  })

  it('updates notes when typing in textarea', async () => {
    const user = userEvent.setup()
    render(<TaskItemExpanded task={mockTask} onCollapse={mockOnCollapse} />)

    const textarea = screen.getByLabelText('Notes for "Test Task"')
    await user.clear(textarea)
    await user.type(textarea, 'New notes content')

    expect(textarea).toHaveValue('New notes content')
  })

  it('auto-saves notes on blur after 500ms', async () => {
    const user = userEvent.setup()
    render(<TaskItemExpanded task={mockTask} onCollapse={mockOnCollapse} />)

    const textarea = screen.getByLabelText('Notes for "Test Task"')
    await user.clear(textarea)
    await user.type(textarea, 'Updated notes')

    // Blur the textarea
    await user.tab()

    // Wait for debounce and save
    await waitFor(
      async () => {
        const dbTask = await db.tasks.get(mockTask.id)
        expect(dbTask?.notes).toBe('Updated notes')
      },
      { timeout: 1000 }
    )
  })

  it('extracts and displays URLs from notes', async () => {
    const user = userEvent.setup()
    render(<TaskItemExpanded task={mockTask} onCollapse={mockOnCollapse} />)

    const textarea = screen.getByLabelText('Notes for "Test Task"')
    await user.clear(textarea)
    await user.type(textarea, 'Check out https://example.com and http://test.org')

    // URLs should appear in the links section
    expect(screen.getByText('Links:')).toBeInTheDocument()
    expect(screen.getByText('https://example.com')).toBeInTheDocument()
    expect(screen.getByText('http://test.org')).toBeInTheDocument()
  })

  it('renders links as clickable anchors with target blank', async () => {
    const user = userEvent.setup()
    render(<TaskItemExpanded task={mockTask} onCollapse={mockOnCollapse} />)

    const textarea = screen.getByLabelText('Notes for "Test Task"')
    await user.clear(textarea)
    await user.type(textarea, 'Visit https://example.com')

    const link = screen.getByText('https://example.com')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not show links section when no URLs present', () => {
    render(<TaskItemExpanded task={mockTask} onCollapse={mockOnCollapse} />)

    expect(screen.queryByText('Links:')).not.toBeInTheDocument()
  })

  it('shows saving indicator during save', async () => {
    const user = userEvent.setup()
    render(<TaskItemExpanded task={mockTask} onCollapse={mockOnCollapse} />)

    const textarea = screen.getByLabelText('Notes for "Test Task"')
    await user.clear(textarea)
    await user.type(textarea, 'New content')
    await user.tab()

    // Should briefly show saving indicator
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })

  it('persists extracted links to database', async () => {
    const user = userEvent.setup()
    render(<TaskItemExpanded task={mockTask} onCollapse={mockOnCollapse} />)

    const textarea = screen.getByLabelText('Notes for "Test Task"')
    await user.clear(textarea)
    await user.type(textarea, 'Links: https://example.com and http://test.org')
    await user.tab()

    await waitFor(
      async () => {
        const dbTask = await db.tasks.get(mockTask.id)
        expect(dbTask?.links).toEqual(['https://example.com', 'http://test.org'])
      },
      { timeout: 1000 }
    )
  })

  it('meets accessibility standards', async () => {
    const { container } = render(
      <TaskItemExpanded task={mockTask} onCollapse={mockOnCollapse} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

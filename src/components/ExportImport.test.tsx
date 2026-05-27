import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { ExportImport } from './ExportImport.tsx'
import { useTaskStore } from '../stores/useTaskStore.ts'
import { useGameStore } from '../stores/useGameStore.ts'
import { db } from '../db/schema.ts'

describe('ExportImport', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    await db.gamification.clear()
    await db.dailyProgress.clear()

    useTaskStore.setState({ tasks: [], expandedTaskId: null })
    useGameStore.setState({
      consecutiveZeroDays: 0,
      lastActivityDate: null,
      totalPoints: 0,
    })

    await Promise.all([
      useTaskStore.getState().hydrate(),
      useGameStore.getState().hydrate(),
    ])
  })

  afterEach(async () => {
    await db.tasks.clear()
    await db.gamification.clear()
    await db.dailyProgress.clear()
    vi.restoreAllMocks()
  })

  it('renders export and import buttons', () => {
    render(<ExportImport />)

    expect(screen.getByRole('button', { name: /Export Backup/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Import Backup/i })).toBeInTheDocument()
  })

  it('renders backup tip', () => {
    render(<ExportImport />)
    expect(screen.getByText(/Export a backup regularly/i)).toBeInTheDocument()
  })

  it('exports data when export button is clicked', async () => {
    // Mock URL.createObjectURL and related methods
    const mockUrl = 'blob:mock-url'
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl)
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    // Mock HTMLAnchorElement.click
    const originalClick = HTMLAnchorElement.prototype.click
    const clickSpy = vi.fn()
    HTMLAnchorElement.prototype.click = clickSpy

    // Add some test data
    await useTaskStore.getState().addTask({ content: 'Test task', parentId: null })
    await useGameStore.getState().addPoints(5, 'task-1')

    const user = userEvent.setup()
    render(<ExportImport />)

    const exportButton = screen.getByRole('button', { name: /Export Backup/i })
    await user.click(exportButton)

    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl)

    // Restore original click
    HTMLAnchorElement.prototype.click = originalClick
  })

  it('triggers file input when import button is clicked', async () => {
    const user = userEvent.setup()
    render(<ExportImport />)

    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click')

    const importButton = screen.getByRole('button', { name: /Import Backup/i })
    await user.click(importButton)

    expect(clickSpy).toHaveBeenCalled()
  })

  it('shows error message for invalid JSON', async () => {
    const user = userEvent.setup()
    render(<ExportImport />)

    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const file = new File(['invalid json{'], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/is not valid JSON/i)).toBeInTheDocument()
    })
  })

  it('shows error for unsupported version', async () => {
    const user = userEvent.setup()
    render(<ExportImport />)

    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const invalidData = JSON.stringify({
      version: 2,
      exportedAt: Date.now(),
      tasks: [],
      dailyProgress: [],
      gamification: {},
    })
    const file = new File([invalidData], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/Unsupported backup version/i)).toBeInTheDocument()
    })
  })

  it('shows error for missing tasks array', async () => {
    const user = userEvent.setup()
    render(<ExportImport />)

    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const invalidData = JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      dailyProgress: [],
      gamification: {},
    })
    const file = new File([invalidData], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/missing tasks array/i)).toBeInTheDocument()
    })
  })

  it('shows error for missing dailyProgress array', async () => {
    const user = userEvent.setup()
    render(<ExportImport />)

    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const invalidData = JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      tasks: [],
      gamification: {},
    })
    const file = new File([invalidData], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/missing dailyProgress array/i)).toBeInTheDocument()
    })
  })

  it('shows error for missing gamification data', async () => {
    const user = userEvent.setup()
    render(<ExportImport />)

    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const invalidData = JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      tasks: [],
      dailyProgress: [],
    })
    const file = new File([invalidData], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/missing gamification data/i)).toBeInTheDocument()
    })
  })

  it('imports valid backup after confirmation', async () => {
    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    // Create initial data
    const taskId = await useTaskStore.getState().addTask({ content: 'Old task', parentId: null })
    await useGameStore.getState().addPoints(3, taskId)

    const user = userEvent.setup()
    render(<ExportImport />)

    // Create backup data with different content
    const backupData = {
      version: 1,
      exportedAt: Date.now(),
      tasks: [{
        id: 'new-task-id',
        content: 'Imported task',
        notes: '',
        links: [],
        completed: false,
        completedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parentId: null,
        orderIndex: 1.0,
      }],
      dailyProgress: [],
      gamification: {
        id: 1,
        consecutiveZeroDays: 0,
        lastActivityDate: null,
        totalPoints: 10,
      },
    }

    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const file = new File([JSON.stringify(backupData)], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/Backup imported successfully/i)).toBeInTheDocument()
    })

    // Verify data was replaced
    const tasks = useTaskStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0].content).toBe('Imported task')

    const totalPoints = useGameStore.getState().totalPoints
    expect(totalPoints).toBe(10)

    expect(confirmSpy).toHaveBeenCalled()
  })

  it('does not import if user cancels confirmation', async () => {
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    // Create initial data
    await useTaskStore.getState().addTask({ content: 'Original task', parentId: null })

    const user = userEvent.setup()
    render(<ExportImport />)

    const backupData = {
      version: 1,
      exportedAt: Date.now(),
      tasks: [],
      dailyProgress: [],
      gamification: {
        id: 1,
        consecutiveZeroDays: 0,
        lastActivityDate: null,
        totalPoints: 0,
      },
    }

    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const file = new File([JSON.stringify(backupData)], 'backup.json', { type: 'application/json' })

    await user.upload(fileInput, file)

    expect(confirmSpy).toHaveBeenCalled()

    // Verify data was NOT replaced
    const tasks = useTaskStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0].content).toBe('Original task')
  })

  it('clears error message when clicking import again', async () => {
    const user = userEvent.setup()
    render(<ExportImport />)

    // First, trigger an error
    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const file = new File(['invalid json'], 'backup.json', { type: 'application/json' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Click import button again
    const importButton = screen.getByRole('button', { name: /Import Backup/i })
    await user.click(importButton)

    // Error message should be cleared
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('meets accessibility standards', async () => {
    const { container } = render(<ExportImport />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards with error message', async () => {
    const user = userEvent.setup()
    const { container } = render(<ExportImport />)

    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const file = new File(['invalid'], 'backup.json', { type: 'application/json' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('meets accessibility standards with success message', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const user = userEvent.setup()
    const { container } = render(<ExportImport />)

    const backupData = {
      version: 1,
      exportedAt: Date.now(),
      tasks: [],
      dailyProgress: [],
      gamification: {
        id: 1,
        consecutiveZeroDays: 0,
        lastActivityDate: null,
        totalPoints: 0,
      },
    }

    const fileInput = screen.getByLabelText(/Select backup file to import/i) as HTMLInputElement
    const file = new File([JSON.stringify(backupData)], 'backup.json', { type: 'application/json' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

import { useState } from 'react'
import { useTaskStore } from '../stores/useTaskStore.ts'
import type { TaskId } from '../types/task.ts'

interface AddTaskButtonProps {
  parentId?: TaskId | null
}

export function AddTaskButton({ parentId = null }: AddTaskButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [taskContent, setTaskContent] = useState('')
  const addTask = useTaskStore(state => state.addTask)
  const getRootTasks = useTaskStore(state => state.getRootTasks)
  const getSubTasks = useTaskStore(state => state.getSubTasks)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskContent.trim()) return

    // Calculate next orderIndex
    const siblings = parentId ? getSubTasks(parentId) : getRootTasks()
    const maxOrderIndex = siblings.length > 0
      ? Math.max(...siblings.map(t => t.orderIndex))
      : 0
    const nextOrderIndex = maxOrderIndex + 1.0

    await addTask({
      content: taskContent.trim(),
      notes: '',
      links: [],
      completed: false,
      completedAt: null,
      parentId,
      orderIndex: nextOrderIndex,
    })

    setTaskContent('')
    setIsAdding(false)
  }

  const handleCancel = () => {
    setTaskContent('')
    setIsAdding(false)
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="add-task-button"
        aria-label={parentId ? 'Add sub-task' : 'Add task'}
      >
        + {parentId ? 'Add Sub-task' : 'Add Task'}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="add-task-form">
      <input
        type="text"
        value={taskContent}
        onChange={(e) => setTaskContent(e.target.value)}
        placeholder={parentId ? 'Sub-task name...' : 'Task name...'}
        autoFocus
        aria-label={parentId ? 'Sub-task name' : 'Task name'}
      />
      <div className="form-buttons">
        <button type="submit" disabled={!taskContent.trim()}>
          Add
        </button>
        <button type="button" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

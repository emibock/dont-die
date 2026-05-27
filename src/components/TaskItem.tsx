import { useTaskStore } from '../stores/useTaskStore.ts'
import type { Task } from '../types/task.ts'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const toggleComplete = useTaskStore(state => state.toggleComplete)
  const deleteTask = useTaskStore(state => state.deleteTask)

  const handleToggle = async () => {
    await toggleComplete(task.id)
  }

  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      await deleteTask(task.id)
    }
  }

  return (
    <div className="task-item">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggle}
        aria-label={`Mark "${task.content}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <span className={task.completed ? 'task-content completed' : 'task-content'}>
        {task.content}
      </span>
      <button
        onClick={handleDelete}
        className="delete-button"
        aria-label={`Delete "${task.content}"`}
      >
        ×
      </button>
    </div>
  )
}

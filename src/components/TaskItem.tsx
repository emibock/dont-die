import { useTaskStore } from '../stores/useTaskStore.ts'
import type { Task } from '../types/task.ts'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const toggleComplete = useTaskStore(state => state.toggleComplete)
  const deleteTask = useTaskStore(state => state.deleteTask)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleToggle = async () => {
    await toggleComplete(task.id)
  }

  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      await deleteTask(task.id)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="task-item">
      <button
        className="drag-handle"
        aria-label={`Drag to reorder "${task.content}"`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
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

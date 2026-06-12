import { useState } from 'react'
import { useTaskStore } from '../stores/useTaskStore.ts'
import { TaskItem } from './TaskItem.tsx'

export function ArchiveView() {
  const [isExpanded, setIsExpanded] = useState(false)
  const tasks = useTaskStore(state => state.tasks)

  const completedTasks = tasks.filter(task => task.completed)

  if (completedTasks.length === 0) {
    return null
  }

  return (
    <div className="archive-view">
      <button
        className="archive-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? '▼' : '▶'} Completed Tasks ({completedTasks.length})
      </button>
      {isExpanded && (
        <div className="archive-content">
          {completedTasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}

import { useTaskStore } from '../stores/useTaskStore.ts'
import type { TaskId } from '../types/task.ts'
import { TaskItem } from './TaskItem.tsx'

interface SubTaskListProps {
  parentId: TaskId
}

export function SubTaskList({ parentId }: SubTaskListProps) {
  const getSubTasks = useTaskStore(state => state.getSubTasks)
  const subTasks = getSubTasks(parentId)

  if (subTasks.length === 0) {
    return null
  }

  return (
    <div className="subtask-list">
      {subTasks.map(task => (
        <div key={task.id} className="subtask-item">
          <TaskItem task={task} />
          {/* Recursive: render sub-tasks of this sub-task */}
          <SubTaskList parentId={task.id} />
        </div>
      ))}
    </div>
  )
}

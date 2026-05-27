import { useTaskStore } from '../stores/useTaskStore.ts'
import { TaskItem } from './TaskItem.tsx'
import { SubTaskList } from './SubTaskList.tsx'
import { AddTaskButton } from './AddTaskButton.tsx'

export function TaskList() {
  const tasks = useTaskStore(state => state.tasks)
  const rootTasks = tasks
    .filter(t => t.parentId === null && !t.completed)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <div className="task-list">
      <h2>Tasks</h2>

      {rootTasks.length === 0 ? (
        <p className="empty-state">No tasks yet. Add one to get started!</p>
      ) : (
        <div className="tasks-container">
          {rootTasks.map(task => (
            <div key={task.id} className="task-group">
              <TaskItem task={task} />
              <SubTaskList parentId={task.id} />
              <AddTaskButton parentId={task.id} />
            </div>
          ))}
        </div>
      )}

      <AddTaskButton />
    </div>
  )
}

import { useTaskStore } from '../stores/useTaskStore.ts'
import { TaskItem } from './TaskItem.tsx'
import { SubTaskList } from './SubTaskList.tsx'
import { AddTaskButton } from './AddTaskButton.tsx'
import { DndContext, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

export function TaskList() {
  const tasks = useTaskStore(state => state.tasks)
  const reorderTasks = useTaskStore(state => state.reorderTasks)
  const rootTasks = tasks
    .filter(t => t.parentId === null && !t.completed)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeIndex = rootTasks.findIndex(t => t.id === active.id)
    const overIndex = rootTasks.findIndex(t => t.id === over.id)

    if (activeIndex === -1 || overIndex === -1) return

    // Determine prev and next task IDs
    const newIndex = overIndex
    const prevTaskId = newIndex > 0 ? rootTasks[newIndex - 1].id : null
    const nextTaskId = newIndex < rootTasks.length ? rootTasks[newIndex].id : null

    // If dragging down, adjust for the gap
    const adjustedPrevId = activeIndex < overIndex ? rootTasks[newIndex].id : prevTaskId
    const adjustedNextId = activeIndex < overIndex
      ? (newIndex + 1 < rootTasks.length ? rootTasks[newIndex + 1].id : null)
      : nextTaskId

    try {
      await reorderTasks(
        active.id as string,
        null, // Root level tasks have no parent
        adjustedPrevId,
        adjustedNextId
      )
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    }
  }

  return (
    <div className="task-list">
      <h2>Tasks</h2>

      {rootTasks.length === 0 ? (
        <p className="empty-state">No tasks yet. Add one to get started!</p>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rootTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="tasks-container">
              {rootTasks.map(task => (
                <div key={task.id} className="task-group">
                  <TaskItem task={task} />
                  <SubTaskList parentId={task.id} />
                  <AddTaskButton parentId={task.id} />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AddTaskButton />
    </div>
  )
}

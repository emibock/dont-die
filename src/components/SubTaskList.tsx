import { useTaskStore } from '../stores/useTaskStore.ts'
import type { TaskId } from '../types/task.ts'
import { TaskItem } from './TaskItem.tsx'
import { DndContext, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface SubTaskListProps {
  parentId: TaskId
}

export function SubTaskList({ parentId }: SubTaskListProps) {
  const tasks = useTaskStore(state => state.tasks)
  const reorderTasks = useTaskStore(state => state.reorderTasks)
  const subTasks = tasks
    .filter(t => t.parentId === parentId && !t.completed)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeIndex = subTasks.findIndex(t => t.id === active.id)
    const overIndex = subTasks.findIndex(t => t.id === over.id)

    if (activeIndex === -1 || overIndex === -1) return

    // Determine prev and next task IDs
    const newIndex = overIndex
    const prevTaskId = newIndex > 0 ? subTasks[newIndex - 1].id : null
    const nextTaskId = newIndex < subTasks.length ? subTasks[newIndex].id : null

    // If dragging down, adjust for the gap
    const adjustedPrevId = activeIndex < overIndex ? subTasks[newIndex].id : prevTaskId
    const adjustedNextId = activeIndex < overIndex
      ? (newIndex + 1 < subTasks.length ? subTasks[newIndex + 1].id : null)
      : nextTaskId

    try {
      await reorderTasks(
        active.id as string,
        parentId, // Keep same parent
        adjustedPrevId,
        adjustedNextId
      )
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    }
  }

  if (subTasks.length === 0) {
    return null
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={subTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="subtask-list">
          {subTasks.map(task => (
            <div key={task.id} className="subtask-item">
              <TaskItem task={task} />
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

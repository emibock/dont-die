import { useState, useEffect, useRef } from 'react'
import { useTaskStore } from '../stores/useTaskStore.ts'
import type { Task } from '../types/task.ts'

interface TaskItemExpandedProps {
  task: Task
  onCollapse: () => void
}

// URL extraction regex - matches http(s):// URLs
const URL_REGEX = /https?:\/\/[^\s]+/g

export function TaskItemExpanded({ task, onCollapse }: TaskItemExpandedProps) {
  const updateTask = useTaskStore(state => state.updateTask)
  const [notes, setNotes] = useState(task.notes)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<number | null>(null)

  // Extract URLs from notes
  const extractedLinks = notes.match(URL_REGEX) || []

  // Sync local state with prop changes
  useEffect(() => {
    setNotes(task.notes)
  }, [task.notes])

  // Debounced auto-save on blur
  const handleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      if (notes !== task.notes) {
        setIsSaving(true)
        await updateTask(task.id, {
          notes,
          links: extractedLinks,
        })
        setIsSaving(false)
      }
    }, 500)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="task-item-expanded">
      <div className="expanded-header">
        <h3>{task.content}</h3>
        <button
          onClick={onCollapse}
          className="collapse-button"
          aria-label="Collapse notepad"
        >
          ✕
        </button>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add notes, paste links, or jot down details..."
        className="notes-textarea"
        rows={8}
        aria-label={`Notes for "${task.content}"`}
      />

      {isSaving && <p className="saving-indicator">Saving...</p>}

      {extractedLinks.length > 0 && (
        <div className="extracted-links">
          <h4>Links:</h4>
          <ul>
            {extractedLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="extracted-link"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

import { useRef, useState } from 'react'
import { db } from '../db/schema.ts'
import { useTaskStore } from '../stores/useTaskStore.ts'
import { useGameStore } from '../stores/useGameStore.ts'

interface BackupData {
  version: 1
  exportedAt: number
  tasks: any[]
  dailyProgress: any[]
  gamification: any
}

export function ExportImport() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const hydrateTaskStore = useTaskStore(state => state.hydrate)
  const hydrateGameStore = useGameStore(state => state.hydrate)

  const handleExport = async () => {
    try {
      // Gather all data from IndexedDB
      const tasks = await db.tasks.toArray()
      const dailyProgress = await db.dailyProgress.toArray()
      const gamification = await db.gamification.get(1)

      const backupData: BackupData = {
        version: 1,
        exportedAt: Date.now(),
        tasks,
        dailyProgress,
        gamification: gamification || {
          id: 1,
          consecutiveZeroDays: 0,
          lastActivityDate: null,
          totalPoints: 0,
        },
      }

      // Create blob and download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().split('T')[0]
      a.download = `dont-die-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. See console for details.')
    }
  }

  const handleImportClick = () => {
    setImportError(null)
    setImportSuccess(false)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data: BackupData = JSON.parse(text)

      // Validate backup format
      if (data.version !== 1) {
        throw new Error(`Unsupported backup version: ${data.version}`)
      }

      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error('Invalid backup: missing tasks array')
      }

      if (!data.dailyProgress || !Array.isArray(data.dailyProgress)) {
        throw new Error('Invalid backup: missing dailyProgress array')
      }

      if (!data.gamification) {
        throw new Error('Invalid backup: missing gamification data')
      }

      // Confirm before wiping data
      const confirmed = window.confirm(
        'This will replace all current data with the backup. Are you sure?'
      )

      if (!confirmed) return

      // Clear existing data
      await db.tasks.clear()
      await db.dailyProgress.clear()
      await db.gamification.clear()

      // Import new data
      await db.tasks.bulkAdd(data.tasks)
      await db.dailyProgress.bulkAdd(data.dailyProgress)
      await db.gamification.put(data.gamification)

      // Reload stores
      await Promise.all([hydrateTaskStore(), hydrateGameStore()])

      setImportSuccess(true)
      setImportError(null)

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Import failed:', error)
      setImportError(error instanceof Error ? error.message : 'Import failed')
      setImportSuccess(false)
    }
  }

  return (
    <div className="export-import">
      <h3>Backup & Restore</h3>
      <div className="export-import-buttons">
        <button onClick={handleExport} className="export-button">
          📥 Export Backup
        </button>
        <button onClick={handleImportClick} className="import-button">
          📤 Import Backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label="Select backup file to import"
        />
      </div>
      {importError && (
        <p className="import-error" role="alert">
          ❌ {importError}
        </p>
      )}
      {importSuccess && (
        <p className="import-success" role="status">
          ✅ Backup imported successfully!
        </p>
      )}
      <p className="backup-note">
        💡 Tip: Export a backup regularly to avoid losing your data. Your data is stored locally in your browser.
      </p>
    </div>
  )
}

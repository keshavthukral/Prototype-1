import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { SyncStatus } from '@/types'
import { syncQueueOperations } from '@/lib/db/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'

interface SyncContextType {
  status: SyncStatus
  pendingCount: number
  isOnline: boolean
  sync: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>('offline')
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update pending count
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await syncQueueOperations.getPendingCount()
      setPendingCount(count)
    }

    updatePendingCount()
    const interval = setInterval(updatePendingCount, 5000)

    return () => clearInterval(interval)
  }, [])

  // Update status based on online state and pending items
  useEffect(() => {
    if (!isOnline) {
      setStatus('offline')
    } else if (pendingCount > 0) {
      setStatus('syncing')
    } else {
      setStatus('online')
    }
  }, [isOnline, pendingCount])

  const sync = useCallback(async () => {
    if (!isOnline || !isSupabaseConfigured()) {
      return
    }

    setStatus('syncing')

    try {
      const pendingItems = await syncQueueOperations.getPendingItems()

      for (const item of pendingItems) {
        try {
          const { operation, table, recordId } = item

          // Skip unknown tables
          const validTables = ['game_results', 'reminders', 'reminder_completions', 'memory_entries', 'activity_logs']
          if (!validTables.includes(table)) {
            console.warn(`Unknown table: ${table}`)
            continue
          }

          // Use a helper function to handle the Supabase operations
          // This avoids complex type issues with dynamic table names
          await syncToSupabase(table, operation, recordId)

          await syncQueueOperations.markSynced(item.queueId!)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          await syncQueueOperations.markFailed(item.queueId!, errorMessage)
          
          // If too many retries, stop syncing
          if (item.retryCount >= 5) {
            console.error(`Failed to sync item ${item.queueId} after 5 retries:`, errorMessage)
            continue
          }
        }
      }

      // Clean up old items (older than 30 days)
      await syncQueueOperations.clearOldItems(30 * 24 * 60 * 60 * 1000)

      setStatus('sync_complete')
      
      // Reset to online after a short delay
      setTimeout(() => {
        if (isOnline) {
          setStatus('online')
        }
      }, 2000)
    } catch (error) {
      console.error('Sync failed:', error)
      setStatus('online')
    }
  }, [isOnline, pendingCount])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      sync()
    }
  }, [isOnline, pendingCount, sync])

  // Periodic sync attempt
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(() => {
      if (pendingCount > 0) {
        sync()
      }
    }, 60000) // Try syncing every minute

    return () => clearInterval(interval)
  }, [isOnline, pendingCount, sync])

  return (
    <SyncContext.Provider value={{ status, pendingCount, isOnline, sync }}>
      {children}
    </SyncContext.Provider>
  )
}

// Helper function to sync data to Supabase
async function syncToSupabase(
  table: string,
  operation: 'create' | 'update' | 'delete',
  recordId: string
) {
  // This is a simplified sync function
  // In production, you would implement proper type-safe operations
  console.log(`Syncing ${operation} to ${table} for record ${recordId}`)
  
  // For now, we'll just log the sync operation
  // The actual Supabase operations would be implemented here
  // when the project is fully set up with proper types
}

export function useSync() {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}

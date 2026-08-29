import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { syncQueueOperations } from '@/lib/db/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { syncService, getSyncStatusForUI } from './sync-service'

interface SyncContextType {
  mode: 'demo' | 'online'
  status: 'idle' | 'syncing' | 'error' | 'complete'
  isOnline: boolean
  pendingCount: number
  lastSyncTime: Date | null
  sync: () => Promise<void>
  retrySync: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'demo' | 'online'>('demo')
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error' | 'complete'>('idle')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Update mode based on Supabase configuration
  useEffect(() => {
    setMode(isSupabaseConfigured() ? 'online' : 'demo')
  }, [])

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

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && mode === 'online' && pendingCount > 0 && status !== 'syncing') {
      sync()
    }
  }, [isOnline, mode, pendingCount, status])

  // Start auto-sync on mount
  useEffect(() => {
    if (mode === 'online') {
      syncService.startAutoSync(30000) // Sync every 30 seconds
    }

    return () => {
      syncService.stopAutoSync()
    }
  }, [mode])

  const sync = useCallback(async () => {
    if (status === 'syncing') return
    if (mode === 'demo') return
    if (!isOnline) return

    setStatus('syncing')

    try {
      const result = await syncService.syncAll()
      
      if (result.success) {
        setStatus('complete')
        setLastSyncTime(new Date())
        
        // Reset to idle after 3 seconds
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
        
        // Reset to idle after 5 seconds
        setTimeout(() => setStatus('idle'), 5000)
      }

      // Update pending count
      const count = await syncQueueOperations.getPendingCount()
      setPendingCount(count)
    } catch (error) {
      console.error('Sync failed:', error)
      setStatus('error')
      
      // Reset to idle after 5 seconds
      setTimeout(() => setStatus('idle'), 5000)
    }
  }, [status, mode, isOnline])

  const retrySync = useCallback(async () => {
    await sync()
  }, [sync])

  return (
    <SyncContext.Provider
      value={{
        mode,
        status,
        isOnline,
        pendingCount,
        lastSyncTime,
        sync,
        retrySync,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}

// Re-export sync status getter
export { getSyncStatusForUI }

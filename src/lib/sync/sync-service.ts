import { db, syncQueueOperations } from '@/lib/db/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'

// Sync status types
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'complete'

export interface SyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  errors: string[]
}

// Table name to Supabase table mapping
const TABLE_MAP: Record<string, string> = {
  game_sessions: 'game_sessions',
  reminders: 'reminders',
  reminder_completions: 'reminder_completions',
  memories: 'memories',
  activity_logs: 'activity_logs',
  patients: 'patients',
  daily_reports: 'daily_reports',
  well_being_check_ins: 'well_being_check_ins',
  support_requests: 'support_requests',
}

// Sync service class
class SyncService {
  private isSyncing = false
  private lastSyncTime: Date | null = null
  private syncInterval: ReturnType<typeof setInterval> | null = null

  // Start automatic sync
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(async () => {
      if (navigator.onLine && isSupabaseConfigured() && !this.isSyncing) {
        await this.syncAll()
      }
    }, intervalMs)
  }

  // Stop automatic sync
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Sync all pending items
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Already syncing'] }
    }

    if (!isSupabaseConfigured()) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Demo mode - no Supabase configured'] }
    }

    if (!navigator.onLine) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Offline'] }
    }

    this.isSyncing = true
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    }

    try {
      const pendingItems = await syncQueueOperations.getPendingItems()

      for (const item of pendingItems) {
        try {
          await this.syncItem(item)
          await syncQueueOperations.markSynced(item.queueId!)
          result.syncedCount++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          await syncQueueOperations.markFailed(item.queueId!, errorMessage)
          result.failedCount++
          result.errors.push(`Failed to sync ${item.table}/${item.recordId}: ${errorMessage}`)
          
          // If too many retries, skip this item
          if (item.retryCount >= 5) {
            console.warn(`Skipping item ${item.queueId} after ${item.retryCount} retries`)
            continue
          }
        }
      }

      // Clean up old items (older than 7 days)
      await syncQueueOperations.clearOldItems(7 * 24 * 60 * 60 * 1000)

      this.lastSyncTime = new Date()
      result.success = result.failedCount === 0
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.success = false
      result.errors.push(`Sync failed: ${errorMessage}`)
    } finally {
      this.isSyncing = false
    }

    return result
  }

  // Sync a single item
  private async syncItem(item: {
    operation: string
    table: string
    recordId: string
    data?: Record<string, unknown>
  }): Promise<void> {
    const supabaseTable = TABLE_MAP[item.table]
    if (!supabaseTable) {
      throw new Error(`Unknown table: ${item.table}`)
    }

    switch (item.operation) {
      case 'create':
      case 'update':
        await this.upsertToRemote(supabaseTable, item.recordId, item.data)
        break
      case 'delete':
        await this.deleteFromRemote(supabaseTable, item.recordId)
        break
      default:
        throw new Error(`Unknown operation: ${item.operation}`)
    }
  }

  // Upsert to remote
  private async upsertToRemote(
    table: string,
    recordId: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (!data) {
      throw new Error('No data to upsert')
    }

    // Add id to data if not present
    const recordData = toRemoteRecord(table, { ...data, id: recordId })

    // Use simple fetch for Supabase operations to avoid type issues
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase not configured')
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(recordData),
    })

    if (!response.ok) {
      throw new Error(`Upsert failed: ${response.statusText}`)
    }
  }

  // Delete from remote
  private async deleteFromRemote(table: string, recordId: string): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase not configured')
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${recordId}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`)
    }
  }

  // Pull remote changes
  async pullRemoteChanges(): Promise<void> {
    if (!isSupabaseConfigured() || !navigator.onLine) {
      return
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        return
      }

      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }

      // Pull game sessions
      const gameSessionsResponse = await fetch(
        `${supabaseUrl}/rest/v1/game_sessions?order=created_at.desc&limit=100`,
        { headers }
      )

      if (gameSessionsResponse.ok) {
        const gameSessions = await gameSessionsResponse.json()
        for (const session of gameSessions) {
          await db.gameSessions.put({
            id: session.id,
            patientId: session.patient_id,
            gameType: session.game_type,
            difficultyLevel: session.difficulty_level,
            accuracy: session.accuracy,
            responseTimeMs: session.response_time_ms,
            hintsUsed: session.hints_used,
            score: session.score,
            completedAt: new Date(session.completed_at),
            createdAt: new Date(session.created_at),
            synced: true,
          })
        }
      }

      // Pull reminders
      const remindersResponse = await fetch(
        `${supabaseUrl}/rest/v1/reminders?order=created_at.desc`,
        { headers }
      )

      if (remindersResponse.ok) {
        const reminders = await remindersResponse.json()
        for (const reminder of reminders) {
          await db.reminders.put({
            id: reminder.id,
            patientId: reminder.patient_id,
            createdBy: reminder.created_by,
            title: reminder.title,
            description: reminder.description,
            reminderType: reminder.reminder_type,
            scheduledTime: reminder.scheduled_time,
            frequency: reminder.frequency,
            specificDays: reminder.specific_days ?? [],
            snoozedUntil: reminder.snoozed_until ? new Date(reminder.snoozed_until) : undefined,
            isActive: reminder.is_active,
            createdAt: new Date(reminder.created_at),
            updatedAt: new Date(reminder.updated_at),
            synced: true,
          })
        }
      }

      // Pull memories
      const memoriesResponse = await fetch(
        `${supabaseUrl}/rest/v1/memories?order=created_at.desc`,
        { headers }
      )

      if (memoriesResponse.ok) {
        const memories = await memoriesResponse.json()
        for (const memory of memories) {
          await db.memories.put({
            id: memory.id,
            patientId: memory.patient_id,
            createdBy: memory.created_by,
            name: memory.name,
            relationship: memory.relationship,
            description: memory.description,
            imageStoragePath: memory.image_storage_path,
            imageUrl: memory.image_url,
            createdAt: new Date(memory.created_at),
            updatedAt: new Date(memory.updated_at),
            synced: true,
          })
        }
      }

      // Pull self-reported well-being check-ins. RLS limits this to the
      // signed-in patient or their linked caregiver.
      const checkInsResponse = await fetch(
        `${supabaseUrl}/rest/v1/well_being_check_ins?order=reported_at.desc&limit=100`,
        { headers }
      )

      if (checkInsResponse.ok) {
        const checkIns = await checkInsResponse.json()
        for (const checkIn of checkIns) {
          await db.wellBeingCheckIns.put({
            id: checkIn.id,
            patientId: checkIn.patient_id,
            reportedAt: new Date(checkIn.reported_at),
            reportedMood: checkIn.reported_mood,
            reportedEnergy: checkIn.reported_energy,
            requestedContact: checkIn.requested_contact,
            createdAt: new Date(checkIn.created_at),
            synced: true,
          })
        }
      }

      const supportRequestsResponse = await fetch(
        `${supabaseUrl}/rest/v1/support_requests?order=requested_at.desc&limit=100`,
        { headers }
      )
      if (supportRequestsResponse.ok) {
        const requests = await supportRequestsResponse.json()
        for (const request of requests) {
          await db.supportRequests.put({
            id: request.id, patientId: request.patient_id, requestType: request.request_type,
            priority: request.priority, status: request.status,
            requestedAt: new Date(request.requested_at),
            acknowledgedAt: request.acknowledged_at ? new Date(request.acknowledged_at) : undefined,
            createdAt: new Date(request.created_at), updatedAt: new Date(request.updated_at), synced: true,
          })
        }
      }
    } catch (error) {
      console.error('Failed to pull remote changes:', error)
    }
  }

  // Get sync status
  getStatus(): {
    isSyncing: boolean
    lastSyncTime: Date | null
  } {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
    }
  }
}

function toRemoteRecord(table: string, data: Record<string, unknown>): Record<string, unknown> {
  const iso = (value: unknown) => value instanceof Date ? value.toISOString() : value
  if (table === 'reminders') return { id: data.id, patient_id: data.patientId, created_by: data.createdBy ?? null, title: data.title, description: data.description ?? null, reminder_type: data.reminderType, scheduled_time: data.scheduledTime ?? null, frequency: data.frequency, specific_days: data.specificDays ?? [], snoozed_until: iso(data.snoozedUntil) ?? null, is_active: data.isActive, created_at: iso(data.createdAt), updated_at: iso(data.updatedAt) }
  if (table === 'reminder_completions') return { id: data.id, reminder_id: data.reminderId, patient_id: data.patientId, status: data.status, completed_at: iso(data.completedAt), created_at: iso(data.createdAt) }
  if (table === 'daily_reports') return { id: data.id, patient_id: data.patientId, report_date: data.reportDate, reminders_completed: data.remindersCompleted, reminders_postponed: data.remindersPostponed, reminders_total: data.remindersTotal, daily_check_in_completed: data.dailyCheckInCompleted ?? false, source_updated_at: iso(data.sourceUpdatedAt), created_at: iso(data.createdAt), updated_at: iso(data.updatedAt) }
  if (table === 'well_being_check_ins') return { id: data.id, patient_id: data.patientId, reported_at: iso(data.reportedAt), reported_mood: data.reportedMood, reported_energy: data.reportedEnergy, requested_contact: data.requestedContact, created_at: iso(data.createdAt) }
  if (table === 'support_requests') return { id: data.id, patient_id: data.patientId, request_type: data.requestType, priority: data.priority, status: data.status, requested_at: iso(data.requestedAt), acknowledged_at: iso(data.acknowledgedAt) ?? null, created_at: iso(data.createdAt), updated_at: iso(data.updatedAt) }
  return data
}

// Export singleton instance
export const syncService = new SyncService()

// Utility function to check if we should sync
export function shouldSync(): boolean {
  return navigator.onLine && isSupabaseConfigured()
}

// Get sync status for UI
export async function getSyncStatusForUI(): Promise<{
  mode: 'demo' | 'online'
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: Date | null
}> {
  const isOnline = navigator.onLine
  const isDemo = !isSupabaseConfigured()
  const pendingCount = await syncQueueOperations.getPendingCount()

  return {
    mode: isDemo ? 'demo' : 'online',
    isOnline,
    isSyncing: syncService.getStatus().isSyncing,
    pendingCount,
    lastSyncTime: syncService.getStatus().lastSyncTime,
  }
}

import Dexie, { type EntityTable } from 'dexie'
import type {
  GameResult,
  Reminder,
  ReminderCompletion,
  MemoryEntry,
  SyncQueueItem,
  ActivityLog,
} from '@/types'

// Extended types with local ID for Dexie
interface LocalGameResult extends GameResult {
  localId?: number
}

interface LocalReminder extends Reminder {
  localId?: number
}

interface LocalReminderCompletion extends ReminderCompletion {
  localId?: number
}

interface LocalMemoryEntry extends MemoryEntry {
  localId?: number
}

interface LocalActivityLog extends ActivityLog {
  localId?: number
}

interface LocalSyncQueueItem extends SyncQueueItem {
  queueId: number
}

interface Setting {
  key: string
  value: string
}

interface LanguageString {
  key: string
  language: string
  value: string
}

interface PatientProfile {
  id: string
  name: string
  preferredLanguage: string
  updatedAt: Date
}

// Create Dexie database
const db = new Dexie('BrainBuddyOffline') as Dexie & {
  patientProfile: EntityTable<PatientProfile, 'id'>
  gameResults: EntityTable<LocalGameResult, 'localId'>
  reminders: EntityTable<LocalReminder, 'localId'>
  reminderCompletions: EntityTable<LocalReminderCompletion, 'localId'>
  memoryEntries: EntityTable<LocalMemoryEntry, 'localId'>
  activityLogs: EntityTable<LocalActivityLog, 'localId'>
  syncQueue: EntityTable<LocalSyncQueueItem, 'queueId'>
  settings: EntityTable<Setting, 'key'>
  languageStrings: EntityTable<LanguageString, 'key'>
}

// Define database schema
db.version(1).stores({
  patientProfile: 'id, name, preferredLanguage',
  gameResults: '++localId, patientId, gameType, [patientId+gameType], completedAt',
  reminders: '++localId, id, patientId, reminderType, isActive',
  reminderCompletions: '++localId, reminderId, patientId, status, completedAt',
  memoryEntries: '++localId, id, patientId, name',
  activityLogs: '++localId, patientId, activityType, createdAt',
  syncQueue: '++queueId, operation, table, recordId, timestamp, retryCount',
  settings: 'key',
  languageStrings: 'key, language',
})

export { db }

// Database operations
export const dbOperations = {
  // Patient Profile
  async getPatientProfile(id: string): Promise<PatientProfile | undefined> {
    return db.patientProfile.get(id)
  },

  async savePatientProfile(profile: PatientProfile): Promise<void> {
    await db.patientProfile.put({ ...profile, updatedAt: new Date() })
  },

  // Game Results
  async saveGameResult(result: Omit<LocalGameResult, 'localId'>): Promise<number> {
    const localId = await db.gameResults.add(result as LocalGameResult)
    await addToSyncQueue('create', 'game_results', result.id, result)
    return localId as number
  },

  async getGameResults(patientId: string, gameType?: string): Promise<LocalGameResult[]> {
    if (gameType) {
      return db.gameResults
        .where('[patientId+gameType]')
        .equals([patientId, gameType])
        .toArray()
    }
    return db.gameResults.where('patientId').equals(patientId).toArray()
  },

  // Reminders
  async saveReminder(reminder: Omit<LocalReminder, 'localId'>): Promise<number> {
    const localId = await db.reminders.put(reminder as LocalReminder)
    await addToSyncQueue(reminder.id ? 'update' : 'create', 'reminders', reminder.id, reminder)
    return localId as number
  },

  async getReminders(patientId: string): Promise<LocalReminder[]> {
    return db.reminders
      .where('patientId')
      .equals(patientId)
      .and((r) => r.isActive)
      .toArray()
  },

  // Reminder Completions
  async saveReminderCompletion(completion: Omit<LocalReminderCompletion, 'localId'>): Promise<number> {
    const localId = await db.reminderCompletions.add(completion as LocalReminderCompletion)
    await addToSyncQueue('create', 'reminder_completions', completion.id, completion)
    return localId as number
  },

  async getReminderCompletions(patientId: string): Promise<LocalReminderCompletion[]> {
    return db.reminderCompletions
      .where('patientId')
      .equals(patientId)
      .toArray()
  },

  // Memory Entries
  async saveMemoryEntry(entry: Omit<LocalMemoryEntry, 'localId'>): Promise<number> {
    const localId = await db.memoryEntries.put(entry as LocalMemoryEntry)
    await addToSyncQueue(entry.id ? 'update' : 'create', 'memory_entries', entry.id, entry)
    return localId as number
  },

  async getMemoryEntries(patientId: string): Promise<LocalMemoryEntry[]> {
    return db.memoryEntries.where('patientId').equals(patientId).toArray()
  },

  // Activity Logs
  async saveActivityLog(log: Omit<LocalActivityLog, 'localId'>): Promise<number> {
    const localId = await db.activityLogs.add(log as LocalActivityLog)
    await addToSyncQueue('create', 'activity_logs', log.id, log)
    return localId as number
  },

  async getActivityLogs(patientId: string, limit = 50): Promise<LocalActivityLog[]> {
    return db.activityLogs
      .where('patientId')
      .equals(patientId)
      .reverse()
      .limit(limit)
      .toArray()
  },

  // Settings
  async getSetting(key: string): Promise<string | undefined> {
    const setting = await db.settings.get(key)
    return setting?.value
  },

  async setSetting(key: string, value: string): Promise<void> {
    await db.settings.put({ key, value })
  },

  // Language Strings (cached)
  async getLanguageString(key: string, language: string): Promise<string | undefined> {
    const entry = await db.languageStrings.get(key)
    if (entry?.language === language) {
      return entry.value
    }
    return undefined
  },

  async cacheLanguageStrings(strings: Record<string, string>, language: string): Promise<void> {
    const entries = Object.entries(strings).map(([key, value]) => ({
      key,
      language,
      value,
    }))
    await db.languageStrings.bulkPut(entries)
  },
}

// Sync Queue operations
async function addToSyncQueue(
  operation: 'create' | 'update' | 'delete',
  table: string,
  recordId: string,
  data?: Record<string, unknown>
): Promise<void> {
  await db.syncQueue.add({
    operation,
    table,
    recordId,
    data,
    timestamp: new Date(),
    retryCount: 0,
  })
}

export const syncQueueOperations = {
  async getPendingItems(): Promise<LocalSyncQueueItem[]> {
    return db.syncQueue.orderBy('timestamp').toArray()
  },

  async markSynced(queueId: number): Promise<void> {
    await db.syncQueue.delete(queueId)
  },

  async markFailed(queueId: number, error: string): Promise<void> {
    const item = await db.syncQueue.get(queueId)
    if (item) {
      await db.syncQueue.update(queueId, {
        retryCount: item.retryCount + 1,
        lastError: error,
      })
    }
  },

  async getPendingCount(): Promise<number> {
    return db.syncQueue.count()
  },

  async clearOldItems(maxAgeMs: number): Promise<void> {
    const cutoff = new Date(Date.now() - maxAgeMs)
    await db.syncQueue.where('timestamp').below(cutoff).delete()
  },
}

import Dexie, { type EntityTable } from 'dexie'

// =====================================================
// TYPES
// =====================================================

// Patient Profile
export interface PatientProfile {
  id: string
  name: string
  preferredLanguage: string
  createdAt: Date
  updatedAt: Date
}

// Game Session
export interface GameSession {
  id: string
  patientId: string
  gameType: 'memory' | 'pattern'
  difficultyLevel: 1 | 2 | 3 | 4 | 5
  accuracy: number
  responseTimeMs: number
  hintsUsed: number
  score: number
  completedAt: Date
  createdAt: Date
  synced: boolean
}

export interface LocalGameSession extends GameSession {
  localId?: number
}

// Reminder
export interface Reminder {
  id: string
  patientId: string
  createdBy?: string
  title: string
  titleAs?: string
  description?: string
  reminderType: 'medicine' | 'hydration' | 'meal' | 'walk' | 'family_call' | 'daily_activity'
  scheduledTime?: string
  frequency: 'once' | 'daily' | 'specific_days'
  specificDays?: number[]
  snoozedUntil?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  synced: boolean
}

export interface LocalReminder extends Reminder {
  localId?: number
}

// Reminder Completion
export interface ReminderCompletion {
  id: string
  reminderId: string
  patientId: string
  status: 'taken' | 'done' | 'skipped' | 'remind_later'
  completedAt: Date
  createdAt: Date
  synced: boolean
}

export interface LocalReminderCompletion extends ReminderCompletion {
  localId?: number
}

// Memory
export interface Memory {
  id: string
  patientId: string
  createdBy?: string
  name: string
  nameAs?: string
  relationship?: string
  relationshipAs?: string
  description?: string
  descriptionAs?: string
  imageStoragePath?: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
  synced: boolean
}

export interface LocalMemory extends Memory {
  localId?: number
}

// Activity Log
export interface ActivityLog {
  id: string
  patientId: string
  activityType: string
  activityData: Record<string, unknown>
  createdAt: Date
  synced: boolean
}

export interface LocalActivityLog extends ActivityLog {
  localId?: number
}

export interface DailyReport {
  id: string
  patientId: string
  reportDate: string
  remindersCompleted: number
  remindersPostponed: number
  remindersTotal: number
  dailyCheckInCompleted?: boolean
  sourceUpdatedAt: Date
  createdAt: Date
  updatedAt: Date
  synced: boolean
}

export type ReportedMood = 'very_good' | 'good' | 'okay' | 'not_so_good'
export type ReportedEnergy = 'good' | 'okay' | 'low'

export interface WellBeingCheckIn {
  id: string
  patientId: string
  reportedAt: Date
  reportedMood: ReportedMood
  reportedEnergy: ReportedEnergy
  requestedContact: boolean
  createdAt: Date
  synced: boolean
}

export interface SupportRequest {
  id: string
  patientId: string
  requestType: 'contact_me'
  priority: 'high'
  status: 'pending' | 'acknowledged'
  requestedAt: Date
  acknowledgedAt?: Date
  createdAt: Date
  updatedAt: Date
  synced: boolean
}

// Sync Queue Item
export interface SyncQueueItem {
  queueId: number
  operation: 'create' | 'update' | 'delete'
  table: string
  recordId: string
  data?: Record<string, unknown>
  timestamp: Date
  retryCount: number
  lastError?: string
}

// Setting
export interface Setting {
  key: string
  value: string
}

// Language String
export interface LanguageString {
  key: string
  language: string
  value: string
}

// =====================================================
// DEXIE DATABASE
// =====================================================

const db = new Dexie('BrainBuddyOffline') as Dexie & {
  patientProfile: EntityTable<PatientProfile, 'id'>
  gameSessions: EntityTable<LocalGameSession, 'localId'>
  reminders: EntityTable<LocalReminder, 'localId'>
  reminderCompletions: EntityTable<LocalReminderCompletion, 'localId'>
  memories: EntityTable<LocalMemory, 'localId'>
  activityLogs: EntityTable<LocalActivityLog, 'localId'>
  dailyReports: EntityTable<DailyReport, 'id'>
  wellBeingCheckIns: EntityTable<WellBeingCheckIn, 'id'>
  supportRequests: EntityTable<SupportRequest, 'id'>
  syncQueue: EntityTable<SyncQueueItem, 'queueId'>
  settings: EntityTable<Setting, 'key'>
  languageStrings: EntityTable<LanguageString, 'key'>
}

// Define database schema
db.version(1).stores({
  patientProfile: 'id, name, preferredLanguage',
  gameSessions: '++localId, id, patientId, gameType, [patientId+gameType], completedAt',
  reminders: '++localId, id, patientId, reminderType, isActive',
  reminderCompletions: '++localId, id, reminderId, patientId, status, completedAt',
  memories: '++localId, id, patientId, name',
  activityLogs: '++localId, patientId, activityType, createdAt',
  syncQueue: '++queueId, operation, table, recordId, timestamp, retryCount',
  settings: 'key',
  languageStrings: 'key, language',
})

db.version(2).stores({
  patientProfile: 'id, name, preferredLanguage',
  gameSessions: '++localId, id, patientId, gameType, [patientId+gameType], completedAt',
  reminders: '++localId, id, patientId, reminderType, isActive, snoozedUntil',
  reminderCompletions: '++localId, id, reminderId, patientId, status, completedAt',
  memories: '++localId, id, patientId, name',
  activityLogs: '++localId, patientId, activityType, createdAt',
  dailyReports: 'id, [patientId+reportDate], patientId, reportDate',
  syncQueue: '++queueId, operation, table, recordId, timestamp, retryCount',
  settings: 'key',
  languageStrings: 'key, language',
})

db.version(3).stores({
  patientProfile: 'id, name, preferredLanguage',
  gameSessions: '++localId, id, patientId, gameType, [patientId+gameType], completedAt',
  reminders: '++localId, id, patientId, reminderType, isActive, snoozedUntil',
  reminderCompletions: '++localId, id, reminderId, patientId, status, completedAt',
  memories: '++localId, id, patientId, name',
  activityLogs: '++localId, patientId, activityType, createdAt',
  dailyReports: 'id, [patientId+reportDate], patientId, reportDate',
  wellBeingCheckIns: 'id, [patientId+reportedAt], patientId, reportedAt',
  syncQueue: '++queueId, operation, table, recordId, timestamp, retryCount',
  settings: 'key',
  languageStrings: 'key, language',
})

db.version(4).stores({
  patientProfile: 'id, name, preferredLanguage',
  gameSessions: '++localId, id, patientId, gameType, [patientId+gameType], completedAt',
  reminders: '++localId, id, patientId, reminderType, isActive, snoozedUntil',
  reminderCompletions: '++localId, id, reminderId, patientId, status, completedAt',
  memories: '++localId, id, patientId, name',
  activityLogs: '++localId, patientId, activityType, createdAt',
  dailyReports: 'id, [patientId+reportDate], patientId, reportDate',
  wellBeingCheckIns: 'id, [patientId+reportedAt], patientId, reportedAt',
  supportRequests: 'id, patientId, status, priority, requestedAt',
  syncQueue: '++queueId, operation, table, recordId, timestamp, retryCount',
  settings: 'key',
  languageStrings: 'key, language',
})

export { db }

// =====================================================
// DATABASE OPERATIONS
// =====================================================

export const dbOperations = {
  // Patient Profile
  async getPatientProfile(id: string): Promise<PatientProfile | undefined> {
    return db.patientProfile.get(id)
  },

  async savePatientProfile(profile: PatientProfile): Promise<void> {
    await db.patientProfile.put({ ...profile, updatedAt: new Date() })
  },

  // Game Sessions
  async saveGameSession(session: Omit<LocalGameSession, 'localId'>): Promise<number> {
    const localId = await db.gameSessions.add(session as LocalGameSession)
    await addToSyncQueue('create', 'game_sessions', session.id, session)
    return localId as number
  },

  async getGameSessions(patientId: string, gameType?: string): Promise<LocalGameSession[]> {
    if (gameType) {
      return db.gameSessions
        .where('[patientId+gameType]')
        .equals([patientId, gameType])
        .toArray()
    }
    return db.gameSessions.where('patientId').equals(patientId).toArray()
  },

  async getRecentGameSessions(patientId: string, limit: number = 10): Promise<LocalGameSession[]> {
    return db.gameSessions
      .where('patientId')
      .equals(patientId)
      .reverse()
      .limit(limit)
      .toArray()
  },

  async getGameSessionStats(patientId: string, gameType: string): Promise<{
    averageAccuracy: number
    sessionsPlayed: number
    currentDifficulty: number
  }> {
    const sessions = await db.gameSessions
      .where('patientId')
      .equals(patientId)
      .and((s) => s.gameType === gameType)
      .toArray()

    if (sessions.length === 0) {
      return { averageAccuracy: 0, sessionsPlayed: 0, currentDifficulty: 1 }
    }

    const averageAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
    const sortedSessions = sessions.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
    const latestSession = sortedSessions[0]

    return {
      averageAccuracy,
      sessionsPlayed: sessions.length,
      currentDifficulty: latestSession?.difficultyLevel ?? 1,
    }
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

  async getAllReminders(patientId: string): Promise<LocalReminder[]> {
    return db.reminders.where('patientId').equals(patientId).toArray()
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

  async getReminderCompletionStats(patientId: string): Promise<{
    total: number
    completed: number
    completionRate: number
  }> {
    const reminders = await db.reminders
      .where('patientId')
      .equals(patientId)
      .and((r) => r.isActive)
      .toArray()

    const completions = await db.reminderCompletions
      .where('patientId')
      .equals(patientId)
      .toArray()

    return {
      total: reminders.length,
      completed: completions.length,
      completionRate: reminders.length > 0 ? (completions.length / reminders.length) * 100 : 0,
    }
  },

  // Memories
  async saveMemory(memory: Omit<LocalMemory, 'localId'>): Promise<number> {
    const localId = await db.memories.put(memory as LocalMemory)
    await addToSyncQueue(memory.id ? 'update' : 'create', 'memories', memory.id, memory)
    return localId as number
  },

  async getMemories(patientId: string): Promise<LocalMemory[]> {
    return db.memories.where('patientId').equals(patientId).toArray()
  },

  async getMemory(id: string): Promise<LocalMemory | undefined> {
    return db.memories.where('id').equals(id).first()
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

  // Check if demo mode
  async isDemoMode(): Promise<boolean> {
    const mode = await dbOperations.getSetting('app-mode')
    return mode === 'demo'
  },

  async setDemoMode(isDemo: boolean): Promise<void> {
    await dbOperations.setSetting('app-mode', isDemo ? 'demo' : 'online')
  },
}

// =====================================================
// SYNC QUEUE OPERATIONS
// =====================================================

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
  async getPendingItems(): Promise<SyncQueueItem[]> {
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

  async getPendingCountByTable(table: string): Promise<number> {
    return db.syncQueue.where('table').equals(table).count()
  },

  async clearOldItems(maxAgeMs: number): Promise<void> {
    const cutoff = new Date(Date.now() - maxAgeMs)
    await db.syncQueue.where('timestamp').below(cutoff).delete()
  },

  async clearAll(): Promise<void> {
    await db.syncQueue.clear()
  },

  // Get items by table
  async getPendingByTable(table: string): Promise<SyncQueueItem[]> {
    return db.syncQueue.where('table').equals(table).toArray()
  },
}

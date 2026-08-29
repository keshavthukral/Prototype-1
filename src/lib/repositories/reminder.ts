import { db } from '@/lib/db/database'
import type { LocalReminder, LocalReminderCompletion } from '@/lib/db/database'

export type ReminderType = 'medicine' | 'hydration' | 'activity'
export type ReminderFrequency = 'daily' | 'weekly' | 'as_needed'
export type ReminderStatus = 'taken' | 'done' | 'skipped' | 'remind_later'

// Re-export types from database
export type { LocalReminder as Reminder, LocalReminderCompletion as ReminderCompletion }

// Reminder repository using direct Dexie operations
export const reminderRepository = {
  async getById(id: string): Promise<LocalReminder | undefined> {
    return db.reminders.where('id').equals(id).first()
  },

  async getByPatientId(patientId: string): Promise<LocalReminder[]> {
    return db.reminders
      .where('patientId')
      .equals(patientId)
      .and((r) => r.isActive)
      .toArray()
  },

  async getAll(patientId: string): Promise<LocalReminder[]> {
    return db.reminders.where('patientId').equals(patientId).toArray()
  },

  async create(reminder: Omit<LocalReminder, 'localId' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<LocalReminder> {
    const newReminder: LocalReminder = {
      ...reminder,
      id: reminder.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false,
    }

    await db.reminders.add(newReminder as LocalReminder & { localId: number })

    // Queue for sync
    await db.syncQueue.add({
      operation: 'create',
      table: 'reminders',
      recordId: newReminder.id,
      data: newReminder as unknown as Record<string, unknown>,
      timestamp: new Date(),
      retryCount: 0,
    })

    return newReminder
  },

  async update(id: string, updates: Partial<LocalReminder>): Promise<LocalReminder | undefined> {
    const existing = await this.getById(id)
    if (!existing) return undefined

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      synced: false,
    }

    await db.reminders.where('id').equals(id).modify(updated as Partial<LocalReminder>)

    // Queue for sync
    await db.syncQueue.add({
      operation: 'update',
      table: 'reminders',
      recordId: id,
      data: updated as unknown as Record<string, unknown>,
      timestamp: new Date(),
      retryCount: 0,
    })

    return updated
  },

  async delete(id: string): Promise<void> {
    await db.reminders.where('id').equals(id).delete()

    // Queue for sync
    await db.syncQueue.add({
      operation: 'delete',
      table: 'reminders',
      recordId: id,
      timestamp: new Date(),
      retryCount: 0,
    })
  },

  // Completions
  async getCompletions(patientId: string): Promise<LocalReminderCompletion[]> {
    return db.reminderCompletions.where('patientId').equals(patientId).toArray()
  },

  async addCompletion(completion: Omit<LocalReminderCompletion, 'localId' | 'createdAt' | 'synced'>): Promise<LocalReminderCompletion> {
    const newCompletion: LocalReminderCompletion = {
      ...completion,
      id: completion.id || crypto.randomUUID(),
      completedAt: new Date(),
      createdAt: new Date(),
      synced: false,
    }

    await db.reminderCompletions.add(newCompletion as LocalReminderCompletion & { localId: number })

    // Queue for sync
    await db.syncQueue.add({
      operation: 'create',
      table: 'reminder_completions',
      recordId: newCompletion.id,
      data: newCompletion as unknown as Record<string, unknown>,
      timestamp: new Date(),
      retryCount: 0,
    })

    return newCompletion
  },
}

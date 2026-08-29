import { db } from '@/lib/db/database'
import type { DailyReport, LocalReminder, LocalReminderCompletion } from '@/lib/db/database'

export type ReminderType = LocalReminder['reminderType']
export type ReminderFrequency = LocalReminder['frequency']
export type ReminderStatus = LocalReminderCompletion['status']
export type { LocalReminder as Reminder, LocalReminderCompletion as ReminderCompletion }

const queue = (operation: 'create' | 'update' | 'delete', table: string, recordId: string, data?: Record<string, unknown>) => db.syncQueue.add({ operation, table, recordId, data, timestamp: new Date(), retryCount: 0 })
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

async function updateReminderReport(patientId: string) {
  const now = new Date(); const start = new Date(now); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1)
  const [allReminders, allCompletions] = await Promise.all([db.reminders.where('patientId').equals(patientId).and((item) => item.isActive).toArray(), db.reminderCompletions.where('patientId').equals(patientId).toArray()])
  const completions = allCompletions.filter((item) => item.completedAt >= start && item.completedAt < end)
  const completedEver = new Set(allCompletions.filter((item) => item.status === 'taken' || item.status === 'done').map((item) => item.reminderId))
  const reminders = allReminders.filter((item) => item.frequency === 'daily' || (item.frequency === 'specific_days' && item.specificDays?.includes(now.getDay())) || (item.frequency === 'once' && (!completedEver.has(item.id) || completions.some((value) => value.reminderId === item.id))))
  const completed = new Set(completions.filter((item) => item.status === 'taken' || item.status === 'done').map((item) => item.reminderId)).size
  const postponed = new Set(completions.filter((item) => item.status === 'remind_later').map((item) => item.reminderId)).size
  const reportDate = localDate(now); const existing = await db.dailyReports.where('[patientId+reportDate]').equals([patientId, reportDate]).first(); const id = existing?.id ?? crypto.randomUUID()
  const report: DailyReport = { id, patientId, reportDate, remindersCompleted: completed, remindersPostponed: postponed, remindersTotal: reminders.length, sourceUpdatedAt: now, createdAt: existing?.createdAt ?? now, updatedAt: now, synced: false }
  await db.dailyReports.put(report); await queue(existing ? 'update' : 'create', 'daily_reports', id, report as unknown as Record<string, unknown>)
}

export const reminderRepository = {
  getById: (id: string) => db.reminders.where('id').equals(id).first(),
  getByPatientId: (patientId: string) => db.reminders.where('patientId').equals(patientId).and((item) => item.isActive).toArray(),
  getAll: (patientId: string) => db.reminders.where('patientId').equals(patientId).toArray(),
  getCompletions: (patientId: string) => db.reminderCompletions.where('patientId').equals(patientId).toArray(),
  async create(reminder: Omit<LocalReminder, 'localId' | 'createdAt' | 'updatedAt' | 'synced'>) { const value: LocalReminder = { ...reminder, id: reminder.id || crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date(), synced: false }; await db.reminders.add(value as LocalReminder & { localId: number }); await queue('create', 'reminders', value.id, value as unknown as Record<string, unknown>); return value },
  async update(id: string, updates: Partial<LocalReminder>) { const existing = await this.getById(id); if (!existing) return undefined; const value = { ...existing, ...updates, updatedAt: new Date(), synced: false }; await db.reminders.where('id').equals(id).modify(value); await queue('update', 'reminders', id, value as unknown as Record<string, unknown>); return value },
  async delete(id: string) { await db.reminders.where('id').equals(id).delete(); await queue('delete', 'reminders', id) },
  async complete(reminder: LocalReminder, status: 'taken' | 'done') { const completion: LocalReminderCompletion = { id: crypto.randomUUID(), reminderId: reminder.id, patientId: reminder.patientId, status, completedAt: new Date(), createdAt: new Date(), synced: false }; await db.reminderCompletions.add(completion as LocalReminderCompletion & { localId: number }); await queue('create', 'reminder_completions', completion.id, completion as unknown as Record<string, unknown>); if (reminder.snoozedUntil) await this.update(reminder.id, { snoozedUntil: undefined }); await updateReminderReport(reminder.patientId); return completion },
  async snooze(reminder: LocalReminder, minutes: number) { const until = new Date(Date.now() + minutes * 60_000); const completion: LocalReminderCompletion = { id: crypto.randomUUID(), reminderId: reminder.id, patientId: reminder.patientId, status: 'remind_later', completedAt: new Date(), createdAt: new Date(), synced: false }; await db.reminderCompletions.add(completion as LocalReminderCompletion & { localId: number }); await queue('create', 'reminder_completions', completion.id, completion as unknown as Record<string, unknown>); await this.update(reminder.id, { snoozedUntil: until }); await updateReminderReport(reminder.patientId); return until },
  async addCompletion(completion: Omit<LocalReminderCompletion, 'localId' | 'createdAt' | 'synced'>) { const value: LocalReminderCompletion = { ...completion, id: completion.id || crypto.randomUUID(), completedAt: new Date(), createdAt: new Date(), synced: false }; await db.reminderCompletions.add(value as LocalReminderCompletion & { localId: number }); await queue('create', 'reminder_completions', value.id, value as unknown as Record<string, unknown>); await updateReminderReport(value.patientId); return value },
}

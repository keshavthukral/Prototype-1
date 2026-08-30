/**
 * Demo data seeder.
 *
 * Seeds versioned demo fixtures into IndexedDB. Existing demo installs are
 * refreshed with Prototype 2 content without clearing user-created records.
 *
 * This module is the ONLY place demo data enters the database.
 * Demo data is tagged `synced: true` so the sync service skips it.
 */

import { db, dbOperations } from '@/lib/db/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import {
  DEMO_PATIENT,
  DEMO_GAME_SESSIONS,
  DEMO_REMINDERS,
  DEMO_REMINDER_COMPLETIONS,
  DEMO_MEMORIES,
  DEMO_SETTINGS,
} from './fixtures'

/**
 * Seed demo data into IndexedDB.
 * Idempotent — safe to call multiple times.
 * Only runs when Supabase is NOT configured (demo mode).
 */
export async function seedDemoData(): Promise<boolean> {
  // Never seed when Supabase is configured
  if (isSupabaseConfigured()) return false

  const seedVersion = await dbOperations.getSetting('demo-seed-version')
  if (seedVersion === '4') return false
  const alreadySeeded = await dbOperations.getSetting('demo-seeded') === 'true'

  console.info('%c🌱 Seeding demo data…', 'color: #0d9488; font-weight: bold;')

  try {
    // Write all data in a single transaction for speed
    await db.transaction(
      'rw',
      [db.patientProfile, db.gameSessions, db.reminders, db.reminderCompletions, db.memories, db.settings],
      async () => {
        // Patient profile
        await db.patientProfile.put(DEMO_PATIENT)

        // Game sessions
        if (!alreadySeeded) {
          await db.gameSessions.bulkAdd(DEMO_GAME_SESSIONS as never)
        }

        // Reminders
        await db.reminders.where('id').anyOf(['demo-r1', 'demo-r2', 'demo-r3']).delete()
        for (const reminder of DEMO_REMINDERS) {
          const existing = await db.reminders.where('id').equals(reminder.id).first()
          if (existing?.localId) await db.reminders.update(existing.localId, reminder)
          else await db.reminders.add(reminder as never)
        }

        // Reminder completions
        if (DEMO_REMINDER_COMPLETIONS.length > 0) {
          await db.reminderCompletions.bulkPut(DEMO_REMINDER_COMPLETIONS as never)
        }

        // Memories
        await db.memories.where('id').anyOf(['demo-m1', 'demo-m2', 'demo-m3', 'demo-m4', 'demo-v2-m1', 'demo-v2-m2', 'demo-v2-m3', 'demo-v2-m4', 'demo-v2-m5']).delete()
        await db.memories.bulkPut(DEMO_MEMORIES as never)

        // Settings (mark as seeded)
        for (const setting of DEMO_SETTINGS) {
          await db.settings.put(setting)
        }
      }
    )

    console.info('%c✅ Demo data seeded successfully', 'color: #0d9488; font-weight: bold;')
    console.info(
      '%c   Patient: Anita Devi · Caregiver: Rahul Sharma',
      'color: #64748b;'
    )
    console.info(
      '%c   Sessions: 15 · Reminders: 6 · Memories: 8',
      'color: #64748b;'
    )

    return true
  } catch (error) {
    console.error('Failed to seed demo data:', error)
    return false
  }
}

/**
 * Check if demo data has been seeded.
 */
export async function isDemoSeeded(): Promise<boolean> {
  const val = await dbOperations.getSetting('demo-seeded')
  return val === 'true'
}

/**
 * Clear all demo data. Useful for re-seeding.
 */
export async function clearDemoData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.patientProfile, db.gameSessions, db.reminders, db.reminderCompletions, db.memories, db.wellBeingCheckIns, db.supportRequests, db.settings, db.syncQueue],
    async () => {
      await db.patientProfile.clear()
      await db.gameSessions.clear()
      await db.reminders.clear()
      await db.reminderCompletions.clear()
      await db.memories.clear()
      await db.wellBeingCheckIns.clear()
      await db.supportRequests.clear()
      await db.settings.clear()
      await db.syncQueue.clear()
    }
  )

  console.info('%c🗑️  Demo data cleared', 'color: #0d9488;')
}

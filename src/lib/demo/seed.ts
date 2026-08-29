/**
 * Demo data seeder.
 *
 * On first visit in demo mode, seeds IndexedDB with the fixtures
 * from ./fixtures.ts. Returns immediately if already seeded
 * (checks the 'demo-seeded' setting key).
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

  // Check if already seeded
  const alreadySeeded = await dbOperations.getSetting('demo-seeded')
  if (alreadySeeded === 'true') return false

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
        await db.gameSessions.bulkAdd(DEMO_GAME_SESSIONS as never)

        // Reminders
        await db.reminders.bulkAdd(DEMO_REMINDERS as never)

        // Reminder completions
        await db.reminderCompletions.bulkAdd(DEMO_REMINDER_COMPLETIONS as never)

        // Memories
        await db.memories.bulkAdd(DEMO_MEMORIES as never)

        // Settings (mark as seeded)
        for (const setting of DEMO_SETTINGS) {
          await db.settings.put(setting)
        }
      }
    )

    console.info('%c✅ Demo data seeded successfully', 'color: #0d9488; font-weight: bold;')
    console.info(
      '%c   Patient: Anita Devi · Caregiver: Rahul',
      'color: #64748b;'
    )
    console.info(
      '%c   Sessions: 15 · Reminders: 3 · Memories: 4',
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
    [db.patientProfile, db.gameSessions, db.reminders, db.reminderCompletions, db.memories, db.settings, db.syncQueue],
    async () => {
      await db.patientProfile.clear()
      await db.gameSessions.clear()
      await db.reminders.clear()
      await db.reminderCompletions.clear()
      await db.memories.clear()
      await db.settings.clear()
      await db.syncQueue.clear()
    }
  )

  console.info('%c🗑️  Demo data cleared', 'color: #0d9488;')
}

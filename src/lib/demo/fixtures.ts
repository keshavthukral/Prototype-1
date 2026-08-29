/**
 * Demo fixtures for the BrainBuddy hackathon pitch.
 *
 * All data is fictional. Patient and caregiver are invented characters.
 * No real personal data is used. Placeholder avatars are generated SVGs,
 * safe to redistribute.
 *
 * These fixtures are seeded into IndexedDB on first visit in demo mode.
 * They are NEVER synced to Supabase — demo data is tagged with
 * `synced: true` so the sync service skips it.
 */

// ─── Fixed IDs ──────────────────────────────────────────────

export const DEMO_PATIENT_ID = 'demo-patient-anita-devi'
export const DEMO_CAREGIVER_ID = 'demo-caregiver-rahul'

// ─── Patient Profile ────────────────────────────────────────

export const DEMO_PATIENT = {
  id: DEMO_PATIENT_ID,
  name: 'Anita Devi',
  preferredLanguage: 'en' as const,
  createdAt: new Date('2026-07-15'),
  updatedAt: new Date('2026-08-29'),
}

// ─── Caregiver Info (for display only, not stored in Dexie) ─

export const DEMO_CAREGIVER = {
  id: DEMO_CAREGIVER_ID,
  name: 'Rahul',
  email: 'rahul@example.com',
}

// ─── Game Sessions ──────────────────────────────────────────
// Spread across recent days to show trend in charts.
// Difficulty levels 1-4, accuracy 40-95%, scores vary.

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0)
  return d
}

export const DEMO_GAME_SESSIONS = [
  // 7 days ago — first session, lower difficulty
  { id: 'demo-s1', patientId: DEMO_PATIENT_ID, gameType: 'memory' as const, difficultyLevel: 1 as const, accuracy: 55, responseTimeMs: 12000, hintsUsed: 2, score: 3, completedAt: daysAgo(7), createdAt: daysAgo(7), synced: true },
  { id: 'demo-s2', patientId: DEMO_PATIENT_ID, gameType: 'pattern' as const, difficultyLevel: 1 as const, accuracy: 60, responseTimeMs: 8000, hintsUsed: 1, score: 3, completedAt: daysAgo(7), createdAt: daysAgo(7), synced: true },

  // 6 days ago
  { id: 'demo-s3', patientId: DEMO_PATIENT_ID, gameType: 'memory' as const, difficultyLevel: 1 as const, accuracy: 65, responseTimeMs: 11000, hintsUsed: 1, score: 4, completedAt: daysAgo(6), createdAt: daysAgo(6), synced: true },
  { id: 'demo-s4', patientId: DEMO_PATIENT_ID, gameType: 'pattern' as const, difficultyLevel: 2 as const, accuracy: 70, responseTimeMs: 7500, hintsUsed: 0, score: 3, completedAt: daysAgo(6), createdAt: daysAgo(6), synced: true },

  // 5 days ago
  { id: 'demo-s5', patientId: DEMO_PATIENT_ID, gameType: 'memory' as const, difficultyLevel: 2 as const, accuracy: 72, responseTimeMs: 10500, hintsUsed: 1, score: 5, completedAt: daysAgo(5), createdAt: daysAgo(5), synced: true },

  // 4 days ago
  { id: 'demo-s6', patientId: DEMO_PATIENT_ID, gameType: 'pattern' as const, difficultyLevel: 2 as const, accuracy: 75, responseTimeMs: 7000, hintsUsed: 0, score: 4, completedAt: daysAgo(4), createdAt: daysAgo(4), synced: true },
  { id: 'demo-s7', patientId: DEMO_PATIENT_ID, gameType: 'memory' as const, difficultyLevel: 2 as const, accuracy: 78, responseTimeMs: 9800, hintsUsed: 0, score: 5, completedAt: daysAgo(4), createdAt: daysAgo(4), synced: true },

  // 3 days ago
  { id: 'demo-s8', patientId: DEMO_PATIENT_ID, gameType: 'pattern' as const, difficultyLevel: 3 as const, accuracy: 80, responseTimeMs: 6500, hintsUsed: 0, score: 4, completedAt: daysAgo(3), createdAt: daysAgo(3), synced: true },
  { id: 'demo-s9', patientId: DEMO_PATIENT_ID, gameType: 'memory' as const, difficultyLevel: 3 as const, accuracy: 82, responseTimeMs: 9200, hintsUsed: 0, score: 6, completedAt: daysAgo(3), createdAt: daysAgo(3), synced: true },

  // 2 days ago
  { id: 'demo-s10', patientId: DEMO_PATIENT_ID, gameType: 'memory' as const, difficultyLevel: 3 as const, accuracy: 85, responseTimeMs: 8800, hintsUsed: 0, score: 6, completedAt: daysAgo(2), createdAt: daysAgo(2), synced: true },
  { id: 'demo-s11', patientId: DEMO_PATIENT_ID, gameType: 'pattern' as const, difficultyLevel: 3 as const, accuracy: 82, responseTimeMs: 6200, hintsUsed: 0, score: 4, completedAt: daysAgo(2), createdAt: daysAgo(2), synced: true },

  // Yesterday
  { id: 'demo-s12', patientId: DEMO_PATIENT_ID, gameType: 'memory' as const, difficultyLevel: 3 as const, accuracy: 88, responseTimeMs: 8500, hintsUsed: 0, score: 7, completedAt: daysAgo(1), createdAt: daysAgo(1), synced: true },
  { id: 'demo-s13', patientId: DEMO_PATIENT_ID, gameType: 'pattern' as const, difficultyLevel: 3 as const, accuracy: 85, responseTimeMs: 5800, hintsUsed: 0, score: 4, completedAt: daysAgo(1), createdAt: daysAgo(1), synced: true },

  // Today — two sessions completed
  { id: 'demo-s14', patientId: DEMO_PATIENT_ID, gameType: 'memory' as const, difficultyLevel: 3 as const, accuracy: 90, responseTimeMs: 8200, hintsUsed: 0, score: 7, completedAt: daysAgo(0), createdAt: daysAgo(0), synced: true },
  { id: 'demo-s15', patientId: DEMO_PATIENT_ID, gameType: 'pattern' as const, difficultyLevel: 3 as const, accuracy: 88, responseTimeMs: 5500, hintsUsed: 0, score: 4, completedAt: daysAgo(0), createdAt: daysAgo(0), synced: true },
]

// ─── Reminders ──────────────────────────────────────────────

export const DEMO_REMINDERS = [
  {
    id: 'demo-r1',
    patientId: DEMO_PATIENT_ID,
    createdBy: DEMO_CAREGIVER_ID,
    title: 'Morning walk',
    description: 'A gentle 15-minute walk around the garden',
    reminderType: 'activity' as const,
    scheduledTime: '07:00',
    frequency: 'daily' as const,
    isActive: true,
    createdAt: new Date('2026-07-20'),
    updatedAt: new Date('2026-08-29'),
    synced: true,
  },
  {
    id: 'demo-r2',
    patientId: DEMO_PATIENT_ID,
    createdBy: DEMO_CAREGIVER_ID,
    title: 'Blood pressure medicine',
    description: 'One tablet after breakfast',
    reminderType: 'medicine' as const,
    scheduledTime: '08:30',
    frequency: 'daily' as const,
    isActive: true,
    createdAt: new Date('2026-07-20'),
    updatedAt: new Date('2026-08-29'),
    synced: true,
  },
  {
    id: 'demo-r3',
    patientId: DEMO_PATIENT_ID,
    createdBy: DEMO_CAREGIVER_ID,
    title: 'Drink water',
    description: 'A glass of water to stay hydrated',
    reminderType: 'hydration' as const,
    scheduledTime: '10:00',
    frequency: 'daily' as const,
    isActive: true,
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-29'),
    synced: true,
  },
]

// ─── Reminder Completions ───────────────────────────────────
// Two completed today (morning walk + medicine)

function todayAt(hours: number, minutes: number): Date {
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d
}

export const DEMO_REMINDER_COMPLETIONS = [
  {
    id: 'demo-rc1',
    reminderId: 'demo-r1',
    patientId: DEMO_PATIENT_ID,
    status: 'done' as const,
    completedAt: todayAt(7, 20),
    createdAt: todayAt(7, 20),
    synced: true,
  },
  {
    id: 'demo-rc2',
    reminderId: 'demo-r2',
    patientId: DEMO_PATIENT_ID,
    status: 'taken' as const,
    completedAt: todayAt(8, 35),
    createdAt: todayAt(8, 35),
    synced: true,
  },
]

// ─── Memories ───────────────────────────────────────────────
// Using generated SVG data URIs as safe placeholder photos.

function avatarSvg(initials: string, bg: string, fg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="16" fill="${bg}"/>
    <text x="100" y="108" text-anchor="middle" font-family="system-ui,sans-serif" font-size="64" font-weight="600" fill="${fg}">${initials}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const DEMO_MEMORIES = [
  {
    id: 'demo-m1',
    patientId: DEMO_PATIENT_ID,
    createdBy: DEMO_CAREGIVER_ID,
    name: 'Suresh',
    relationship: 'Husband',
    description: 'Your beloved husband Suresh. You met at the college library in 1978.',
    imageUrl: avatarSvg('S', '#e0f2fe', '#0369a1'),
    imageStoragePath: undefined,
    createdAt: new Date('2026-07-20'),
    updatedAt: new Date('2026-07-20'),
    synced: true,
  },
  {
    id: 'demo-m2',
    patientId: DEMO_PATIENT_ID,
    createdBy: DEMO_CAREGIVER_ID,
    name: 'Priya',
    relationship: 'Daughter',
    description: 'Your daughter Priya lives in Guwahati. She calls every Sunday evening.',
    imageUrl: avatarSvg('P', '#fce7f3', '#be185d'),
    imageStoragePath: undefined,
    createdAt: new Date('2026-07-22'),
    updatedAt: new Date('2026-07-22'),
    synced: true,
  },
  {
    id: 'demo-m3',
    patientId: DEMO_PATIENT_ID,
    createdBy: DEMO_CAREGIVER_ID,
    name: 'Rahul',
    relationship: 'Son',
    description: 'Your son Rahul takes care of you. He visits every weekend with sweets.',
    imageUrl: avatarSvg('R', '#dcfce7', '#15803d'),
    imageStoragePath: undefined,
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-01'),
    synced: true,
  },
  {
    id: 'demo-m4',
    patientId: DEMO_PATIENT_ID,
    createdBy: DEMO_CAREGIVER_ID,
    name: 'Aai',
    relationship: 'Mother',
    description: 'Your mother, who taught you to cook Assamese bhogali khichdi.',
    imageUrl: avatarSvg('A', '#fef3c7', '#92400e'),
    imageStoragePath: undefined,
    createdAt: new Date('2026-08-10'),
    updatedAt: new Date('2026-08-10'),
    synced: true,
  },
]

// ─── Demo Settings ──────────────────────────────────────────

export const DEMO_SETTINGS = [
  { key: 'app-mode', value: 'demo' },
  { key: 'demo-seeded', value: 'true' },
  { key: 'demo-patient-id', value: DEMO_PATIENT_ID },
  { key: 'demo-caregiver-id', value: DEMO_CAREGIVER_ID },
]

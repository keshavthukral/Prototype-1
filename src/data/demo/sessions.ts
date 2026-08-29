import { DEMO_PATIENT_ID } from './patient'

function daysAgo(days: number, hour: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 0, 0, 0)
  return date
}

const session = (id: string, days: number, gameType: 'memory' | 'pattern', accuracy: number, score: number) => ({
  id, patientId: DEMO_PATIENT_ID, gameType, difficultyLevel: 3 as const, accuracy,
  responseTimeMs: gameType === 'memory' ? 8500 : 6000, hintsUsed: 0, score,
  completedAt: daysAgo(days, gameType === 'memory' ? 10 : 16),
  createdAt: daysAgo(days, gameType === 'memory' ? 10 : 16), synced: true,
})

export const DEMO_GAME_SESSIONS = [
  session('demo-s1', 7, 'memory', 62, 4), session('demo-s2', 7, 'pattern', 65, 3),
  session('demo-s3', 6, 'memory', 68, 5), session('demo-s4', 6, 'pattern', 70, 3),
  session('demo-s5', 5, 'memory', 72, 5), session('demo-s6', 4, 'pattern', 75, 4),
  session('demo-s7', 4, 'memory', 78, 5), session('demo-s8', 3, 'pattern', 80, 4),
  session('demo-s9', 3, 'memory', 82, 6), session('demo-s10', 2, 'memory', 85, 6),
  session('demo-s11', 2, 'pattern', 82, 4), session('demo-s12', 1, 'memory', 88, 7),
  session('demo-s13', 1, 'pattern', 85, 4), session('demo-s14', 0, 'memory', 90, 7),
  session('demo-s15', 0, 'pattern', 88, 4),
]

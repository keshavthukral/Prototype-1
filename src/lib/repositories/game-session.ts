import { db, dbOperations } from '@/lib/db/database'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { SessionResult } from '@/lib/games/adaptive-engine'

export interface GameSessionRecord {
  id: string
  patientId: string
  gameType: 'memory' | 'pattern'
  difficultyLevel: DifficultyLevel
  correctCount: number
  totalCount: number
  accuracy: number
  responseTimeMs: number
  hintsUsed: number
  score: number
  completedAt: Date
  createdAt: Date
  synced: boolean
}

/**
 * Convert a Dexie-stored LocalGameSession to our SessionResult format
 * used by the adaptive engine.
 */
export function toSessionResult(record: {
  difficultyLevel: number
  accuracy: number
  responseTimeMs: number
  hintsUsed: number
}): SessionResult {
  return {
    correctCount: Math.round(record.accuracy), // store accuracy as percent; we reconstruct below
    totalCount: 100, // normalised
    responseTimeMs: record.responseTimeMs,
    hintsUsed: record.hintsUsed,
    difficulty: record.difficultyLevel as DifficultyLevel,
  }
}

/**
 * Build a SessionResult from raw game data.
 */
export function buildSessionResult(params: {
  correctCount: number
  totalCount: number
  responseTimeMs: number
  hintsUsed: number
  difficulty: DifficultyLevel
}): SessionResult {
  return {
    correctCount: params.correctCount,
    totalCount: params.totalCount,
    responseTimeMs: params.responseTimeMs,
    hintsUsed: params.hintsUsed,
    difficulty: params.difficulty,
  }
}

/**
 * Save a completed game session to Dexie (local) and queue for Supabase sync.
 */
export async function saveGameSession(params: {
  patientId: string
  gameType: 'memory' | 'pattern'
  difficultyLevel: DifficultyLevel
  correctCount: number
  totalCount: number
  responseTimeMs: number
  hintsUsed: number
}): Promise<void> {
  const accuracy = params.totalCount > 0
    ? (params.correctCount / params.totalCount) * 100
    : 0
  const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const session = {
    id,
    patientId: params.patientId,
    gameType: params.gameType,
    difficultyLevel: params.difficultyLevel,
    accuracy,
    responseTimeMs: params.responseTimeMs,
    hintsUsed: params.hintsUsed,
    score: params.correctCount,
    completedAt: new Date(),
    createdAt: new Date(),
    synced: false,
  }

  // Save to Dexie (local storage) — always succeeds offline
  await dbOperations.saveGameSession(session)

  // If online, try immediate push for fast feedback.
  // The sync queue is the source of truth; if this fails the
  // queue item is still pending and the sync service will retry.
  if (isSupabaseConfigured() && navigator.onLine) {
    try {
      await supabase.from('game_sessions').upsert({
        id: session.id,
        patient_id: session.patientId,
        game_type: session.gameType,
        difficulty_level: session.difficultyLevel,
        accuracy: session.accuracy,
        response_time_ms: session.responseTimeMs,
        hints_used: session.hintsUsed,
        score: session.score,
        completed_at: session.completedAt.toISOString(),
        created_at: session.createdAt.toISOString(),
      } as never, { onConflict: 'id' })
    } catch {
      // Sync queue already has this item — the sync service will retry
    }
  }
}

/**
 * Get recent session results for a patient, ordered newest first.
 * Used by the adaptive engine.
 */
export async function getRecentSessions(
  patientId: string,
  gameType: 'memory' | 'pattern',
  limit: number = 5,
): Promise<SessionResult[]> {
  const sessions = await db.gameSessions
    .where('[patientId+gameType]')
    .equals([patientId, gameType])
    .reverse()
    .limit(limit)
    .toArray()

  return sessions.map(s => ({
    correctCount: s.score,
    totalCount: Math.round(s.accuracy) > 0 ? Math.round((s.score / s.accuracy) * 100) : 0,
    responseTimeMs: s.responseTimeMs,
    hintsUsed: s.hintsUsed,
    difficulty: s.difficultyLevel as DifficultyLevel,
  }))
}

/**
 * Get the current difficulty level for a patient.
 * Returns the difficulty from the most recent session, or 1 if no sessions exist.
 */
export async function getCurrentDifficulty(
  patientId: string,
  gameType: 'memory' | 'pattern',
): Promise<DifficultyLevel> {
  const sessions = await db.gameSessions
    .where('[patientId+gameType]')
    .equals([patientId, gameType])
    .reverse()
    .limit(1)
    .toArray()

  if (sessions.length === 0) return 1
  const first = sessions[0]
  return (first?.difficultyLevel || 1) as DifficultyLevel
}

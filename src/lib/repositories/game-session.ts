import { db } from '@/lib/db/database'
import type { LocalGameSession } from '@/lib/db/database'

export type GameType = 'memory' | 'pattern'
export type DifficultyLevel = 1 | 2 | 3 | 4

// Re-export type from database
export type { LocalGameSession as GameSession }

// Game session repository using direct Dexie operations
export const gameSessionRepository = {
  async getById(id: string): Promise<LocalGameSession | undefined> {
    return db.gameSessions.where('id').equals(id).first()
  },

  async getByPatientId(patientId: string): Promise<LocalGameSession[]> {
    return db.gameSessions.where('patientId').equals(patientId).toArray()
  },

  async getByGameType(patientId: string, gameType: GameType): Promise<LocalGameSession[]> {
    return db.gameSessions
      .where('patientId')
      .equals(patientId)
      .and((s) => s.gameType === gameType)
      .toArray()
  },

  async getRecentSessions(patientId: string, limit: number = 10): Promise<LocalGameSession[]> {
    return db.gameSessions
      .where('patientId')
      .equals(patientId)
      .reverse()
      .limit(limit)
      .toArray()
  },

  async create(session: Omit<LocalGameSession, 'localId' | 'createdAt' | 'synced'>): Promise<LocalGameSession> {
    const newSession: LocalGameSession = {
      ...session,
      id: session.id || crypto.randomUUID(),
      completedAt: new Date(),
      createdAt: new Date(),
      synced: false,
    }

    await db.gameSessions.add(newSession as LocalGameSession & { localId: number })

    // Queue for sync
    await db.syncQueue.add({
      operation: 'create',
      table: 'game_sessions',
      recordId: newSession.id,
      data: newSession as unknown as Record<string, unknown>,
      timestamp: new Date(),
      retryCount: 0,
    })

    return newSession
  },

  async getAverageAccuracy(patientId: string, gameType?: GameType): Promise<number> {
    const sessions = gameType
      ? await this.getByGameType(patientId, gameType)
      : await this.getByPatientId(patientId)

    if (sessions.length === 0) return 0

    const totalAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0)
    return totalAccuracy / sessions.length
  },

  async getRecentPerformance(patientId: string, gameType: GameType, count: number = 5): Promise<number[]> {
    const sessions = await this.getByGameType(patientId, gameType)
    return sessions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, count)
      .map((s) => s.accuracy)
  },

  async getDifficultyStats(patientId: string, gameType: GameType): Promise<{
    currentDifficulty: DifficultyLevel
    averageAccuracy: number
    sessionsPlayed: number
  }> {
    const sessions = await this.getByGameType(patientId, gameType)
    
    if (sessions.length === 0) {
      return {
        currentDifficulty: 1,
        averageAccuracy: 0,
        sessionsPlayed: 0,
      }
    }

    const sortedSessions = sessions.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
    const latestSession = sortedSessions[0]

    const averageAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length

    return {
      currentDifficulty: latestSession?.difficultyLevel ?? 1,
      averageAccuracy,
      sessionsPlayed: sessions.length,
    }
  },
}

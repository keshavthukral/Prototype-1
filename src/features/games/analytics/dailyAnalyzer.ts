/**
 * Daily Analyzer — End-of-day performance aggregation.
 *
 * Combines memory, attention, engagement, and routine data
 * into a structured DailyPerformance object.
 */

import type { MemorySessionAnalysis } from './sessionAnalyzer'
import type { AttentionSessionAnalysis } from './sessionAnalyzer'

// ─── Daily Performance ──────────────────────────────────────────

export interface DailyPerformance {
  date: string // ISO date string

  memory: {
    immediateRecallAccuracy: number
    delayedRecallAccuracy: number | null
    spatialAccuracy: number | null
    sequenceAccuracy: number | null
    averageResponseTime: number
  }

  attention: {
    visualSearchAccuracy: number
    patternAccuracy: number
    matchingAccuracy: number
    averageResponseTime: number
  }

  engagement: {
    gamesCompleted: number
    hintsUsed: number
    skippedActivities: number
  }

  routine: {
    remindersCompleted: number
    remindersPostponed: number
  }
}

// ─── Functions ──────────────────────────────────────────────────

/**
 * Build a DailyPerformance from session analyses and routine data.
 */
export function buildDailyPerformance(params: {
  date: string
  memorySession: MemorySessionAnalysis | null
  attentionSession: AttentionSessionAnalysis | null
  gamesCompleted: number
  hintsUsed: number
  skippedActivities: number
  remindersCompleted: number
  remindersPostponed: number
}): DailyPerformance {
  const { memorySession, attentionSession } = params

  return {
    date: params.date,

    memory: {
      immediateRecallAccuracy: memorySession?.immediateRecallAccuracy ?? 0,
      delayedRecallAccuracy: memorySession?.delayedRecallAccuracy ?? null,
      spatialAccuracy: memorySession?.spatialAccuracy ?? null,
      sequenceAccuracy: memorySession?.sequenceAccuracy ?? null,
      averageResponseTime: memorySession?.averageResponseTime ?? 0,
    },

    attention: {
      visualSearchAccuracy: attentionSession?.visualSearchAccuracy ?? 0,
      patternAccuracy: attentionSession?.patternAccuracy ?? 0,
      matchingAccuracy: attentionSession?.pairMatchingAccuracy ?? 0,
      averageResponseTime: attentionSession?.averageResponseTime ?? 0,
    },

    engagement: {
      gamesCompleted: params.gamesCompleted,
      hintsUsed: params.hintsUsed,
      skippedActivities: params.skippedActivities,
    },

    routine: {
      remindersCompleted: params.remindersCompleted,
      remindersPostponed: params.remindersPostponed,
    },
  }
}

/**
 * Calculate a simple engagement score from daily performance.
 * This is NOT a diagnostic metric — just tracks participation.
 */
export function calculateEngagementScore(performance: DailyPerformance): number {
  const completionBonus = performance.engagement.gamesCompleted * 20
  const hintPenalty = Math.min(performance.engagement.hintsUsed * 5, 30)
  const skipPenalty = performance.engagement.skippedActivities * 15
  return Math.max(0, Math.min(100, completionBonus - hintPenalty - skipPenalty))
}

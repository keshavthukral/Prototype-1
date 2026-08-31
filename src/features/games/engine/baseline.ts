/**
 * Baseline — Tracks personal change over time.
 *
 * Records baseline values and compares current performance against
 * the patient's own history. NOT a diagnostic tool.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'

// ─── Baseline Snapshot ──────────────────────────────────────────

export interface BaselineSnapshot {
  /** Timestamp of this snapshot */
  timestamp: number
  /** Difficulty level at time of recording */
  difficulty: DifficultyLevel
  /** Overall accuracy percentage */
  accuracy: number
  /** Average response time in ms */
  averageResponseTimeMs: number
  /** Total hints used */
  hintsUsed: number
  /** Whether the session was completed */
  completed: boolean
  /** Duration of the session in ms */
  duration: number
}

// ─── Trend Direction ────────────────────────────────────────────

export type TrendDirection = 'improving' | 'stable' | 'declining'

export interface TrendResult {
  direction: TrendDirection
  /** How confident we are (0–1) */
  confidence: number
  /** Average accuracy over recent sessions */
  recentAccuracy: number
  /** Average accuracy over earlier sessions */
  earlierAccuracy: number
}

// ─── Functions ──────────────────────────────────────────────────

/**
 * Create a baseline snapshot from session metrics.
 */
export function createSnapshot(params: {
  difficulty: DifficultyLevel
  accuracy: number
  averageResponseTimeMs: number
  hintsUsed: number
  completed: boolean
  duration: number
}): BaselineSnapshot {
  return {
    timestamp: performance.now(),
    difficulty: params.difficulty,
    accuracy: params.accuracy,
    averageResponseTimeMs: params.averageResponseTimeMs,
    hintsUsed: params.hintsUsed,
    completed: params.completed,
    duration: params.duration,
  }
}

/**
 * Analyse trend direction across recent baseline snapshots.
 * Splits snapshots into recent vs earlier and compares.
 */
export function analyseTrend(snapshots: BaselineSnapshot[]): TrendResult | null {
  if (snapshots.length < 4) return null

  const midpoint = Math.ceil(snapshots.length / 2)
  const earlier = snapshots.slice(0, midpoint)
  const recent = snapshots.slice(midpoint)

  const earlierAccuracy = earlier.reduce((s, b) => s + b.accuracy, 0) / earlier.length
  const recentAccuracy = recent.reduce((s, b) => s + b.accuracy, 0) / recent.length

  const diff = recentAccuracy - earlierAccuracy

  let direction: TrendDirection
  let confidence: number

  if (diff > 5) {
    direction = 'improving'
    confidence = Math.min(1, diff / 20)
  } else if (diff < -5) {
    direction = 'declining'
    confidence = Math.min(1, Math.abs(diff) / 20)
  } else {
    direction = 'stable'
    confidence = 1 - Math.abs(diff) / 10
  }

  return { direction, confidence, recentAccuracy, earlierAccuracy }
}

/**
 * Calculate the patient's personal speed baseline (median response time).
 */
export function personalSpeedBaseline(snapshots: BaselineSnapshot[]): {
  medianMs: number
  fastThreshold: number
  slowThreshold: number
} {
  const times = snapshots
    .map((s) => s.averageResponseTimeMs)
    .filter((t) => t > 0)
    .sort((a, b) => a - b)

  if (times.length === 0) {
    return { medianMs: 30_000, fastThreshold: 15_000, slowThreshold: 60_000 }
  }

  const mid = Math.floor(times.length / 2)
  const medianMs = times.length % 2 !== 0
    ? times[mid]!
    : (times[mid - 1]! + times[mid]!) / 2

  return {
    medianMs,
    fastThreshold: medianMs * 0.6,
    slowThreshold: medianMs * 1.8,
  }
}

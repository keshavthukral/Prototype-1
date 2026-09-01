/**
 * Session Analyzer — Deterministic analysis of completed sessions.
 *
 * Produces separate analysis for memory and attention sessions.
 * Does NOT collapse everything into one "brain score".
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { MemoryRoundMetric, ChallengeMetric, ChallengeType } from '../metrics/types'
import { median } from '../engine/scoring'

// ─── Memory Session Analysis ────────────────────────────────────

export interface MemorySessionAnalysis {
  immediateRecallAccuracy: number
  delayedRecallAccuracy: number | null
  spatialAccuracy: number | null
  sequenceAccuracy: number | null
  personalMemoryAccuracy: number | null

  averageResponseTime: number
  medianResponseTime: number

  falseSelectionRate: number
  hintRate: number
  completionRate: number

  /** Overall accuracy across completed rounds */
  overallAccuracy: number
  /** Performance change from early to late rounds */
  performanceChange: number
}

/**
 * Analyze a complete memory session from its round metrics.
 */
export function analyzeMemorySession(
  rounds: MemoryRoundMetric[],
  totalRounds: number,
  _difficulty: DifficultyLevel,
): MemorySessionAnalysis {
  const completed = rounds.filter((r) => !r.skipped)

  // Immediate recall (round 1 — object-recall)
  const immediate = rounds.find((r) => r.roundType === 'object-recall')
  const immediateRecallAccuracy = immediate?.accuracy ?? 0

  // Delayed recall (round 5 — delayed-recall)
  const delayed = rounds.find((r) => r.roundType === 'delayed-recall')
  const delayedRecallAccuracy = delayed ? delayed.accuracy : null

  // Spatial memory
  const spatial = rounds.find((r) => r.roundType === 'spatial-memory')
  const spatialAccuracy = spatial ? spatial.accuracy : null

  // Sequence/order memory
  const sequence = rounds.find((r) => r.roundType === 'order-memory')
  const sequenceAccuracy = sequence ? sequence.accuracy : null

  // Personal memory
  const personal = rounds.find((r) => r.roundType === 'personal-memory')
  const personalMemoryAccuracy = personal ? personal.accuracy : null

  // Response times
  const responseTimes = completed.map((r) => r.responseTimeMs).filter((t) => t > 0)
  const averageResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0
  const medianResponseTime = Math.round(median(responseTimes))

  // False selection rate
  const totalFalse = completed.reduce((sum, r) => {
    if ('incorrectSelections' in r) return sum + (r as { incorrectSelections: number }).incorrectSelections
    return sum
  }, 0)
  const totalSelected = completed.reduce((sum, r) => {
    if ('correctTargets' in r && 'incorrectSelections' in r) {
      return sum + (r as { correctTargets: number; incorrectSelections: number }).correctTargets
        + (r as { incorrectSelections: number }).incorrectSelections
    }
    return sum
  }, 0)
  const falseSelectionRate = totalSelected > 0
    ? Math.round((totalFalse / totalSelected) * 100)
    : 0

  // Hint rate
  const totalHints = completed.reduce((sum, r) => sum + r.hints, 0)
  const hintRate = completed.length > 0
    ? Math.round((totalHints / completed.length) * 100)
    : 0

  // Completion rate
  const completionRate = totalRounds > 0
    ? Math.round((completed.length / totalRounds) * 100)
    : 0

  // Overall accuracy
  const overallAccuracy = completed.length > 0
    ? Math.round(completed.reduce((sum, r) => sum + r.accuracy, 0) / completed.length)
    : 0

  // Performance change (early vs late rounds)
  const midpoint = Math.ceil(completed.length / 2)
  const early = completed.slice(0, midpoint)
  const late = completed.slice(midpoint)
  const earlyAvg = early.length > 0
    ? early.reduce((s, r) => s + r.accuracy, 0) / early.length
    : 0
  const lateAvg = late.length > 0
    ? late.reduce((s, r) => s + r.accuracy, 0) / late.length
    : 0
  const performanceChange = Math.round(lateAvg - earlyAvg)

  return {
    immediateRecallAccuracy,
    delayedRecallAccuracy,
    spatialAccuracy,
    sequenceAccuracy,
    personalMemoryAccuracy,
    averageResponseTime,
    medianResponseTime,
    falseSelectionRate,
    hintRate,
    completionRate,
    overallAccuracy,
    performanceChange,
  }
}

// ─── Attention Session Analysis ─────────────────────────────────

export interface AttentionSessionAnalysis {
  trailConnectAccuracy: number | null
  cancellationAccuracy: number | null
  ruleSwitchAccuracy: number | null
  everydaySequenceAccuracy: number | null

  averageResponseTime: number
  errorRate: number
  completionRate: number

  overallAccuracy: number
}

/**
 * Analyze a complete attention session from its challenge metrics.
 */
export function analyzeAttentionSession(
  challenges: ChallengeMetric[],
  totalChallenges: number,
  _difficulty: DifficultyLevel,
): AttentionSessionAnalysis {
  const completed = challenges.filter((c) => !c.skipped)

  // Group by task type
  const byType = new Map<ChallengeType, ChallengeMetric[]>()
  for (const c of completed) {
    const list = byType.get(c.challengeType) ?? []
    list.push(c)
    byType.set(c.challengeType, list)
  }

  // Per-type accuracy helpers
  const accuracyForType = (type: ChallengeType): number | null => {
    const group = byType.get(type)
    if (!group || group.length === 0) return null
    const correct = group.filter((c) => c.correct).length
    return Math.round((correct / group.length) * 100)
  }

  const trailConnectAccuracy = accuracyForType('trail-connect')
  const cancellationAccuracy = accuracyForType('cancellation')
  const ruleSwitchAccuracy = accuracyForType('rule-switch')
  const everydaySequenceAccuracy = accuracyForType('everyday-sequence')

  // Average response time
  const responseTimes = completed.map((c) => c.responseTimeMs).filter((t) => t > 0)
  const averageResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0

  // Error rate
  const errorRate = completed.length > 0
    ? Math.round(((completed.length - completed.filter((c) => c.correct).length) / completed.length) * 100)
    : 0

  // Completion rate
  const completionRate = totalChallenges > 0
    ? Math.round((completed.length / totalChallenges) * 100)
    : 0

  // Overall accuracy
  const overallAccuracy = completed.length > 0
    ? Math.round((completed.filter((c) => c.correct).length / completed.length) * 100)
    : 0

  return {
    trailConnectAccuracy,
    cancellationAccuracy,
    ruleSwitchAccuracy,
    everydaySequenceAccuracy,
    averageResponseTime,
    errorRate,
    completionRate,
    overallAccuracy,
  }
}

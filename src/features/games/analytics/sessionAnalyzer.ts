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
  patternAccuracy: number
  visualSearchAccuracy: number
  pairMatchingAccuracy: number
  ruleSwitchAccuracy: number
  selectiveAttentionAccuracy: number
  workingMemoryAccuracy: number

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

  // Pattern accuracy (what-comes-next, sequence-completion, number-pattern)
  const patternTypes: ChallengeType[] = ['what-comes-next', 'sequence-completion', 'number-pattern']
  const patternChallenges = completed.filter((c) => patternTypes.includes(c.challengeType))
  const patternCorrect = patternChallenges.filter((c) => c.correct).length
  const patternAccuracy = patternChallenges.length > 0
    ? Math.round((patternCorrect / patternChallenges.length) * 100)
    : 0

  // Visual search accuracy (find-different, target-find)
  const searchTypes: ChallengeType[] = ['find-different', 'target-find']
  const searchChallenges = completed.filter((c) => searchTypes.includes(c.challengeType))
  const searchCorrect = searchChallenges.filter((c) => c.correct).length
  const visualSearchAccuracy = searchChallenges.length > 0
    ? Math.round((searchCorrect / searchChallenges.length) * 100)
    : 0

  // Pair matching accuracy
  const pairChallenges = byType.get('match-pair') ?? []
  const pairCorrect = pairChallenges.filter((c) => c.correct).length
  const pairMatchingAccuracy = pairChallenges.length > 0
    ? Math.round((pairCorrect / pairChallenges.length) * 100)
    : 0

  // Rule switch accuracy (rule-switch type)
  const ruleChallenges = byType.get('rule-switch') ?? []
  const ruleCorrect = ruleChallenges.filter((c) => c.correct).length
  const ruleSwitchAccuracy = ruleChallenges.length > 0
    ? Math.round((ruleCorrect / ruleChallenges.length) * 100)
    : 0

  // Selective attention accuracy
  const selectiveChallenges = byType.get('selective-attention') ?? []
  const selectiveCorrect = selectiveChallenges.filter((c) => c.correct).length
  const selectiveAttentionAccuracy = selectiveChallenges.length > 0
    ? Math.round((selectiveCorrect / selectiveChallenges.length) * 100)
    : 0

  // Working memory accuracy
  const workingMemoryChallenges = byType.get('working-memory-choice') ?? []
  const workingMemoryCorrect = workingMemoryChallenges.filter((c) => c.correct).length
  const workingMemoryAccuracy = workingMemoryChallenges.length > 0
    ? Math.round((workingMemoryCorrect / workingMemoryChallenges.length) * 100)
    : 0

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
    patternAccuracy,
    visualSearchAccuracy,
    pairMatchingAccuracy,
    ruleSwitchAccuracy,
    selectiveAttentionAccuracy,
    workingMemoryAccuracy,
    averageResponseTime,
    errorRate,
    completionRate,
    overallAccuracy,
  }
}

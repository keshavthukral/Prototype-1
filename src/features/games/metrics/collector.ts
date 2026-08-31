/**
 * Metrics Collector
 *
 * Accumulates round/challenge-level metrics during a game session
 * and produces a final session summary for persistence.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type {
  MemoryRoundMetric,
  MemorySessionMetrics,
  ChallengeMetric,
  AttentionSessionMetrics,
} from './types'
import { median } from '../engine/scoring'

// ─── Memory session collector ───────────────────────────────────

export class MemoryMetricsCollector {
  private rounds: MemoryRoundMetric[] = []
  private sessionStart = performance.now()

  addRound(metric: MemoryRoundMetric) {
    this.rounds.push(metric)
  }

  getSessionMetrics(params: {
    mode: 'daily' | 'practice'
    difficulty: DifficultyLevel
    completed: boolean
  }): MemorySessionMetrics {
    const duration = performance.now() - this.sessionStart
    const completedRounds = this.rounds.filter((r) => !r.skipped)

    // Total accuracy: average of all round accuracies
    const totalAccuracy =
      completedRounds.length > 0
        ? completedRounds.reduce((sum, r) => sum + r.accuracy, 0) /
          completedRounds.length
        : 0

    // Response times
    const responseTimes = completedRounds
      .map((r) => r.responseTimeMs)
      .filter((t) => t > 0)

    const averageResponseTimeMs =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          )
        : 0

    const medianResponseTimeMs = Math.round(median(responseTimes))

    // Performance by round
    const performanceByRound = this.rounds.map((r) => r.accuracy)

    // Performance change: compare early vs late rounds
    const midpoint = Math.ceil(this.rounds.length / 2)
    const earlyRounds = this.rounds.slice(0, midpoint)
    const lateRounds = this.rounds.slice(midpoint)
    const earlyAvg =
      earlyRounds.length > 0
        ? earlyRounds.reduce((s, r) => s + r.accuracy, 0) /
          earlyRounds.length
        : 0
    const lateAvg =
      lateRounds.length > 0
        ? lateRounds.reduce((s, r) => s + r.accuracy, 0) / lateRounds.length
        : 0
    const performanceChange = lateAvg - earlyAvg

    // Delayed recall accuracy
    const delayed = this.rounds.find((r) => r.roundType === 'delayed-recall')
    const delayedRecallAccuracy = delayed ? delayed.accuracy : null

    // False selection rate
    let totalFalseSelections = 0
    let totalSelections = 0
    for (const r of this.rounds) {
      if (r.roundType === 'object-recall' || r.roundType === 'delayed-recall') {
        totalFalseSelections += r.incorrectSelections
        totalSelections += r.correctTargets + r.incorrectSelections
      }
    }
    const falseSelectionRate = totalSelections > 0
      ? Math.round((totalFalseSelections / totalSelections) * 100)
      : 0

    // Hint rate
    const totalHints = this.rounds.reduce((sum, r) => sum + r.hints, 0)
    const hintRate = this.rounds.length > 0
      ? Math.round((totalHints / this.rounds.length) * 100)
      : 0

    // Completion rate
    const completionRate = params.completed ? 100 : Math.round(
      (completedRounds.length / this.rounds.length) * 100,
    )

    return {
      mode: params.mode,
      difficulty: params.difficulty,
      rounds: this.rounds,
      totalAccuracy,
      averageResponseTimeMs,
      medianResponseTimeMs,
      performanceByRound,
      performanceChange,
      delayedRecallAccuracy,
      falseSelectionRate,
      hintRate,
      completionRate,
      completed: params.completed,
      duration,
    }
  }

  reset() {
    this.rounds = []
    this.sessionStart = performance.now()
  }
}

// ─── Attention session collector ────────────────────────────────

export class AttentionMetricsCollector {
  private challenges: ChallengeMetric[] = []
  private sessionStart = performance.now()

  addChallenge(metric: ChallengeMetric) {
    this.challenges.push(metric)
  }

  getSessionMetrics(params: {
    mode: 'daily' | 'practice'
    difficulty: DifficultyLevel
    completed: boolean
  }): AttentionSessionMetrics {
    const duration = performance.now() - this.sessionStart
    const completed = this.challenges.filter((c) => !c.skipped)

    const totalAccuracy =
      this.challenges.length > 0
        ? (this.challenges.filter((c) => c.correct).length /
            this.challenges.length) *
          100
        : 0

    const avgResponse =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, c) => sum + c.responseTimeMs, 0) /
              completed.length,
          )
        : 0

    // Response time variation
    const mean = avgResponse
    const variation =
      completed.length > 0
        ? Math.round(
            Math.sqrt(
              completed.reduce(
                (sum, c) =>
                  sum + Math.pow(c.responseTimeMs - mean, 2),
                0,
              ) / completed.length,
            ),
          )
        : 0

    // Error rate
    const errorRate = completed.length > 0
      ? Math.round(
          ((completed.length - completed.filter((c) => c.correct).length) /
            completed.length) *
            100,
        )
      : 0

    // Completion rate
    const completionRate = params.completed ? 100 : Math.round(
      (completed.length / this.challenges.length) * 100,
    )

    return {
      mode: params.mode,
      difficulty: params.difficulty,
      challenges: this.challenges,
      totalAccuracy,
      averageResponseTimeMs: avgResponse,
      averageResponseVariationMs: variation,
      errorRate,
      completionRate,
      completed: params.completed,
      duration,
    }
  }

  reset() {
    this.challenges = []
    this.sessionStart = performance.now()
  }
}

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

    // Average response time
    const avgResponse =
      completedRounds.length > 0
        ? Math.round(
            completedRounds.reduce((sum, r) => sum + r.responseTimeMs, 0) /
              completedRounds.length,
          )
        : 0

    // Performance by round (accuracy per round)
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

    return {
      mode: params.mode,
      difficulty: params.difficulty,
      rounds: this.rounds,
      totalAccuracy,
      averageResponseTimeMs: avgResponse,
      performanceByRound,
      performanceChange,
      delayedRecallAccuracy,
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

    return {
      mode: params.mode,
      difficulty: params.difficulty,
      challenges: this.challenges,
      totalAccuracy,
      averageResponseTimeMs: avgResponse,
      averageResponseVariationMs: variation,
      completed: params.completed,
      duration,
    }
  }

  reset() {
    this.challenges = []
    this.sessionStart = performance.now()
  }
}

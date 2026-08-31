/**
 * Adaptive Difficulty Engine
 *
 * A transparent, rule-based system that adjusts game difficulty
 * based on recent session performance. This is NOT a diagnostic model.
 * It aims for comfortable engagement, not maximising difficulty.
 *
 * Philosophy:
 *   - Consistently high accuracy, reasonable response time, few hints → increase
 *   - Middling performance → maintain
 *   - Repeated low accuracy or many hints → decrease
 *   - Never jump more than one level at a time
 *   - Difficulty is bounded 1–4
 *   - Never intentionally make the activity frustrating
 */

// ─── Types ────────────────────────────────────────────────────

export type DifficultyLevel = 1 | 2 | 3 | 4

export interface SessionResult {
  /** Number of correct answers out of total targets */
  correctCount: number
  /** Total number of target items */
  totalCount: number
  /** Time spent on the activity in milliseconds */
  responseTimeMs: number
  /** Number of hints used during the activity */
  hintsUsed: number
  /** Difficulty level this session was played at */
  difficulty: DifficultyLevel
}

export interface DifficultyDecision {
  /** The new difficulty level to use for the next session */
  newDifficulty: DifficultyLevel
  /** Human-readable explanation of why this decision was made */
  reasoning: string
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Compute the next difficulty level based on recent session history.
 *
 * @param currentDifficulty - The player's current difficulty level (1–4)
 * @param recentSessions - Array of recent session results (newest first)
 * @returns A DifficultyDecision with the recommended next level and reasoning
 */
export function computeNextDifficulty(
  currentDifficulty: DifficultyLevel,
  recentSessions: SessionResult[],
): DifficultyDecision {
  // Thresholds (kept local for clarity)
  const accuracyStrong = 0.8
  const accuracyWeak = 0.5
  const hintLow = 1
  const hintHigh = 3
  const compositeUp = 0.75
  const compositeDown = 0.4
  const windowSize = 5
  const maxConsecutive = 2

  // Speed thresholds per difficulty (in ms)
  const speedThresholds: Record<DifficultyLevel, { fast: number; slow: number }> = {
    1: { fast: 15_000, slow: 45_000 },
    2: { fast: 20_000, slow: 60_000 },
    3: { fast: 25_000, slow: 90_000 },
    4: { fast: 30_000, slow: 120_000 },
  }

  // Take the most recent sessions up to the window size
  const recent = recentSessions.slice(0, windowSize)

  if (recent.length === 0) {
    return {
      newDifficulty: currentDifficulty,
      reasoning: 'No recent sessions. Keeping the same difficulty.',
    }
  }

  // Calculate composite scores
  const avgAccuracy = calcAverageAccuracy(recent)
  const avgSpeedScore = calcAverageSpeedScore(recent, currentDifficulty, speedThresholds)
  const avgHintScore = calcAverageHintScore(recent, hintLow, hintHigh)

  const composite =
    avgAccuracy * 0.5 +
    avgSpeedScore * 0.3 +
    avgHintScore * 0.2

  // Count consecutive low/high performances
  const consecutiveStrong = countConsecutive(
    recent, currentDifficulty, speedThresholds, accuracyStrong, hintHigh, 'strong',
  )
  const consecutiveWeak = countConsecutive(
    recent, currentDifficulty, speedThresholds, accuracyWeak, hintHigh, 'weak',
  )

  // ── Decision logic ──────────────────────────────────────────

  // Strong upward signal: consistent high accuracy, decent speed, few hints
  if (
    composite >= compositeUp &&
    consecutiveStrong >= maxConsecutive &&
    currentDifficulty < 4
  ) {
    const newLevel = (currentDifficulty + 1) as DifficultyLevel
    return {
      newDifficulty: newLevel,
      reasoning: `Consistent strong performance (${Math.round(avgAccuracy * 100)}% accuracy, few hints). Moving to level ${newLevel}.`,
    }
  }

  // Weak downward signal: repeated low accuracy or many hints
  if (
    composite < compositeDown &&
    consecutiveWeak >= maxConsecutive &&
    currentDifficulty > 1
  ) {
    const newLevel = (currentDifficulty - 1) as DifficultyLevel
    return {
      newDifficulty: newLevel,
      reasoning: `Performance has been below target (${Math.round(avgAccuracy * 100)}% accuracy). Moving to level ${newLevel} for comfort.`,
    }
  }

  // Single session of very low accuracy with many hints → consider decrease
  if (
    avgAccuracy < accuracyWeak &&
    (recent[0]?.hintsUsed ?? 0) >= hintHigh &&
    currentDifficulty > 1
  ) {
    const newLevel = (currentDifficulty - 1) as DifficultyLevel
    return {
      newDifficulty: newLevel,
      reasoning: `Low accuracy (${Math.round(avgAccuracy * 100)}%) with several hints. Moving to level ${newLevel}.`,
    }
  }

  // Middling or mixed results → stay
  return {
    newDifficulty: currentDifficulty,
    reasoning: 'Performance is steady. Keeping the same difficulty.',
  }
}

/**
 * Determine the default starting difficulty for a new player.
 */
export function getStartingDifficulty(): DifficultyLevel {
  return 1
}

// ─── Internal helpers ─────────────────────────────────────────

function calcAverageAccuracy(sessions: SessionResult[]): number {
  if (sessions.length === 0) return 0
  const total = sessions.reduce((sum, s) => sum + s.correctCount, 0)
  const targets = sessions.reduce((sum, s) => sum + s.totalCount, 0)
  return targets === 0 ? 0 : total / targets
}

function calcAverageSpeedScore(
  sessions: SessionResult[],
  difficulty: DifficultyLevel,
  thresholds: Record<DifficultyLevel, { fast: number; slow: number }>,
): number {
  if (sessions.length === 0) return 0.5

  const t = thresholds[difficulty]

  const scores = sessions.map(s => {
    if (s.responseTimeMs <= t.fast) return 1.0
    if (s.responseTimeMs >= t.slow) return 0.0
    return 1 - (s.responseTimeMs - t.fast) / (t.slow - t.fast)
  })

  return scores.reduce((a, b) => a + b, 0) / scores.length
}

function calcAverageHintScore(
  sessions: SessionResult[],
  low: number,
  high: number,
): number {
  if (sessions.length === 0) return 1.0

  const scores = sessions.map(s => {
    if (s.hintsUsed <= low) return 1.0
    if (s.hintsUsed >= high) return 0.0
    return 1 - (s.hintsUsed - low) / (high - low)
  })

  return scores.reduce((a, b) => a + b, 0) / scores.length
}

function isClassifiedSession(
  s: SessionResult,
  difficulty: DifficultyLevel,
  thresholds: Record<DifficultyLevel, { fast: number; slow: number }>,
  accuracyThreshold: number,
  hintThreshold: number,
  kind: 'strong' | 'weak',
): boolean {
  const accuracy = s.totalCount > 0 ? s.correctCount / s.totalCount : 0
  const speedSlow = s.responseTimeMs > thresholds[difficulty].slow
  const hintsMany = s.hintsUsed >= hintThreshold

  if (kind === 'strong') {
    const speedOk = !speedSlow
    const hintsOk = !hintsMany
    return accuracy >= accuracyThreshold && speedOk && hintsOk
  }
  // weak
  return accuracy < accuracyThreshold || (speedSlow && hintsMany)
}

function countConsecutive(
  sessions: SessionResult[],
  difficulty: DifficultyLevel,
  thresholds: Record<DifficultyLevel, { fast: number; slow: number }>,
  accuracyThreshold: number,
  hintThreshold: number,
  kind: 'strong' | 'weak',
): number {
  if (sessions.length === 0) return 0
  let count = 0
  for (const s of sessions) {
    if (isClassifiedSession(s, difficulty, thresholds, accuracyThreshold, hintThreshold, kind)) {
      count++
    } else {
      break
    }
  }
  return count
}

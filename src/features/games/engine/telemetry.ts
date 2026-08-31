/**
 * Telemetry — Standardized interaction tracking.
 *
 * Records timing, clicks, and interaction metadata for every challenge.
 * Does NOT record raw mouse movements, webcam, microphone, or any private data.
 * Hesitation is derived solely from time-to-first-interaction.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'

// ─── Interaction Record ─────────────────────────────────────────

export interface InteractionRecord {
  /** When the challenge became visible */
  startedAt: number
  /** When the first meaningful interaction occurred (click/tap) */
  firstInteractionAt: number | null
  /** When the challenge was completed or skipped */
  completedAt: number

  /** Time from start to first interaction in ms */
  timeToFirstInteractionMs: number
  /** Total time from start to completion in ms */
  completionTimeMs: number

  /** Whether the answer was correct */
  correct: boolean
  /** Accuracy as a percentage (0–100) */
  accuracy: number

  /** Total number of meaningful clicks/taps */
  numberOfClicks: number
  /** Number of incorrect clicks */
  incorrectClicks: number
  /** Number of times the user changed their answer */
  changedAnswers: number
  /** Hints requested */
  hintsUsed: number
  /** Whether the challenge was skipped */
  skipped: boolean

  /** Current difficulty level */
  difficulty: DifficultyLevel
  /** The type of task/challenge */
  taskType: string
}

// ─── Telemetry Tracker ──────────────────────────────────────────

export class TelemetryTracker {
  private startedAt = 0
  private firstInteractionAt: number | null = null
  private clicks = 0
  private incorrectClicks = 0
  private changedAnswers = 0
  private hintsUsed = 0
  private _difficulty: DifficultyLevel = 1
  private _taskType = ''

  /** Get the time of the first interaction (or null if none recorded) */
  getFirstInteractionAt(): number | null {
    return this.firstInteractionAt
  }

  /** Start tracking a new challenge */
  start(difficulty: DifficultyLevel, taskType: string) {
    this.startedAt = performance.now()
    this.firstInteractionAt = null
    this.clicks = 0
    this.incorrectClicks = 0
    this.changedAnswers = 0
    this.hintsUsed = 0
    this._difficulty = difficulty
    this._taskType = taskType
  }

  /** Record the first meaningful interaction */
  recordInteraction() {
    if (this.firstInteractionAt === null) {
      this.firstInteractionAt = performance.now()
    }
  }

  /** Record a click/tap */
  recordClick(isCorrect?: boolean) {
    this.recordInteraction()
    this.clicks++
    if (isCorrect === false) {
      this.incorrectClicks++
    }
  }

  /** Record an answer change */
  recordChange() {
    this.recordInteraction()
    this.changedAnswers++
  }

  /** Record a hint usage */
  recordHint() {
    this.recordInteraction()
    this.hintsUsed++
  }

  /** Build the final interaction record */
  complete(correct: boolean, accuracy: number): InteractionRecord {
    const completedAt = performance.now()
    return {
      startedAt: this.startedAt,
      firstInteractionAt: this.firstInteractionAt,
      completedAt,
      timeToFirstInteractionMs: this.firstInteractionAt
        ? Math.round(this.firstInteractionAt - this.startedAt)
        : Math.round(completedAt - this.startedAt),
      completionTimeMs: Math.round(completedAt - this.startedAt),
      correct,
      accuracy,
      numberOfClicks: this.clicks,
      incorrectClicks: this.incorrectClicks,
      changedAnswers: this.changedAnswers,
      hintsUsed: this.hintsUsed,
      skipped: false,
      difficulty: this._difficulty,
      taskType: this._taskType,
    }
  }

  /** Build a skipped record */
  skip(): InteractionRecord {
    const completedAt = performance.now()
    return {
      startedAt: this.startedAt,
      firstInteractionAt: this.firstInteractionAt,
      completedAt,
      timeToFirstInteractionMs: this.firstInteractionAt
        ? Math.round(this.firstInteractionAt - this.startedAt)
        : 0,
      completionTimeMs: Math.round(completedAt - this.startedAt),
      correct: false,
      accuracy: 0,
      numberOfClicks: this.clicks,
      incorrectClicks: this.incorrectClicks,
      changedAnswers: this.changedAnswers,
      hintsUsed: this.hintsUsed,
      skipped: true,
      difficulty: this._difficulty,
      taskType: this._taskType,
    }
  }

  /** Reset for next challenge */
  reset() {
    this.startedAt = 0
    this.firstInteractionAt = null
    this.clicks = 0
    this.incorrectClicks = 0
    this.changedAnswers = 0
    this.hintsUsed = 0
  }
}

// ─── Hesitation Metric ──────────────────────────────────────────

/**
 * Derive hesitation duration from time-to-first-interaction.
 * Hesitation = time before the patient makes their first meaningful interaction.
 * No webcam, microphone, eye tracking, or emotion recognition involved.
 */
export function calculateHesitation(timeToFirstInteractionMs: number): 'none' | 'brief' | 'moderate' | 'long' {
  if (timeToFirstInteractionMs < 2000) return 'none'
  if (timeToFirstInteractionMs < 5000) return 'brief'
  if (timeToFirstInteractionMs < 10000) return 'moderate'
  return 'long'
}

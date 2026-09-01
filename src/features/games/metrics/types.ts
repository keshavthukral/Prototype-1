/**
 * Game behaviour metrics.
 *
 * These are recorded internally and persisted for caregiver analytics.
 * They are NEVER shown to the patient — only a simple summary at the end.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'

// ─── Base metric ────────────────────────────────────────────────

export interface BaseRoundMetric {
  round: number
  roundType: string
  responseTimeMs: number
  timeToFirstInteractionMs: number
  hints: number
  accuracy: number
  skipped: boolean
  selectionChanges: number
  hesitationDurationMs: number
}

// ─── Memory round metrics ───────────────────────────────────────

export interface ObjectRecallMetric extends BaseRoundMetric {
  roundType: 'object-recall'
  correctTargets: number
  missedTargets: number
  incorrectSelections: number
  totalTargets: number
}

export interface SpatialMemoryMetric extends BaseRoundMetric {
  roundType: 'spatial-memory'
  correctLocations: number
  totalLocations: number
  spatialErrors: number
  firstChoiceCorrect: boolean
  locationQuestions: Array<{
    targetId: string
    correct: boolean
    responseTimeMs: number
  }>
}

export interface OrderMemoryMetric extends BaseRoundMetric {
  roundType: 'order-memory'
  correctPositions: number
  totalPositions: number
  orderingErrors: number
  sequenceDistance: number
}

export interface PersonalMemoryMetric extends BaseRoundMetric {
  roundType: 'personal-memory'
  correct: boolean
  targetName: string
  distractorsShown: string[]
}

export interface DelayedRecallMetric extends BaseRoundMetric {
  roundType: 'delayed-recall'
  correctTargets: number
  missedTargets: number
  incorrectSelections: number
  totalTargets: number
  itemsIntroducedEarlier: number
}

export type MemoryRoundMetric =
  | ObjectRecallMetric
  | SpatialMemoryMetric
  | OrderMemoryMetric
  | PersonalMemoryMetric
  | DelayedRecallMetric

// ─── Attention challenge metrics ────────────────────────────────

export type ChallengeType =
  | 'trail-connect'
  | 'cancellation'
  | 'rule-switch'
  | 'everyday-sequence'

export interface ChallengeMetric {
  challengeId: string
  challengeType: ChallengeType
  correct: boolean
  responseTimeMs: number
  timeToFirstInteractionMs: number
  hints: number
  skipped: boolean
  changedAnswers: number
  difficulty: DifficultyLevel
}

// ─── Session-level metrics ──────────────────────────────────────

export interface MemorySessionMetrics {
  mode: 'daily' | 'practice'
  difficulty: DifficultyLevel
  rounds: MemoryRoundMetric[]
  totalAccuracy: number
  averageResponseTimeMs: number
  medianResponseTimeMs: number
  performanceByRound: number[]
  performanceChange: number
  delayedRecallAccuracy: number | null
  falseSelectionRate: number
  hintRate: number
  completionRate: number
  completed: boolean
  duration: number
}

export interface AttentionSessionMetrics {
  mode: 'daily' | 'practice'
  difficulty: DifficultyLevel
  challenges: ChallengeMetric[]
  totalAccuracy: number
  averageResponseTimeMs: number
  averageResponseVariationMs: number
  errorRate: number
  completionRate: number
  completed: boolean
  duration: number
}

// ─── Session result (for adaptive engine) ───────────────────────

export interface GameSessionResult {
  gameType: 'memory' | 'pattern'
  difficultyLevel: DifficultyLevel
  correctCount: number
  totalCount: number
  responseTimeMs: number
  hintsUsed: number
}

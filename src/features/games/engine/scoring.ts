/**
 * Scoring — Deterministic, task-specific scoring.
 *
 * Does NOT collapse everything into one fake "brain score".
 * Each dimension is measured independently.
 */

// ─── Memory Round Scores ────────────────────────────────────────

export interface ObjectRecallScore {
  targetsShown: number
  targetsSelectedCorrectly: number
  falseSelections: number
  missedTargets: number
  accuracy: number
  falseSelectionRate: number
}

export interface SpatialScore {
  correctPositions: number
  wrongPositions: number
  totalQuestions: number
  accuracy: number
  firstChoiceAccuracy: boolean
  corrections: number
}

export interface SequenceScore {
  correctPositions: number
  totalPositions: number
  accuracy: number
  sequenceDistance: number
  numberOfReorders: number
}

export interface PersonalMemoryScore {
  correct: boolean
  accuracy: number
}

export interface DelayedRecallScore {
  correct: number
  falseSelections: number
  totalTargets: number
  accuracy: number
}

// ─── Object Recall ──────────────────────────────────────────────

export function scoreObjectRecall(params: {
  targetIds: Set<string>
  selectedIds: string[]
  totalTargets: number
}): ObjectRecallScore {
  const { targetIds, selectedIds, totalTargets } = params
  const correct = selectedIds.filter((id) => targetIds.has(id)).length
  const falseSelections = selectedIds.filter((id) => !targetIds.has(id)).length
  const missedTargets = totalTargets - correct

  const accuracy = totalTargets > 0
    ? Math.max(0, correct - falseSelections) / totalTargets * 100
    : 0

  const falseSelectionRate = selectedIds.length > 0
    ? (falseSelections / selectedIds.length) * 100
    : 0

  return {
    targetsShown: totalTargets,
    targetsSelectedCorrectly: correct,
    falseSelections,
    missedTargets,
    accuracy,
    falseSelectionRate,
  }
}

// ─── Spatial Memory ─────────────────────────────────────────────

export function scoreSpatialMemory(params: {
  correctPositions: number
  totalQuestions: number
  corrections: number
  firstChoiceCorrect: boolean
}): SpatialScore {
  const { correctPositions, totalQuestions, corrections, firstChoiceCorrect } = params
  const wrongPositions = totalQuestions - correctPositions
  const accuracy = totalQuestions > 0
    ? (correctPositions / totalQuestions) * 100
    : 0

  return {
    correctPositions,
    wrongPositions,
    totalQuestions,
    accuracy,
    firstChoiceAccuracy: firstChoiceCorrect,
    corrections,
  }
}

// ─── Sequence Memory ────────────────────────────────────────────

/**
 * Calculate sequence distance (number of adjacent swaps needed to correct).
 * Based on counting inversions in the user's order vs correct order.
 */
export function calculateSequenceDistance(
  correctOrder: string[],
  userOrder: string[],
): number {
  const n = correctOrder.length
  const correctIndexMap = new Map<string, number>()
  correctOrder.forEach((id, i) => correctIndexMap.set(id, i))

  // Map user order to positions in correct order
  const mapped = userOrder.map((id) => correctIndexMap.get(id) ?? 0)

  // Count inversions
  let inversions = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (mapped[i]! > mapped[j]!) inversions++
    }
  }
  return inversions
}

export function scoreSequence(params: {
  correctOrder: string[]
  userOrder: string[]
  reorders: number
  timeToFirstActionMs: number
  completionTimeMs: number
}): SequenceScore {
  const { correctOrder, userOrder, reorders } = params
  const totalPositions = correctOrder.length
  const correctPositions = correctOrder.filter(
    (id, i) => userOrder[i] === id,
  ).length

  const accuracy = totalPositions > 0
    ? (correctPositions / totalPositions) * 100
    : 0

  const sequenceDistance = calculateSequenceDistance(correctOrder, userOrder)

  return {
    correctPositions,
    totalPositions,
    accuracy,
    sequenceDistance,
    numberOfReorders: reorders,
  }
}

// ─── Personal Memory ────────────────────────────────────────────

export function scorePersonalMemory(correct: boolean): PersonalMemoryScore {
  return { correct, accuracy: correct ? 100 : 0 }
}

// ─── Delayed Recall ─────────────────────────────────────────────

export function scoreDelayedRecall(params: {
  targetIds: Set<string>
  selectedIds: string[]
  totalTargets: number
}): DelayedRecallScore {
  const { targetIds, selectedIds, totalTargets } = params
  const correct = selectedIds.filter((id) => targetIds.has(id)).length
  const falseSelections = selectedIds.filter((id) => !targetIds.has(id)).length

  const accuracy = totalTargets > 0
    ? Math.max(0, correct - falseSelections) / totalTargets * 100
    : 0

  return { correct, falseSelections, totalTargets, accuracy }
}

// ─── Attention Challenge Scores ─────────────────────────────────

export interface PatternScore {
  correct: boolean
  accuracy: number
}

export interface OddOneOutScore {
  correct: boolean
  incorrectTaps: number
  accuracy: number
}

export interface TargetSearchScore {
  targetsFound: number
  missedTargets: number
  falseTargets: number
  totalTargetsInDisplay: number
  accuracy: number
  falseTargetRate: number
}

export interface PairMatchingScore {
  attempts: number
  correctPairs: number
  totalPairs: number
  accuracy: number
}

export interface RuleSwitchScore {
  initialCorrect: boolean
  switchCorrect: boolean
  accuracy: number
  adaptedToRule: boolean
}

export function scorePattern(correct: boolean): PatternScore {
  return { correct, accuracy: correct ? 100 : 0 }
}

export function scoreOddOneOut(params: {
  correct: boolean
  incorrectTaps: number
}): OddOneOutScore {
  return {
    correct: params.correct,
    incorrectTaps: params.incorrectTaps,
    accuracy: params.correct ? 100 : 0,
  }
}

export function scoreTargetSearch(params: {
  selectedIds: number[]
  targetIndices: number[]
  totalDisplayItems: number
}): TargetSearchScore {
  const { selectedIds, targetIndices, totalDisplayItems } = params
  const targetsFound = selectedIds.filter((id) => targetIndices.includes(id)).length
  const falseTargets = selectedIds.filter((id) => !targetIndices.includes(id)).length
  const missedTargets = targetIndices.length - targetsFound

  const accuracy = targetIndices.length > 0
    ? (targetsFound / targetIndices.length) * 100
    : 0

  const falseTargetRate = selectedIds.length > 0
    ? (falseTargets / selectedIds.length) * 100
    : 0

  return {
    targetsFound,
    missedTargets,
    falseTargets,
    totalTargetsInDisplay: totalDisplayItems,
    accuracy,
    falseTargetRate,
  }
}

export function scorePairMatching(params: {
  attempts: number
  correctPairs: number
  totalPairs: number
}): PairMatchingScore {
  const accuracy = params.totalPairs > 0
    ? (params.correctPairs / params.totalPairs) * 100
    : 0

  return { ...params, accuracy }
}

export function scoreRuleSwitch(params: {
  initialCorrect: boolean
  switchCorrect: boolean
}): RuleSwitchScore {
  return {
    initialCorrect: params.initialCorrect,
    switchCorrect: params.switchCorrect,
    accuracy: (params.initialCorrect && params.switchCorrect) ? 100
      : params.switchCorrect ? 50
        : params.initialCorrect ? 50
          : 0,
    adaptedToRule: params.switchCorrect,
  }
}

// ─── Median Calculation ─────────────────────────────────────────

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2
}

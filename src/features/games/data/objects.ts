/**
 * Memory Game — Object Pool
 *
 * Everyday, familiar objects with emoji and bilingual labels.
 * Used for the memorise → recall flow.
 * Difficulty levels 1–5: more objects, more distractors, longer sequences.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { GameChoice, MemoryRoundConfig } from '@/features/games/types'

/** The full pool — always familiar, culturally neutral */
export const OBJECT_POOL: GameChoice[] = [
  { id: 'apple',     emoji: '🍎',  label: 'Apple' },
  { id: 'banana',    emoji: '🍌',  label: 'Banana' },
  { id: 'cup',       emoji: '☕',   label: 'Cup' },
  { id: 'book',      emoji: '📖',  label: 'Book' },
  { id: 'key',       emoji: '🔑',  label: 'Key' },
  { id: 'umbrella',  emoji: '☂️',  label: 'Umbrella' },
  { id: 'clock',     emoji: '🕐',  label: 'Clock' },
  { id: 'flower',    emoji: '🌸',  label: 'Flower' },
  { id: 'chair',     emoji: '🪑',  label: 'Chair' },
  { id: 'ball',      emoji: '⚽',  label: 'Ball' },
  { id: 'spoon',     emoji: '🥄',  label: 'Spoon' },
  { id: 'glasses',   emoji: '👓',  label: 'Glasses' },
  { id: 'bag',       emoji: '👜',  label: 'Bag' },
  { id: 'bottle',    emoji: '🍶',  label: 'Bottle' },
  { id: 'telephone', emoji: '📞',  label: 'Telephone' },
  { id: 'lamp',      emoji: '💡',  label: 'Lamp' },
  { id: 'plate',     emoji: '🍽️',  label: 'Plate' },
  { id: 'hat',       emoji: '🎩',  label: 'Hat' },
  { id: 'ring',      emoji: '💍',  label: 'Ring' },
  { id: 'shoe',      emoji: '👟',  label: 'Shoe' },
]

/** Fisher–Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = a[i]!
    a[i] = a[j]!
    a[j] = temp
  }
  return a
}

/** Target counts per difficulty level */
function targetsCount(d: DifficultyLevel): number {
  return d === 1 ? 3 : d === 2 ? 4 : d === 3 ? 5 : d === 4 ? 7 : 8
}

/** Distractor counts per difficulty level */
function distractorCount(d: DifficultyLevel): number {
  return d === 1 ? 2 : d === 2 ? 3 : d === 3 ? 4 : d === 4 ? 5 : 6
}

/**
 * Build one round's config: pick targets, generate distractors, merge + shuffle.
 * Distractors increase by difficulty while targets scale with level.
 */
export function buildMemoryRound(
  difficulty: DifficultyLevel,
  excludeIds: string[] = [],
): MemoryRoundConfig {
  const targetCount = targetsCount(difficulty)
  const available = OBJECT_POOL.filter(o => !excludeIds.includes(o.id))
  const shuffled = shuffle(available)

  const targets = shuffled.slice(0, targetCount)
  const distractorPool = shuffled.slice(targetCount)
  const distCount = distractorCount(difficulty)
  const distractors = distractorPool.slice(0, distCount)

  const options = shuffle([...targets, ...distractors])

  // Validate: ensure we have enough unique objects
  if (targets.length < 2 || options.length < targets.length) {
    // Fallback: use fewer targets from the full pool
    const fallbackTargets = shuffle(OBJECT_POOL).slice(0, Math.min(targetCount, OBJECT_POOL.length))
    const fallbackOptions = shuffle([...fallbackTargets, ...shuffle(OBJECT_POOL.filter(o => !fallbackTargets.some(t => t.id === o.id))).slice(0, 2)])
    return { targets: fallbackTargets, distractors: [], options: fallbackOptions }
  }

  return { targets, distractors, options }
}

/** Get object count for spatial grid at given difficulty */
export function spatialGridSize(d: DifficultyLevel): number {
  return d === 1 ? 4 : d === 2 ? 6 : d === 3 ? 8 : d === 4 ? 9 : 12
}

/** Get sequence length for order memory at given difficulty */
export function sequenceLength(d: DifficultyLevel): number {
  return d === 1 ? 3 : d === 2 ? 4 : d === 3 ? 5 : d === 4 ? 6 : 7
}

/** Get view duration in seconds at given difficulty */
export function viewSeconds(d: DifficultyLevel): number {
  return d === 1 ? 8 : d === 2 ? 7 : d === 3 ? 6 : d === 4 ? 5 : 4
}

/** Get number of spatial questions at given difficulty */
export function spatialQuestions(d: DifficultyLevel): number {
  return d === 1 ? 1 : d === 2 ? 2 : d === 3 ? 2 : d === 4 ? 3 : 4
}

/** Target find item count for attention game */
export function targetFindCount(d: DifficultyLevel): number {
  return d === 1 ? 8 : d === 2 ? 12 : d === 3 ? 16 : d === 4 ? 20 : 24
}

/** Match pair card count for attention game */
export function matchPairCount(d: DifficultyLevel): number {
  return d === 1 ? 4 : d === 2 ? 6 : d === 3 ? 8 : d === 4 ? 10 : 12
}

// ─── Association Recall ─────────────────────────────────────────

/** Association pairs for memory recall — natural, everyday pairings */
const ASSOCIATION_PAIRS: Array<{ left: GameChoice; right: string }> = [
  { left: { id: 'key', emoji: '🔑', label: 'Key' }, right: 'Door' },
  { left: { id: 'cup', emoji: '☕', label: 'Cup' }, right: 'Tea' },
  { left: { id: 'umbrella', emoji: '☂️', label: 'Umbrella' }, right: 'Rain' },
  { left: { id: 'book', emoji: '📖', label: 'Book' }, right: 'Reading' },
  { left: { id: 'flower', emoji: '🌸', label: 'Flower' }, right: 'Garden' },
  { left: { id: 'clock', emoji: '🕐', label: 'Clock' }, right: 'Time' },
  { left: { id: 'spoon', emoji: '🥄', label: 'Spoon' }, right: 'Food' },
  { left: { id: 'glasses', emoji: '👓', label: 'Glasses' }, right: 'Eyes' },
  { left: { id: 'telephone', emoji: '📞', label: 'Telephone' }, right: 'Call' },
  { left: { id: 'bottle', emoji: '🍶', label: 'Bottle' }, right: 'Water' },
  { left: { id: 'hat', emoji: '🎩', label: 'Hat' }, right: 'Head' },
  { left: { id: 'shoe', emoji: '👟', label: 'Shoe' }, right: 'Foot' },
]

/** Association distractors — words that do NOT pair with any shown object */
const ASSOCIATION_DISTRACTORS = [
  'Music', 'Sky', 'River', 'Cloud', 'Star', 'Wind', 'Stone', 'Moon',
]

export interface AssociationPair {
  left: GameChoice
  right: string
}

export interface AssociationQuestion {
  /** The pairs shown to the patient */
  pairs: AssociationPair[]
  /** Which pair was selected for the question */
  queryLeft: GameChoice
  /** The correct answer */
  correctAnswer: string
  /** Answer options including distractors */
  options: string[]
}

/**
 * Build an association recall question.
 * Shows 3–5 pairs, then asks which item was paired with a specific object.
 */
export function buildAssociationQuestion(
  difficulty: DifficultyLevel,
): AssociationQuestion | null {
  const pairCount = difficulty === 1 ? 3 : difficulty === 2 ? 3 : difficulty === 3 ? 4 : difficulty === 4 ? 4 : 5
  const shuffledPairs = shuffle(ASSOCIATION_PAIRS)
  const selectedPairs = shuffledPairs.slice(0, pairCount)

  // Pick one pair as the question target
  const queryPair = selectedPairs[Math.floor(Math.random() * selectedPairs.length)]
  if (!queryPair) return null

  // Generate distractors (2 distractor options)
  const distractors = shuffle(ASSOCIATION_DISTRACTORS)
    .filter((d) => d !== queryPair.right)
    .slice(0, 2)

  const options = shuffle([queryPair.right, ...distractors])

  return {
    pairs: selectedPairs,
    queryLeft: queryPair.left,
    correctAnswer: queryPair.right,
    options,
  }
}

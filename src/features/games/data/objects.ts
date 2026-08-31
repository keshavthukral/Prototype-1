/**
 * Memory Game — Object Pool (V2)
 *
 * Everyday, familiar objects with emoji and bilingual labels.
 * Used for the memorise → recall flow across all 6 scenes.
 *
 * V2 additions:
 * - MARKET_BASKET objects for Scene 1
 * - ROOM_ITEMS for Scene 2 (furniture + placed objects)
 * - MORNING_ROUTINE for Scene 3
 * - ASSOCIATION_PAIRS for Scene 5
 * - DELAYED_PREVIEW for Scene 6
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { GameChoice, MemoryRoundConfig } from '@/features/games/types'
import { createSeededRandom } from '@/lib/games/seeded-random'

// ─── Core Object Pool ──────────────────────────────────────────

/** The full pool — always familiar, culturally neutral */
export const OBJECT_POOL: GameChoice[] = [
  { id: 'apple',     emoji: '🍎',  label: 'Apple' },
  { id: 'banana',    emoji: '🍌',  label: 'Banana' },
  { id: 'cup',       emoji: '☕',  label: 'Cup' },
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

// ─── V2 Scene Data ─────────────────────────────────────────────

/** Scene 1 — Market Basket: objects that sit on a tabletop/basket */
export const MARKET_BASKET_OBJECTS: GameChoice[] = [
  { id: 'banana',    emoji: '🍌',  label: 'Banana' },
  { id: 'cup',       emoji: '☕',  label: 'Tea Cup' },
  { id: 'key',       emoji: '🔑',  label: 'Keys' },
  { id: 'umbrella',  emoji: '☂️',  label: 'Umbrella' },
  { id: 'book',      emoji: '📖',  label: 'Book' },
  { id: 'apple',     emoji: '🍎',  label: 'Apple' },
  { id: 'glasses',   emoji: '👓',  label: 'Glasses' },
  { id: 'flower',    emoji: '🌸',  label: 'Flower' },
]

/** Scene 2 — Where Did It Go?: furniture items in a cozy room */
export interface RoomFurniture {
  id: string
  emoji: string
  label: string
}

export const ROOM_FURNITURE: RoomFurniture[] = [
  { id: 'table',          emoji: '🪑', label: 'Table' },
  { id: 'chair',          emoji: '🪑', label: 'Chair' },
  { id: 'shelf',          emoji: '📚', label: 'Shelf' },
  { id: 'window',         emoji: '🪟', label: 'Window' },
  { id: 'bedside_table',  emoji: '🛏️', label: 'Bedside Table' },
]

/** Scene 2 — Objects placed on furniture */
export interface PlacedObject {
  objectId: string
  furnitureId: string
}

export const PLACED_OBJECTS: PlacedObject[] = [
  { objectId: 'key',      furnitureId: 'table' },
  { objectId: 'book',     furnitureId: 'shelf' },
  { objectId: 'glasses',  furnitureId: 'chair' },
  { objectId: 'umbrella', furnitureId: 'bedside_table' },
  { objectId: 'flower',   furnitureId: 'window' },
  { objectId: 'cup',      furnitureId: 'table' },
]

/** Scene 3 — Morning Routine: familiar daily activities */
export interface MorningStep {
  id: string
  emoji: string
  label: string
  description: string
}

export const MORNING_ROUTINE: MorningStep[] = [
  { id: 'wake_up',      emoji: '🌅', label: 'Wake Up',        description: 'Start the day' },
  { id: 'drink_water',  emoji: '💧', label: 'Drink Water',    description: 'A glass of water' },
  { id: 'breakfast',    emoji: '🍛', label: 'Breakfast',      description: 'Morning meal' },
  { id: 'morning_walk', emoji: '🚶', label: 'Morning Walk',   description: 'A gentle walk' },
]

/** Scene 5 — Pairs & Connections: familiar associations */
export const ASSOCIATION_PAIRS_V2: Array<{ left: GameChoice; right: string }> = [
  { left: { id: 'cup',       emoji: '☕',  label: 'Cup' },       right: 'Tea' },
  { left: { id: 'key',       emoji: '🔑',  label: 'Key' },       right: 'Door' },
  { left: { id: 'umbrella',  emoji: '☂️',  label: 'Umbrella' },  right: 'Rain' },
  { left: { id: 'shoe',      emoji: '👟',  label: 'Shoes' },     right: 'Walk' },
  { left: { id: 'book',      emoji: '📖',  label: 'Book' },      right: 'Reading' },
  { left: { id: 'flower',    emoji: '🌸',  label: 'Flower' },    right: 'Garden' },
  { left: { id: 'clock',     emoji: '🕐',  label: 'Clock' },     right: 'Time' },
  { left: { id: 'spoon',     emoji: '🥄',  label: 'Spoon' },     right: 'Food' },
  { left: { id: 'glasses',   emoji: '👓',  label: 'Glasses' },   right: 'Eyes' },
  { left: { id: 'telephone', emoji: '📞',  label: 'Telephone' }, right: 'Call' },
  { left: { id: 'bottle',    emoji: '🍶',  label: 'Bottle' },    right: 'Water' },
  { left: { id: 'hat',       emoji: '🎩',  label: 'Hat' },       right: 'Head' },
]

/** Association distractors — words that do NOT pair with any shown object */
const ASSOCIATION_DISTRACTORS = [
  'Music', 'Sky', 'River', 'Cloud', 'Star', 'Wind', 'Stone', 'Moon',
]

// ─── Internal Helpers ──────────────────────────────────────────

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

// ─── Public API ────────────────────────────────────────────────

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
    const fallbackTargets = shuffle(OBJECT_POOL).slice(0, Math.min(targetCount, OBJECT_POOL.length))
    const fallbackOptions = shuffle([...fallbackTargets, ...shuffle(OBJECT_POOL.filter(o => !fallbackTargets.some(t => t.id === o.id))).slice(0, 2)])
    return { targets: fallbackTargets, distractors: [], options: fallbackOptions }
  }

  return { targets, distractors, options }
}

/**
 * Scene 1 — Build Market Basket round.
 * Picks N objects to show, then tests recall from a larger collection.
 */
export function buildMarketBasketRound(
  difficulty: DifficultyLevel,
  seed?: number,
): { basketObjects: GameChoice[]; recallOptions: GameChoice[] } {
  const rng = seed !== undefined ? createSeededRandom(seed) : undefined
  const shuffleFn = <T,>(arr: T[]) => rng ? rng.shuffle(arr) : shuffle(arr)

  const showCount = difficulty <= 2 ? 4 : difficulty <= 4 ? 5 : 6
  const distractorCount = difficulty <= 2 ? 3 : difficulty <= 4 ? 4 : 5

  const shuffledPool = shuffleFn(MARKET_BASKET_OBJECTS)
  const basketObjects = shuffledPool.slice(0, showCount)
  const distractorPool = shuffledPool.slice(showCount)
    .concat(OBJECT_POOL.filter(o => !basketObjects.some(b => b.id === o.id)))
  const distractors = shuffleFn(distractorPool).slice(0, distractorCount)

  return {
    basketObjects,
    recallOptions: shuffleFn([...basketObjects, ...distractors]),
  }
}

/**
 * Scene 2 — Build Where Did It Go? round.
 * Places objects on furniture, returns quiz questions.
 */
export function buildSpatialRound(
  difficulty: DifficultyLevel,
  seed?: number,
): {
  furniture: RoomFurniture[]
  placedObjects: PlacedObject[]
  questions: Array<{ objectId: string; objectEmoji: string; objectLabel: string; correctFurnitureId: string }>
} {
  const rng = seed !== undefined ? createSeededRandom(seed) : undefined
  const shuffleFn = <T,>(arr: T[]) => rng ? rng.shuffle(arr) : shuffle(arr)

  const questionCount = difficulty <= 2 ? 2 : difficulty <= 4 ? 3 : 4
  const shuffledPlacements = shuffleFn(PLACED_OBJECTS).slice(0, questionCount)
  // Ensure we have furniture for the room display
  const roomFurniture = [...ROOM_FURNITURE]
  // Add extra furniture for the room if needed
  const extraFurniture: RoomFurniture[] = [
    { id: 'rug', emoji: '🟫', label: 'Rug' },
    { id: 'plant', emoji: '🪴', label: 'Plant' },
  ]
  while (roomFurniture.length < 6) {
    const extra = extraFurniture[roomFurniture.length - 5]
    if (extra) roomFurniture.push(extra)
    else break
  }

  const questions = shuffledPlacements.map(p => {
    const obj = OBJECT_POOL.find(o => o.id === p.objectId)!
    return {
      objectId: p.objectId,
      objectEmoji: obj.emoji,
      objectLabel: obj.label,
      correctFurnitureId: p.furnitureId,
    }
  })

  return {
    furniture: roomFurniture,
    placedObjects: shuffledPlacements,
    questions,
  }
}

/**
 * Scene 3 — Build Morning Routine round.
 * Returns steps in correct order (shuffled for user to reorder).
 */
export function buildMorningRoutineRound(
  difficulty: DifficultyLevel,
  seed?: number,
): { correctOrder: MorningStep[]; shuffledOrder: MorningStep[] } {
  const rng = seed !== undefined ? createSeededRandom(seed) : undefined
  const shuffleFn = <T,>(arr: T[]) => rng ? rng.shuffle(arr) : shuffle(arr)

  const steps = MORNING_ROUTINE.slice(0, difficulty <= 2 ? 4 : 4)
  return {
    correctOrder: steps,
    shuffledOrder: shuffleFn(steps),
  }
}

/**
 * Scene 5 — Build Association round.
 * Shows pairs, then tests one association.
 */
export function buildAssociationRoundV2(
  difficulty: DifficultyLevel,
  seed?: number,
): {
  pairsShown: Array<{ left: GameChoice; right: string }>
  queryLeft: GameChoice
  correctAnswer: string
  options: string[]
} | null {
  const rng = seed !== undefined ? createSeededRandom(seed) : undefined
  const shuffleFn = <T,>(arr: T[]) => rng ? rng.shuffle(arr) : shuffle(arr)

  const pairCount = difficulty <= 2 ? 3 : difficulty <= 4 ? 4 : 5
  const shuffledPairs = shuffleFn(ASSOCIATION_PAIRS_V2)
  const pairsShown = shuffledPairs.slice(0, pairCount)

  const queryPair = pairsShown[Math.floor(Math.random() * pairsShown.length)]
  if (!queryPair) return null

  const distractors = shuffleFn(
    ASSOCIATION_DISTRACTORS.filter(d => d !== queryPair.right)
  ).slice(0, 2)

  return {
    pairsShown,
    queryLeft: queryPair.left,
    correctAnswer: queryPair.right,
    options: shuffleFn([queryPair.right, ...distractors]),
  }
}

/**
 * Scene 6 — Build Delayed Recall round.
 * Returns the delayed objects to show at start + options to test later.
 */
export function buildDelayedRecallRound(
  difficulty: DifficultyLevel,
  seed?: number,
): { previewObjects: GameChoice[]; testOptions: GameChoice[] } {
  const rng = seed !== undefined ? createSeededRandom(seed) : undefined
  const shuffleFn = <T,>(arr: T[]) => rng ? rng.shuffle(arr) : shuffle(arr)

  const previewObjects = shuffleFn(MARKET_BASKET_OBJECTS).slice(0, 3)
  const distractorPool = OBJECT_POOL.filter(o => !previewObjects.some(p => p.id === o.id))
  const distractors = shuffleFn(distractorPool).slice(0, difficulty + 1)

  return {
    previewObjects,
    testOptions: shuffleFn([...previewObjects, ...distractors]),
  }
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

// ─── Association Recall (Legacy V1 — kept for backward compat) ─

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
 * Build an association recall question (V1 legacy).
 * Shows 3–5 pairs, then asks which item was paired with a specific object.
 */
export function buildAssociationQuestion(
  difficulty: DifficultyLevel,
): AssociationQuestion | null {
  const pairCount = difficulty === 1 ? 3 : difficulty === 2 ? 3 : difficulty === 3 ? 4 : difficulty === 4 ? 4 : 5
  const shuffledPairs = shuffle(ASSOCIATION_PAIRS_V2)
  const selectedPairs = shuffledPairs.slice(0, pairCount)

  const queryPair = selectedPairs[Math.floor(Math.random() * selectedPairs.length)]
  if (!queryPair) return null

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

/**
 * Memory Game — Object Pool
 *
 * Everyday, familiar objects with emoji and bilingual labels.
 * Used for the memorise → recall flow.
 * Difficulty levels 1–4: more objects, more distractors, longer sequences.
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
  { id: 'scissors',    emoji: '✂️',   label: 'Scissors' },
  { id: 'camera',      emoji: '📷',  label: 'Camera' },
  { id: 'crown',       emoji: '👑',  label: 'Crown' },
  { id: 'paintbrush',  emoji: '🎨',  label: 'Paintbrush' },
  { id: 'fish',        emoji: '🐟',  label: 'Fish' },
  { id: 'shield',      emoji: '🛡️',  label: 'Shield' },
  { id: 'compass',     emoji: '🧭',  label: 'Compass' },
  { id: 'anchor',      emoji: '⚓',   label: 'Anchor' },
  { id: 'hammer',      emoji: '🔨',  label: 'Hammer' },
  { id: 'bell',        emoji: '🔔',  label: 'Bell' },
  { id: 'star',        emoji: '⭐',  label: 'Star' },
  { id: 'feather',     emoji: '🪶',  label: 'Feather' },
  { id: 'drum',        emoji: '🥁',  label: 'Drum' },
  { id: 'wallet',      emoji: '👛',  label: 'Wallet' },
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

/** Target counts per difficulty level — gradual progression */
function targetsCount(d: DifficultyLevel): number {
  return d === 1 ? 3 : d === 2 ? 4 : d === 3 ? 5 : 6
}

/** Distractor counts per difficulty level */
function distractorCount(d: DifficultyLevel): number {
  return d === 1 ? 2 : d === 2 ? 3 : d === 3 ? 4 : 5
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

  return { targets, distractors, options }
}

/** Get object count for spatial grid at given difficulty */
export function spatialGridSize(d: DifficultyLevel): number {
  return d === 1 ? 4 : d === 2 ? 6 : d === 3 ? 8 : 9
}

/** Get sequence length for order memory at given difficulty */
export function sequenceLength(d: DifficultyLevel): number {
  return d === 1 ? 3 : d === 2 ? 4 : d === 3 ? 5 : 6
}

/** Get view duration in seconds at given difficulty — generous timing */
export function viewSeconds(d: DifficultyLevel): number {
  return d === 1 ? 10 : d === 2 ? 9 : d === 3 ? 8 : 8
}

/** Get number of spatial questions at given difficulty */
export function spatialQuestions(d: DifficultyLevel): number {
  return d === 1 ? 1 : d === 2 ? 2 : d === 3 ? 2 : 3
}

/** Target find item count for attention game */
export function targetFindCount(d: DifficultyLevel): number {
  return d === 1 ? 8 : d === 2 ? 12 : d === 3 ? 16 : 20
}

/** Match pair card count for attention game */
export function matchPairCount(d: DifficultyLevel): number {
  return d === 1 ? 4 : d === 2 ? 6 : d === 3 ? 8 : 10
}

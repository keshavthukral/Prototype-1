/**
 * Memory Game — Object Pool
 *
 * Everyday, familiar objects with emoji and bilingual labels.
 * Used for the memorise → recall flow.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { GameChoice, MemoryRoundConfig } from '@/features/games/types'
import { targetsCountForDifficulty } from '@/features/games/types'

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

/**
 * Build one round's config: pick targets, generate distractors, merge + shuffle.
 * Distractors increase by difficulty while targets stay within 3–6.
 */
export function buildMemoryRound(
  difficulty: DifficultyLevel,
  excludeIds: string[] = [],
): MemoryRoundConfig {
  const targetCount = targetsCountForDifficulty(difficulty)
  const available = OBJECT_POOL.filter(o => !excludeIds.includes(o.id))
  const shuffled = shuffle(available)

  const targets = shuffled.slice(0, targetCount)
  const distractorPool = shuffled.slice(targetCount)
  const distractorCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  const distractors = distractorPool.slice(0, distractorCount)

  const options = shuffle([...targets, ...distractors])

  return { targets, distractors, options }
}

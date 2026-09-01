/**
 * Rule Switch — Challenge data generator.
 *
 * Presents items from two categories one at a time.  Halfway through,
 * the matching rule switches to the second category.  The player
 * must answer "Yes" or "No" for each item against the active rule.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { RuleSwitchConfig } from '@/features/games/data/challenges'

// ─── Category groupings ─────────────────────────────────────────
// Every category has ≥3 members from OBJECT_POOL.
// A few objects (book, key, ring) don't fit any category and are
// left out of the rule-switch pool.

const CATEGORIES: Record<string, string[]> = {
  'Kitchen items': ['cup', 'spoon', 'plate', 'bottle'],
  'Things you wear': ['glasses', 'hat', 'shoe', 'umbrella'],
  'Living room items': ['clock', 'chair', 'lamp', 'telephone'],
  'Outdoor things': ['flower', 'ball', 'bag'],
}

/**
 * Check whether a given object id belongs to a category.
 * Used by the component to validate answers.
 */
export function belongsToCategory(objectId: string, category: string): boolean {
  return CATEGORIES[category]?.includes(objectId) ?? false
}

/**
 * Return all category names. Useful for callers that need to enumerate.
 */
export function getCategoryNames(): string[] {
  return Object.keys(CATEGORIES)
}

/**
 * Return the member object ids for a given category.
 * Used by the component to display what belongs to the active rule.
 */
export function getCategoryMembers(category: string): string[] {
  return CATEGORIES[category] ?? []
}

// ─── Helpers ────────────────────────────────────────────────────

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

// ─── Item count per difficulty ───────────────────────────────────

const ITEM_COUNTS: Record<DifficultyLevel, number> = {
  1: 4,
  2: 5,
  3: 6,
  4: 8,
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Generate a rule-switch challenge for the given difficulty.
 */
export function generateRuleSwitchChallenge(
  difficulty: DifficultyLevel,
  id: string,
): RuleSwitchConfig {
  const categoryNames = Object.keys(CATEGORIES)
  const [catA, catB] = shuffle(categoryNames).slice(0, 2) as [string, string]

  const itemCount = ITEM_COUNTS[difficulty]
  const halfCount = Math.ceil(itemCount / 2)
  const otherHalf = itemCount - halfCount

  // Pick roughly half items from each category, shuffled
  const fromA = shuffle(CATEGORIES[catA]!).slice(0, halfCount)
  const fromB = shuffle(CATEGORIES[catB]!).slice(0, otherHalf)
  const itemObjectIds = shuffle([...fromA, ...fromB] as string[])

  const switchAt = Math.ceil(itemCount / 2)

  return {
    id,
    type: 'rule-switch',
    initialRule: { promptText: '', matchCategory: catA },
    switchedRule: { promptText: '', matchCategory: catB, switchAt },
    itemObjectIds,
  }
}

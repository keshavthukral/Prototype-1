/**
 * Attention Adventure — Challenge Data Pool
 *
 * 8 challenge types (including rule-switch), each with difficulty variants.
 * 7 challenges are selected per session from this pool, ensuring type variety.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { ChallengeType } from '@/features/games/metrics/types'

// ─── Challenge configs ──────────────────────────────────────────

export interface ChallengeConfig {
  id: string
  type: ChallengeType
  /** Instruction shown to the patient */
  prompt: string
  /** Visual sequence for display */
  sequence: string[]
  /** The correct answer */
  answer: string
  /** Multiple choice options */
  options: string[]
  /** For match-pair: pairs to match */
  pairs?: Array<{ left: string; right: string }>
  /** For find-different: the grid items */
  grid?: string[]
  /** For target-find: all items in the display */
  targetItems?: string[]
  /** For target-find: indices of items that are correct targets */
  targetIndices?: number[]
  /** For rule-switch: the rule changes mid-challenge */
  ruleChanges?: { from: string; to: string; changeAt?: number }
  /** For rule-switch: which option index matches the rule */
  correctOptionIndex?: number
}

// ─── Difficulty 1 ───────────────────────────────────────────────

const easy: ChallengeConfig[] = [
  // TYPE A — What Comes Next
  {
    id: 'easy-wcn-1', type: 'what-comes-next', prompt: 'What comes next?',
    sequence: ['🍎', '🍌', '🍎', '🍌'], answer: '🍎', options: ['🍎', '🍌', '🍊'],
  },
  {
    id: 'easy-wcn-2', type: 'what-comes-next', prompt: 'What comes next?',
    sequence: ['🌸', '🌸', '☀️', '🌸', '🌸'], answer: '☀️', options: ['🌸', '☀️', '🌙'],
  },

  // TYPE B — Find the Different One
  {
    id: 'easy-fdo-1', type: 'find-different', prompt: 'Find the different one.',
    sequence: [], answer: '🍌', grid: ['🍎', '🍎', '🍎', '🍌', '🍎', '🍎'],
    options: ['🍎', '🍎', '🍎', '🍌', '🍎', '🍎'],
  },
  {
    id: 'easy-fdo-2', type: 'find-different', prompt: 'Find the different one.',
    sequence: [], answer: '🌙', grid: ['☀️', '☀️', '☀️', '🌙', '☀️', '☀️'],
    options: ['☀️', '☀️', '☀️', '🌙', '☀️', '☀️'],
  },

  // TYPE C — Target Find
  {
    id: 'easy-tf-1', type: 'target-find', prompt: 'Find all the cups.',
    sequence: [], answer: '☕',
    targetItems: ['☕', '📖', '☕', '🔑', '📖', '☕', '🌸', '🪑'],
    targetIndices: [0, 2, 5],
    options: ['☕', '📖', '🔑'],
  },

  // TYPE D — Sequence Completion
  {
    id: 'easy-sc-1', type: 'sequence-completion', prompt: 'What comes next?',
    sequence: ['A', 'B', 'A', 'B'], answer: 'A', options: ['A', 'B', 'C'],
  },

  // TYPE E — Number Pattern
  {
    id: 'easy-np-1', type: 'number-pattern', prompt: 'What comes next?',
    sequence: ['1', '2', '3', '4'], answer: '5', options: ['3', '5', '6'],
  },

  // TYPE F — Match the Pair
  {
    id: 'easy-mp-1', type: 'match-pair', prompt: 'Match the pairs.',
    sequence: [], answer: '',
    pairs: [{ left: '🍎', right: 'Apple' }, { left: '🍌', right: 'Banana' }],
    options: ['🍎', '🍌', 'Apple', 'Banana'],
  },

  // TYPE G — Quick Choice
  {
    id: 'easy-qc-1', type: 'quick-choice', prompt: 'Tap the flower.',
    sequence: [], answer: '🌸',
    targetItems: ['📖', '🌸', '🔑', '☕'], options: ['📖', '🌸', '🔑', '☕'],
  },

  // TYPE H — Rule Switch
  {
    id: 'easy-rs-1', type: 'rule-switch', prompt: 'Tap the RED shape.',
    sequence: [], answer: '🔴',
    options: ['🔴', '🔵', '🟢', '🟡'],
    ruleChanges: { from: 'Tap the RED shape.', to: 'Now tap the CIRCLE.', changeAt: 2 },
  },
]

// ─── Difficulty 2 ───────────────────────────────────────────────

const medium: ChallengeConfig[] = [
  {
    id: 'med-wcn-1', type: 'what-comes-next', prompt: 'What comes next?',
    sequence: ['🍎', '🍌', '☕', '🍎', '🍌'], answer: '☕',
    options: ['🍎', '🍌', '☕', '📖'],
  },
  {
    id: 'med-wcn-2', type: 'what-comes-next', prompt: 'What comes next?',
    sequence: ['🌸', '☀️', '🌸', '☀️', '🌸'], answer: '☀️',
    options: ['🌸', '☀️', '🌙', '⭐'],
  },
  {
    id: 'med-fdo-1', type: 'find-different', prompt: 'Find the different one.',
    sequence: [], answer: '☕',
    grid: ['📖', '📖', '📖', '📖', '☕', '📖', '📖', '📖'],
    options: ['📖', '📖', '📖', '📖', '☕', '📖', '📖', '📖'],
  },
  {
    id: 'med-tf-1', type: 'target-find', prompt: 'Find all the keys.',
    sequence: [], answer: '🔑',
    targetItems: ['🔑', '📖', '☕', '🔑', '🌸', '🔑', '🪑', '🍌', '🔑', '📞'],
    targetIndices: [0, 3, 5, 8],
    options: ['🔑', '📖', '☕', '🌸'],
  },
  {
    id: 'med-sc-1', type: 'sequence-completion', prompt: 'What comes next?',
    sequence: ['A', 'B', 'C', 'A', 'B'], answer: 'C', options: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'med-np-1', type: 'number-pattern', prompt: 'What comes next?',
    sequence: ['2', '4', '6', '8'], answer: '10', options: ['9', '10', '12', '8'],
  },
  {
    id: 'med-mp-1', type: 'match-pair', prompt: 'Match the pairs.',
    sequence: [], answer: '',
    pairs: [
      { left: '🍎', right: 'Apple' },
      { left: '☕', right: 'Cup' },
      { left: '📖', right: 'Book' },
    ],
    options: ['🍎', '☕', '📖', 'Apple', 'Cup', 'Book'],
  },
  {
    id: 'med-qc-1', type: 'quick-choice', prompt: 'Tap the umbrella.',
    sequence: [], answer: '☂️',
    targetItems: ['🔑', '☂️', '📖', '☕', '🌸', '🪑'],
    options: ['🔑', '☂️', '📖', '☕', '🌸', '🪑'],
  },
  {
    id: 'med-rs-1', type: 'rule-switch', prompt: 'Tap the RED shape.',
    sequence: [], answer: '🔴',
    options: ['🔴', '🔵', '🟢', '🟡'],
    ruleChanges: { from: 'Tap the RED shape.', to: 'Now tap the CIRCLE.', changeAt: 2 },
  },
]

// ─── Difficulty 3 ───────────────────────────────────────────────

const hard: ChallengeConfig[] = [
  {
    id: 'hard-wcn-1', type: 'what-comes-next', prompt: 'What comes next?',
    sequence: ['🍎', '🍌', '☕', '📖', '🍎', '🍌'], answer: '☕',
    options: ['🍎', '🍌', '☕', '📖', '🔑'],
  },
  {
    id: 'hard-fdo-1', type: 'find-different', prompt: 'Find the different one.',
    sequence: [], answer: '🌙',
    grid: ['☀️', '☀️', '☀️', '☀️', '🌙', '☀️', '☀️', '☀️', '☀️'],
    options: ['☀️', '☀️', '☀️', '☀️', '🌙', '☀️', '☀️', '☀️', '☀️'],
  },
  {
    id: 'hard-tf-1', type: 'target-find', prompt: 'Find all the flowers.',
    sequence: [], answer: '🌸',
    targetItems: ['🌸', '🔑', '🌸', '📖', '🌸', '☕', '🌸', '🪑', '🍌', '🌸', '📞', '💡'],
    targetIndices: [0, 2, 4, 6, 10],
    options: ['🌸', '🔑', '📖', '☕'],
  },
  {
    id: 'hard-sc-1', type: 'sequence-completion', prompt: 'What comes next?',
    sequence: ['A', 'B', 'C', 'A', 'B', 'C', 'A'], answer: 'B',
    options: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'hard-np-1', type: 'number-pattern', prompt: 'What comes next?',
    sequence: ['1', '3', '5', '7'], answer: '9', options: ['8', '9', '10', '7'],
  },
  {
    id: 'hard-mp-1', type: 'match-pair', prompt: 'Match the pairs.',
    sequence: [], answer: '',
    pairs: [
      { left: '🍎', right: 'Apple' }, { left: '☕', right: 'Cup' },
      { left: '📖', right: 'Book' }, { left: '🔑', right: 'Key' },
    ],
    options: ['🍎', '☕', '📖', '🔑', 'Apple', 'Cup', 'Book', 'Key'],
  },
  {
    id: 'hard-qc-1', type: 'quick-choice', prompt: 'Tap the clock.',
    sequence: [], answer: '🕐',
    targetItems: ['🔑', '🕐', '📖', '☕', '🌸', '☂️', '🪑'],
    options: ['🔑', '🕐', '📖', '☕', '🌸', '☂️', '🪑'],
  },
  {
    id: 'hard-rs-1', type: 'rule-switch', prompt: 'Tap the BLUE shape.',
    sequence: [], answer: '🔵',
    options: ['🔴', '🔵', '🟢', '🟡'],
    ruleChanges: { from: 'Tap the BLUE shape.', to: 'Now tap the SQUARE.', changeAt: 2 },
  },
]

// ─── Difficulty 4 ───────────────────────────────────────────────

const expert: ChallengeConfig[] = [
  {
    id: 'exp-wcn-1', type: 'what-comes-next', prompt: 'What comes next?',
    sequence: ['🍎', '🍌', '☕', '📖', '🔑', '🍎', '🍌'], answer: '☕',
    options: ['🍎', '🍌', '☕', '📖', '🔑', '🌸'],
  },
  {
    id: 'exp-fdo-1', type: 'find-different', prompt: 'Find the different one.',
    sequence: [], answer: '🌙',
    grid: ['☀️', '☀️', '☀️', '☀️', '☀️', '🌙', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️'],
    options: ['☀️', '☀️', '☀️', '☀️', '☀️', '🌙', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️'],
  },
  {
    id: 'exp-tf-1', type: 'target-find', prompt: 'Find all the flowers.',
    sequence: [], answer: '🌸',
    targetItems: ['🌸', '🔑', '🌸', '📖', '🌸', '☕', '🌸', '🪑', '🍌', '🌸', '📞', '💡', '🌸', '🍽️', '🌸'],
    targetIndices: [0, 2, 4, 6, 9, 12, 14],
    options: ['🌸', '🔑', '📖', '☕'],
  },
  {
    id: 'exp-sc-1', type: 'sequence-completion', prompt: 'What comes next?',
    sequence: ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A'], answer: 'B',
    options: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'exp-np-1', type: 'number-pattern', prompt: 'What comes next?',
    sequence: ['2', '4', '8', '16'], answer: '32', options: ['24', '32', '64', '16'],
  },
  {
    id: 'exp-mp-1', type: 'match-pair', prompt: 'Match the pairs.',
    sequence: [], answer: '',
    pairs: [
      { left: '🍎', right: 'Apple' }, { left: '☕', right: 'Cup' },
      { left: '📖', right: 'Book' }, { left: '🔑', right: 'Key' },
      { left: '🌸', right: 'Flower' },
    ],
    options: ['🍎', '☕', '📖', '🔑', '🌸', 'Apple', 'Cup', 'Book', 'Key', 'Flower'],
  },
  {
    id: 'exp-qc-1', type: 'quick-choice', prompt: 'Tap the telephone.',
    sequence: [], answer: '📞',
    targetItems: ['🔑', '📞', '📖', '☕', '🌸', '☂️', '🪑', '💡'],
    options: ['🔑', '📞', '📖', '☕', '🌸', '☂️', '🪑', '💡'],
  },
  {
    id: 'exp-rs-1', type: 'rule-switch', prompt: 'Tap the GREEN shape.',
    sequence: [], answer: '🟢',
    options: ['🔴', '🔵', '🟢', '🟡'],
    ruleChanges: { from: 'Tap the GREEN shape.', to: 'Now tap the TRIANGLE.', changeAt: 2 },
  },
]

// ─── Selection logic ────────────────────────────────────────────

const byDifficulty: Record<DifficultyLevel, ChallengeConfig[]> = {
  1: easy,
  2: medium,
  3: hard,
  4: expert,
}

/**
 * Get a set of challenges for one session.
 * Picks 7 challenges from the pool, ensuring type variety.
 */
export function getSessionChallenges(
  difficulty: DifficultyLevel,
  count: number = 7,
): ChallengeConfig[] {
  const pool = byDifficulty[difficulty]

  // Group by type
  const byType = new Map<ChallengeType, ChallengeConfig[]>()
  for (const c of pool) {
    const list = byType.get(c.type) ?? []
    list.push(c)
    byType.set(c.type, list)
  }

  // First pass: one from each type (up to count)
  const selected: ChallengeConfig[] = []
  const types = Array.from(byType.keys()).sort(() => Math.random() - 0.5)

  for (const type of types) {
    if (selected.length >= count) break
    const items = byType.get(type)!
    const pick = items[Math.floor(Math.random() * items.length)]
    if (pick) selected.push(pick)
  }

  // Fill remaining from random pool
  if (selected.length < count) {
    const remaining = pool.filter(
      (c) => !selected.some((s) => s.id === c.id),
    )
    const shuffled = remaining.sort(() => Math.random() - 0.5)
    for (const c of shuffled) {
      if (selected.length >= count) break
      selected.push(c)
    }
  }

  return selected.sort(() => Math.random() - 0.5)
}

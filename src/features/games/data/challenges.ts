/**
 * Attention Adventure — Challenge Data Pool (V2)
 *
 * 7 challenge types, each with difficulty variants.
 * 7 challenges are selected per session, ensuring type variety.
 *
 * V2 changes:
 * - Uses illustrated scenes (garden, room, etc.)
 * - Visual sequences use everyday concepts, not abstract symbols
 * - Garden Search uses natural object placement
 * - Find What Changed shows a scene before/after
 * - Odd One Out uses subtle differences
 * - Matching Pairs has flip-card board
 * - Follow the Rule switches mid-challenge
 * - Complete the Story uses visual sequences (seed→plant→flower)
 * - Quick Find is a fast identification task
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { ChallengeType } from '@/features/games/metrics/types'
import { createSeededRandom } from '@/lib/games/seeded-random'

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
  /** For find-what-changed: items in the "before" scene */
  beforeItems?: string[]
  /** For find-what-changed: items in the "after" scene */
  afterItems?: string[]
  /** For find-what-changed: index of the changed item in afterItems */
  changedIndex?: number
  /** For complete-the-story: the scenario label */
  scenarioLabel?: string
}

// ─── Difficulty 1 (Easy) ───────────────────────────────────────

const easy: ChallengeConfig[] = [
  // 1. GARDEN SEARCH — "Find all the flowers"
  {
    id: 'easy-gs-1', type: 'target-find', prompt: 'Find all the flowers.',
    sequence: [], answer: '🌸',
    targetItems: ['☕', '📖', '🌸', '🔑', '🌸', '🪑', '🌸', '📖'],
    targetIndices: [2, 4, 6],
    options: ['🌸'],
  },

  // 2. FIND WHAT CHANGED
  {
    id: 'easy-fwc-1', type: 'find-different', prompt: 'What changed?',
    sequence: [], answer: '🔑',
    grid: ['☕', '📖', '🔑', '🌸', '🪑'],
    beforeItems: ['☕', '📖', '🔑', '🌸', '🪑'],
    afterItems: ['☕', '📖', '🌸', '🌸', '🪑'],
    changedIndex: 2,
    options: ['☕', '📖', '🔑', '🌸', '🪑'],
  },

  // 3. ODD ONE OUT
  {
    id: 'easy-ooo-1', type: 'find-different', prompt: 'Find the different one.',
    sequence: [], answer: '🍌',
    grid: ['🍎', '🍎', '🍎', '🍌', '🍎', '🍎'],
    options: ['🍎', '🍎', '🍎', '🍌', '🍎', '🍎'],
  },

  // 4. MATCHING PAIRS
  {
    id: 'easy-mp-1', type: 'match-pair', prompt: 'Match the pairs.',
    sequence: [], answer: '',
    pairs: [
      { left: '☕', right: 'Tea' },
      { left: '📖', right: 'Book' },
    ],
    options: ['☕', '📖', 'Tea', 'Book'],
  },

  // 5. FOLLOW THE RULE
  {
    id: 'easy-rs-1', type: 'rule-switch', prompt: 'Tap the RED shape.',
    sequence: [], answer: '🔴',
    options: ['🔴', '🔵', '🟢', '🟡'],
    ruleChanges: { from: 'Tap the RED shape.', to: 'Now tap the CIRCLE.', changeAt: 2 },
  },

  // 6. COMPLETE THE STORY — seed → small plant → larger plant → ?
  {
    id: 'easy-cts-1', type: 'sequence-completion', prompt: 'What comes next?',
    sequence: ['🌱', '🌿', '🌻'],
    answer: '🌻',
    scenarioLabel: 'seed → plant → ?',
    options: ['🌱', '🌿', '🌻', '☁️'],
  },

  // 7. QUICK FIND — "Find the umbrella"
  {
    id: 'easy-qf-1', type: 'quick-choice', prompt: 'Find the umbrella.',
    sequence: [], answer: '☂️',
    targetItems: ['📖', '☂️', '🔑', '☕'],
    options: ['📖', '☂️', '🔑', '☕'],
  },
]

// ─── Difficulty 2 (Medium) ─────────────────────────────────────

const medium: ChallengeConfig[] = [
  // 1. GARDEN SEARCH
  {
    id: 'med-gs-1', type: 'target-find', prompt: 'Find all the keys.',
    sequence: [], answer: '🔑',
    targetItems: ['🔑', '📖', '☕', '🔑', '🌸', '🔑', '🪑', '🍌', '🔑', '📞'],
    targetIndices: [0, 3, 5, 8],
    options: ['🔑', '📖', '☕', '🌸'],
  },

  // 2. FIND WHAT CHANGED
  {
    id: 'med-fwc-1', type: 'find-different', prompt: 'What changed?',
    sequence: [], answer: '🌸',
    grid: ['☕', '📖', '🔑', '🌸', '🪑', '📞'],
    beforeItems: ['☕', '📖', '🔑', '🌸', '🪑', '📞'],
    afterItems: ['☕', '📖', '🔑', '🪑', '🪑', '📞'],
    changedIndex: 3,
    options: ['☕', '📖', '🔑', '🌸', '🪑', '📞'],
  },

  // 3. ODD ONE OUT
  {
    id: 'med-ooo-1', type: 'find-different', prompt: 'Find the different one.',
    sequence: [], answer: '☕',
    grid: ['📖', '📖', '📖', '📖', '☕', '📖', '📖', '📖'],
    options: ['📖', '📖', '📖', '📖', '☕', '📖', '📖', '📖'],
  },

  // 4. MATCHING PAIRS
  {
    id: 'med-mp-1', type: 'match-pair', prompt: 'Match the pairs.',
    sequence: [], answer: '',
    pairs: [
      { left: '☕', right: 'Tea' },
      { left: '📖', right: 'Book' },
      { left: '🔑', right: 'Key' },
    ],
    options: ['☕', '📖', '🔑', 'Tea', 'Book', 'Key'],
  },

  // 5. FOLLOW THE RULE
  {
    id: 'med-rs-1', type: 'rule-switch', prompt: 'Tap the BLUE shape.',
    sequence: [], answer: '🔵',
    options: ['🔴', '🔵', '🟢', '🟡'],
    ruleChanges: { from: 'Tap the BLUE shape.', to: 'Now tap the SQUARE.', changeAt: 2 },
  },

  // 6. COMPLETE THE STORY — morning → afternoon → ?
  {
    id: 'med-cts-1', type: 'sequence-completion', prompt: 'What comes next?',
    sequence: ['🌅', '☀️', '🌙'],
    answer: '🌙',
    scenarioLabel: 'morning → afternoon → ?',
    options: ['🌅', '☀️', '🌙', '⭐'],
  },

  // 7. QUICK FIND
  {
    id: 'med-qf-1', type: 'quick-choice', prompt: 'Find the telephone.',
    sequence: [], answer: '📞',
    targetItems: ['🔑', '📞', '📖', '☕', '🌸', '🪑'],
    options: ['🔑', '📞', '📖', '☕', '🌸', '🪑'],
  },
]

// ─── Difficulty 3 (Hard) ───────────────────────────────────────

const hard: ChallengeConfig[] = [
  // 1. GARDEN SEARCH
  {
    id: 'hard-gs-1', type: 'target-find', prompt: 'Find all the flowers.',
    sequence: [], answer: '🌸',
    targetItems: ['🌸', '🔑', '🌸', '📖', '🌸', '☕', '🌸', '🪑', '🍌', '🌸', '📞', '💡'],
    targetIndices: [0, 2, 4, 6, 10],
    options: ['🌸', '🔑', '📖', '☕'],
  },

  // 2. FIND WHAT CHANGED
  {
    id: 'hard-fwc-1', type: 'find-different', prompt: 'What changed?',
    sequence: [], answer: '🪑',
    grid: ['☕', '📖', '🔑', '🌸', '🪑', '📞', '🍌'],
    beforeItems: ['☕', '📖', '🔑', '🌸', '🪑', '📞', '🍌'],
    afterItems: ['☕', '📖', '🔑', '🌸', '📞', '📞', '🍌'],
    changedIndex: 4,
    options: ['☕', '📖', '🔑', '🌸', '🪑', '📞', '🍌'],
  },

  // 3. ODD ONE OUT
  {
    id: 'hard-ooo-1', type: 'find-different', prompt: 'Find the different one.',
    sequence: [], answer: '🌙',
    grid: ['☀️', '☀️', '☀️', '☀️', '🌙', '☀️', '☀️', '☀️', '☀️'],
    options: ['☀️', '☀️', '☀️', '☀️', '🌙', '☀️', '☀️', '☀️', '☀️'],
  },

  // 4. MATCHING PAIRS
  {
    id: 'hard-mp-1', type: 'match-pair', prompt: 'Match the pairs.',
    sequence: [], answer: '',
    pairs: [
      { left: '☕', right: 'Tea' },
      { left: '📖', right: 'Book' },
      { left: '🔑', right: 'Key' },
      { left: '🌸', right: 'Flower' },
    ],
    options: ['☕', '📖', '🔑', '🌸', 'Tea', 'Book', 'Key', 'Flower'],
  },

  // 5. FOLLOW THE RULE
  {
    id: 'hard-rs-1', type: 'rule-switch', prompt: 'Tap the GREEN shape.',
    sequence: [], answer: '🟢',
    options: ['🔴', '🔵', '🟢', '🟡'],
    ruleChanges: { from: 'Tap the GREEN shape.', to: 'Now tap the TRIANGLE.', changeAt: 3 },
  },

  // 6. COMPLETE THE STORY — bud → bloom → bouquet
  {
    id: 'hard-cts-1', type: 'sequence-completion', prompt: 'What comes next?',
    sequence: ['🌸', '🌷', '💐'],
    answer: '💐',
    scenarioLabel: 'bud → bloom → ?',
    options: ['🌸', '🌷', '💐', '🪴'],
  },

  // 7. QUICK FIND
  {
    id: 'hard-qf-1', type: 'quick-choice', prompt: 'Find the glasses.',
    sequence: [], answer: '👓',
    targetItems: ['🔑', '👓', '📖', '☕', '🌸', '☂️', '🪑'],
    options: ['🔑', '👓', '📖', '☕', '🌸', '☂️', '🪑'],
  },
]

// ─── Difficulty 4 (Expert) ─────────────────────────────────────

const expert: ChallengeConfig[] = [
  // 1. GARDEN SEARCH
  {
    id: 'exp-gs-1', type: 'target-find', prompt: 'Find all the flowers.',
    sequence: [], answer: '🌸',
    targetItems: ['🌸', '🔑', '🌸', '📖', '🌸', '☕', '🌸', '🪑', '🍌', '🌸', '📞', '💡', '🌸', '🍽️', '🌸'],
    targetIndices: [0, 2, 4, 6, 9, 12, 14],
    options: ['🌸', '🔑', '📖', '☕'],
  },

  // 2. FIND WHAT CHANGED
  {
    id: 'exp-fwc-1', type: 'find-different', prompt: 'What changed?',
    sequence: [], answer: '🍌',
    grid: ['☕', '📖', '🔑', '🌸', '🪑', '📞', '🍌', '💡'],
    beforeItems: ['☕', '📖', '🔑', '🌸', '🪑', '📞', '🍌', '💡'],
    afterItems: ['☕', '📖', '🔑', '🌸', '🪑', '📞', '💡', '💡'],
    changedIndex: 6,
    options: ['☕', '📖', '🔑', '🌸', '🪑', '📞', '🍌', '💡'],
  },

  // 3. ODD ONE OUT
  {
    id: 'exp-ooo-1', type: 'find-different', prompt: 'Find the different one.',
    sequence: [], answer: '🌙',
    grid: ['☀️', '☀️', '☀️', '☀️', '☀️', '🌙', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️'],
    options: ['☀️', '☀️', '☀️', '☀️', '☀️', '🌙', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️'],
  },

  // 4. MATCHING PAIRS
  {
    id: 'exp-mp-1', type: 'match-pair', prompt: 'Match the pairs.',
    sequence: [], answer: '',
    pairs: [
      { left: '☕', right: 'Tea' },
      { left: '📖', right: 'Book' },
      { left: '🔑', right: 'Key' },
      { left: '🌸', right: 'Flower' },
      { left: '☂️', right: 'Umbrella' },
    ],
    options: ['☕', '📖', '🔑', '🌸', '☂️', 'Tea', 'Book', 'Key', 'Flower', 'Umbrella'],
  },

  // 5. FOLLOW THE RULE
  {
    id: 'exp-rs-1', type: 'rule-switch', prompt: 'Tap the RED shape.',
    sequence: [], answer: '🔴',
    options: ['🔴', '🔵', '🟢', '🟡'],
    ruleChanges: { from: 'Tap the RED shape.', to: 'Now tap the CIRCLE.', changeAt: 3 },
  },

  // 6. COMPLETE THE STORY
  {
    id: 'exp-cts-1', type: 'sequence-completion', prompt: 'What comes next?',
    sequence: [' egg', '🐣', '🐥', '🐔'],
    answer: '🐔',
    scenarioLabel: 'egg → chick → ?',
    options: [' egg', '🐣', '🐥', '🐔'],
  },

  // 7. QUICK FIND
  {
    id: 'exp-qf-1', type: 'quick-choice', prompt: 'Find the bottle.',
    sequence: [], answer: '🍶',
    targetItems: ['🔑', '🍶', '📖', '☕', '🌸', '☂️', '🪑', '💡'],
    options: ['🔑', '🍶', '📖', '☕', '🌸', '☂️', '🪑', '💡'],
  },
]

// ─── Difficulty 5 (Advanced) ───────────────────────────────────

const advanced: ChallengeConfig[] = [
  // 1. GARDEN SEARCH
  {
    id: 'adv-gs-1', type: 'target-find', prompt: 'Find all the keys.',
    sequence: [], answer: '🔑',
    targetItems: ['🔑', '📖', '☕', '🔑', '🌸', '🔑', '🪑', '🍌', '🔑', '📞', '🔑', '💡'],
    targetIndices: [0, 3, 5, 8, 10],
    options: ['🔑', '📖', '☕', '🌸'],
  },

  // 2. FIND WHAT CHANGED
  {
    id: 'adv-fwc-1', type: 'find-different', prompt: 'What changed?',
    sequence: [], answer: '📚',
    grid: ['☕', '📖', '🔑', '🌸', '🪑', '📞', '🍌', '💡', '🍽️'],
    beforeItems: ['☕', '📖', '🔑', '🌸', '🪑', '📞', '🍌', '💡', '🍽️'],
    afterItems: ['☕', '📚', '🔑', '🌸', '🪑', '📞', '🍌', '💡', '🍽️'],
    changedIndex: 1,
    options: ['☕', '📖', '🔑', '🌸', '🪑', '📞', '🍌', '💡', '🍽️'],
  },

  // 3. ODD ONE OUT
  {
    id: 'adv-ooo-1', type: 'find-different', prompt: 'Find the different one.',
    sequence: [], answer: '🌙',
    grid: ['☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '🌙', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️'],
    options: ['☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '🌙', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️'],
  },

  // 4. MATCHING PAIRS
  {
    id: 'adv-mp-1', type: 'match-pair', prompt: 'Match the pairs.',
    sequence: [], answer: '',
    pairs: [
      { left: '☕', right: 'Tea' },
      { left: '📖', right: 'Book' },
      { left: '🔑', right: 'Key' },
      { left: '🌸', right: 'Flower' },
      { left: '☂️', right: 'Umbrella' },
      { left: '👟', right: 'Shoes' },
    ],
    options: ['☕', '📖', '🔑', '🌸', '☂️', '👟', 'Tea', 'Book', 'Key', 'Flower', 'Umbrella', 'Shoes'],
  },

  // 5. FOLLOW THE RULE
  {
    id: 'adv-rs-1', type: 'rule-switch', prompt: 'Tap the BLUE shape.',
    sequence: [], answer: '🔵',
    options: ['🔴', '🔵', '🟢', '🟡'],
    ruleChanges: { from: 'Tap the BLUE shape.', to: 'Now tap the SQUARE.', changeAt: 3 },
  },

  // 6. COMPLETE THE STORY
  {
    id: 'adv-cts-1', type: 'sequence-completion', prompt: 'What comes next?',
    sequence: ['🌱', '🌿', '🌳'],
    answer: '🌳',
    scenarioLabel: 'sprout → plant → ?',
    options: ['🌱', '🌿', '🌳', '☁️'],
  },

  // 7. QUICK FIND
  {
    id: 'adv-qf-1', type: 'quick-choice', prompt: 'Find the hat.',
    sequence: [], answer: '🎩',
    targetItems: ['🔑', '🎩', '📖', '☕', '🌸', '☂️', '🪑', '💡', '🪑'],
    options: ['🔑', '🎩', '📖', '☕', '🌸', '☂️', '🪑', '💡'],
  },
]

// ─── Selection logic ────────────────────────────────────────────

const byDifficulty: Record<DifficultyLevel, ChallengeConfig[]> = {
  1: easy,
  2: medium,
  3: hard,
  4: expert,
  5: advanced,
}

/**
 * Validate a challenge config has required fields for its type.
 * Returns true if the challenge is usable.
 */
function validateChallenge(c: ChallengeConfig): boolean {
  if (!c.id || !c.prompt || !c.answer) return false

  switch (c.type) {
    case 'find-different':
      return Boolean(c.grid && c.grid.length > 0)
    case 'target-find':
      return Boolean(c.targetItems && c.targetItems.length > 0 && c.targetIndices && c.targetIndices.length > 0)
    case 'match-pair':
      return Boolean(c.pairs && c.pairs.length > 0 && c.options.length >= c.pairs.length * 2)
    case 'rule-switch':
      return Boolean(c.options.length > 0 && c.ruleChanges)
    case 'what-comes-next':
    case 'sequence-completion':
    case 'number-pattern':
      return Boolean(c.sequence.length > 0 && c.options.length > 0)
    default:
      return c.options.length > 0
  }
}

/**
 * Get a set of challenges for one session.
 * Picks 7 challenges from the pool, ensuring type variety.
 * Uses seeded random for deterministic variation across days.
 */
export function getSessionChallenges(
  difficulty: DifficultyLevel,
  count: number = 7,
  seed?: number,
): ChallengeConfig[] {
  const pool = byDifficulty[difficulty].filter(validateChallenge)

  // If pool is too small after validation, use all valid challenges
  if (pool.length <= count) {
    const rng = seed !== undefined ? createSeededRandom(seed) : undefined
    return rng ? rng.shuffle([...pool]) : [...pool].sort(() => Math.random() - 0.5)
  }

  const rng = seed !== undefined ? createSeededRandom(seed) : undefined
  const shuffleFn = <T,>(arr: T[]) => rng ? rng.shuffle(arr) : arr.sort(() => Math.random() - 0.5)

  // Group by type
  const byType = new Map<ChallengeType, ChallengeConfig[]>()
  for (const c of pool) {
    const list = byType.get(c.type) ?? []
    list.push(c)
    byType.set(c.type, list)
  }

  // First pass: one from each type (up to count)
  const selected: ChallengeConfig[] = []
  const types = shuffleFn(Array.from(byType.keys()))

  for (const type of types) {
    if (selected.length >= count) break
    const items = byType.get(type)!
    const pick = items[Math.floor(rng ? rng.random() * items.length : Math.random() * items.length)]
    if (pick) selected.push(pick)
  }

  // Fill remaining from random pool
  if (selected.length < count) {
    const remaining = pool.filter(
      (c) => !selected.some((s) => s.id === c.id),
    )
    const shuffled = shuffleFn(remaining)
    for (const c of shuffled) {
      if (selected.length >= count) break
      selected.push(c)
    }
  }

  return shuffleFn(selected)
}

/**
 * Pattern / Attention Game Data
 *
 * Simple sequence-completion tasks organised by difficulty level.
 * Visual logic is straightforward: shapes, colours, household symbols.
 *
 * Level 1: Simple alternating pattern (A-B-A-?)
 * Level 2: Repeating group pattern (A-B-C-A-B-?)
 * Level 3: Longer sequence with more distractors
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'

export interface PatternRound {
  /** The displayed sequence (without the missing item) */
  sequence: string[]
  /** The correct next item */
  answer: string
  /** All answer options including the correct one */
  options: string[]
}

// ── Level 1: Simple alternating ───────────────────────────────

const LEVEL_1: PatternRound[] = [
  {
    sequence: ['🔴', '🔵', '🔴', '🔵'],
    answer: '🔴',
    options: ['🔴', '🔵', '🟢', '🟡'],
  },
  {
    sequence: ['⭐', '🌙', '⭐', '🌙'],
    answer: '⭐',
    options: ['⭐', '🌙', '☀️', '🌈'],
  },
  {
    sequence: ['🟩', '🟪', '🟩', '🟪'],
    answer: '🟩',
    options: ['🟩', '🟪', '🟧', '🟥'],
  },
  {
    sequence: ['🌸', '🌺', '🌸', '🌺'],
    answer: '🌸',
    options: ['🌸', '🌺', '🌻', '🌹'],
  },
  {
    sequence: ['🔺', '🔻', '🔺', '🔻'],
    answer: '🔺',
    options: ['🔺', '🔻', '⬛', '⬜'],
  },
]

// ── Level 2: Repeating groups ─────────────────────────────────

const LEVEL_2: PatternRound[] = [
  {
    sequence: ['🔴', '🔵', '🟢', '🔴', '🔵'],
    answer: '🟢',
    options: ['🔴', '🔵', '🟢', '🟡'],
  },
  {
    sequence: ['⭐', '🌙', '☀️', '⭐', '🌙'],
    answer: '☀️',
    options: ['⭐', '🌙', '☀️', '🌈'],
  },
  {
    sequence: ['🟥', '🟧', '🟨', '🟥', '🟧'],
    answer: '🟨',
    options: ['🟥', '🟧', '🟨', '🟩'],
  },
  {
    sequence: ['🌸', '🌺', '🌻', '🌸', '🌺'],
    answer: '🌻',
    options: ['🌸', '🌺', '🌻', '🌹'],
  },
  {
    sequence: ['🔺', '🔻', '⬛', '🔺', '🔻'],
    answer: '⬛',
    options: ['🔺', '🔻', '⬛', '⬜'],
  },
]

// ── Level 3: Longer sequences ─────────────────────────────────

const LEVEL_3: PatternRound[] = [
  {
    sequence: ['🔴', '🔵', '🟢', '🟡', '🔴', '🔵'],
    answer: '🟢',
    options: ['🔴', '🔵', '🟢', '🟡'],
  },
  {
    sequence: ['⭐', '🌙', '☀️', '🌈', '⭐', '🌙'],
    answer: '☀️',
    options: ['⭐', '🌙', '☀️', '🌈'],
  },
  {
    sequence: ['🟥', '🟧', '🟨', '🟩', '🟥', '🟧'],
    answer: '🟨',
    options: ['🟥', '🟧', '🟨', '🟩'],
  },
  {
    sequence: ['🌸', '🌺', '🌻', '🌹', '🌸', '🌺'],
    answer: '🌻',
    options: ['🌸', '🌺', '🌻', '🌹'],
  },
  {
    sequence: ['🔺', '🔻', '⬛', '⬜', '🔺', '🔻'],
    answer: '⬛',
    options: ['🔺', '🔻', '⬛', '⬜'],
  },
]

// ── Level 4: Complex sequences ─────────────────────────────

const LEVEL_4: PatternRound[] = [
  {
    sequence: ['🔴', '🔵', '🟢', '🟡', '🟣', '🔴', '🔵'],
    answer: '🟢',
    options: ['🔴', '🔵', '🟢', '🟡'],
  },
  {
    sequence: ['⭐', '🌙', '☀️', '🌈', '⚡', '⭐', '🌙'],
    answer: '☀️',
    options: ['⭐', '🌙', '☀️', '🌈'],
  },
  {
    sequence: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟥', '🟧'],
    answer: '🟨',
    options: ['🟥', '🟧', '🟨', '🟩'],
  },
  {
    sequence: ['🌸', '🌺', '🌻', '🌹', '🌷', '🌸', '🌺'],
    answer: '🌻',
    options: ['🌸', '🌺', '🌻', '🌹'],
  },
  {
    sequence: ['🔺', '🔻', '⬛', '⬜', '💎', '🔺', '🔻'],
    answer: '⬛',
    options: ['🔺', '🔻', '⬛', '⬜'],
  },
]

// ── Level 5: Advanced sequences ──────────────────────────────

const LEVEL_5: PatternRound[] = [
  {
    sequence: ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '🔴', '🔵'],
    answer: '🟢',
    options: ['🔴', '🔵', '🟢', '🟡', '🟣'],
  },
  {
    sequence: ['⭐', '🌙', '☀️', '🌈', '⚡', '🌟', '⭐', '🌙'],
    answer: '☀️',
    options: ['⭐', '🌙', '☀️', '🌈', '⚡'],
  },
  {
    sequence: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟥', '🟧'],
    answer: '🟨',
    options: ['🟥', '🟧', '🟨', '🟩', '🟦'],
  },
  {
    sequence: ['🌸', '🌺', '🌻', '🌹', '🌷', '🏵️', '🌸', '🌺'],
    answer: '🌻',
    options: ['🌸', '🌺', '🌻', '🌹', '🌷'],
  },
  {
    sequence: ['🔺', '🔻', '⬛', '⬜', '💎', '🔶', '🔺', '🔻'],
    answer: '⬛',
    options: ['🔺', '🔻', '⬛', '⬜', '💎'],
  },
]

/** Patterns indexed by difficulty level */
export const PATTERNS_BY_LEVEL: Record<DifficultyLevel, PatternRound[]> = {
  1: LEVEL_1,
  2: LEVEL_2,
  3: LEVEL_3,
  4: LEVEL_4,
  5: LEVEL_5,
}

/** Number of rounds per difficulty level */
export const ROUNDS_PER_LEVEL: Record<DifficultyLevel, number> = {
  1: 5,
  2: 5,
  3: 5,
  4: 5,
  5: 5,
}

/**
 * Get shuffled rounds for a given difficulty level.
 */
export function getPatternRounds(level: DifficultyLevel): PatternRound[] {
  const pool = PATTERNS_BY_LEVEL[level]
  return [...pool].sort(() => Math.random() - 0.5)
}

/**
 * Pattern & Attention — Question Bank
 *
 * Five pattern categories, each cognitively simple.
 * Difficulty selects which pool to draw from.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { PatternQuestionConfig } from '@/features/games/types'

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

// ── Level 1: Simple alternating (A-B-A-B) ─────────────────────

const L1: PatternQuestionConfig[] = [
  { sequence: ['🔴', '🔵', '🔴', '🔵'],         answer: '🔴', options: ['🔴', '🔵', '🟢'] },
  { sequence: ['⭐', '🌙', '⭐', '🌙'],         answer: '⭐', options: ['⭐', '🌙', '☀️'] },
  { sequence: ['🟩', '🟪', '🟩', '🟪'],         answer: '🟩', options: ['🟩', '🟪', '🟧'] },
  { sequence: ['🌸', '🌺', '🌸', '🌺'],         answer: '🌸', options: ['🌸', '🌺', '🌻'] },
  { sequence: ['🔺', '🔻', '🔺', '🔻'],         answer: '🔺', options: ['🔺', '🔻', '⬛'] },
  { sequence: ['🍎', '📖', '🍎', '📖'],         answer: '🍎', options: ['🍎', '📖', '☕'] },
  { sequence: ['🟥', '🟧', '🟥', '🟧'],         answer: '🟥', options: ['🟥', '🟧', '🟨'] },
  { sequence: ['🔵', '🟢', '🔵', '🟢'],         answer: '🔵', options: ['🔵', '🟢', '🔴'] },
]

// ── Level 2: Three-item repeat (A-B-C-A-B) ────────────────────

const L2: PatternQuestionConfig[] = [
  { sequence: ['🔴', '🔵', '🟢', '🔴', '🔵'],   answer: '🟢', options: ['🔴', '🔵', '🟢'] },
  { sequence: ['⭐', '🌙', '☀️', '⭐', '🌙'],   answer: '☀️', options: ['⭐', '🌙', '☀️'] },
  { sequence: ['🟥', '🟧', '🟨', '🟥', '🟧'],   answer: '🟨', options: ['🟥', '🟧', '🟨'] },
  { sequence: ['🌸', '🌺', '🌻', '🌸', '🌺'],   answer: '🌻', options: ['🌸', '🌺', '🌻'] },
  { sequence: ['🔺', '🔻', '⬛', '🔺', '🔻'],   answer: '⬛', options: ['🔺', '🔻', '⬛'] },
  { sequence: ['🍎', '📖', '☕', '🍎', '📖'],   answer: '☕', options: ['🍎', '📖', '☕'] },
  { sequence: ['🟩', '🟪', '🟧', '🟩', '🟪'],   answer: '🟧', options: ['🟩', '🟪', '🟧'] },
  { sequence: ['🔵', '🟢', '🟡', '🔵', '🟢'],   answer: '🟡', options: ['🔵', '🟢', '🟡'] },
]

// ── Level 3: Longer or mixed ───────────────────────────────────

const L3: PatternQuestionConfig[] = [
  { sequence: ['🔴', '🔵', '🟢', '🟡', '🔴', '🔵'],   answer: '🟢', options: ['🔴', '🔵', '🟢'] },
  { sequence: ['⭐', '🌙', '☀️', '🌈', '⭐', '🌙'],   answer: '☀️', options: ['⭐', '🌙', '☀️'] },
  { sequence: ['🟥', '🟧', '🟨', '🟩', '🟥', '🟧'],   answer: '🟨', options: ['🟥', '🟧', '🟨'] },
  { sequence: ['🌸', '🌺', '🌻', '🌹', '🌸', '🌺'],   answer: '🌻', options: ['🌸', '🌺', '🌻'] },
  { sequence: ['🔺', '🔻', '⬛', '⬜', '🔺', '🔻'],   answer: '⬛', options: ['🔺', '🔻', '⬛'] },
  { sequence: ['🍎', '📖', '☕', '🔑', '🍎', '📖'],   answer: '☕', options: ['🍎', '📖', '☕'] },
  { sequence: ['🟩', '🟪', '🟧', '🟥', '🟩', '🟪'],   answer: '🟧', options: ['🟩', '🟪', '🟧'] },
  { sequence: ['🔵', '🟢', '🟡', '🔴', '🔵', '🟢'],   answer: '🟡', options: ['🔵', '🟢', '🟡'] },
]

const POOL: Record<DifficultyLevel, PatternQuestionConfig[]> = { 1: L1, 2: L2, 3: L3 }

/**
 * Return `count` shuffled questions for the given difficulty.
 * If the pool is smaller than `count`, questions may repeat.
 */
export function getPatternQuestions(
  difficulty: DifficultyLevel,
  count: number = 5,
): PatternQuestionConfig[] {
  const pool = POOL[difficulty]
  const shuffled = shuffle(pool)
  const result: PatternQuestionConfig[] = []
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]!)
  }
  return result
}

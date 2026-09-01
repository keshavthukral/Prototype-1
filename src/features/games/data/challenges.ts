/**
 * Attention Adventure — Challenge Data
 *
 * 4 task types with type-specific config shapes.
 *getSessionChallenges builds a deliberate 7-task session.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import { generateTrailConnectChallenge } from '@/features/games/data/trail-connect'
import { generateCancellationChallenge } from '@/features/games/data/cancellation'
import { generateRuleSwitchChallenge } from '@/features/games/data/rule-switch'
import { generateEverydaySequenceChallenge } from '@/features/games/data/everyday-sequence'

// ─── Type-specific config interfaces ────────────────────────────

export interface TrailConnectConfig {
  id: string
  type: 'trail-connect'
  prompt: string
  points: Array<{ id: string; label: string; x: number; y: number }>
  order: string[] // point ids in correct tap order
}

export interface CancellationConfig {
  id: string
  type: 'cancellation'
  prompt: string
  targetObjectId: string // matches an id in OBJECT_POOL
  gridObjectIds: string[] // all objects shown, includes multiple copies of the target
  targetIndices: number[] // positions in gridObjectIds that are correct
}

export interface RuleSwitchConfig {
  id: string
  type: 'rule-switch'
  initialRule: { promptText: string; matchCategory: string }
  switchedRule: { promptText: string; matchCategory: string; switchAt: number }
  itemObjectIds: string[] // pool of object ids to present, drawn from OBJECT_POOL
}

export interface EverydaySequenceConfig {
  id: string
  type: 'everyday-sequence'
  prompt: string
  routineId: string
  routineLabel: string
  steps: Array<{ id: string; label: string }> // in correct order; UI will shuffle for display
}

export type ChallengeConfig =
  | TrailConnectConfig
  | CancellationConfig
  | RuleSwitchConfig
  | EverydaySequenceConfig

// ─── Session generation ────────────────────────────────────────

/**
 * Build a deliberate 7-task session from the four task types.
 *
 * Pattern: TC, C, RS, ES, then a random pair from the remaining
 * two types, ensuring each type appears at least once and no more
 * than twice.
 */
export function getSessionChallenges(
  difficulty: DifficultyLevel,
  count: number = 7,
): ChallengeConfig[] {
  // Deterministic base sequence: one of each type, then fill
  const types: Array<'trail-connect' | 'cancellation' | 'rule-switch' | 'everyday-sequence'> = [
    'trail-connect',
    'cancellation',
    'rule-switch',
    'everyday-sequence',
  ]

  // Fill remaining slots with a mix (no type more than twice total)
  const extras: typeof types = ['trail-connect', 'cancellation', 'rule-switch', 'everyday-sequence']
  // Simple seeded-ish shuffle via difficulty as entropy
  for (let i = extras.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = extras[i]!
    extras[i] = extras[j]!
    extras[j] = tmp
  }
  while (types.length < count) {
    types.push(extras[types.length % extras.length]!)
  }

  // Shuffle the last 3 so the order isn't perfectly predictable
  const tail = types.slice(4)
  for (let i = tail.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = tail[i]!
    tail[i] = tail[j]!
    tail[j] = tmp
  }
  types.splice(4, tail.length, ...tail)

  return types.slice(0, count).map((type, i) => {
    const id = `att-${i + 1}-${type}`
    switch (type) {
      case 'trail-connect':
        return generateTrailConnectChallenge(difficulty, id)
      case 'cancellation':
        return generateCancellationChallenge(difficulty, id)
      case 'rule-switch':
        return generateRuleSwitchChallenge(difficulty, id)
      case 'everyday-sequence':
        return generateEverydaySequenceChallenge(difficulty, id)
    }
  })
}

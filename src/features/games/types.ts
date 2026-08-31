import type { DifficultyLevel } from '@/lib/games/adaptive-engine'

export type GameMode = 'daily' | 'practice'

export interface GameChoice {
  id: string
  emoji: string
  label: string
}

export interface MemoryRoundConfig {
  targets: GameChoice[]
  distractors: GameChoice[]
  options: GameChoice[]
}

export interface PatternQuestionConfig {
  id: string
  type: 'alternating' | 'repetition' | 'number' | 'shape' | 'missing' | 'attention'
  prompt: string
  sequence: string[]
  answer: string
  options: string[]
  missingIndex?: number
}

export function targetsCountForDifficulty(d: DifficultyLevel): number {
  return d === 1 ? 3 : d === 2 ? 4 : d === 3 ? 5 : 7
}

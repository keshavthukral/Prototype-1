// Repository exports
export { patientRepository } from './patient'
export { reminderRepository } from './reminder'
export { memoryRepository } from './memory'
export { saveGameSession, getRecentSessions, getCurrentDifficulty } from './game-session'

// Type exports
export type { Patient } from './patient'
export type {
  Reminder,
  ReminderCompletion,
  ReminderType,
  ReminderFrequency,
  ReminderStatus,
} from './reminder'
export type { Memory } from './memory'
export type { GameSessionRecord as GameSession } from './game-session'
export type { DifficultyLevel } from '@/lib/games/adaptive-engine'

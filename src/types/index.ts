// User and Auth Types
export type UserRole = 'patient' | 'caregiver'

export interface User {
  id: string
  email?: string
  role: UserRole
  name: string
  createdAt: Date
}

export interface Patient extends User {
  role: 'patient'
  preferredLanguage: Language
  caregiverId?: string
}

export interface Caregiver extends User {
  role: 'caregiver'
  patients: Patient[]
}

// Language Types
export type Language = 'en' | 'as'

export interface LanguageStrings {
  [key: string]: string
}

// Game Types
export type GameType = 'memory' | 'pattern'

export interface GameObject {
  id: string
  name: string
  nameAs?: string // Assamese name
  imageUrl: string
  category: string
}

export interface GameResult {
  id: string
  patientId: string
  gameType: GameType
  score: number
  accuracy: number
  responseTimeMs: number
  hintsUsed: number
  difficultyLevel: number
  completedAt: Date
  synced: boolean
}

export interface GameSession {
  gameType: GameType
  difficulty: DifficultyLevel
  objects: GameObject[]
  startTime: Date
  endTime?: Date
  score: number
  accuracy: number
  hintsUsed: number
}

// Difficulty Types
export type DifficultyLevel = 1 | 2 | 3 | 4

export interface AdaptiveInput {
  accuracy: number
  responseTimeMs: number
  hintsUsed: number
  recentPerformance: number[]
}

export interface AdaptiveOutput {
  difficulty: 'easier' | 'same' | 'harder'
  reasoning: string
}

// Reminder Types
export type ReminderType = 'medicine' | 'hydration' | 'meal' | 'walk' | 'family_call' | 'daily_activity'
export type ReminderStatus = 'taken' | 'done' | 'skipped' | 'remind_later'

export interface Reminder {
  id: string
  patientId: string
  caregiverId?: string
  title: string
  description?: string
  reminderType: ReminderType
  frequency: string
  timeOfDay?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ReminderCompletion {
  id: string
  reminderId: string
  patientId: string
  status: ReminderStatus
  completedAt: Date
  synced: boolean
}

// Memory Book Types
export interface MemoryEntry {
  id: string
  patientId: string
  caregiverId?: string
  name: string
  relationship?: string
  description?: string
  photoUrl?: string
  createdAt: Date
  updatedAt: Date
}

// Sync Types
export type SyncOperation = 'create' | 'update' | 'delete'
export type SyncStatus = 'online' | 'offline' | 'syncing' | 'sync_complete'

export interface SyncQueueItem {
  queueId?: number
  operation: SyncOperation
  table: string
  recordId: string
  data?: Record<string, unknown>
  timestamp: Date
  retryCount: number
  lastError?: string
}

// Activity Log Types
export type ActivityType = 'game_completed' | 'reminder_completed' | 'memory_viewed'

export interface ActivityLog {
  id: string
  patientId: string
  activityType: ActivityType
  activityData: Record<string, unknown>
  createdAt: Date
  synced: boolean
}

// Settings Types
export interface AppSettings {
  key: string
  value: string | number | boolean
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  error?: Error
  message?: string
}

// Base repository types and utilities
export type SyncStatus = 'pending' | 'synced' | 'failed'

// Simple repository interface
export interface BaseRepository<T> {
  getById(id: string): Promise<T | undefined>
  getAll(): Promise<T[]>
  create(item: T): Promise<T>
  update(id: string, updates: Partial<T>): Promise<T | undefined>
  delete(id: string): Promise<void>
}

// Export nothing complex - just types
export {}

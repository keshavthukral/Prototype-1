import { db } from '@/lib/db/database'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import type { LocalMemory } from '@/lib/db/database'

// Re-export type from database
export type { LocalMemory as Memory }

// Memory repository using direct Dexie operations
export const memoryRepository = {
  async getById(id: string): Promise<LocalMemory | undefined> {
    return db.memories.where('id').equals(id).first()
  },

  async getByPatientId(patientId: string): Promise<LocalMemory[]> {
    return db.memories.where('patientId').equals(patientId).toArray()
  },

  async create(memory: Omit<LocalMemory, 'localId' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<LocalMemory> {
    const newMemory: LocalMemory = {
      ...memory,
      id: memory.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false,
    }

    await db.memories.add(newMemory as LocalMemory & { localId: number })

    // Queue for sync
    await db.syncQueue.add({
      operation: 'create',
      table: 'memories',
      recordId: newMemory.id,
      data: newMemory as unknown as Record<string, unknown>,
      timestamp: new Date(),
      retryCount: 0,
    })

    return newMemory
  },

  async update(id: string, updates: Partial<LocalMemory>): Promise<LocalMemory | undefined> {
    const existing = await this.getById(id)
    if (!existing) return undefined

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      synced: false,
    }

    await db.memories.where('id').equals(id).modify(updated as Partial<LocalMemory>)

    // Queue for sync
    await db.syncQueue.add({
      operation: 'update',
      table: 'memories',
      recordId: id,
      data: updated as unknown as Record<string, unknown>,
      timestamp: new Date(),
      retryCount: 0,
    })

    return updated
  },

  async delete(id: string): Promise<void> {
    await db.memories.where('id').equals(id).delete()

    // Queue for sync
    await db.syncQueue.add({
      operation: 'delete',
      table: 'memories',
      recordId: id,
      timestamp: new Date(),
      retryCount: 0,
    })
  },

  // Image upload operations
  async uploadImage(patientId: string, memoryId: string, file: File): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      // In demo mode, create a local URL
      return URL.createObjectURL(file)
    }

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${patientId}/${memoryId}-${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from('memory-photos')
        .upload(filePath, file)

      if (error) {
        console.error('Image upload error:', error)
        return null
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('memory-photos')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Image upload failed:', error)
      return null
    }
  },

  async deleteImage(storagePath: string): Promise<void> {
    if (!isSupabaseConfigured()) return

    try {
      await supabase.storage
        .from('memory-photos')
        .remove([storagePath])
    } catch (error) {
      console.error('Image delete failed:', error)
    }
  },
}

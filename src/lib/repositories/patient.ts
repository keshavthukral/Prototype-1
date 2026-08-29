import { db } from '@/lib/db/database'

export interface Patient {
  id: string
  userId: string
  name: string
  preferredLanguage: 'en' | 'as'
  dateOfBirth?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  synced: boolean
}

// Patient repository using direct Dexie operations
export const patientRepository = {
  async getById(id: string): Promise<Patient | undefined> {
    const profile = await db.patientProfile.get(id)
    if (!profile) return undefined
    return {
      id: profile.id,
      userId: profile.id,
      name: profile.name,
      preferredLanguage: profile.preferredLanguage as 'en' | 'as',
      createdAt: new Date(),
      updatedAt: profile.updatedAt,
      synced: true,
    }
  },

  async getByUserId(userId: string): Promise<Patient | undefined> {
    return this.getById(userId)
  },

  async create(patient: Omit<Patient, 'createdAt' | 'updatedAt' | 'synced'>): Promise<Patient> {
    const newPatient: Patient = {
      ...patient,
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false,
    }

    await db.patientProfile.put({
      id: newPatient.id,
      name: newPatient.name,
      preferredLanguage: newPatient.preferredLanguage,
      createdAt: newPatient.createdAt,
      updatedAt: newPatient.updatedAt,
    })

    return newPatient
  },

  async update(id: string, updates: Partial<Patient>): Promise<Patient | undefined> {
    const existing = await this.getById(id)
    if (!existing) return undefined

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      synced: false,
    }

    await db.patientProfile.put({
      id: updated.id,
      name: updated.name,
      preferredLanguage: updated.preferredLanguage,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })

    return updated
  },
}

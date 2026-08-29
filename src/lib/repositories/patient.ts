import { db } from '@/lib/db/database'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

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

// Patient repository: Dexie (local) + Supabase RPC (cloud)
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

  /**
   * Create a patient on Supabase via the create_patient_for_caregiver RPC.
   * The RPC atomically inserts the patient + caregiver_patient_links row.
   * Never sends caregiver_id — the function determines it from auth.uid().
   */
  async createOnServer(params: {
    preferredLanguage?: string
    dateOfBirth?: string | null
    notes?: string | null
  }): Promise<{ id: string } | null> {
    if (!isSupabaseConfigured()) return null

    const { data, error } = await supabase.rpc('create_patient_for_caregiver' as never, {
      p_preferred_language: params.preferredLanguage ?? 'en',
      p_date_of_birth: params.dateOfBirth ?? null,
      p_notes: params.notes ?? null,
    } as never)

    if (error) {
      console.error('create_patient_for_caregiver failed:', error.message)
      return null
    }

    // data is the JSONB patient row returned by the RPC
    const row = data as { id: string } | null
    return row ?? null
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

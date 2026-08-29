import { useState, useEffect, useCallback } from 'react'
import { db, dbOperations } from '@/lib/db/database'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import type { LocalReminder, LocalReminderCompletion, SupportRequest } from '@/lib/db/database'
import type { LocalMemory } from '@/lib/db/database'

// =====================================================
// Types
// =====================================================

export interface PatientProfile {
  id: string
  name: string
  preferredLanguage: string
  createdAt: Date
  updatedAt: Date
}

export interface GameSessionSummary {
  id: string
  gameType: 'memory' | 'pattern'
  accuracy: number
  score: number
  difficultyLevel: number
  completedAt: Date
}

export interface ReminderWithStatus {
  reminder: LocalReminder
  completions: LocalReminderCompletion[]
  todayCompleted: boolean
}

export interface ActivityFeedItem {
  id: string
  type: 'game_completed' | 'reminder_completed' | 'reminder_postponed' | 'memory_added' | 'sync_event'
  title: string
  subtitle: string
  timestamp: Date
  icon: string
}

export interface DashboardData {
  patient: PatientProfile | null
  todaySessions: GameSessionSummary[]
  recentSessions: GameSessionSummary[]
  memorySessions: GameSessionSummary[]
  patternSessions: GameSessionSummary[]
  reminders: ReminderWithStatus[]
  memories: LocalMemory[]
  activityFeed: ActivityFeedItem[]
  syncPendingCount: number
  supportRequests: SupportRequest[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export interface PatientDetailData {
  patient: PatientProfile | null
  recentSessions: GameSessionSummary[]
  memoryStats: { sessionsPlayed: number; averageAccuracy: number }
  patternStats: { sessionsPlayed: number; averageAccuracy: number }
  reminders: ReminderWithStatus[]
  memories: LocalMemory[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// =====================================================
// Helpers
// =====================================================

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}



// =====================================================
// Hook: useCaregiverData (Dashboard)
// =====================================================

export function useCaregiverData(patientId: string | null): DashboardData {
  const [data, setData] = useState<DashboardData>({
    patient: null,
    todaySessions: [],
    recentSessions: [],
    memorySessions: [],
    patternSessions: [],
    reminders: [],
    memories: [],
    activityFeed: [],
    syncPendingCount: 0,
    supportRequests: [],
    isLoading: true,
    error: null,
    refresh: async () => {},
  })

  const fetchData = useCallback(async () => {
    if (!patientId) {
      setData((prev) => ({ ...prev, isLoading: false, patient: null }))
      return
    }

    try {
      setData((prev) => ({ ...prev, isLoading: true, error: null }))

      // Fetch all data in parallel
      const [
        profile,
        allSessions,
        reminders,
        completions,
        memories,
        pendingCount,
        supportRequests,
      ] = await Promise.all([
        dbOperations.getPatientProfile(patientId),
        dbOperations.getRecentGameSessions(patientId, 30),
        dbOperations.getReminders(patientId),
        dbOperations.getReminderCompletions(patientId),
        dbOperations.getMemories(patientId),
        db.syncQueue.count(),
        db.supportRequests.where('patientId').equals(patientId).reverse().sortBy('requestedAt'),
      ])

      // Process sessions
      const todaySessions: GameSessionSummary[] = allSessions
        .filter((s) => isToday(s.completedAt))
        .map((s) => ({
          id: s.id,
          gameType: s.gameType,
          accuracy: s.accuracy,
          score: s.score,
          difficultyLevel: s.difficultyLevel,
          completedAt: s.completedAt,
        }))

      const recentSessions: GameSessionSummary[] = allSessions
        .slice(0, 10)
        .map((s) => ({
          id: s.id,
          gameType: s.gameType,
          accuracy: s.accuracy,
          score: s.score,
          difficultyLevel: s.difficultyLevel,
          completedAt: s.completedAt,
        }))

      const memorySessions: GameSessionSummary[] = allSessions
        .filter((s) => s.gameType === 'memory')
        .slice(0, 14)
        .map((s) => ({
          id: s.id,
          gameType: s.gameType,
          accuracy: s.accuracy,
          score: s.score,
          difficultyLevel: s.difficultyLevel,
          completedAt: s.completedAt,
        }))

      const patternSessions: GameSessionSummary[] = allSessions
        .filter((s) => s.gameType === 'pattern')
        .slice(0, 14)
        .map((s) => ({
          id: s.id,
          gameType: s.gameType,
          accuracy: s.accuracy,
          score: s.score,
          difficultyLevel: s.difficultyLevel,
          completedAt: s.completedAt,
        }))

      // Process reminders with today's completions
      const remindersWithStatus: ReminderWithStatus[] = reminders.map((r) => {
        const reminderCompletions = completions.filter(
          (c) => c.reminderId === r.id && isToday(c.completedAt)
        )
        return {
          reminder: r,
          completions: reminderCompletions,
          todayCompleted: reminderCompletions.some(
            (c) => c.status === 'done' || c.status === 'taken'
          ),
        }
      })

      // Build activity feed
      const feedItems: ActivityFeedItem[] = []

      // Game completions
      allSessions.slice(0, 5).forEach((s) => {
        feedItems.push({
          id: `session-${s.id}`,
          type: 'game_completed',
          title: s.gameType === 'memory' ? 'Memory game completed' : 'Pattern game completed',
          subtitle: `Score: ${s.score} · Accuracy: ${Math.round(s.accuracy)}%`,
          timestamp: s.completedAt,
          icon: 'game',
        })
      })

      // Reminder completions
      completions.slice(0, 5).forEach((c) => {
        const reminder = reminders.find((r) => r.id === c.reminderId)
        feedItems.push({
          id: `completion-${c.id}`,
          type: c.status === 'remind_later' ? 'reminder_postponed' : 'reminder_completed',
          title: c.status === 'remind_later'
            ? 'Reminder postponed'
            : `Reminder completed`,
          subtitle: reminder?.title || 'Unknown reminder',
          timestamp: c.completedAt,
          icon: 'reminder',
        })
      })

      // Memory additions
      memories.slice(0, 3).forEach((m) => {
        feedItems.push({
          id: `memory-${m.id}`,
          type: 'memory_added',
          title: 'Memory added',
          subtitle: m.name,
          timestamp: m.createdAt,
          icon: 'memory',
        })
      })

      // Sort by timestamp
      feedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Build patient profile
      const patientProfile: PatientProfile | null = profile
        ? {
            id: profile.id,
            name: profile.name,
            preferredLanguage: profile.preferredLanguage,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null

      setData({
        patient: patientProfile,
        todaySessions,
        recentSessions,
        memorySessions,
        patternSessions,
        reminders: remindersWithStatus,
        memories,
        activityFeed: feedItems.slice(0, 10),
        syncPendingCount: pendingCount,
        supportRequests,
        isLoading: false,
        error: null,
        refresh: fetchData,
      })
    } catch (err) {
      console.error('Failed to load caregiver data:', err)
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
        refresh: fetchData,
      }))
    }
  }, [patientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...data, refresh: fetchData }
}

// =====================================================
// Hook: usePatientDetail
// =====================================================

export function usePatientDetail(patientId: string | null): PatientDetailData {
  const [data, setData] = useState<PatientDetailData>({
    patient: null,
    recentSessions: [],
    memoryStats: { sessionsPlayed: 0, averageAccuracy: 0 },
    patternStats: { sessionsPlayed: 0, averageAccuracy: 0 },
    reminders: [],
    memories: [],
    isLoading: true,
    error: null,
    refresh: async () => {},
  })

  const fetchData = useCallback(async () => {
    if (!patientId) {
      setData((prev) => ({ ...prev, isLoading: false, patient: null }))
      return
    }

    try {
      setData((prev) => ({ ...prev, isLoading: true, error: null }))

      const [profile, memoryStats, patternStats, reminders, completions, memories, recentSessions] =
        await Promise.all([
          dbOperations.getPatientProfile(patientId),
          dbOperations.getGameSessionStats(patientId, 'memory'),
          dbOperations.getGameSessionStats(patientId, 'pattern'),
          dbOperations.getReminders(patientId),
          dbOperations.getReminderCompletions(patientId),
          dbOperations.getMemories(patientId),
          dbOperations.getRecentGameSessions(patientId, 10),
        ])

      const remindersWithStatus: ReminderWithStatus[] = reminders.map((r) => {
        const todayCompletions = completions.filter(
          (c) => c.reminderId === r.id && isToday(c.completedAt)
        )
        return {
          reminder: r,
          completions: todayCompletions,
          todayCompleted: todayCompletions.some(
            (c) => c.status === 'done' || c.status === 'taken'
          ),
        }
      })

      const patientProfile: PatientProfile | null = profile
        ? {
            id: profile.id,
            name: profile.name,
            preferredLanguage: profile.preferredLanguage,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null

      setData({
        patient: patientProfile,
        recentSessions: recentSessions.map((s) => ({
          id: s.id,
          gameType: s.gameType,
          accuracy: s.accuracy,
          score: s.score,
          difficultyLevel: s.difficultyLevel,
          completedAt: s.completedAt,
        })),
        memoryStats: {
          sessionsPlayed: memoryStats.sessionsPlayed,
          averageAccuracy: Math.round(memoryStats.averageAccuracy),
        },
        patternStats: {
          sessionsPlayed: patternStats.sessionsPlayed,
          averageAccuracy: Math.round(patternStats.averageAccuracy),
        },
        reminders: remindersWithStatus,
        memories,
        isLoading: false,
        error: null,
        refresh: fetchData,
      })
    } catch (err) {
      console.error('Failed to load patient detail:', err)
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
        refresh: fetchData,
      }))
    }
  }, [patientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...data, refresh: fetchData }
}

// =====================================================
// Hook: useLinkedPatientId
// Gets the patient ID linked to the current caregiver
// =====================================================

export function useLinkedPatientId(caregiverId: string | null): string | null {
  const [patientId, setPatientId] = useState<string | null>(null)

  useEffect(() => {
    if (!caregiverId) {
      setPatientId(null)
      return
    }

    const fetchLinkedPatient = async () => {
      if (isSupabaseConfigured() && navigator.onLine) {
        try {
          const { data: links } = await supabase
            .from('caregiver_patient_links')
            .select('patient_id')
            .eq('caregiver_id', caregiverId)
            .limit(1)

          if (links && links.length > 0) {
            const first = links[0] as { patient_id: string } | undefined
            if (first) {
              setPatientId(first.patient_id)
              return
            }
          }
        } catch {
          // Fall through to local
        }
      }

      // Demo mode: check for the seeded demo patient ID
      const demoPatientId = await dbOperations.getSetting('demo-patient-id')
      if (demoPatientId) {
        setPatientId(demoPatientId)
        return
      }

      // Final fallback: use the caregiver ID as patient ID
      setPatientId(caregiverId)
    }

    fetchLinkedPatient()
  }, [caregiverId])

  return patientId
}

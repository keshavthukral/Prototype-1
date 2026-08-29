import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { supabase, isSupabaseConfigured } from './client'
import { DEMO_PATIENT, DEMO_CAREGIVER } from '@/lib/demo/fixtures'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isOnlineMode: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  loginAsPatient: (name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PATIENT_STORAGE_KEY = 'brainbuddy-patient'

interface StoredPatient {
  id: string
  name: string
  role: 'patient'
}

function getStoredPatient(): StoredPatient | null {
  try {
    const stored = localStorage.getItem(PATIENT_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as StoredPatient
    }
  } catch {
    // localStorage not available
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isOnlineMode = isSupabaseConfigured()

  // Check for stored patient session on mount
  useEffect(() => {
    const storedPatient = getStoredPatient()
    if (storedPatient) {
      setUser({
        ...storedPatient,
        createdAt: new Date(),
      })
    } else if (!isSupabaseConfigured()) {
      // Demo mode: auto-create a demo patient session
      const demoUser: User = {
        id: DEMO_PATIENT.id,
        role: 'patient',
        name: DEMO_PATIENT.name,
        createdAt: DEMO_PATIENT.createdAt,
      }
      try {
        localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify({
          id: demoUser.id,
          name: demoUser.name,
          role: demoUser.role,
        }))
      } catch { /* localStorage not available */ }
      setUser(demoUser)
    }
    setIsLoading(false)
  }, [])

  // Listen for Supabase auth changes if online
  useEffect(() => {
    if (!isOnlineMode) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const role = session.user.user_metadata?.role as UserRole ?? 'caregiver'
          setUser({
            id: session.user.id,
            email: session.user.email,
            role,
            name: session.user.user_metadata?.name ?? session.user.email ?? 'User',
            createdAt: new Date(session.user.created_at),
          })
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [isOnlineMode])

  // Get demo caregiver info (for caregiver login bypass)
  const getDemoCaregiver = (): User => ({
    id: DEMO_CAREGIVER.id,
    email: DEMO_CAREGIVER.email,
    role: 'caregiver' as const,
    name: DEMO_CAREGIVER.name,
    createdAt: new Date('2026-07-15'),
  })

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!isOnlineMode) {
      // Demo mode: accept any credentials, log in as demo caregiver
      const demoCaregiver = getDemoCaregiver()
      setUser(demoCaregiver)
      return {}
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch {
      return { error: 'Failed to connect to server' }
    }
  }

  const loginAsPatient = async (name: string) => {
    const patientId = `patient-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const patient: StoredPatient = {
      id: patientId,
      name,
      role: 'patient',
    }

    try {
      localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(patient))
    } catch {
      // localStorage not available
    }

    setUser({
      ...patient,
      createdAt: new Date(),
    })
  }

  const logout = async () => {
    if (isOnlineMode) {
      await supabase.auth.signOut()
    }

    try {
      localStorage.removeItem(PATIENT_STORAGE_KEY)
    } catch {
      // localStorage not available
    }

    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isOnlineMode,
        login,
        loginAsPatient,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

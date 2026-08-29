import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseUrl !== '' &&
  supabaseAnonKey !== ''
)

// Log mode on startup
if (!isConfigured) {
  console.info(
    '%c🧠 BrainBuddy running in DEMO MODE',
    'color: #0d9488; font-weight: bold; font-size: 14px;'
  )
  console.info(
    '%cAll data is stored locally in your browser.',
    'color: #64748b;'
  )
  console.info(
    '%cTo enable cloud sync, create a .env file with:',
    'color: #64748b;'
  )
  console.info(
    '%cVITE_SUPABASE_URL=your-project-url\nVITE_SUPABASE_ANON_KEY=your-anon-key',
    'color: #0d9488; font-family: monospace;'
  )
} else {
  console.info(
    '%c🧠 BrainBuddy connected to Supabase',
    'color: #0d9488; font-weight: bold; font-size: 14px;'
  )
}

// Create Supabase client
// When not configured, we create a client with placeholder values
// The app will detect demo mode and skip all remote operations
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return isConfigured
}

// Get demo mode status
export function isDemoMode(): boolean {
  return !isConfigured
}

// Helper to check online status with Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isConfigured) {
    return false
  }
  
  try {
    const { error } = await supabase.from('patients').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

// Get connection status for UI
export async function getConnectionStatus(): Promise<{
  isConfigured: boolean
  isConnected: boolean
  error?: string
}> {
  if (!isConfigured) {
    return {
      isConfigured: false,
      isConnected: false,
      error: 'Running in demo mode - no Supabase configured',
    }
  }

  try {
    const connected = await checkSupabaseConnection()
    return {
      isConfigured: true,
      isConnected: connected,
      error: connected ? undefined : 'Could not connect to Supabase',
    }
  } catch (error) {
    return {
      isConfigured: true,
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

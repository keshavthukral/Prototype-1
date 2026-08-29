import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Running in offline-only mode.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file for online features.'
  )
}

// Create Supabase client (will work without env vars for offline mode)
export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
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
  return Boolean(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co')
}

// Helper to check online status with Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }
  
  try {
    const { error } = await supabase.from('patients').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

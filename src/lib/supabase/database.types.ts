export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string
          user_id: string
          name: string
          preferred_language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          preferred_language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          preferred_language?: string
          created_at?: string
          updated_at?: string
        }
      }
      caregivers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          created_at?: string
        }
      }
      patient_caregiver: {
        Row: {
          id: string
          patient_id: string
          caregiver_id: string
          relationship: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          caregiver_id: string
          relationship?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          caregiver_id?: string
          relationship?: string | null
          created_at?: string
        }
      }
      game_results: {
        Row: {
          id: string
          patient_id: string
          game_type: string
          score: number
          accuracy: number
          response_time_ms: number
          hints_used: number
          difficulty_level: number
          completed_at: string
          synced: boolean
        }
        Insert: {
          id?: string
          patient_id: string
          game_type: string
          score: number
          accuracy: number
          response_time_ms: number
          hints_used?: number
          difficulty_level?: number
          completed_at?: string
          synced?: boolean
        }
        Update: {
          id?: string
          patient_id?: string
          game_type?: string
          score?: number
          accuracy?: number
          response_time_ms?: number
          hints_used?: number
          difficulty_level?: number
          completed_at?: string
          synced?: boolean
        }
      }
      reminders: {
        Row: {
          id: string
          patient_id: string
          caregiver_id: string | null
          title: string
          description: string | null
          reminder_type: string
          frequency: string | null
          time_of_day: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          caregiver_id?: string | null
          title: string
          description?: string | null
          reminder_type: string
          frequency?: string | null
          time_of_day?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          caregiver_id?: string | null
          title?: string
          description?: string | null
          reminder_type?: string
          frequency?: string | null
          time_of_day?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reminder_completions: {
        Row: {
          id: string
          reminder_id: string
          patient_id: string
          status: string
          completed_at: string
          synced: boolean
        }
        Insert: {
          id?: string
          reminder_id: string
          patient_id: string
          status: string
          completed_at?: string
          synced?: boolean
        }
        Update: {
          id?: string
          reminder_id?: string
          patient_id?: string
          status?: string
          completed_at?: string
          synced?: boolean
        }
      }
      memory_entries: {
        Row: {
          id: string
          patient_id: string
          caregiver_id: string | null
          name: string
          relationship: string | null
          description: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          caregiver_id?: string | null
          name: string
          relationship?: string | null
          description?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          caregiver_id?: string | null
          name?: string
          relationship?: string | null
          description?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          patient_id: string
          activity_type: string
          activity_data: Json
          created_at: string
          synced: boolean
        }
        Insert: {
          id?: string
          patient_id: string
          activity_type: string
          activity_data?: Json
          created_at?: string
          synced?: boolean
        }
        Update: {
          id?: string
          patient_id?: string
          activity_type?: string
          activity_data?: Json
          created_at?: string
          synced?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

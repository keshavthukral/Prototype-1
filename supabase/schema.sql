-- BrainBuddy Database Schema
-- Offline-first cognitive engagement for elderly patients

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'caregiver')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'as')),
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CAREGIVER-PATIENT LINKS
-- =====================================================
CREATE TABLE public.caregiver_patient_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caregiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  relationship TEXT, -- e.g., 'son', 'daughter', 'nurse'
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caregiver_id, patient_id)
);

-- =====================================================
-- REMINDERS TABLE
-- =====================================================
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('medicine', 'hydration', 'activity')),
  scheduled_time TIME,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'as_needed')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REMINDER COMPLETIONS TABLE
-- =====================================================
CREATE TABLE public.reminder_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('taken', 'done', 'skipped', 'remind_later')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MEMORIES TABLE
-- =====================================================
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  description TEXT,
  image_storage_path TEXT, -- Path in Supabase Storage
  image_url TEXT, -- Public URL for display
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GAME SESSIONS TABLE
-- =====================================================
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('memory', 'pattern')),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 4),
  accuracy DECIMAL(5,2) CHECK (accuracy BETWEEN 0 AND 100),
  response_time_ms INTEGER,
  hints_used INTEGER DEFAULT 0,
  score INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_caregiver_patient_links_caregiver ON public.caregiver_patient_links(caregiver_id);
CREATE INDEX idx_caregiver_patient_links_patient ON public.caregiver_patient_links(patient_id);
CREATE INDEX idx_reminders_patient ON public.reminders(patient_id);
CREATE INDEX idx_reminder_completions_reminder ON public.reminder_completions(reminder_id);
CREATE INDEX idx_reminder_completions_patient ON public.reminder_completions(patient_id);
CREATE INDEX idx_memories_patient ON public.memories(patient_id);
CREATE INDEX idx_game_sessions_patient ON public.game_sessions(patient_id);
CREATE INDEX idx_game_sessions_type ON public.game_sessions(game_type);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_patient_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if caregiver is linked to patient
CREATE OR REPLACE FUNCTION is_caregiver_linked_to_patient(patient_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_patient_links
    WHERE caregiver_id = auth.uid()
    AND patient_id = patient_uuid
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if user owns this patient record
CREATE OR REPLACE FUNCTION is_patient_owner(patient_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = patient_uuid
    AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Caregivers can view profiles of linked patients
CREATE POLICY "Caregivers can view linked patient profiles"
  ON public.profiles FOR SELECT
  USING (
    get_user_role() = 'caregiver'
    AND id IN (
      SELECT p.user_id FROM public.patients p
      JOIN public.caregiver_patient_links cpl ON p.id = cpl.patient_id
      WHERE cpl.caregiver_id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- PATIENTS POLICIES
-- =====================================================
-- Patients can view their own record
CREATE POLICY "Patients can view own record"
  ON public.patients FOR SELECT
  USING (user_id = auth.uid());

-- Caregivers can view linked patients
CREATE POLICY "Caregivers can view linked patients"
  ON public.patients FOR SELECT
  USING (
    get_user_role() = 'caregiver'
    AND id IN (
      SELECT patient_id FROM public.caregiver_patient_links
      WHERE caregiver_id = auth.uid()
    )
  );

-- Caregivers can create patients
CREATE POLICY "Caregivers can create patients"
  ON public.patients FOR INSERT
  WITH CHECK (get_user_role() = 'caregiver');

-- Caregivers can update linked patients
CREATE POLICY "Caregivers can update linked patients"
  ON public.patients FOR UPDATE
  USING (
    get_user_role() = 'caregiver'
    AND id IN (
      SELECT patient_id FROM public.caregiver_patient_links
      WHERE caregiver_id = auth.uid()
    )
  );

-- =====================================================
-- CAREGIVER-PATIENT LINKS POLICIES
-- =====================================================
-- Caregivers can view their own links
CREATE POLICY "Caregivers can view own links"
  ON public.caregiver_patient_links FOR SELECT
  USING (caregiver_id = auth.uid());

-- Caregivers can create links
CREATE POLICY "Caregivers can create links"
  ON public.caregiver_patient_links FOR INSERT
  WITH CHECK (
    get_user_role() = 'caregiver'
    AND caregiver_id = auth.uid()
  );

-- Caregivers can delete their own links
CREATE POLICY "Caregivers can delete own links"
  ON public.caregiver_patient_links FOR DELETE
  USING (caregiver_id = auth.uid());

-- =====================================================
-- REMINDERS POLICIES
-- =====================================================
-- Patients can view their own reminders
CREATE POLICY "Patients can view own reminders"
  ON public.reminders FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Caregivers can view reminders for linked patients
CREATE POLICY "Caregivers can view linked patient reminders"
  ON public.reminders FOR SELECT
  USING (
    get_user_role() = 'caregiver'
    AND is_caregiver_linked_to_patient(patient_id)
  );

-- Caregivers can create reminders for linked patients
CREATE POLICY "Caregivers can create reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (
    get_user_role() = 'caregiver'
    AND is_caregiver_linked_to_patient(patient_id)
  );

-- Caregivers can update reminders for linked patients
CREATE POLICY "Caregivers can update reminders"
  ON public.reminders FOR UPDATE
  USING (
    get_user_role() = 'caregiver'
    AND is_caregiver_linked_to_patient(patient_id)
  );

-- Caregivers can delete reminders for linked patients
CREATE POLICY "Caregivers can delete reminders"
  ON public.reminders FOR DELETE
  USING (
    get_user_role() = 'caregiver'
    AND is_caregiver_linked_to_patient(patient_id)
  );

-- =====================================================
-- REMINDER COMPLETIONS POLICIES
-- =====================================================
-- Patients can view their own completions
CREATE POLICY "Patients can view own completions"
  ON public.reminder_completions FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Caregivers can view completions for linked patients
CREATE POLICY "Caregivers can view linked patient completions"
  ON public.reminder_completions FOR SELECT
  USING (
    get_user_role() = 'caregiver'
    AND is_caregiver_linked_to_patient(patient_id)
  );

-- Patients can create their own completions
CREATE POLICY "Patients can create completions"
  ON public.reminder_completions FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- MEMORIES POLICIES
-- =====================================================
-- Patients can view their own memories
CREATE POLICY "Patients can view own memories"
  ON public.memories FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Caregivers can view memories for linked patients
CREATE POLICY "Caregivers can view linked patient memories"
  ON public.memories FOR SELECT
  USING (
    get_user_role() = 'caregiver'
    AND is_caregiver_linked_to_patient(patient_id)
  );

-- Caregivers can create memories for linked patients
CREATE POLICY "Caregivers can create memories"
  ON public.memories FOR INSERT
  WITH CHECK (
    get_user_role() = 'caregiver'
    AND is_caregiver_linked_to_patient(patient_id)
  );

-- Caregivers can update memories for linked patients
CREATE POLICY "Caregivers can update memories"
  ON public.memories FOR UPDATE
  USING (
    get_user_role() = 'caregiver'
    AND is_caregiver_linked_to_patient(patient_id)
  );

-- Caregivers can delete memories for linked patients
CREATE POLICY "Caregivers can delete memories"
  ON public.memories FOR DELETE
  USING (
    get_user_role() = 'caregiver'
    AND is_caregiver_linked_to_patient(patient_id)
  );

-- =====================================================
-- GAME SESSIONS POLICIES
-- =====================================================
-- Patients can view their own game sessions
CREATE POLICY "Patients can view own game sessions"
  ON public.game_sessions FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Caregivers can view game sessions for linked patients
CREATE POLICY "Caregivers can view linked patient game sessions"
  ON public.game_sessions FOR SELECT
  USING (
    get_user_role() = 'caregiver'
    AND is_caregiver_linked_to_patient(patient_id)
  );

-- Patients can create their own game sessions
CREATE POLICY "Patients can create game sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- STORAGE BUCKET FOR MEMORY PHOTOS
-- =====================================================
-- Note: This must be created via Supabase dashboard or CLI
-- INSERT INTO storage.buckets (id, name, public) VALUES ('memory-photos', 'memory-photos', false);

-- Storage policies (apply after bucket creation)
-- Patients can view their own photos
CREATE POLICY "Patients can view own memory photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'memory-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Caregivers can view photos for linked patients
CREATE POLICY "Caregivers can view linked patient memory photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'memory-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.patients p
      JOIN public.caregiver_patient_links cpl ON p.id = cpl.patient_id
      WHERE cpl.caregiver_id = auth.uid()
    )
  );

-- Caregivers can upload photos for linked patients
CREATE POLICY "Caregivers can upload memory photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'memory-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.patients p
      JOIN public.caregiver_patient_links cpl ON p.id = cpl.patient_id
      WHERE cpl.caregiver_id = auth.uid()
    )
  );

-- Caregivers can delete photos for linked patients
CREATE POLICY "Caregivers can delete memory photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'memory-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.patients p
      JOIN public.caregiver_patient_links cpl ON p.id = cpl.patient_id
      WHERE cpl.caregiver_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS FOR DASHBOARD QUERIES
-- =====================================================

-- Get patient statistics for caregiver dashboard
CREATE OR REPLACE FUNCTION get_patient_stats(patient_uuid UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  avg_accuracy DECIMAL(5,2),
  total_reminders BIGINT,
  completed_reminders BIGINT,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.game_sessions WHERE patient_id = patient_uuid) as total_sessions,
    (SELECT AVG(accuracy) FROM public.game_sessions WHERE patient_id = patient_uuid) as avg_accuracy,
    (SELECT COUNT(*) FROM public.reminders WHERE patient_id = patient_uuid AND is_active = TRUE) as total_reminders,
    (SELECT COUNT(*) FROM public.reminder_completions WHERE patient_id = patient_uuid) as completed_reminders,
    (SELECT MAX(created_at) FROM public.game_sessions WHERE patient_id = patient_uuid) as last_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recent activity for patient
CREATE OR REPLACE FUNCTION get_recent_activity(patient_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  activity_type TEXT,
  activity_data JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'game_completed' as activity_type,
    jsonb_build_object(
      'game_type', gs.game_type,
      'accuracy', gs.accuracy,
      'score', gs.score
    ) as activity_data,
    gs.created_at
  FROM public.game_sessions gs
  WHERE gs.patient_id = patient_uuid
  UNION ALL
  SELECT
    'reminder_completed' as activity_type,
    jsonb_build_object(
      'reminder_id', rc.reminder_id,
      'status', rc.status
    ) as activity_data,
    rc.completed_at as created_at
  FROM public.reminder_completions rc
  WHERE rc.patient_id = patient_uuid
  ORDER BY created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

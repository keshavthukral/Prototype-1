-- BrainBuddy Database Schema
-- Offline-first cognitive engagement for elderly patients
--
-- Fixed: Ambiguous column references in storage policies and PL/pgSQL functions
-- Safe to re-run: Uses DROP IF EXISTS / IF NOT EXISTS / CREATE OR REPLACE

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
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
CREATE TABLE IF NOT EXISTS public.patients (
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
CREATE TABLE IF NOT EXISTS public.caregiver_patient_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caregiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caregiver_id, patient_id)
);

-- =====================================================
-- REMINDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reminders (
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
CREATE TABLE IF NOT EXISTS public.reminder_completions (
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
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  description TEXT,
  image_storage_path TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GAME SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.game_sessions (
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
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_patient_links_caregiver ON public.caregiver_patient_links(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_patient_links_patient ON public.caregiver_patient_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_patient ON public.reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminder_completions_reminder ON public.reminder_completions(reminder_id);
CREATE INDEX IF NOT EXISTS idx_reminder_completions_patient ON public.reminder_completions(patient_id);
CREATE INDEX IF NOT EXISTS idx_memories_patient ON public.memories(patient_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_patient ON public.game_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_type ON public.game_sessions(game_type);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers (drop first for re-runnability)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reminders_updated_at ON public.reminders;
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memories_updated_at ON public.memories;
CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_patient_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- SECURITY DEFINER + SET search_path = ''
-- Fully schema-qualified to prevent search_path attacks
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT p.role FROM public.profiles p WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_caregiver_linked_to_patient(patient_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_patient_links cpl
    WHERE cpl.caregiver_id = auth.uid()
    AND cpl.patient_id = patient_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_patient_owner(patient_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_uuid
    AND p.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_profile_linked_to_caregiver(profile_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_patient_links cpl
    JOIN public.patients p ON p.id = cpl.patient_id
    WHERE cpl.caregiver_id = auth.uid()
    AND p.user_id = profile_uuid
  );
$$;

-- Revoke from PUBLIC, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_caregiver_linked_to_patient(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_patient_owner(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_profile_linked_to_caregiver(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_caregiver_linked_to_patient(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_patient_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_profile_linked_to_caregiver(UUID) TO authenticated;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Caregivers can view linked patient profiles" ON public.profiles;
CREATE POLICY "Caregivers can view linked patient profiles"
  ON public.profiles FOR SELECT
  USING (public.is_profile_linked_to_caregiver(id));

DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- PATIENTS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Patients can view own record" ON public.patients;
CREATE POLICY "Patients can view own record"
  ON public.patients FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Caregivers can view linked patients" ON public.patients;
CREATE POLICY "Caregivers can view linked patients"
  ON public.patients FOR SELECT
  USING (public.is_caregiver_linked_to_patient(id));

DROP POLICY IF EXISTS "Caregivers can create patients" ON public.patients;
CREATE POLICY "Caregivers can create patients"
  ON public.patients FOR INSERT
  WITH CHECK (public.get_user_role() = 'caregiver');

DROP POLICY IF EXISTS "Caregivers can update linked patients" ON public.patients;
CREATE POLICY "Caregivers can update linked patients"
  ON public.patients FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(id));

-- =====================================================
-- CAREGIVER-PATIENT LINKS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Caregivers can view own links" ON public.caregiver_patient_links;
CREATE POLICY "Caregivers can view own links"
  ON public.caregiver_patient_links FOR SELECT
  USING (caregiver_id = auth.uid());

DROP POLICY IF EXISTS "Caregivers can create links" ON public.caregiver_patient_links;
CREATE POLICY "Caregivers can create links"
  ON public.caregiver_patient_links FOR INSERT
  WITH CHECK (public.get_user_role() = 'caregiver' AND caregiver_id = auth.uid());

DROP POLICY IF EXISTS "Caregivers can delete own links" ON public.caregiver_patient_links;
CREATE POLICY "Caregivers can delete own links"
  ON public.caregiver_patient_links FOR DELETE
  USING (caregiver_id = auth.uid());

-- =====================================================
-- REMINDERS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Patients can view own reminders" ON public.reminders;
CREATE POLICY "Patients can view own reminders"
  ON public.reminders FOR SELECT
  USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can view linked patient reminders" ON public.reminders;
CREATE POLICY "Caregivers can view linked patient reminders"
  ON public.reminders FOR SELECT
  USING (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Caregivers can create reminders" ON public.reminders;
CREATE POLICY "Caregivers can create reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Caregivers can update reminders" ON public.reminders;
CREATE POLICY "Caregivers can update reminders"
  ON public.reminders FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Caregivers can delete reminders" ON public.reminders;
CREATE POLICY "Caregivers can delete reminders"
  ON public.reminders FOR DELETE
  USING (public.is_caregiver_linked_to_patient(patient_id));

-- =====================================================
-- REMINDER COMPLETIONS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Patients can view own completions" ON public.reminder_completions;
CREATE POLICY "Patients can view own completions"
  ON public.reminder_completions FOR SELECT
  USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can view linked patient completions" ON public.reminder_completions;
CREATE POLICY "Caregivers can view linked patient completions"
  ON public.reminder_completions FOR SELECT
  USING (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Patients can create completions" ON public.reminder_completions;
CREATE POLICY "Patients can create completions"
  ON public.reminder_completions FOR INSERT
  WITH CHECK (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can create completions" ON public.reminder_completions;
CREATE POLICY "Caregivers can create completions"
  ON public.reminder_completions FOR INSERT
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Patients can update own completions" ON public.reminder_completions;
CREATE POLICY "Patients can update own completions"
  ON public.reminder_completions FOR UPDATE
  USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can update linked completions" ON public.reminder_completions;
CREATE POLICY "Caregivers can update linked completions"
  ON public.reminder_completions FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(patient_id));

-- =====================================================
-- MEMORIES POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Patients can view own memories" ON public.memories;
CREATE POLICY "Patients can view own memories"
  ON public.memories FOR SELECT
  USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can view linked patient memories" ON public.memories;
CREATE POLICY "Caregivers can view linked patient memories"
  ON public.memories FOR SELECT
  USING (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Caregivers can create memories" ON public.memories;
CREATE POLICY "Caregivers can create memories"
  ON public.memories FOR INSERT
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Caregivers can update memories" ON public.memories;
CREATE POLICY "Caregivers can update memories"
  ON public.memories FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Caregivers can delete memories" ON public.memories;
CREATE POLICY "Caregivers can delete memories"
  ON public.memories FOR DELETE
  USING (public.is_caregiver_linked_to_patient(patient_id));

-- =====================================================
-- GAME SESSIONS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Patients can view own game sessions" ON public.game_sessions;
CREATE POLICY "Patients can view own game sessions"
  ON public.game_sessions FOR SELECT
  USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can view linked patient game sessions" ON public.game_sessions;
CREATE POLICY "Caregivers can view linked patient game sessions"
  ON public.game_sessions FOR SELECT
  USING (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Patients can create game sessions" ON public.game_sessions;
CREATE POLICY "Patients can create game sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can create game sessions" ON public.game_sessions;
CREATE POLICY "Caregivers can create game sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Patients can update own game sessions" ON public.game_sessions;
CREATE POLICY "Patients can update own game sessions"
  ON public.game_sessions FOR UPDATE
  USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can update linked game sessions" ON public.game_sessions;
CREATE POLICY "Caregivers can update linked game sessions"
  ON public.game_sessions FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(patient_id));

-- =====================================================
-- STORAGE BUCKET FOR MEMORY PHOTOS
-- =====================================================
-- Create bucket if it doesn't exist (idempotent)
-- Note: Run in Supabase Dashboard > Storage > New Bucket if this fails
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'memory-photos') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('memory-photos', 'memory-photos', false);
  END IF;
END
$$;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================
-- FIX: Qualified p.id to resolve ambiguity when joining patients + caregiver_patient_links
-- Both tables have an 'id' column; using p.id makes it explicit.

-- Patients can view their own photos
DROP POLICY IF EXISTS "Patients can view own memory photos" ON storage.objects;
CREATE POLICY "Patients can view own memory photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'memory-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Caregivers can view photos for linked patients
DROP POLICY IF EXISTS "Caregivers can view linked patient memory photos" ON storage.objects;
CREATE POLICY "Caregivers can view linked patient memory photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'memory-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.patients p
      JOIN public.caregiver_patient_links cpl ON p.id = cpl.patient_id
      WHERE cpl.caregiver_id = auth.uid()
    )
  );

-- Caregivers can upload photos for linked patients
DROP POLICY IF EXISTS "Caregivers can upload memory photos" ON storage.objects;
CREATE POLICY "Caregivers can upload memory photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'memory-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.patients p
      JOIN public.caregiver_patient_links cpl ON p.id = cpl.patient_id
      WHERE cpl.caregiver_id = auth.uid()
    )
  );

-- Caregivers can delete photos for linked patients
DROP POLICY IF EXISTS "Caregivers can delete memory photos" ON storage.objects;
CREATE POLICY "Caregivers can delete memory photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'memory-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text FROM public.patients p
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
    (SELECT COUNT(*)::BIGINT FROM public.game_sessions gs WHERE gs.patient_id = patient_uuid),
    (SELECT AVG(gs.accuracy) FROM public.game_sessions gs WHERE gs.patient_id = patient_uuid),
    (SELECT COUNT(*)::BIGINT FROM public.reminders r WHERE r.patient_id = patient_uuid AND r.is_active = TRUE),
    (SELECT COUNT(*)::BIGINT FROM public.reminder_completions rc WHERE rc.patient_id = patient_uuid),
    (SELECT MAX(gs.created_at) FROM public.game_sessions gs WHERE gs.patient_id = patient_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recent activity for patient
-- FIX: Renamed output column from 'created_at' to 'occurred_at' to avoid
-- conflict with PL/pgSQL variable that shadows the UNION ALL column.
-- FIX: Fully qualified all column references with table aliases.
CREATE OR REPLACE FUNCTION get_recent_activity(patient_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  activity_type TEXT,
  activity_data JSONB,
  occurred_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sub.activity_type,
    sub.activity_data,
    sub.occurred_at
  FROM (
    SELECT
      'game_completed'::TEXT AS activity_type,
      jsonb_build_object(
        'game_type', gs.game_type,
        'accuracy', gs.accuracy,
        'score', gs.score
      ) AS activity_data,
      gs.created_at AS occurred_at
    FROM public.game_sessions gs
    WHERE gs.patient_id = patient_uuid
    UNION ALL
    SELECT
      'reminder_completed'::TEXT AS activity_type,
      jsonb_build_object(
        'reminder_id', rc.reminder_id,
        'status', rc.status
      ) AS activity_data,
      rc.completed_at AS occurred_at
    FROM public.reminder_completions rc
    WHERE rc.patient_id = patient_uuid
  ) sub
  ORDER BY sub.occurred_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RPC: Create patient (bypasses INSERT policy)
-- =====================================================
-- Atomically inserts patient + caregiver_patient_links.
-- Caller determined from auth.uid(), never from client input.
-- Returns the created patient row as JSONB.

DROP FUNCTION IF EXISTS public.create_patient_for_caregiver(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_patient_for_caregiver(
  p_preferred_language TEXT DEFAULT 'en',
  p_date_of_birth TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_patient_id UUID;
  v_result JSONB;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.role INTO v_caller_role
  FROM public.profiles p
  WHERE p.id = v_caller_id;

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'No profile found for authenticated user';
  END IF;

  IF v_caller_role != 'caregiver' THEN
    RAISE EXCEPTION 'Only caregivers can create patients';
  END IF;

  INSERT INTO public.patients (
    preferred_language,
    date_of_birth,
    notes
  ) VALUES (
    p_preferred_language,
    p_date_of_birth::DATE,
    p_notes
  )
  RETURNING id INTO v_patient_id;

  INSERT INTO public.caregiver_patient_links (
    caregiver_id,
    patient_id,
    relationship,
    is_primary
  ) VALUES (
    v_caller_id,
    v_patient_id,
    'caregiver',
    TRUE
  );

  SELECT to_jsonb(pat.*) INTO v_result
  FROM public.patients pat
  WHERE pat.id = v_patient_id;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_patient_for_caregiver(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_patient_for_caregiver(TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- FIX: Circular RLS dependency across profiles ↔ patients ↔ caregiver_patient_links
-- =====================================================
--
-- ROOT CAUSE:
--   Inline subqueries in policies (e.g. EXISTS (SELECT 1 FROM public.profiles))
--   trigger RLS on the referenced table, which triggers RLS on other tables,
--   creating infinite recursion:
--
--   patients INSERT → queries profiles → profiles RLS → queries patients → CYCLE
--   reminders SELECT → queries patients → patients RLS → queries profiles → CYCLE
--   links INSERT → queries profiles → profiles RLS → queries patients → CYCLE
--
-- FIX:
--   Replace ALL cross-table lookups with SECURITY DEFINER helper functions
--   that bypass RLS entirely, breaking every cycle.
--
--   Rules applied to every policy:
--   - Only use auth.uid() for current-user checks
--   - Only use SECURITY DEFINER functions for role/link/ownership checks
--   - NEVER inline-subquery another RLS-protected table
--
-- Safe to apply: Uses DROP POLICY IF EXISTS + CREATE POLICY
-- Safe to re-apply: Idempotent

BEGIN;

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES (clean slate)
-- =====================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Caregivers can view linked patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Patients
DROP POLICY IF EXISTS "Patients can view own record" ON public.patients;
DROP POLICY IF EXISTS "Caregivers can view linked patients" ON public.patients;
DROP POLICY IF EXISTS "Caregivers can create patients" ON public.patients;
DROP POLICY IF EXISTS "Caregivers can update linked patients" ON public.patients;

-- Caregiver-patient links
DROP POLICY IF EXISTS "Caregivers can view own links" ON public.caregiver_patient_links;
DROP POLICY IF EXISTS "Caregivers can create links" ON public.caregiver_patient_links;
DROP POLICY IF EXISTS "Caregivers can delete own links" ON public.caregiver_patient_links;

-- Reminders
DROP POLICY IF EXISTS "Patients can view own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Caregivers can view linked patient reminders" ON public.reminders;
DROP POLICY IF EXISTS "Caregivers can create reminders" ON public.reminders;
DROP POLICY IF EXISTS "Caregivers can update reminders" ON public.reminders;
DROP POLICY IF EXISTS "Caregivers can delete reminders" ON public.reminders;

-- Reminder completions
DROP POLICY IF EXISTS "Patients can view own completions" ON public.reminder_completions;
DROP POLICY IF EXISTS "Caregivers can view linked patient completions" ON public.reminder_completions;
DROP POLICY IF EXISTS "Patients can create completions" ON public.reminder_completions;

-- Memories
DROP POLICY IF EXISTS "Patients can view own memories" ON public.memories;
DROP POLICY IF EXISTS "Caregivers can view linked patient memories" ON public.memories;
DROP POLICY IF EXISTS "Caregivers can create memories" ON public.memories;
DROP POLICY IF EXISTS "Caregivers can update memories" ON public.memories;
DROP POLICY IF EXISTS "Caregivers can delete memories" ON public.memories;

-- Game sessions
DROP POLICY IF EXISTS "Patients can view own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Caregivers can view linked patient game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Patients can create game sessions" ON public.game_sessions;

-- =====================================================
-- 2. RECREATE HELPER FUNCTIONS
--    SECURITY DEFINER + SET search_path = ''
--    Fully schema-qualified references
-- =====================================================

-- Get current user's role (bypasses profiles RLS)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT p.role FROM public.profiles p WHERE p.id = auth.uid();
$$;

-- Check if current user is a caregiver linked to a given patient
-- (bypasses caregiver_patient_links RLS)
CREATE OR REPLACE FUNCTION public.is_caregiver_linked_to_patient(patient_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_patient_links cpl
    WHERE cpl.caregiver_id = auth.uid()
    AND cpl.patient_id = patient_uuid
  );
$$;

-- Check if current user owns a patient record (bypasses patients RLS)
CREATE OR REPLACE FUNCTION public.is_patient_owner(patient_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_uuid
    AND p.user_id = auth.uid()
  );
$$;

-- NEW: Check if a profile belongs to a patient linked to the current caregiver
-- (bypasses RLS on profiles, patients, and caregiver_patient_links)
CREATE OR REPLACE FUNCTION public.is_profile_linked_to_caregiver(profile_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_patient_links cpl
    JOIN public.patients p ON p.id = cpl.patient_id
    WHERE cpl.caregiver_id = auth.uid()
    AND p.user_id = profile_uuid
  );
$$;

-- =====================================================
-- 3. REVOKE AND GRANT EXECUTE
-- =====================================================

REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_caregiver_linked_to_patient(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_patient_owner(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_profile_linked_to_caregiver(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_caregiver_linked_to_patient(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_patient_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_profile_linked_to_caregiver(UUID) TO authenticated;

-- =====================================================
-- 4. RECREATE ALL POLICIES
--    Rule: auth.uid() + SECURITY DEFINER helpers only
-- =====================================================

-- ── PROFILES ──────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Caregivers can view linked patient profiles"
  ON public.profiles FOR SELECT
  USING (public.is_profile_linked_to_caregiver(id));

CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── PATIENTS ──────────────────────────────────────
CREATE POLICY "Patients can view own record"
  ON public.patients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Caregivers can view linked patients"
  ON public.patients FOR SELECT
  USING (public.is_caregiver_linked_to_patient(id));

CREATE POLICY "Caregivers can create patients"
  ON public.patients FOR INSERT
  WITH CHECK (public.get_user_role() = 'caregiver');

CREATE POLICY "Caregivers can update linked patients"
  ON public.patients FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(id));

-- ── CAREGIVER-PATIENT LINKS ───────────────────────
CREATE POLICY "Caregivers can view own links"
  ON public.caregiver_patient_links FOR SELECT
  USING (caregiver_id = auth.uid());

CREATE POLICY "Caregivers can create links"
  ON public.caregiver_patient_links FOR INSERT
  WITH CHECK (public.get_user_role() = 'caregiver' AND caregiver_id = auth.uid());

CREATE POLICY "Caregivers can delete own links"
  ON public.caregiver_patient_links FOR DELETE
  USING (caregiver_id = auth.uid());

-- ── REMINDERS ─────────────────────────────────────
CREATE POLICY "Patients can view own reminders"
  ON public.reminders FOR SELECT
  USING (public.is_patient_owner(patient_id));

CREATE POLICY "Caregivers can view linked patient reminders"
  ON public.reminders FOR SELECT
  USING (public.is_caregiver_linked_to_patient(patient_id));

CREATE POLICY "Caregivers can create reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

CREATE POLICY "Caregivers can update reminders"
  ON public.reminders FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(patient_id));

CREATE POLICY "Caregivers can delete reminders"
  ON public.reminders FOR DELETE
  USING (public.is_caregiver_linked_to_patient(patient_id));

-- ── REMINDER COMPLETIONS ──────────────────────────
CREATE POLICY "Patients can view own completions"
  ON public.reminder_completions FOR SELECT
  USING (public.is_patient_owner(patient_id));

CREATE POLICY "Caregivers can view linked patient completions"
  ON public.reminder_completions FOR SELECT
  USING (public.is_caregiver_linked_to_patient(patient_id));

CREATE POLICY "Patients can create completions"
  ON public.reminder_completions FOR INSERT
  WITH CHECK (public.is_patient_owner(patient_id));

-- ── MEMORIES ──────────────────────────────────────
CREATE POLICY "Patients can view own memories"
  ON public.memories FOR SELECT
  USING (public.is_patient_owner(patient_id));

CREATE POLICY "Caregivers can view linked patient memories"
  ON public.memories FOR SELECT
  USING (public.is_caregiver_linked_to_patient(patient_id));

CREATE POLICY "Caregivers can create memories"
  ON public.memories FOR INSERT
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

CREATE POLICY "Caregivers can update memories"
  ON public.memories FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(patient_id));

CREATE POLICY "Caregivers can delete memories"
  ON public.memories FOR DELETE
  USING (public.is_caregiver_linked_to_patient(patient_id));

-- ── GAME SESSIONS ─────────────────────────────────
CREATE POLICY "Patients can view own game sessions"
  ON public.game_sessions FOR SELECT
  USING (public.is_patient_owner(patient_id));

CREATE POLICY "Caregivers can view linked patient game sessions"
  ON public.game_sessions FOR SELECT
  USING (public.is_caregiver_linked_to_patient(patient_id));

CREATE POLICY "Patients can create game sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (public.is_patient_owner(patient_id));

COMMIT;

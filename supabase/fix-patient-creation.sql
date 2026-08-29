-- =====================================================
-- FIX: Patient creation via RPC (bypasses INSERT policy recursion)
-- =====================================================
--
-- WHY: The patients INSERT policy "Caregivers can create patients"
--   WITH CHECK (public.get_user_role() = 'caregiver')
-- failed because PostgreSQL could not resolve auth.uid() inside
-- SECURITY DEFINER functions when called from WITH CHECK context.
-- This was caused by SET search_path = '' (removed in fix-rls-recursion-v2.sql).
-- Even without SET search_path, the WITH CHECK evaluation context
-- prevents security-definer functions from seeing the JWT claims.
--
-- SOLUTION: Move patient creation into a SECURITY DEFINER RPC function.
-- The function:
--   1. Reads the caller from auth.uid() (available in RPC context)
--   2. Verifies the caller has role 'caregiver' in public.profiles
--   3. Inserts the patient row
--   4. Inserts the caregiver_patient_links row (atomic)
--   5. Returns the created patient
--   6. Never accepts caregiver_id from the client
--
-- Safe to apply. Idempotent. Does not modify existing policies.

BEGIN;

-- =====================================================
-- 1. DROP OLD FUNCTION (if exists from prior attempts)
-- =====================================================
DROP FUNCTION IF EXISTS public.create_patient_for_caregiver(
  TEXT, TEXT, TEXT
);

-- =====================================================
-- 2. CREATE THE RPC
-- =====================================================
-- Parameters:
--   p_preferred_language  TEXT  (default 'en')
--   p_date_of_birth       TEXT  (nullable, ISO date string)
--   p_notes               TEXT  (nullable)
--
-- Returns: the newly created patient row as JSONB

CREATE OR REPLACE FUNCTION public.create_patient_for_caregiver(
  p_preferred_language TEXT DEFAULT 'en',
  p_date_of_birth TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
-- No SET search_path: we use fully-qualified names only
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_patient_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Determine the caller from auth.uid() (never from client input)
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify the caller is a caregiver
  SELECT p.role INTO v_caller_role
  FROM public.profiles p
  WHERE p.id = v_caller_id;

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'No profile found for authenticated user';
  END IF;

  IF v_caller_role != 'caregiver' THEN
    RAISE EXCEPTION 'Only caregivers can create patients';
  END IF;

  -- 3. Insert the patient (caller_id is the caregiver, NOT the patient owner)
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

  -- 4. Link the caregiver to the new patient
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

  -- 5. Return the created patient as JSONB
  SELECT to_jsonb(pat.*) INTO v_result
  FROM public.patients pat
  WHERE pat.id = v_patient_id;

  RETURN v_result;
END;
$$;

-- =====================================================
-- 3. REVOKE / GRANT EXECUTE
-- =====================================================
REVOKE EXECUTE ON FUNCTION public.create_patient_for_caregiver(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_patient_for_caregiver(TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 4. FIX: Add caregiver INSERT policy for reminder_completions
-- =====================================================
-- The existing INSERT policy only allows patients (is_patient_owner).
-- Caregivers who are linked to a patient should also be able to
-- record completions on behalf of the patient.

DROP POLICY IF EXISTS "Caregivers can create completions" ON public.reminder_completions;
CREATE POLICY "Caregivers can create completions"
  ON public.reminder_completions FOR INSERT
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

-- =====================================================
-- 5. FIX: Add caregiver INSERT policy for game_sessions
-- =====================================================

DROP POLICY IF EXISTS "Caregivers can create game sessions" ON public.game_sessions;
CREATE POLICY "Caregivers can create game sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

-- =====================================================
-- 6. FIX: Add UPDATE policies for reminder_completions + game_sessions
-- =====================================================

DROP POLICY IF EXISTS "Patients can update own completions" ON public.reminder_completions;
CREATE POLICY "Patients can update own completions"
  ON public.reminder_completions FOR UPDATE
  USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can update linked completions" ON public.reminder_completions;
CREATE POLICY "Caregivers can update linked completions"
  ON public.reminder_completions FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Patients can update own game sessions" ON public.game_sessions;
CREATE POLICY "Patients can update own game sessions"
  ON public.game_sessions FOR UPDATE
  USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can update linked game sessions" ON public.game_sessions;
CREATE POLICY "Caregivers can update linked game sessions"
  ON public.game_sessions FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(patient_id));

COMMIT;

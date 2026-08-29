-- Self-reported daily well-being check-ins.
-- Additive migration: no diagnostic score and no free-form health details.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.well_being_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reported_mood TEXT NOT NULL CHECK (reported_mood IN ('very_good', 'good', 'okay', 'not_so_good')),
  reported_energy TEXT NOT NULL CHECK (reported_energy IN ('good', 'okay', 'low')),
  requested_contact BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_well_being_check_ins_patient_reported
  ON public.well_being_check_ins (patient_id, reported_at DESC);

ALTER TABLE public.well_being_check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can view own well-being check-ins" ON public.well_being_check_ins;
CREATE POLICY "Patients can view own well-being check-ins" ON public.well_being_check_ins
  FOR SELECT USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Patients can create own well-being check-ins" ON public.well_being_check_ins;
CREATE POLICY "Patients can create own well-being check-ins" ON public.well_being_check_ins
  FOR INSERT WITH CHECK (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can view linked well-being check-ins" ON public.well_being_check_ins;
CREATE POLICY "Caregivers can view linked well-being check-ins" ON public.well_being_check_ins
  FOR SELECT USING (public.is_linked_caregiver(patient_id));

GRANT SELECT, INSERT ON public.well_being_check_ins TO authenticated;

COMMENT ON TABLE public.well_being_check_ins IS
  'Self-reported well-being answers. These records are not a diagnosis or medical score.';

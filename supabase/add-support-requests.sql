-- Quick-access caregiver contact requests.
-- These are high-priority support notifications, not automatic medical emergencies.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'contact_me' CHECK (request_type = 'contact_me'),
  priority TEXT NOT NULL DEFAULT 'high' CHECK (priority = 'high'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status = 'pending' AND acknowledged_at IS NULL) OR status = 'acknowledged')
);

CREATE INDEX IF NOT EXISTS idx_support_requests_patient_requested
  ON public.support_requests (patient_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_pending
  ON public.support_requests (patient_id, requested_at DESC) WHERE status = 'pending';

DROP TRIGGER IF EXISTS update_support_requests_updated_at ON public.support_requests;
CREATE TRIGGER update_support_requests_updated_at BEFORE UPDATE ON public.support_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can create own support requests" ON public.support_requests;
CREATE POLICY "Patients can create own support requests" ON public.support_requests
  FOR INSERT WITH CHECK (public.is_patient_owner(patient_id));
DROP POLICY IF EXISTS "Patients can view own support requests" ON public.support_requests;
CREATE POLICY "Patients can view own support requests" ON public.support_requests
  FOR SELECT USING (public.is_patient_owner(patient_id));
DROP POLICY IF EXISTS "Caregivers can view linked support requests" ON public.support_requests;
CREATE POLICY "Caregivers can view linked support requests" ON public.support_requests
  FOR SELECT USING (public.is_caregiver_linked_to_patient(patient_id));
DROP POLICY IF EXISTS "Caregivers can acknowledge linked support requests" ON public.support_requests;
CREATE POLICY "Caregivers can acknowledge linked support requests" ON public.support_requests
  FOR UPDATE USING (public.is_caregiver_linked_to_patient(patient_id))
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

GRANT SELECT, INSERT, UPDATE ON public.support_requests TO authenticated;

COMMENT ON TABLE public.support_requests IS
  'Patient requests for caregiver contact. High-priority support does not imply a medical emergency.';

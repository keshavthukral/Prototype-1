-- Daily activity performance reports and caregiver trend alerts
--
-- This migration is additive. It does not alter game_sessions or any existing
-- production table. Reports compare a patient only with their own history and
-- must not be interpreted as diagnosis, severity, or disease progression.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DAILY REPORTS
-- One locally reproducible aggregate per patient and calendar date.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,

  memory_sessions_completed INTEGER NOT NULL DEFAULT 0 CHECK (memory_sessions_completed >= 0),
  memory_accuracy DECIMAL(5,2) CHECK (memory_accuracy BETWEEN 0 AND 100),
  memory_avg_response_time_ms INTEGER CHECK (memory_avg_response_time_ms >= 0),
  memory_hints INTEGER NOT NULL DEFAULT 0 CHECK (memory_hints >= 0),
  memory_false_selections INTEGER NOT NULL DEFAULT 0 CHECK (memory_false_selections >= 0),
  memory_omissions INTEGER NOT NULL DEFAULT 0 CHECK (memory_omissions >= 0),

  pattern_sessions_completed INTEGER NOT NULL DEFAULT 0 CHECK (pattern_sessions_completed >= 0),
  pattern_questions_completed INTEGER NOT NULL DEFAULT 0 CHECK (pattern_questions_completed >= 0),
  pattern_accuracy DECIMAL(5,2) CHECK (pattern_accuracy BETWEEN 0 AND 100),
  pattern_avg_response_time_ms INTEGER CHECK (pattern_avg_response_time_ms >= 0),
  pattern_hints INTEGER NOT NULL DEFAULT 0 CHECK (pattern_hints >= 0),

  activities_completed INTEGER NOT NULL DEFAULT 0 CHECK (activities_completed >= 0),
  activities_expected INTEGER NOT NULL DEFAULT 2 CHECK (activities_expected >= 0),
  reminders_completed INTEGER NOT NULL DEFAULT 0 CHECK (reminders_completed >= 0),
  reminders_postponed INTEGER NOT NULL DEFAULT 0 CHECK (reminders_postponed >= 0),
  reminders_total INTEGER NOT NULL DEFAULT 0 CHECK (reminders_total >= 0),
  daily_check_in_completed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Latest local event included in this aggregate. Used for deterministic,
  -- idempotent regeneration when offline events later sync.
  source_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (patient_id, report_date),
  CHECK (activities_completed <= activities_expected)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_patient_date
  ON public.daily_reports (patient_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date
  ON public.daily_reports (report_date DESC);

-- =====================================================
-- CAREGIVER ALERTS
-- Deterministic, non-medical changes relative to personal baseline only.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.caregiver_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  daily_report_id UUID REFERENCES public.daily_reports(id) ON DELETE SET NULL,
  alert_date DATE NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('information', 'attention')),
  category TEXT NOT NULL CHECK (
    category IN ('activity_performance', 'engagement', 'response_patterns')
  ),
  rule_key TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Stores the deterministic inputs used by the rule, such as today's values,
  -- seven-day personal baseline values, and triggered indicator names.
  indicators JSONB NOT NULL DEFAULT '{}'::JSONB,
  baseline_start_date DATE,
  baseline_end_date DATE,
  consecutive_periods INTEGER NOT NULL DEFAULT 1 CHECK (consecutive_periods >= 1),

  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (patient_id, alert_date, rule_key),
  CHECK (
    (dismissed_at IS NULL AND dismissed_by IS NULL)
    OR dismissed_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_caregiver_alerts_patient_date
  ON public.caregiver_alerts (patient_id, alert_date DESC);

CREATE INDEX IF NOT EXISTS idx_caregiver_alerts_active
  ON public.caregiver_alerts (patient_id, created_at DESC)
  WHERE dismissed_at IS NULL;

-- Reuse the existing schema trigger function without changing it.
DROP TRIGGER IF EXISTS update_daily_reports_updated_at ON public.daily_reports;
CREATE TRIGGER update_daily_reports_updated_at
  BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_caregiver_alerts_updated_at ON public.caregiver_alerts;
CREATE TRIGGER update_caregiver_alerts_updated_at
  BEFORE UPDATE ON public.caregiver_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- Uses the existing non-recursive ownership/link helper functions.
-- =====================================================

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can view own daily reports" ON public.daily_reports;
CREATE POLICY "Patients can view own daily reports"
  ON public.daily_reports FOR SELECT
  USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Patients can create own daily reports" ON public.daily_reports;
CREATE POLICY "Patients can create own daily reports"
  ON public.daily_reports FOR INSERT
  WITH CHECK (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Patients can update own daily reports" ON public.daily_reports;
CREATE POLICY "Patients can update own daily reports"
  ON public.daily_reports FOR UPDATE
  USING (public.is_patient_owner(patient_id))
  WITH CHECK (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can view linked daily reports" ON public.daily_reports;
CREATE POLICY "Caregivers can view linked daily reports"
  ON public.daily_reports FOR SELECT
  USING (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Caregivers can create linked daily reports" ON public.daily_reports;
CREATE POLICY "Caregivers can create linked daily reports"
  ON public.daily_reports FOR INSERT
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Caregivers can update linked daily reports" ON public.daily_reports;
CREATE POLICY "Caregivers can update linked daily reports"
  ON public.daily_reports FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(patient_id))
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

-- Patients may create/update their own deterministic alert records so offline
-- generation can sync. Patient-facing UI must not display these alerts.
DROP POLICY IF EXISTS "Patients can view own caregiver alerts" ON public.caregiver_alerts;
CREATE POLICY "Patients can view own caregiver alerts"
  ON public.caregiver_alerts FOR SELECT
  USING (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Patients can create own caregiver alerts" ON public.caregiver_alerts;
CREATE POLICY "Patients can create own caregiver alerts"
  ON public.caregiver_alerts FOR INSERT
  WITH CHECK (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Patients can update own caregiver alerts" ON public.caregiver_alerts;
CREATE POLICY "Patients can update own caregiver alerts"
  ON public.caregiver_alerts FOR UPDATE
  USING (public.is_patient_owner(patient_id))
  WITH CHECK (public.is_patient_owner(patient_id));

DROP POLICY IF EXISTS "Caregivers can view linked caregiver alerts" ON public.caregiver_alerts;
CREATE POLICY "Caregivers can view linked caregiver alerts"
  ON public.caregiver_alerts FOR SELECT
  USING (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Caregivers can create linked caregiver alerts" ON public.caregiver_alerts;
CREATE POLICY "Caregivers can create linked caregiver alerts"
  ON public.caregiver_alerts FOR INSERT
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

DROP POLICY IF EXISTS "Caregivers can dismiss linked caregiver alerts" ON public.caregiver_alerts;
CREATE POLICY "Caregivers can dismiss linked caregiver alerts"
  ON public.caregiver_alerts FOR UPDATE
  USING (public.is_caregiver_linked_to_patient(patient_id))
  WITH CHECK (public.is_caregiver_linked_to_patient(patient_id));

GRANT SELECT, INSERT, UPDATE ON public.daily_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.caregiver_alerts TO authenticated;

COMMENT ON TABLE public.daily_reports IS
  'Daily activity-performance and engagement aggregates. Non-diagnostic; compare only with the same patient recent history.';

COMMENT ON TABLE public.caregiver_alerts IS
  'Rule-based observations about activity performance, engagement, or response patterns relative to a personal baseline. Not medical alerts.';

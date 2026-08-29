-- Additive reminder scheduling migration. Apply after the base schema.
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS specific_days SMALLINT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;

ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_reminder_type_check;
ALTER TABLE public.reminders ADD CONSTRAINT reminders_reminder_type_check
  CHECK (reminder_type IN ('medicine', 'hydration', 'meal', 'walk', 'family_call', 'daily_activity'));

ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_frequency_check;
ALTER TABLE public.reminders ADD CONSTRAINT reminders_frequency_check
  CHECK (frequency IN ('once', 'daily', 'specific_days'));

ALTER TABLE public.reminders ADD CONSTRAINT reminders_specific_days_check
  CHECK (specific_days <@ ARRAY[0,1,2,3,4,5,6]::SMALLINT[]);

CREATE INDEX IF NOT EXISTS idx_reminders_snoozed_until
  ON public.reminders (patient_id, snoozed_until)
  WHERE is_active = TRUE;

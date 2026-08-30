/** Compatibility barrel for the existing demo seed and auth architecture. */
export { DEMO_PATIENT, DEMO_CAREGIVER, DEMO_PATIENT_ID, DEMO_CAREGIVER_ID } from '@/data/demo/patient'
export { DEMO_REMINDERS, DEMO_REMINDER_COMPLETIONS } from '@/data/demo/reminders'
export { DEMO_MEMORIES } from '@/data/demo/memories'
export { DEMO_GAME_SESSIONS } from '@/data/demo/sessions'

export const DEMO_SETTINGS = [
  { key: 'app-mode', value: 'demo' },
  { key: 'demo-seeded', value: 'true' },
  { key: 'demo-seed-version', value: '4' },
  { key: 'demo-patient-id', value: 'demo-patient-anita-devi' },
  { key: 'demo-caregiver-id', value: 'demo-caregiver-rahul' },
]

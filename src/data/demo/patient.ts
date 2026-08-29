export const DEMO_PATIENT_ID = 'demo-patient-anita-devi'
export const DEMO_CAREGIVER_ID = 'demo-caregiver-rahul'

export const DEMO_PATIENT = {
  id: DEMO_PATIENT_ID,
  name: 'Anita Devi',
  firstName: 'Anita',
  age: 72,
  preferredLanguage: 'en' as const,
  createdAt: new Date('2026-07-15'),
  updatedAt: new Date('2026-08-29'),
}

export const DEMO_CAREGIVER = {
  id: DEMO_CAREGIVER_ID,
  name: 'Rahul Sharma',
  relationship: 'Son',
  email: 'rahul@example.com',
}

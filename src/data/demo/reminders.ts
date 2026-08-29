import { DEMO_CAREGIVER_ID, DEMO_PATIENT_ID } from './patient'

const shared = {
  patientId: DEMO_PATIENT_ID,
  createdBy: DEMO_CAREGIVER_ID,
  frequency: 'daily' as const,
  isActive: true,
  createdAt: new Date('2026-08-29'),
  updatedAt: new Date('2026-08-29'),
  synced: true,
}

export const DEMO_REMINDERS = [
  { ...shared, id: 'demo-v2-r1', title: 'Morning Medicine', reminderType: 'medicine' as const, scheduledTime: '08:00' },
  { ...shared, id: 'demo-v2-r2', title: 'Drink Water', reminderType: 'hydration' as const, scheduledTime: '10:30' },
  { ...shared, id: 'demo-v2-r3', title: 'Lunch', reminderType: 'meal' as const, scheduledTime: '13:00' },
  { ...shared, id: 'demo-v2-r4', title: 'Evening Walk', reminderType: 'walk' as const, scheduledTime: '17:00' },
  { ...shared, id: 'demo-v2-r5', title: 'Evening Medicine', reminderType: 'medicine' as const, scheduledTime: '20:00' },
]

export const DEMO_REMINDER_COMPLETIONS = []

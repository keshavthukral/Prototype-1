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
  { ...shared, id: 'demo-v2-r1', title: 'Morning Medicine', titleAs: 'ৰাতিপুৱাৰ ঔষধ', reminderType: 'medicine' as const, scheduledTime: '08:00' },
  { ...shared, id: 'demo-v2-r2', title: 'Drink Water', titleAs: 'পানী খাওক', reminderType: 'hydration' as const, scheduledTime: '10:30' },
  { ...shared, id: 'demo-v2-r3', title: 'Lunch', titleAs: 'দুপৰীয়াৰ আহাৰ', reminderType: 'meal' as const, scheduledTime: '13:00' },
  { ...shared, id: 'demo-v3-r4', title: 'Family Call', titleAs: 'পৰিয়াললৈ ফোন', reminderType: 'family_call' as const, scheduledTime: '15:00' },
  { ...shared, id: 'demo-v2-r4', title: 'Evening Walk', titleAs: 'সন্ধিয়াৰ খোজ', reminderType: 'walk' as const, scheduledTime: '17:00' },
  { ...shared, id: 'demo-v2-r5', title: 'Evening Medicine', titleAs: 'সন্ধিয়াৰ ঔষধ', reminderType: 'medicine' as const, scheduledTime: '20:00' },
]

export const DEMO_REMINDER_COMPLETIONS = []

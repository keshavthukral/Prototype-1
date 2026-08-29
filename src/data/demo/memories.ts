import rahulPortrait from '@/assets/demo/rahul.svg'
import meeraPortrait from '@/assets/demo/meera.svg'
import riyaPortrait from '@/assets/demo/riya.svg'
import familyHome from '@/assets/demo/family-home.svg'
import garden from '@/assets/demo/garden.svg'
import { DEMO_CAREGIVER_ID, DEMO_PATIENT_ID } from './patient'

const shared = {
  patientId: DEMO_PATIENT_ID,
  createdBy: DEMO_CAREGIVER_ID,
  imageStoragePath: undefined,
  createdAt: new Date('2026-08-29'),
  updatedAt: new Date('2026-08-29'),
  synced: true,
}

export const DEMO_MEMORIES = [
  { ...shared, id: 'demo-v2-m1', name: 'Rahul', relationship: 'Son', description: 'Rahul visits every Sunday.', imageUrl: rahulPortrait },
  { ...shared, id: 'demo-v2-m2', name: 'Meera', relationship: 'Daughter', description: 'You enjoy having tea together.', imageUrl: meeraPortrait },
  { ...shared, id: 'demo-v2-m3', name: 'Riya', relationship: 'Granddaughter', description: 'Riya loves listening to your stories.', imageUrl: riyaPortrait },
  { ...shared, id: 'demo-v2-m4', name: 'Family Home', relationship: 'A special place', description: 'Our family home where we celebrate festivals.', imageUrl: familyHome },
  { ...shared, id: 'demo-v2-m5', name: 'Garden', relationship: 'A favourite place', description: 'You enjoy your morning walks here.', imageUrl: garden },
]

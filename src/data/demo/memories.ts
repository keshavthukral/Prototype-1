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
  { ...shared, id: 'demo-v3-m1', name: 'Rahul Sharma', relationship: 'Son', relationshipAs: 'পুত্ৰ', description: 'Rahul visits you every Sunday.', descriptionAs: 'ৰাহুলে প্ৰতি দেওবাৰে আপোনাক লগ কৰিবলৈ আহে।', imageUrl: '/demo-memories/rahul.svg' },
  { ...shared, id: 'demo-v3-m2', name: 'Meera', relationship: 'Daughter', relationshipAs: 'জীয়ৰী', description: 'You enjoy evening tea together.', descriptionAs: 'আপোনালোকে একেলগে সন্ধিয়াৰ চাহ ভাল পায়।', imageUrl: '/demo-memories/meera.svg' },
  { ...shared, id: 'demo-v3-m3', name: 'Riya', relationship: 'Granddaughter', relationshipAs: 'নাতিনী', description: 'Riya loves hearing your childhood stories.', descriptionAs: 'ৰিয়াই আপোনাৰ সৰু কালৰ কাহিনী শুনি ভাল পায়।', imageUrl: '/demo-memories/riya.svg' },
  { ...shared, id: 'demo-v3-m4', name: 'Family Diwali', nameAs: 'পৰিয়ালৰ দীপাৱলী', relationship: 'Family celebration', relationshipAs: 'পৰিয়ালৰ উৎসৱ', description: 'We celebrated Diwali together at home.', descriptionAs: 'আমি ঘৰত একেলগে দীপাৱলী উদযাপন কৰিছিলোঁ।', imageUrl: '/demo-memories/diwali.svg' },
  { ...shared, id: 'demo-v3-m5', name: 'Wedding Day', nameAs: 'বিয়াৰ দিন', relationship: 'Family celebration', relationshipAs: 'পৰিয়ালৰ উৎসৱ', description: 'A special family celebration.', descriptionAs: 'এটি বিশেষ পাৰিবাৰিক উদযাপন।', imageUrl: '/demo-memories/wedding.svg' },
  { ...shared, id: 'demo-v3-m6', name: 'Garden', nameAs: 'বাগিচা', relationship: 'Favourite place', relationshipAs: 'প্ৰিয় ঠাই', description: 'You enjoy walking here in the morning.', descriptionAs: 'আপুনি ৰাতিপুৱা ইয়াত খোজ কাঢ়ি ভাল পায়।', imageUrl: '/demo-memories/garden.svg' },
  { ...shared, id: 'demo-v3-m7', name: 'Family Home', nameAs: 'পৰিয়ালৰ ঘৰ', relationship: 'Family place', relationshipAs: 'পৰিয়ালৰ ঠাই', description: 'This is the home where many family celebrations happened.', descriptionAs: 'এই ঘৰতে পৰিয়ালৰ বহুতো উৎসৱ হৈছিল।', imageUrl: '/demo-memories/home.svg' },
  { ...shared, id: 'demo-v3-m8', name: 'Tea Time', nameAs: 'চাহৰ সময়', relationship: 'Favourite routine', relationshipAs: 'প্ৰিয় অভ্যাস', description: 'Evening tea with your family is one of your favourite routines.', descriptionAs: 'পৰিয়ালৰ সৈতে সন্ধিয়াৰ চাহ আপোনাৰ এটি প্ৰিয় অভ্যাস।', imageUrl: '/demo-memories/tea.svg' },
]

/**
 * Memory Game Data
 *
 * Everyday, familiar objects organised by difficulty level.
 * Each level determines how many objects the player must remember.
 *
 * Level 1: 3 objects — gentle introduction
 * Level 2: 4 objects — moderate challenge
 * Level 3: 6 objects — engaging stretch
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'

export interface MemoryObject {
  id: string
  emoji: string
  nameEn: string
  nameAs: string
}

/** Full pool of objects — always familiar, culturally appropriate */
const OBJECT_POOL: MemoryObject[] = [
  { id: '1',  emoji: '🪷', nameEn: 'Lotus',   nameAs: 'কোঁপোল' },
  { id: '2',  emoji: '🫖', nameEn: 'Teapot',  nameAs: 'চাহৰ বাতৰী' },
  { id: '3',  emoji: '🎵', nameEn: 'Music',   nameAs: 'গান' },
  { id: '4',  emoji: '🪔', nameEn: 'Lamp',    nameAs: 'মই' },
  { id: '5',  emoji: '🥭', nameEn: 'Mango',   nameAs: 'আম' },
  { id: '6',  emoji: '📖', nameEn: 'Book',    nameAs: 'পুথি' },
  { id: '7',  emoji: '🌸', nameEn: 'Flower',  nameAs: 'ফুল' },
  { id: '8',  emoji: '🪴', nameEn: 'Plant',   nameAs: 'বৰষেণী' },
  { id: '9',  emoji: '🍚', nameEn: 'Rice',    nameAs: 'ভাত' },
  { id: '10', emoji: '🔔', nameEn: 'Bell',    nameAs: 'ঘণ্টা' },
  { id: '11', emoji: '🫕', nameEn: 'Bowl',    nameAs: 'বাটি' },
  { id: '12', emoji: '🪭', nameEn: 'Fan',     nameAs: 'পাখা' },
  { id: '13', emoji: '🎶', nameEn: 'Song',    nameAs: 'গীত' },
  { id: '14', emoji: '☀️', nameEn: 'Sun',     nameAs: 'সূয়' },
  { id: '15', emoji: '🌙', nameEn: 'Moon',    nameAs: 'চাঁদ' },
]

/** How many objects to show per difficulty level */
export const OBJECTS_PER_LEVEL: Record<DifficultyLevel, number> = {
  1: 3,
  2: 4,
  3: 6,
  4: 7,
}

/**
 * Pick a random subset of objects for a given difficulty level.
 * Returns a shuffled array.
 */
export function pickObjects(level: DifficultyLevel, pool: MemoryObject[] = OBJECT_POOL): MemoryObject[] {
  const count = OBJECTS_PER_LEVEL[level]
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Get display name for an object based on language.
 */
export function getObjectName(obj: MemoryObject, lang: 'en' | 'as'): string {
  return lang === 'as' ? obj.nameAs : obj.nameEn
}

export { OBJECT_POOL }

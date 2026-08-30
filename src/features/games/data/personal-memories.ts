/**
 * Personal Memory data for Round 4 of Memory Journey.
 *
 * Uses demo memory/persona fixtures when available.
 * Falls back to generic familiar-object activity when unavailable.
 *
 * NOTE: This activity must remain supportive and NEVER claim to test recognition medically.
 */

export interface PersonalMemoryCard {
  id: string
  name: string
  relationship: string
  imageUrl: string
  description: string
}

// Demo personal memories — used as quiz content
// These come from the DEMO_MEMORIES fixtures
const DEMO_PERSONAL_CARDS: PersonalMemoryCard[] = [
  {
    id: 'rahul',
    name: 'Rahul',
    relationship: 'Son',
    imageUrl: '/demo-memories/rahul.svg',
    description: 'Rahul visits every Sunday.',
  },
  {
    id: 'meera',
    name: 'Meera',
    relationship: 'Daughter',
    imageUrl: '/demo-memories/meera.svg',
    description: 'Evening tea together.',
  },
  {
    id: 'riya',
    name: 'Riya',
    relationship: 'Granddaughter',
    imageUrl: '/demo-memories/riya.svg',
    description: 'Loves childhood stories.',
  },
]

/** Distractors for the "Who is this?" options */
const NAME_OPTIONS = ['Rahul', 'Meera', 'Riya', 'Sanjay', 'Priya', 'Amit']

/**
 * Get personal memory cards for the current session.
 * Returns available cards (up to 3), or empty array if none available.
 */
export function getPersonalMemoryCards(): PersonalMemoryCard[] {
  return DEMO_PERSONAL_CARDS
}

/**
 * Build a personal memory question: show a card + multiple-choice name.
 */
export function buildPersonalQuestion(
  card: PersonalMemoryCard,
): {
  card: PersonalMemoryCard
  options: string[]
  correctAnswer: string
} {
  // Pick 3 distractors (not the correct name)
  const distractors = NAME_OPTIONS.filter((n) => n !== card.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)

  // Shuffle all options
  const options = [card.name, ...distractors].sort(
    () => Math.random() - 0.5,
  )

  return { card, options, correctAnswer: card.name }
}

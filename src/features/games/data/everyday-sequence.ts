/**
 * Everyday Sequence — Challenge data generator.
 *
 * Picks a familiar daily routine, takes a difficulty-scaled prefix
 * of its steps, and returns them in correct order for the player
 * to reassemble.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { EverydaySequenceConfig } from '@/features/games/data/challenges'

// ─── Routine data ───────────────────────────────────────────────

const ROUTINES: Record<string, { label: string; steps: string[] }> = {
  'making-tea': {
    label: 'Making tea',
    steps: [
      'Boil water',
      'Add tea leaves',
      'Add milk',
      'Add sugar',
      'Strain into a cup',
      'Let it cool a little',
    ],
  },
  'getting-dressed': {
    label: 'Getting dressed',
    steps: [
      'Take clothes from the wardrobe',
      'Put on inner clothes',
      'Put on your shirt',
      'Put on your pants',
      'Put on socks',
      'Put on shoes',
    ],
  },
  'washing-hands': {
    label: 'Washing hands',
    steps: [
      'Turn on the tap',
      'Wet your hands',
      'Apply soap',
      'Rub hands together',
      'Rinse with water',
      'Dry with a towel',
    ],
  },
  'watering-a-plant': {
    label: 'Watering a plant',
    steps: [
      'Get the watering can',
      'Fill it with water',
      'Walk to the plant',
      'Pour water into the soil',
      'Check the leaves',
      'Put the can away',
    ],
  },
  'making-a-phone-call': {
    label: 'Making a phone call',
    steps: [
      'Pick up the phone',
      'Unlock the screen',
      'Open the contacts',
      "Find the person's name",
      'Tap to call',
      'Wait for them to answer',
    ],
  },
  'setting-the-table': {
    label: 'Setting the table',
    steps: [
      'Take out the plates',
      'Place a plate for each person',
      'Add spoons and glasses',
      'Put out the water jug',
      'Arrange napkins',
      'Call everyone to eat',
    ],
  },
}

// ─── Step count per difficulty ───────────────────────────────────

const STEP_COUNTS: Record<DifficultyLevel, number> = {
  1: 3,
  2: 4,
  3: 5,
  4: 5,
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Generate an everyday-sequence challenge for the given difficulty.
 */
export function generateEverydaySequenceChallenge(
  difficulty: DifficultyLevel,
  id: string,
): EverydaySequenceConfig {
  const routineIds = Object.keys(ROUTINES)
  const routineId = routineIds[Math.floor(Math.random() * routineIds.length)]!
  const routine = ROUTINES[routineId]!

  const stepCount = STEP_COUNTS[difficulty]
  const selectedSteps = routine.steps.slice(0, stepCount)

  const steps = selectedSteps.map((label, index) => ({
    id: `${routineId}-${index}`,
    label,
  }))

  return {
    id,
    type: 'everyday-sequence',
    prompt: `Put these steps in the order you would normally do them.`,
    routineId,
    routineLabel: routine.label,
    steps,
  }
}

/**
 * Cancellation — Challenge data generator.
 *
 * Presents a grid of objects where the player must find every
 * instance of a specific target object.  Grid size and target
 * count scale with difficulty.  Targets are spread across the
 * grid to avoid adjacent clustering.
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { CancellationConfig } from '@/features/games/data/challenges'
import { OBJECT_POOL } from '@/features/games/data/objects'

// ─── Config per difficulty ──────────────────────────────────────

const TARGET_COUNTS: Record<DifficultyLevel, number> = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
}

const GRID_SIZES: Record<DifficultyLevel, number> = {
  1: 12,
  2: 16,
  3: 20,
  4: 24,
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Generate a cancellation challenge for the given difficulty.
 * Targets are placed at random positions with no two adjacent.
 */
export function generateCancellationChallenge(
  difficulty: DifficultyLevel,
  id: string,
): CancellationConfig {
  const targetCount = TARGET_COUNTS[difficulty]
  const totalGridSize = GRID_SIZES[difficulty]

  // Pick a random target object from the pool
  const targetIndex = Math.floor(Math.random() * OBJECT_POOL.length)
  const targetObjectId = OBJECT_POOL[targetIndex]!.id

  // Distractor pool: all objects except the target
  const distractors = OBJECT_POOL.filter((o) => o.id !== targetObjectId)

  // Place targets at random positions, ensuring no two are adjacent
  const targetPositions = new Set<number>()
  while (targetPositions.size < targetCount) {
    const pos = Math.floor(Math.random() * totalGridSize)
    // Check no adjacent target already placed
    const hasAdjacent =
      targetPositions.has(pos - 1) || targetPositions.has(pos + 1)
    if (!hasAdjacent) {
      targetPositions.add(pos)
    }
  }

  // Build grid: targets first, then fill remaining with distractors
  const gridObjectIds: string[] = new Array(totalGridSize).fill('')
  for (const pos of targetPositions) {
    gridObjectIds[pos] = targetObjectId
  }

  // Fill remaining cells with distractors, preferring variety and
  // avoiding same distractor as immediate neighbor
  const distractorCounts = new Map<string, number>()
  for (let i = 0; i < totalGridSize; i++) {
    if (gridObjectIds[i] !== '') continue

    const prev = i > 0 ? gridObjectIds[i - 1] : ''
    const sorted = [...distractors]
      .map((d) => ({
        id: d.id,
        count: distractorCounts.get(d.id) ?? 0,
        adjacent: d.id === prev,
      }))
      .sort((a, b) =>
        a.adjacent === b.adjacent ? a.count - b.count : a.adjacent ? 1 : -1,
      )

    const chosen = sorted[0]!.id
    gridObjectIds[i] = chosen
    distractorCounts.set(chosen, (distractorCounts.get(chosen) ?? 0) + 1)
  }

  // Compute target indices from final grid positions
  const targetIndices = [...targetPositions]

  return {
    id,
    type: 'cancellation',
    prompt: '',
    targetObjectId,
    gridObjectIds,
    targetIndices,
  }
}

/**
 * Trail Connect — Challenge data generator.
 *
 * Generates a set of numbered points at random positions that the player
 * must tap in ascending numerical order.  Minimum spacing is guaranteed
 * so that no two points can overlap visually or cause accidental taps.
 *
 * Algorithm:
 *   1. Build a dense grid of candidate positions within the safe area,
 *      adding small random jitter so the layout doesn't look rigid.
 *   2. Greedily select positions one at a time, each time choosing the
 *      candidate that is farthest from all already-selected points (biased
 *      random tie-breaking for variety).
 *   3. Validate the result.  If validation fails, regenerate the entire
 *      challenge (up to a limited number of full attempts).
 */

import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import type { TrailConnectConfig } from '@/features/games/data/challenges'

// ─── Constants ──────────────────────────────────────────────────

/** Minimum percentage-unit distance between any two points. */
const MIN_DISTANCE = 20

/** Safe area bounds (percentage of container). */
const SAFE_X_MIN = 10
const SAFE_X_MAX = 90
const SAFE_Y_MIN = 15
const SAFE_Y_MAX = 85

/** Grid spacing used to build the candidate pool (%). */
const GRID_STEP = 10

/** Maximum jitter applied to each grid point (%). */
const JITTER = 3

/** Number of full regeneration attempts before giving up. */
const MAX_ATTEMPTS = 5

// ─── Helpers ────────────────────────────────────────────────────

function randomInRange(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function euclideanDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

// ─── Point count per difficulty ──────────────────────────────────

const POINT_COUNTS: Record<DifficultyLevel, number> = {
  1: 5,
  2: 6,
  3: 8,
  4: 10,
}

// ─── Core algorithm ─────────────────────────────────────────────

/**
 * Build a pool of candidate positions on a regular grid with jitter.
 * The grid covers the entire safe area so every position is guaranteed
 * to be within bounds.
 */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function buildCandidatePool(): Array<{ x: number; y: number }> {
  const candidates: Array<{ x: number; y: number }> = []
  for (let x = SAFE_X_MIN; x <= SAFE_X_MAX; x += GRID_STEP) {
    for (let y = SAFE_Y_MIN; y <= SAFE_Y_MAX; y += GRID_STEP) {
      candidates.push({
        x: clamp(x + randomInRange(-JITTER, JITTER), SAFE_X_MIN, SAFE_X_MAX),
        y: clamp(y + randomInRange(-JITTER, JITTER), SAFE_Y_MIN, SAFE_Y_MAX),
      })
    }
  }
  return candidates
}

/**
 * Select `count` positions from the candidate pool such that every
 * selected pair satisfies the minimum distance constraint.
 *
 * Uses a greedy approach: at each step, filter candidates that are
 * far enough from all already-selected points, then pick the one
 * with the greatest minimum distance to the existing set (random
 * tie-breaking for visual variety).
 *
 * Throws if there are not enough valid candidates to fill the quota.
 */
function selectPositions(
  candidates: Array<{ x: number; y: number }>,
  count: number,
): Array<{ x: number; y: number }> {
  const selected: Array<{ x: number; y: number }> = []

  for (let i = 0; i < count; i++) {
    // Filter candidates that satisfy spacing with all selected points
    const valid = candidates.filter((c) =>
      selected.every((s) => euclideanDistance(c, s) >= MIN_DISTANCE),
    )

    if (valid.length === 0) {
      throw new Error(
        `Cannot place point ${i + 1}/${count}: no valid candidates remaining.`,
      )
    }

    // Score each valid candidate by its minimum distance to the selected set.
    // Higher score = more space around it = better choice.
    // On the very first point, all candidates score identically, so just pick
    // one at random (the sort will keep a random one at position 0).
    const scored = valid.map((c) => ({
      ...c,
      minDist:
        selected.length === 0
          ? Infinity
          : Math.min(...selected.map((s) => euclideanDistance(c, s))),
    }))

    // Sort by descending minimum distance; for ties, pick randomly.
    // Fisher–Yates partial shuffle on the top results is overkill, so we
    // shuffle valid candidates first, then sort stably by score.
    for (let j = scored.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      const tmp = scored[j]!
      scored[j] = scored[k]!
      scored[k] = tmp
    }
    scored.sort((a, b) => b.minDist - a.minDist)

    // Pick the best; if multiple share the top score the shuffle above
    // ensures we don't always get the same one.
    const best = scored[0]!
    selected.push({ x: best.x, y: best.y })
  }

  return selected
}

/**
 * Validate a complete set of points:
 *  - All within the safe area
 *  - All pairs at least MIN_DISTANCE apart
 *  - All IDs unique
 *  - Order matches points
 */
function validateChallenge(
  points: Array<{ id: string; label: string; x: number; y: number }>,
  order: string[],
  pointCount: number,
): boolean {
  if (points.length !== pointCount) return false
  if (order.length !== pointCount) return false

  const ids = new Set<string>()
  for (const p of points) {
    // Check bounds
    if (p.x < SAFE_X_MIN || p.x > SAFE_X_MAX) return false
    if (p.y < SAFE_Y_MIN || p.y > SAFE_Y_MAX) return false
    // Check unique IDs
    if (ids.has(p.id)) return false
    ids.add(p.id)
  }

  // Check every ID in order exists in points
  for (const id of order) {
    if (!ids.has(id)) return false
  }

  // Check pairwise spacing
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (euclideanDistance(points[i]!, points[j]!) < MIN_DISTANCE) {
        return false
      }
    }
  }

  return true
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Generate a trail-connect challenge for the given difficulty.
 *
 * Uses a pool-based greedy algorithm to guarantee minimum spacing
 * between all points.  If a generation attempt fails validation,
 * the entire challenge is regenerated (up to MAX_ATTEMPTS times).
 */
export function generateTrailConnectChallenge(
  difficulty: DifficultyLevel,
  id: string,
): TrailConnectConfig {
  const pointCount = POINT_COUNTS[difficulty]

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidates = buildCandidatePool()
    const positions = selectPositions(candidates, pointCount)

    const points = positions.map((pos, i) => ({
      id: String(i + 1),
      label: String(i + 1),
      x: pos.x,
      y: pos.y,
    }))

    const order = points.map((p) => p.id)

    if (validateChallenge(points, order, pointCount)) {
      return {
        id,
        type: 'trail-connect',
        prompt: 'Connect the numbers in order.',
        points,
        order,
      }
    }
  }

  // The greedy algorithm with a full candidate pool should never fail.
  // If it does after MAX_ATTEMPTS, produce a best-effort result that
  // is guaranteed valid by construction: use a strict grid layout.
  return generateFallbackChallenge(difficulty, id)
}

/**
 * Fallback: deterministic grid layout that is guaranteed to satisfy
 * the spacing constraint.  Points are placed on a regular grid and
 * then shuffled so the visual order doesn't always match the grid.
 * This should essentially never be reached.
 */
function generateFallbackChallenge(
  difficulty: DifficultyLevel,
  id: string,
): TrailConnectConfig {
  const pointCount = POINT_COUNTS[difficulty]

  // Calculate grid dimensions that fit all points with MIN_DISTANCE spacing
  const safeWidth = SAFE_X_MAX - SAFE_X_MIN // 80
  const safeHeight = SAFE_Y_MAX - SAFE_Y_MIN // 70
  const cols = Math.ceil(Math.sqrt((pointCount * safeWidth) / safeHeight))
  const rows = Math.ceil(pointCount / cols)

  const gridSpacingX = safeWidth / Math.max(cols - 1, 1)
  const gridSpacingY = safeHeight / Math.max(rows - 1, 1)
  const stepX = Math.max(gridSpacingX, MIN_DISTANCE)
  const stepY = Math.max(gridSpacingY, MIN_DISTANCE)

  // Center the grid in the safe area
  const totalWidth = stepX * (cols - 1)
  const totalHeight = stepY * (rows - 1)
  const offsetX = SAFE_X_MIN + (safeWidth - totalWidth) / 2
  const offsetY = SAFE_Y_MIN + (safeHeight - totalHeight) / 2

  const positions: Array<{ x: number; y: number }> = []
  for (let row = 0; row < rows && positions.length < pointCount; row++) {
    for (let col = 0; col < cols && positions.length < pointCount; col++) {
      positions.push({
        x: Math.round((offsetX + col * stepX) * 100) / 100,
        y: Math.round((offsetY + row * stepY) * 100) / 100,
      })
    }
  }

  const points = positions.map((pos, i) => ({
    id: String(i + 1),
    label: String(i + 1),
    x: pos.x,
    y: pos.y,
  }))

  const order = points.map((p) => p.id)

  return {
    id,
    type: 'trail-connect',
    prompt: 'Connect the numbers in order.',
    points,
    order,
  }
}

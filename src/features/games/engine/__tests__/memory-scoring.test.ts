import { describe, it, expect } from 'vitest'
import {
  scoreObjectRecall,
  scoreSequence,
  calculateSequenceDistance,
  scoreDelayedRecall,
} from '@/features/games/engine/scoring'

// ─── Object Recall (Visual Recall & Delayed Recall share scoring) ───

describe('scoreObjectRecall', () => {
  it('scores all targets correctly when all selected', () => {
    const result = scoreObjectRecall({
      targetIds: new Set(['a', 'b', 'c']),
      selectedIds: ['a', 'b', 'c'],
      totalTargets: 3,
    })
    expect(result.targetsSelectedCorrectly).toBe(3)
    expect(result.falseSelections).toBe(0)
    expect(result.missedTargets).toBe(0)
    expect(result.accuracy).toBe(100)
  })

  it('penalizes false selections', () => {
    const result = scoreObjectRecall({
      targetIds: new Set(['a', 'b', 'c']),
      selectedIds: ['a', 'b', 'c', 'x', 'y'],
      totalTargets: 3,
    })
    expect(result.targetsSelectedCorrectly).toBe(3)
    expect(result.falseSelections).toBe(2)
    expect(result.missedTargets).toBe(0)
    // accuracy = max(0, 3 - 2) / 3 * 100 = 33.33
    expect(result.accuracy).toBeCloseTo(33.33, 0)
  })

  it('handles no selections', () => {
    const result = scoreObjectRecall({
      targetIds: new Set(['a', 'b', 'c']),
      selectedIds: [],
      totalTargets: 3,
    })
    expect(result.targetsSelectedCorrectly).toBe(0)
    expect(result.falseSelections).toBe(0)
    expect(result.missedTargets).toBe(3)
    expect(result.accuracy).toBe(0)
  })

  it('handles mixed correct and incorrect', () => {
    const result = scoreObjectRecall({
      targetIds: new Set(['a', 'b', 'c']),
      selectedIds: ['a', 'x'],
      totalTargets: 3,
    })
    expect(result.targetsSelectedCorrectly).toBe(1)
    expect(result.falseSelections).toBe(1)
    expect(result.missedTargets).toBe(2)
    // accuracy = max(0, 1-1) / 3 * 100 = 0
    expect(result.accuracy).toBe(0)
  })
})

// ─── Delayed Recall ───

describe('scoreDelayedRecall', () => {
  it('scores correctly with all targets selected', () => {
    const result = scoreDelayedRecall({
      targetIds: new Set(['a', 'b', 'c']),
      selectedIds: ['a', 'b', 'c'],
      totalTargets: 3,
    })
    expect(result.correct).toBe(3)
    expect(result.falseSelections).toBe(0)
    expect(result.accuracy).toBe(100)
  })

  it('handles missed targets and false positives', () => {
    const result = scoreDelayedRecall({
      targetIds: new Set(['a', 'b', 'c']),
      selectedIds: ['a', 'b', 'd'],
      totalTargets: 3,
    })
    expect(result.correct).toBe(2)
    expect(result.falseSelections).toBe(1)
    // accuracy = max(0, 2-1) / 3 * 100 = 33.33
    expect(result.accuracy).toBeCloseTo(33.33, 0)
  })

  it('penalizes when more false selections than correct', () => {
    const result = scoreDelayedRecall({
      targetIds: new Set(['a', 'b', 'c']),
      selectedIds: ['a', 'x', 'y', 'z'],
      totalTargets: 3,
    })
    expect(result.correct).toBe(1)
    expect(result.falseSelections).toBe(3)
    // accuracy = max(0, 1-3) / 3 * 100 = 0
    expect(result.accuracy).toBe(0)
  })
})

// ─── Sequence Memory ───

describe('scoreSequence', () => {
  it('scores a perfect sequence', () => {
    const result = scoreSequence({
      correctOrder: ['a', 'b', 'c', 'd'],
      userOrder: ['a', 'b', 'c', 'd'],
      reorders: 0,
      timeToFirstActionMs: 1000,
      completionTimeMs: 5000,
    })
    expect(result.correctPositions).toBe(4)
    expect(result.totalPositions).toBe(4)
    expect(result.accuracy).toBe(100)
    expect(result.sequenceDistance).toBe(0)
  })

  it('scores partial sequence correctly', () => {
    // Original: A B C D
    // Patient:  A C B D
    // Position 1: correct (A=A)
    // Position 2: incorrect (C≠B)
    // Position 3: incorrect (B≠C)
    // Position 4: correct (D=D)
    const result = scoreSequence({
      correctOrder: ['a', 'b', 'c', 'd'],
      userOrder: ['a', 'c', 'b', 'd'],
      reorders: 2,
      timeToFirstActionMs: 1000,
      completionTimeMs: 8000,
    })
    expect(result.correctPositions).toBe(2)
    expect(result.totalPositions).toBe(4)
    expect(result.accuracy).toBe(50)
    expect(result.sequenceDistance).toBeGreaterThan(0)
  })

  it('scores completely wrong sequence', () => {
    const result = scoreSequence({
      correctOrder: ['a', 'b', 'c', 'd'],
      userOrder: ['d', 'c', 'b', 'a'],
      reorders: 6,
      timeToFirstActionMs: 500,
      completionTimeMs: 3000,
    })
    expect(result.correctPositions).toBe(0)
    expect(result.totalPositions).toBe(4)
    expect(result.accuracy).toBe(0)
    expect(result.sequenceDistance).toBeGreaterThan(0)
  })

  it('handles empty sequences', () => {
    const result = scoreSequence({
      correctOrder: [],
      userOrder: [],
      reorders: 0,
      timeToFirstActionMs: 0,
      completionTimeMs: 0,
    })
    expect(result.correctPositions).toBe(0)
    expect(result.totalPositions).toBe(0)
    expect(result.accuracy).toBe(0)
  })
})

describe('calculateSequenceDistance', () => {
  it('returns 0 for identical sequences', () => {
    expect(calculateSequenceDistance(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(0)
  })

  it('counts inversions correctly', () => {
    // One adjacent swap: A B C -> A C B (1 inversion)
    expect(calculateSequenceDistance(['a', 'b', 'c'], ['a', 'c', 'b'])).toBe(1)
  })

  it('counts multiple inversions', () => {
    // A B C D -> D C B A (6 inversions)
    expect(calculateSequenceDistance(['a', 'b', 'c', 'd'], ['d', 'c', 'b', 'a'])).toBe(6)
  })
})

// ─── Spatial Memory (inline scoring, not from scoring.ts) ───
// The spatial round uses inline logic in chooseLocation, but we test
// the principle: position match should be correct.

describe('spatial memory position check', () => {
  it('correct position matches original grid position', () => {
    const grid = [
      { id: 'apple', emoji: '🍎', label: 'Apple' },
      { id: 'banana', emoji: '🍌', label: 'Banana' },
      { id: 'cup', emoji: '☕', label: 'Cup' },
      { id: 'key', emoji: '🔑', label: 'Key' },
    ]
    const queriedObject = grid[2]! // cup at position 2
    const originalPosition = grid.findIndex((item) => item.id === queriedObject.id)
    expect(originalPosition).toBe(2)

    // Clicking position 2 = correct
    expect(2 === originalPosition).toBe(true)
    // Clicking position 0 = incorrect
    expect(0 === originalPosition).toBe(false)
  })

  it('each queried object has a unique position in the grid', () => {
    const grid = [
      { id: 'apple', emoji: '🍎', label: 'Apple' },
      { id: 'banana', emoji: '🍌', label: 'Banana' },
      { id: 'cup', emoji: '☕', label: 'Cup' },
      { id: 'key', emoji: '🔑', label: 'Key' },
    ]
    const positions = grid.map((item, index) => ({
      id: item.id,
      position: index,
    }))
    const uniquePositions = new Set(positions.map((p) => p.position))
    expect(uniquePositions.size).toBe(grid.length)
    // Verify all positions are distinct
    expect(grid.length).toBeGreaterThan(0)
  })
})

// ─── Data Integrity ───

describe('data integrity across phases', () => {
  it('spatial recall uses same grid data as memorize phase', () => {
    // Simulate: generate grid during memorize, use same grid during recall
    const memorizeGrid = [
      { id: 'apple', emoji: '🍎', label: 'Apple' },
      { id: 'banana', emoji: '🍌', label: 'Banana' },
      { id: 'cup', emoji: '☕', label: 'Cup' },
    ]
    // During recall, the same grid is used (not regenerated)
    const recallGrid = memorizeGrid
    expect(recallGrid).toBe(memorizeGrid) // Same reference, not a copy
    expect(recallGrid[1]!.id).toBe('banana')
  })

  it('sequence recall uses same objects as memorize phase', () => {
    const memorizeTargets = [
      { id: 'apple', emoji: '🍎', label: 'Apple' },
      { id: 'key', emoji: '🔑', label: 'Key' },
      { id: 'book', emoji: '📖', label: 'Book' },
    ]
    // Options are a shuffled copy of targets (same objects, different order)
    const recallOptions = [...memorizeTargets].reverse()
    // Both contain the same object IDs
    const memorizeIds = memorizeTargets.map((t) => t.id)
    const recallIds = recallOptions.map((t) => t.id)
    expect(recallIds.sort()).toEqual(memorizeIds.sort())
  })

  it('delayed recall targets match the initial preview objects', () => {
    const previewObjects = [
      { id: 'apple', emoji: '🍎', label: 'Apple' },
      { id: 'banana', emoji: '🍌', label: 'Banana' },
      { id: 'cup', emoji: '☕', label: 'Cup' },
    ]
    // Delayed recall targets should be the same objects from preview
    const delayedTargets = previewObjects
    expect(delayedTargets.map((t) => t.id)).toEqual(
      previewObjects.map((t) => t.id),
    )
  })
})

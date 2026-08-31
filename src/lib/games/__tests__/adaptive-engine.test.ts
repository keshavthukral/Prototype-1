import { describe, it, expect } from 'vitest'
import {
  computeNextDifficulty,
  getStartingDifficulty,
  type SessionResult,
  type DifficultyLevel,
} from '@/lib/games/adaptive-engine'

// ─── Helpers ──────────────────────────────────────────────────

function makeSession(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    correctCount: 8,
    totalCount: 10,
    responseTimeMs: 20_000,
    hintsUsed: 0,
    difficulty: 1,
    ...overrides,
  }
}

function makeStrongSessions(count: number, difficulty: DifficultyLevel = 1): SessionResult[] {
  return Array.from({ length: count }, () =>
    makeSession({
      correctCount: 9,
      totalCount: 10,
      responseTimeMs: 15_000,
      hintsUsed: 0,
      difficulty,
    }),
  )
}

function makeWeakSessions(count: number, difficulty: DifficultyLevel = 2): SessionResult[] {
  return Array.from({ length: count }, () =>
    makeSession({
      correctCount: 2,
      totalCount: 10,
      responseTimeMs: 70_000,
      hintsUsed: 4,
      difficulty,
    }),
  )
}

// ─── Tests ────────────────────────────────────────────────────

describe('getStartingDifficulty', () => {
  it('returns 1 as the starting difficulty', () => {
    expect(getStartingDifficulty()).toBe(1)
  })
})

describe('computeNextDifficulty', () => {
  describe('with no sessions', () => {
    it('keeps the same difficulty', () => {
      const result = computeNextDifficulty(1, [])
      expect(result.newDifficulty).toBe(1)
      expect(result.reasoning).toContain('No recent sessions')
    })

    it('keeps difficulty 2 if no sessions', () => {
      const result = computeNextDifficulty(2, [])
      expect(result.newDifficulty).toBe(2)
    })
  })

  describe('strong performance → increase', () => {
    it('increases from 1 to 2 after 2+ strong sessions', () => {
      const sessions = makeStrongSessions(3, 1)
      const result = computeNextDifficulty(1, sessions)
      expect(result.newDifficulty).toBe(2)
      expect(result.reasoning).toContain('level 2')
    })

    it('increases from 2 to 3 after 2+ strong sessions', () => {
      const sessions = makeStrongSessions(3, 2)
      const result = computeNextDifficulty(2, sessions)
      expect(result.newDifficulty).toBe(3)
      expect(result.reasoning).toContain('level 3')
    })

    it('increases from 3 to 4 after 2+ strong sessions', () => {
      const sessions = makeStrongSessions(3, 3)
      const result = computeNextDifficulty(3, sessions)
      expect(result.newDifficulty).toBe(4)
      expect(result.reasoning).toContain('level 4')
    })

    it('increases from 4 to 5 after 2+ strong sessions', () => {
      const sessions = makeStrongSessions(3, 4)
      const result = computeNextDifficulty(4, sessions)
      expect(result.newDifficulty).toBe(5)
      expect(result.reasoning).toContain('level 5')
    })

    it('does NOT increase beyond 5', () => {
      const sessions = makeStrongSessions(3, 5)
      const result = computeNextDifficulty(5, sessions)
      expect(result.newDifficulty).toBe(5)
    })
  })

  describe('weak performance → decrease', () => {
    it('decreases from 2 to 1 after 2+ weak sessions', () => {
      const sessions = makeWeakSessions(3, 2)
      const result = computeNextDifficulty(2, sessions)
      expect(result.newDifficulty).toBe(1)
      expect(result.reasoning).toContain('level 1')
    })

    it('decreases from 3 to 2 after 2+ weak sessions', () => {
      const sessions = makeWeakSessions(3, 3)
      const result = computeNextDifficulty(3, sessions)
      expect(result.newDifficulty).toBe(2)
    })

    it('decreases from 5 to 4 after 2+ weak sessions', () => {
      const sessions = makeWeakSessions(3, 5)
      const result = computeNextDifficulty(5, sessions)
      expect(result.newDifficulty).toBe(4)
    })

    it('does NOT decrease below 1', () => {
      const sessions = makeWeakSessions(3, 1)
      const result = computeNextDifficulty(1, sessions)
      expect(result.newDifficulty).toBe(1)
    })

    it('decreases on single session with low accuracy AND many hints', () => {
      const sessions = [
        makeSession({
          correctCount: 2,
          totalCount: 10,
          responseTimeMs: 50_000,
          hintsUsed: 3,
          difficulty: 2,
        }),
      ]
      const result = computeNextDifficulty(2, sessions)
      expect(result.newDifficulty).toBe(1)
    })
  })

  describe('mixed performance → stay', () => {
    it('keeps difficulty with one good and one bad session', () => {
      const sessions = [
        makeSession({ correctCount: 9, totalCount: 10, responseTimeMs: 15_000, hintsUsed: 0 }),
        makeSession({ correctCount: 3, totalCount: 10, responseTimeMs: 60_000, hintsUsed: 3 }),
      ]
      const result = computeNextDifficulty(2, sessions)
      expect(result.newDifficulty).toBe(2)
    })

    it('keeps difficulty with middling performance', () => {
      const sessions = [
        makeSession({ correctCount: 6, totalCount: 10, responseTimeMs: 30_000, hintsUsed: 1 }),
        makeSession({ correctCount: 7, totalCount: 10, responseTimeMs: 35_000, hintsUsed: 1 }),
      ]
      const result = computeNextDifficulty(2, sessions)
      expect(result.newDifficulty).toBe(2)
    })
  })

  describe('single strong session is NOT enough', () => {
    it('does not increase after just 1 strong session', () => {
      const sessions = makeStrongSessions(1, 1)
      const result = computeNextDifficulty(1, sessions)
      expect(result.newDifficulty).toBe(1)
    })
  })

  describe('single weak session with hints does decrease', () => {
    it('decreases when accuracy < 50% and hints >= 3', () => {
      const sessions = [
        makeSession({ correctCount: 1, totalCount: 10, hintsUsed: 4, difficulty: 2 }),
      ]
      const result = computeNextDifficulty(2, sessions)
      expect(result.newDifficulty).toBe(1)
    })

    it('does not decrease when hints are low', () => {
      const sessions = [
        makeSession({ correctCount: 2, totalCount: 10, hintsUsed: 0, difficulty: 2 }),
      ]
      const result = computeNextDifficulty(2, sessions)
      expect(result.newDifficulty).toBe(2)
    })
  })

  describe('window size', () => {
    it('only considers the 5 most recent sessions', () => {
      // 5 weak sessions followed by 2 strong ones — but window is 5,
      // so only the 2 strong + 3 weak are in the window, mixed → stay
      const sessions = [
        ...makeStrongSessions(2, 1),
        ...makeWeakSessions(3, 1),
      ]
      const result = computeNextDifficulty(1, sessions)
      // Mixed performance → stay
      expect(result.newDifficulty).toBe(1)
    })
  })

  describe('reasoning is always provided', () => {
    it('includes a reasoning string in every decision', () => {
      const cases = [
        computeNextDifficulty(1, []),
        computeNextDifficulty(1, makeStrongSessions(3)),
        computeNextDifficulty(2, makeWeakSessions(3)),
        computeNextDifficulty(2, [
          makeSession({ correctCount: 5, totalCount: 10 }),
        ]),
      ]
      for (const c of cases) {
        expect(typeof c.reasoning).toBe('string')
        expect(c.reasoning.length).toBeGreaterThan(0)
      }
    })
  })
})

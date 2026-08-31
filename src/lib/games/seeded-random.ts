/**
 * Seeded Pseudo-Random Number Generator
 *
 * Mulberry32 — simple, fast, deterministic.
 * Used to create session-level variation so Day 1, Day 2, Day 3
 * feel somewhat different, without random() surprises.
 */

export function createSeededRandom(seed: number) {
  let s = seed | 0

  function next(): number {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    /** Return a random float in [0, 1) */
    random: next,
    /** Return a random integer in [min, max] inclusive */
    int(min: number, max: number): number {
      return Math.floor(next() * (max - min + 1)) + min
    },
    /** Return a shuffled copy of arr (Fisher–Yates, seeded) */
    shuffle<T>(arr: T[]): T[] {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        const tmp = a[i]!
        a[i] = a[j]!
        a[j] = tmp
      }
      return a
    },
    /** Pick n unique items from arr */
    sample<T>(arr: T[], n: number): T[] {
      return this.shuffle(arr).slice(0, n)
    },
  }
}

/**
 * Derive a session seed from date + patient so the same patient
 * gets deterministic-but-varied sessions across days.
 */
export function sessionSeed(date?: Date, offset: number = 0): number {
  const d = date ?? new Date()
  return (
    d.getFullYear() * 10000 +
    (d.getMonth() + 1) * 100 +
    d.getDate() +
    offset * 7919 // prime offset for variation
  )
}

export type Random = () => number

/**
 * mulberry32 — a tiny seeded PRNG.
 *
 * Generators take their randomness as an argument rather than reaching for
 * `Math.random` themselves. That is what makes a maze reproducible: the same
 * seed gives the same board, so a test that fails is a board we can look at
 * again instead of a coin flip.
 */
export function seededRandom(seed: number): Random {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Unseeded source for the app itself, where every click should differ. */
export const systemRandom: Random = Math.random

/** Uniform integer in [min, max]. */
export function randomInt(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

export function pickOne<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]
}

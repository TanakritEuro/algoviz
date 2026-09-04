import { describe, expect, it } from 'vitest'
import { replayOps } from './recorder'
import { SORTING_ALGORITHMS, getSortAlgorithm } from './index'
import type { SortAlgorithmEntry } from './types'
import { seededRandom } from '../../lib/random'

const ascending = (a: number, b: number) => a - b

function randomArray(seed: number, length: number, max = 100): number[] {
  const random = seededRandom(seed)
  return Array.from({ length }, () => 1 + Math.floor(random() * max))
}

const CASES: Array<{ name: string; input: number[] }> = [
  { name: 'empty', input: [] },
  { name: 'single element', input: [42] },
  { name: 'two in order', input: [1, 2] },
  { name: 'two out of order', input: [2, 1] },
  { name: 'already sorted', input: [1, 2, 3, 4, 5, 6, 7, 8] },
  { name: 'reversed', input: [8, 7, 6, 5, 4, 3, 2, 1] },
  { name: 'all identical', input: [5, 5, 5, 5, 5, 5] },
  { name: 'many duplicates', input: [3, 1, 3, 2, 1, 2, 3, 1, 2] },
  { name: 'negatives and zero', input: [0, -4, 7, -1, 0, 3, -9] },
  { name: 'random 40', input: randomArray(1, 40) },
  { name: 'random 101', input: randomArray(2, 101) },
]

describe.each(SORTING_ALGORITHMS)('$name', (algorithm: SortAlgorithmEntry) => {
  it.each(CASES)('sorts $name', ({ input }) => {
    const result = algorithm.run(input)
    expect(result.sorted).toEqual([...input].sort(ascending))
  })

  it.each(CASES)('replaying the recording of $name reproduces the result', ({ input }) => {
    // The property that makes the visualiser honest: if replaying the ops did
    // not land on the algorithm's own output, the animation would be showing
    // something the algorithm never did.
    const result = algorithm.run(input)
    expect(replayOps(input, result.ops)).toEqual(result.sorted)
  })

  it.each(CASES)('does not mutate the input array for $name', ({ input }) => {
    const before = [...input]
    algorithm.run(input)
    expect(input).toEqual(before)
  })

  it('marks every position sorted exactly by the end', () => {
    const result = algorithm.run(randomArray(3, 30))
    const marked = new Set<number>()
    for (const op of result.ops) {
      if (op.type === 'sorted') for (const index of op.indices) marked.add(index)
    }
    expect(marked.size).toBe(30)
  })

  it('never references an index outside the array', () => {
    const input = randomArray(4, 25)
    const result = algorithm.run(input)

    for (const op of result.ops) {
      const indices =
        op.type === 'sorted'
          ? op.indices
          : op.type === 'write'
            ? [op.index]
            : [op.a, op.b]
      for (const index of indices) {
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThan(input.length)
      }
    }
  })

  it('counts work that actually happened', () => {
    const result = algorithm.run(randomArray(5, 40))
    expect(result.comparisons).toBeGreaterThan(0)
    expect(result.writes).toBeGreaterThan(0)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    // Every swap moves two values, so writes can never lag behind.
    expect(result.writes).toBeGreaterThanOrEqual(result.swaps * 2)
  })

  it('does no work at all on an empty array', () => {
    const result = algorithm.run([])
    expect(result.ops).toEqual([])
    expect(result.comparisons).toBe(0)
    expect(result.swaps).toBe(0)
  })
})

describe('the comparison the stats panel is making', () => {
  // Larger than the visualiser ever shows, on purpose: the whole point of the
  // n log n / n squared distinction is that the gap widens with n, and at the
  // 120 bars on screen it is only about threefold.
  const input = randomArray(7, 400)

  it('the O(n log n) sorts compare far less than the quadratic ones', () => {
    const bubble = getSortAlgorithm('bubble').run(input).comparisons
    const insertion = getSortAlgorithm('insertion').run(input).comparisons
    const merge = getSortAlgorithm('merge').run(input).comparisons
    const quick = getSortAlgorithm('quick').run(input).comparisons
    const heap = getSortAlgorithm('heap').run(input).comparisons

    // Measured at n=400: bubble 79,500 and insertion 40,285 comparisons against
    // merge 2,943, quick 4,450 and heap 5,685. Insertion is the tighter bound of
    // the two quadratics — it abandons each inner loop early, so it does about
    // n²/4 where bubble does n²/2. A fivefold margin clears the real 7x gap and
    // would still fail loudly if one of these quietly went quadratic.
    for (const fast of [merge, quick, heap]) {
      expect(fast).toBeLessThan(bubble / 5)
      expect(fast).toBeLessThan(insertion / 5)
    }
  })

  it('merge sort writes without swapping; the in-place sorts swap', () => {
    const merge = getSortAlgorithm('merge').run(input)
    expect(merge.swaps).toBe(0)
    expect(merge.writes).toBeGreaterThan(0)

    for (const id of ['bubble', 'insertion', 'quick', 'heap']) {
      expect(getSortAlgorithm(id).run(input).swaps).toBeGreaterThan(0)
    }
  })

  it('bubble and insertion sort spot an already-sorted array cheaply', () => {
    const sorted = Array.from({ length: 100 }, (_, i) => i)
    // Their O(n) best case: one clean pass, no swaps.
    expect(getSortAlgorithm('bubble').run(sorted).swaps).toBe(0)
    expect(getSortAlgorithm('bubble').run(sorted).comparisons).toBeLessThan(200)
    expect(getSortAlgorithm('insertion').run(sorted).swaps).toBe(0)
  })

  it('quick sort survives the already-sorted input that kills a naive pivot', () => {
    // With a last-element pivot this is the O(n squared) worst case. Median-of-three
    // keeps it near its average, so it must stay well under the quadratic sorts.
    const sorted = Array.from({ length: 400 }, (_, i) => i)
    const quick = getSortAlgorithm('quick').run(sorted)
    const quadratic = getSortAlgorithm('insertion').run(input).comparisons

    expect(quick.sorted).toEqual(sorted)
    // Sorted input is quick sort's classic worst case. With the median parked
    // correctly it stays near n log n; with the naive last-element pivot this
    // number lands around n²/2 and the assertion fails loudly.
    expect(quick.comparisons).toBeLessThan(quadratic / 10)
  })
})

describe('registry', () => {
  it('exposes a unique id per algorithm', () => {
    const ids = SORTING_ALGORITHMS.map((algorithm) => algorithm.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('throws helpfully on an unknown id', () => {
    expect(() => getSortAlgorithm('bogosort')).toThrow(/bogosort/)
  })
})

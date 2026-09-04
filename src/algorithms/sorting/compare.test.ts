import { describe, expect, it } from 'vitest'
import { compareSortToBaseline } from './compare'
import { getSortAlgorithm } from './index'
import { seededRandom } from '../../lib/random'

function randomArray(seed: number, length: number): number[] {
  const random = seededRandom(seed)
  return Array.from({ length }, () => 1 + Math.floor(random() * 100))
}

describe('compareSortToBaseline', () => {
  const input = randomArray(9, 80)
  const baseline = getSortAlgorithm('bubble').run(input)

  it('reports how much work the n log n sorts save over bubble sort', () => {
    for (const id of ['merge', 'quick', 'heap']) {
      const insight = compareSortToBaseline(getSortAlgorithm(id).run(input), baseline, false)
      expect(insight.comparisonsSaved).toBeGreaterThan(0.5)
      expect(insight.comparisons).toBeLessThan(insight.baselineComparisons)
    }
  })

  it('flags the baseline itself as having nothing to compare against', () => {
    const insight = compareSortToBaseline(baseline, baseline, true)
    expect(insight.isBaseline).toBe(true)
    expect(insight.comparisonsSaved).toBe(0)
    expect(insight.writesSaved).toBe(0)
  })

  it('stays finite on an empty array, where the baseline does no work at all', () => {
    const empty = getSortAlgorithm('bubble').run([])
    const insight = compareSortToBaseline(getSortAlgorithm('merge').run([]), empty, false)

    expect(Number.isFinite(insight.comparisonsSaved)).toBe(true)
    expect(Number.isFinite(insight.writesSaved)).toBe(true)
    expect(insight.comparisonsSaved).toBe(0)
  })

  it('reports merge sort saving no writes despite saving comparisons', () => {
    // Merge sort writes every element at every level of the recursion, so its
    // write count is not the dramatic win — the comparison count is. The panel
    // should be able to tell those apart rather than claiming one number.
    const insight = compareSortToBaseline(getSortAlgorithm('merge').run(input), baseline, false)
    expect(insight.comparisonsSaved).toBeGreaterThan(insight.writesSaved)
  })
})

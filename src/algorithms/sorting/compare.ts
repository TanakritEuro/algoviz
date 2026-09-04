import type { SortResult } from './types'

/**
 * Bubble sort is the yardstick here: the algorithm everyone writes first, and
 * the one every other algorithm on the list exists to improve on. "82% fewer
 * comparisons than bubble sort" is a more useful sentence than a big-O label,
 * because it is a number the viewer just watched happen.
 */
export const BASELINE_SORT_ID = 'bubble'

export interface SortInsight {
  comparisons: number
  writes: number
  baselineComparisons: number
  baselineWrites: number
  /** Share of the baseline's comparisons avoided. 0.82 = "82% fewer". */
  comparisonsSaved: number
  /** Share of the baseline's array writes avoided. */
  writesSaved: number
  isBaseline: boolean
}

/** Measures one sort against the baseline sort on the same input array. */
export function compareSortToBaseline(
  result: SortResult,
  baseline: SortResult,
  isBaseline: boolean,
): SortInsight {
  const share = (mine: number, theirs: number) => (theirs === 0 ? 0 : (theirs - mine) / theirs)

  return {
    comparisons: result.comparisons,
    writes: result.writes,
    baselineComparisons: baseline.comparisons,
    baselineWrites: baseline.writes,
    comparisonsSaved: share(result.comparisons, baseline.comparisons),
    writesSaved: share(result.writes, baseline.writes),
    isBaseline,
  }
}

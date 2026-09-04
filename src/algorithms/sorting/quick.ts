import { SortRecorder } from './recorder'
import type { SortAlgorithm } from './types'

/**
 * Quick sort, with Lomuto partitioning and a median-of-three pivot.
 *
 * Picks a pivot, moves everything smaller to its left and everything larger to
 * its right, then recurses into both sides. The pivot lands in its final
 * position immediately — that is why the sorted markers appear scattered rather
 * than growing from one end.
 *
 * The pivot choice is the whole ballgame. Taking the last element degrades to
 * O(n squared) on already-sorted input, which is exactly the array a user is
 * most likely to try twice in a row. Median-of-three costs two comparisons and
 * removes that trap.
 */
export const quickSort: SortAlgorithm = (values) => {
  const tape = new SortRecorder(values)

  const choosePivot = (lo: number, hi: number): void => {
    const mid = lo + Math.floor((hi - lo) / 2)

    // Order the three candidates so that a[lo] <= a[mid] <= a[hi].
    if (tape.compareAt(lo, mid) > 0) tape.swap(lo, mid)
    if (tape.compareAt(lo, hi) > 0) tape.swap(lo, hi)
    if (tape.compareAt(mid, hi) > 0) tape.swap(mid, hi)

    // Now a[hi] holds the *largest* of the three, which on sorted input is the
    // worst possible pivot — the exact O(n squared) case this is meant to avoid.
    // Parking the median at hi is the step that does the avoiding.
    tape.swap(mid, hi)
  }

  const partition = (lo: number, hi: number): number => {
    if (hi - lo >= 2) choosePivot(lo, hi)

    let boundary = lo
    for (let i = lo; i < hi; i += 1) {
      if (tape.compareAt(i, hi) < 0) {
        tape.swap(i, boundary)
        boundary += 1
      }
    }

    tape.swap(boundary, hi)
    return boundary
  }

  const sort = (lo: number, hi: number): void => {
    if (lo > hi) return
    if (lo === hi) {
      tape.markSorted(lo)
      return
    }

    const pivot = partition(lo, hi)
    tape.markSorted(pivot)
    sort(lo, pivot - 1)
    sort(pivot + 1, hi)
  }

  sort(0, tape.length - 1)
  return tape.finish()
}

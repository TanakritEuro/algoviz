import { SortRecorder } from './recorder'
import type { SortAlgorithm } from './types'

/**
 * Merge sort.
 *
 * Splits the array down to single elements, then merges neighbouring runs back
 * together in order. The merge step is where the O(n log n) comes from: every
 * level of the recursion touches all n elements, and there are log n levels.
 *
 * Note what the stats show — merge sort records almost no *swaps*. It does not
 * exchange pairs; it copies a run into a buffer and writes the values back in
 * order. That extra buffer is its O(n) space cost, and the reason it is the one
 * algorithm here that is not in-place.
 */
export const mergeSort: SortAlgorithm = (values) => {
  const tape = new SortRecorder(values)

  const merge = (lo: number, mid: number, hi: number): void => {
    // Copy both runs out first: we are about to overwrite the range they occupy.
    const buffer = tape.slice(lo, hi)
    let left = lo
    let right = mid + 1
    let write = lo

    while (left <= mid && right <= hi) {
      // The values live in the buffer, but the indices the viewer cares about
      // are the array positions they came from.
      tape.logCompare(left, right)
      if (buffer[left - lo] <= buffer[right - lo]) {
        tape.write(write, buffer[left - lo])
        left += 1
      } else {
        tape.write(write, buffer[right - lo])
        right += 1
      }
      write += 1
    }

    while (left <= mid) {
      tape.write(write, buffer[left - lo])
      left += 1
      write += 1
    }
    while (right <= hi) {
      tape.write(write, buffer[right - lo])
      right += 1
      write += 1
    }
  }

  const sort = (lo: number, hi: number): void => {
    if (lo >= hi) return
    const mid = lo + Math.floor((hi - lo) / 2)
    sort(lo, mid)
    sort(mid + 1, hi)
    merge(lo, mid, hi)
  }

  sort(0, tape.length - 1)
  return tape.finish()
}

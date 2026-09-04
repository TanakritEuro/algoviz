import { SortRecorder } from './recorder'
import type { SortAlgorithm } from './types'

/**
 * Insertion sort.
 *
 * Keeps a sorted region on the left and repeatedly takes the next value, sliding
 * it left until it sits in the right place. Quadratic in general, but it does
 * almost no work on data that is already nearly ordered — which is why real
 * sorting libraries fall back to it for small or nearly-sorted runs instead of
 * recursing further.
 */
export const insertionSort: SortAlgorithm = (values) => {
  const tape = new SortRecorder(values)
  const n = tape.length

  for (let i = 1; i < n; i += 1) {
    // Slide the new value down past everything larger than it.
    let j = i
    while (j > 0 && tape.compareAt(j - 1, j) > 0) {
      tape.swap(j - 1, j)
      j -= 1
    }
  }

  return tape.finish()
}

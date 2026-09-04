import { SortRecorder } from './recorder'
import type { SortAlgorithm } from './types'

/**
 * Bubble sort.
 *
 * Walks the array swapping any pair that is out of order, over and over. Each
 * pass drags the largest remaining value to the end, which is why the sorted
 * region grows from the right. The early exit matters: on an already-sorted
 * array one clean pass ends it, which is the only case where bubble sort is
 * competitive at O(n).
 */
export const bubbleSort: SortAlgorithm = (values) => {
  const tape = new SortRecorder(values)
  const n = tape.length

  for (let end = n - 1; end > 0; end -= 1) {
    let swapped = false

    for (let i = 0; i < end; i += 1) {
      if (tape.compareAt(i, i + 1) > 0) {
        tape.swap(i, i + 1)
        swapped = true
      }
    }

    // Whatever just bubbled to `end` is the largest of what was left.
    tape.markSorted(end)
    if (!swapped) break
  }

  return tape.finish()
}

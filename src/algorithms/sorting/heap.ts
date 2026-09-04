import { SortRecorder } from './recorder'
import type { SortAlgorithm } from './types'

/**
 * Heap sort.
 *
 * Rearranges the array into a max-heap in place, then repeatedly swaps the root
 * (the largest remaining value) to the end and repairs the heap. Watch the first
 * phase: nothing looks sorted, because it is not sorting — it is building the
 * structure that makes "give me the largest" cost O(log n) instead of O(n).
 *
 * The same binary heap as the one behind Dijkstra and A*, used here on the array
 * itself rather than as a separate priority queue.
 */
export const heapSort: SortAlgorithm = (values) => {
  const tape = new SortRecorder(values)
  const n = tape.length

  /** Pushes the value at `root` down until the subtree is a valid max-heap. */
  const siftDown = (root: number, size: number): void => {
    let parent = root

    for (;;) {
      const left = parent * 2 + 1
      if (left >= size) break
      const right = left + 1

      let largest = left
      if (right < size && tape.compareAt(right, left) > 0) largest = right
      if (tape.compareAt(largest, parent) <= 0) break

      tape.swap(parent, largest)
      parent = largest
    }
  }

  // Build the heap from the last parent upwards.
  for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) siftDown(i, n)

  // Then pull the maximum out, one at a time, growing the sorted tail.
  for (let end = n - 1; end > 0; end -= 1) {
    tape.swap(0, end)
    tape.markSorted(end)
    siftDown(0, end)
  }

  return tape.finish()
}

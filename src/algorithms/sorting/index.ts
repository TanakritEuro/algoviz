import { bubbleSort } from './bubble'
import { heapSort } from './heap'
import { insertionSort } from './insertion'
import { mergeSort } from './merge'
import { quickSort } from './quick'
import type { SortAlgorithmEntry } from './types'

/**
 * The single source of truth for the sorting view — dropdown, stats panel and
 * education panel all read from here, so adding an algorithm is one entry.
 */
export const SORTING_ALGORITHMS: SortAlgorithmEntry[] = [
  {
    id: 'bubble',
    name: 'Bubble Sort',
    shortName: 'Bubble',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: true,
    inPlace: true,
    blurb:
      'Repeatedly walks the array swapping neighbours that are out of order, so the largest value bubbles to the end on every pass. Simple to write, and slow enough on anything sizeable that it exists mostly as a teaching example — though it does spot an already-sorted array in a single pass.',
    pseudocode: [
      'for end from n-1 down to 1:',
      '    swapped ← false',
      '    for i from 0 to end-1:',
      '        if a[i] > a[i+1]:',
      '            swap a[i], a[i+1]',
      '            swapped ← true',
      '    if not swapped: break        // already in order',
    ],
    run: bubbleSort,
  },
  {
    id: 'insertion',
    name: 'Insertion Sort',
    shortName: 'Insertion',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: true,
    inPlace: true,
    blurb:
      'Grows a sorted region on the left, taking each new value and sliding it down into place — the way most people sort a hand of cards. Quadratic in general, but it barely works at all on nearly-ordered data, which is why real sorting libraries switch to it for small runs.',
    pseudocode: [
      'for i from 1 to n-1:',
      '    j ← i',
      '    while j > 0 and a[j-1] > a[j]:',
      '        swap a[j-1], a[j]',
      '        j ← j - 1',
    ],
    run: insertionSort,
  },
  {
    id: 'merge',
    name: 'Merge Sort',
    shortName: 'Merge',
    complexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(n)',
    },
    stable: true,
    inPlace: false,
    blurb:
      'Splits the array down to single elements and merges neighbouring runs back together in order. Every level of the recursion touches all n elements and there are log n levels — hence O(n log n) in every case, best and worst alike. Note the stats: it barely swaps at all, because it moves data by copying into a buffer. That buffer is its O(n) space cost.',
    pseudocode: [
      'sort(lo, hi):',
      '    if lo >= hi: return',
      '    mid ← (lo + hi) / 2',
      '    sort(lo, mid); sort(mid+1, hi)',
      '    merge(lo, mid, hi)',
      '',
      'merge(lo, mid, hi):',
      '    buffer ← copy of a[lo..hi]',
      '    take the smaller front value of the two runs,',
      '    write it back, repeat until both are drained',
    ],
    run: mergeSort,
  },
  {
    id: 'quick',
    name: 'Quick Sort',
    shortName: 'Quick',
    complexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n²)',
      space: 'O(log n)',
    },
    stable: false,
    inPlace: true,
    blurb:
      'Picks a pivot, moves everything smaller to its left and everything larger to its right, then recurses into both sides. The pivot reaches its final position immediately, which is why the sorted markers appear scattered rather than growing from one end. Usually the fastest of the five in practice — but a bad pivot choice degrades it to O(n²), so this one takes the median of three.',
    pseudocode: [
      'sort(lo, hi):',
      '    if lo >= hi: return',
      '    p ← partition(lo, hi)   // pivot lands for good',
      '    sort(lo, p-1); sort(p+1, hi)',
      '',
      'partition(lo, hi):',
      '    pivot ← median of a[lo], a[mid], a[hi], parked at hi',
      '    boundary ← lo',
      '    for i from lo to hi-1:',
      '        if a[i] < pivot: swap a[i], a[boundary]; boundary++',
      '    swap a[boundary], a[hi]; return boundary',
    ],
    run: quickSort,
  },
  {
    id: 'heap',
    name: 'Heap Sort',
    shortName: 'Heap',
    complexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(1)',
    },
    stable: false,
    inPlace: true,
    blurb:
      'Rearranges the array into a max-heap in place, then repeatedly swaps the largest value to the end and repairs the heap. The first phase looks like nothing is happening because nothing is being sorted yet — it is building the structure that makes "give me the largest" cost O(log n). Same binary heap as the one driving Dijkstra and A*, applied to the array itself.',
    pseudocode: [
      'for i from n/2-1 down to 0:',
      '    siftDown(i, n)              // build the heap',
      '',
      'for end from n-1 down to 1:',
      '    swap a[0], a[end]           // largest to the back',
      '    siftDown(0, end)            // repair what is left',
    ],
    run: heapSort,
  },
]

export function getSortAlgorithm(id: string): SortAlgorithmEntry {
  const entry = SORTING_ALGORITHMS.find((algorithm) => algorithm.id === id)
  if (!entry) throw new Error(`Unknown sorting algorithm: ${id}`)
  return entry
}

export * from './compare'
export * from './recorder'
export * from './types'

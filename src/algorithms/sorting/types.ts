/**
 * Core types for the sorting layer.
 *
 * Same shape as the pathfinding side: an algorithm runs to completion and hands
 * back a *recording* of what it did, which the UI replays at whatever speed it
 * likes. Nothing here imports React or touches the DOM.
 *
 * The recording is a list of operations rather than a list of array snapshots.
 * Bubble sort on 100 elements performs roughly 10,000 steps; storing a 100-item
 * array for each would be a million numbers to describe work that four fields
 * can express exactly.
 */

export type SortOp =
  /** Two positions were compared. Nothing moved. */
  | { type: 'compare'; a: number; b: number }
  /** Two positions exchanged values. */
  | { type: 'swap'; a: number; b: number }
  /** One position was written directly — how merge sort moves data. */
  | { type: 'write'; index: number; value: number }
  /** These positions are now in their final place and will not move again. */
  | { type: 'sorted'; indices: number[] }

export interface SortResult {
  /** The full recording, in order. Replaying it reproduces `sorted` exactly. */
  ops: SortOp[]
  /** The finished array — the same thing a plain `.sort()` would produce. */
  sorted: number[]
  comparisons: number
  swaps: number
  /** Every value written into the array, including the two halves of a swap. */
  writes: number
  /** Wall-clock time of the pure sort, excluding any rendering. */
  durationMs: number
}

export type SortAlgorithm = (values: readonly number[]) => SortResult

export interface SortAlgorithmMeta {
  id: string
  name: string
  shortName: string
  complexity: {
    best: string
    average: string
    worst: string
    space: string
  }
  /** Does it preserve the relative order of equal elements? */
  stable: boolean
  /** Does it sort within the array, or does it need a second one? */
  inPlace: boolean
  blurb: string
  pseudocode: string[]
}

export interface SortAlgorithmEntry extends SortAlgorithmMeta {
  run: SortAlgorithm
}

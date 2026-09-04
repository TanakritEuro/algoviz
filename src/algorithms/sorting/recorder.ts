import type { SortOp, SortResult } from './types'

/**
 * A working array that writes down everything done to it.
 *
 * Every algorithm below operates through this instead of a raw array, which buys
 * three things at once: the counters can never drift from the actual work (there
 * is no second place to remember to increment them), the recording is guaranteed
 * to match what the algorithm really did, and each sort still reads like the
 * version in a textbook — `if (tape.compareAt(j, j + 1) > 0) tape.swap(j, j + 1)`
 * is recognisably bubble sort.
 */
export class SortRecorder {
  private readonly values: number[]
  private readonly ops: SortOp[] = []
  private comparisons = 0
  private swaps = 0
  private writes = 0
  private readonly startedAt: number

  constructor(values: readonly number[]) {
    // Copy up front: callers keep the array they passed in, untouched.
    this.values = [...values]
    this.startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  get length(): number {
    return this.values.length
  }

  /** Reads a value without recording anything — bookkeeping, not a comparison. */
  read(index: number): number {
    return this.values[index]
  }

  /** Copies a range out of the array, for algorithms that merge from a buffer. */
  slice(from: number, to: number): number[] {
    return this.values.slice(from, to + 1)
  }

  /**
   * Compares two positions. Returns the familiar negative / zero / positive, so
   * call sites read as `if (compareAt(j, j + 1) > 0)`.
   */
  compareAt(a: number, b: number): number {
    this.comparisons += 1
    this.ops.push({ type: 'compare', a, b })
    return this.values[a] - this.values[b]
  }

  /**
   * Records a comparison between two positions whose values the caller already
   * holds. Merge sort compares elements it has copied into a buffer; the indices
   * it passes are where those values came from, which is what the viewer needs
   * to see highlighted.
   */
  logCompare(a: number, b: number): void {
    this.comparisons += 1
    this.ops.push({ type: 'compare', a, b })
  }

  swap(a: number, b: number): void {
    if (a === b) return
    this.swaps += 1
    this.writes += 2
    const temp = this.values[a]
    this.values[a] = this.values[b]
    this.values[b] = temp
    this.ops.push({ type: 'swap', a, b })
  }

  write(index: number, value: number): void {
    this.writes += 1
    this.values[index] = value
    this.ops.push({ type: 'write', index, value })
  }

  /** Marks positions as finished — they will not move again. */
  markSorted(...indices: number[]): void {
    if (indices.length === 0) return
    this.ops.push({ type: 'sorted', indices })
  }

  /**
   * Closes the recording. Any position not already marked is marked now, so the
   * final frame always shows a fully sorted array however the algorithm tracked
   * its progress along the way.
   */
  finish(): SortResult {
    const alreadySorted = new Set<number>()
    for (const op of this.ops) {
      if (op.type === 'sorted') for (const index of op.indices) alreadySorted.add(index)
    }

    const remaining: number[] = []
    for (let index = 0; index < this.values.length; index += 1) {
      if (!alreadySorted.has(index)) remaining.push(index)
    }
    this.markSorted(...remaining)

    return {
      ops: this.ops,
      sorted: [...this.values],
      comparisons: this.comparisons,
      swaps: this.swaps,
      writes: this.writes,
      durationMs:
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - this.startedAt,
    }
  }
}

/**
 * Replays a recording onto a copy of the starting array.
 *
 * Used by the tests to prove the recording is faithful: if replaying the ops does
 * not reproduce the algorithm's own output, then what the animation shows is not
 * what the algorithm did, and the visualiser would be lying.
 */
export function replayOps(initial: readonly number[], ops: readonly SortOp[]): number[] {
  const values = [...initial]
  for (const op of ops) {
    if (op.type === 'swap') {
      const temp = values[op.a]
      values[op.a] = values[op.b]
      values[op.b] = temp
    } else if (op.type === 'write') {
      values[op.index] = op.value
    }
  }
  return values
}

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SortOp, SortResult } from '../algorithms/sorting'
import { MAX_SORT_RUN_SECONDS, SORT_OPS_PER_SECOND, type SpeedName } from '../lib/speed'

export interface SortFrame {
  values: number[]
  /** Positions being compared right now. */
  comparing: readonly number[]
  /** Positions being written or exchanged right now. */
  moving: readonly number[]
  /** Positions known to be in their final place. */
  sorted: readonly boolean[]
  /** Work done *so far* — these tick up as the run plays, and must, because
   *  showing the finished totals over an unfinished array would be a lie. */
  comparisons: number
  swaps: number
  writes: number
}

interface Run {
  ops: readonly SortOp[]
  index: number
  accumulator: number
  lastFrame: number
  opsPerSecond: number
  onComplete?: () => void
}

function idleFrame(values: readonly number[]): SortFrame {
  return {
    values: [...values],
    comparing: [],
    moving: [],
    sorted: values.map(() => false),
    comparisons: 0,
    swaps: 0,
    writes: 0,
  }
}

/**
 * Replays a sorting recording.
 *
 * Unlike the pathfinding board this drives React state directly, one frame per
 * animation frame. That board is ~950 cells and had to bypass reconciliation to
 * hold 60fps; this is at most 120 bars, where the render is cheap and ordinary
 * state keeps the component honest and readable. Same recording-then-replay
 * design, different amount of machinery — chosen by measurement, not by habit.
 */
export function useSortPlayer(initial: readonly number[]) {
  const [frame, setFrame] = useState<SortFrame>(() => idleFrame(initial))
  const [isPlaying, setIsPlaying] = useState(false)

  const run = useRef<Run | null>(null)
  const rafId = useRef(0)
  const values = useRef<number[]>([...initial])
  const sorted = useRef<boolean[]>(initial.map(() => false))
  const tally = useRef({ comparisons: 0, swaps: 0, writes: 0 })

  const cancel = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current)
    rafId.current = 0
    run.current = null
  }, [])

  /** Drops any run in progress and shows `next` untouched. */
  const reset = useCallback(
    (next: readonly number[]) => {
      cancel()
      values.current = [...next]
      sorted.current = next.map(() => false)
      tally.current = { comparisons: 0, swaps: 0, writes: 0 }
      setIsPlaying(false)
      setFrame(idleFrame(next))
    },
    [cancel],
  )

  const stop = useCallback(() => {
    cancel()
    setIsPlaying(false)
  }, [cancel])

  const apply = useCallback((op: SortOp) => {
    if (op.type === 'swap') {
      const temp = values.current[op.a]
      values.current[op.a] = values.current[op.b]
      values.current[op.b] = temp
      tally.current.swaps += 1
      tally.current.writes += 2
    } else if (op.type === 'write') {
      values.current[op.index] = op.value
      tally.current.writes += 1
    } else if (op.type === 'compare') {
      tally.current.comparisons += 1
    } else if (op.type === 'sorted') {
      for (const index of op.indices) sorted.current[index] = true
    }
  }, [])

  const play = useCallback(
    (start: readonly number[], result: SortResult, speed: SpeedName, onComplete?: () => void) => {
      cancel()
      values.current = [...start]
      sorted.current = start.map(() => false)
      tally.current = { comparisons: 0, swaps: 0, writes: 0 }

      const requested = SORT_OPS_PER_SECOND[speed]
      // Raise the rate rather than let a long run become unwatchable.
      const floor = result.ops.length / MAX_SORT_RUN_SECONDS
      const opsPerSecond = Math.max(requested, floor)

      run.current = {
        ops: result.ops,
        index: 0,
        accumulator: 0,
        lastFrame: 0,
        opsPerSecond,
        onComplete,
      }
      setIsPlaying(true)

      const step = (timestamp: number) => {
        const active = run.current
        if (!active) return

        const elapsed = active.lastFrame ? timestamp - active.lastFrame : 0
        active.lastFrame = timestamp
        active.accumulator += (elapsed / 1000) * active.opsPerSecond

        let budget = Number.isFinite(active.opsPerSecond)
          ? Math.max(1, Math.floor(active.accumulator))
          : Number.POSITIVE_INFINITY
        if (Number.isFinite(budget)) active.accumulator -= budget

        // The last op consumed this frame is the one worth highlighting — at
        // speed, several hundred land per frame and marking them all would just
        // light up the whole array.
        let comparing: readonly number[] = []
        let moving: readonly number[] = []

        while (budget > 0 && active.index < active.ops.length) {
          const op = active.ops[active.index]
          apply(op)
          active.index += 1
          budget -= 1

          if (op.type === 'compare') {
            comparing = [op.a, op.b]
            moving = []
          } else if (op.type === 'swap') {
            moving = [op.a, op.b]
            comparing = []
          } else if (op.type === 'write') {
            moving = [op.index]
            comparing = []
          }
        }

        const done = active.index >= active.ops.length

        setFrame({
          values: [...values.current],
          comparing: done ? [] : comparing,
          moving: done ? [] : moving,
          sorted: [...sorted.current],
          ...tally.current,
        })

        if (done) {
          const finished = active.onComplete
          run.current = null
          rafId.current = 0
          setIsPlaying(false)
          finished?.()
          return
        }

        rafId.current = requestAnimationFrame(step)
      }

      rafId.current = requestAnimationFrame(step)
    },
    [apply, cancel],
  )

  useEffect(
    () => () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
    },
    [],
  )

  return { frame, isPlaying, play, stop, reset }
}

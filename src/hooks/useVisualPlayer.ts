import { useCallback, useEffect, useRef, useState } from 'react'
import type { Coord, SearchResult } from '../algorithms/pathfinding'
import { SPEEDS, type SpeedName } from '../lib/speed'

type Phase = 'idle' | 'visiting' | 'tracing'

interface Run {
  phase: Phase
  visited: Coord[]
  path: Coord[]
  index: number
  /** Time debt carried between frames so slow speeds are not quantised to 16ms. */
  accumulator: number
  lastFrame: number
  onComplete?: () => void
}

/**
 * Replays a recorded search onto the board.
 *
 * The important design choice: this writes `data-state` directly onto the cell
 * elements instead of pushing per-frame React state. A 40×60 board is 2,400
 * nodes; reconciling that tree sixty times a second would dominate the frame
 * budget and make "Fast" feel worse than "Slow". React still owns the board's
 * structure — walls, weights, endpoints — and this layer only paints over it.
 */
export function useVisualPlayer(cols: number) {
  const cells = useRef(new Map<number, HTMLElement>())
  const frame = useRef(0)
  const run = useRef<Run | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const registerCell = useCallback((index: number, element: HTMLElement | null) => {
    if (element) cells.current.set(index, element)
    else cells.current.delete(index)
  }, [])

  const paint = useCallback(
    (coord: Coord, state: 'visited' | 'path') => {
      const index = coord.row * cols + coord.col
      const element = cells.current.get(index)
      if (!element) return
      // Endpoints keep their own marker — the search may cross them, but they
      // must stay recognisable while it does.
      const current = element.dataset.state
      if (current === 'start' || current === 'end') return
      element.dataset.state = state
    },
    [cols],
  )

  /**
   * Wipes the search overlay, leaving walls, weights and endpoints untouched.
   *
   * This sweeps every registered cell rather than a remembered list of painted
   * ones. That costs a couple of thousand cheap attribute reads on a discrete
   * user action — never per frame — and in exchange it cannot desynchronise:
   * when the board is rebuilt (a resize, say) React reuses cell indices without
   * touching `data-state`, so a remembered list would leave paint stranded.
   */
  const clearPaint = useCallback(() => {
    for (const element of cells.current.values()) {
      const state = element.dataset.state
      if (state === 'visited' || state === 'path') element.dataset.state = 'empty'
    }
  }, [])

  const stop = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = 0
    run.current = null
    setIsPlaying(false)
  }, [])

  const tick = useCallback(
    (speed: SpeedName) => {
      const settings = SPEEDS[speed]

      const step = (timestamp: number) => {
        const active = run.current
        if (!active) return

        const elapsed = active.lastFrame ? timestamp - active.lastFrame : 0
        active.lastFrame = timestamp
        active.accumulator += elapsed

        const interval =
          active.phase === 'visiting' ? settings.msPerVisit : settings.msPerPathStep

        // At "instant" there is no interval, so drain the whole queue this frame.
        let budget =
          interval === 0
            ? Number.POSITIVE_INFINITY
            : Math.max(1, Math.floor(active.accumulator / interval))
        if (interval > 0) active.accumulator -= budget * interval

        while (budget > 0) {
          if (active.phase === 'visiting') {
            if (active.index >= active.visited.length) {
              active.phase = 'tracing'
              active.index = 0
              active.accumulator = 0
              continue
            }
            paint(active.visited[active.index], 'visited')
          } else {
            if (active.index >= active.path.length) {
              const done = active.onComplete
              run.current = null
              frame.current = 0
              setIsPlaying(false)
              done?.()
              return
            }
            paint(active.path[active.index], 'path')
          }
          active.index += 1
          budget -= 1
        }

        frame.current = requestAnimationFrame(step)
      }

      frame.current = requestAnimationFrame(step)
    },
    [paint],
  )

  const play = useCallback(
    (result: SearchResult, speed: SpeedName, onComplete?: () => void) => {
      stop()
      clearPaint()
      run.current = {
        phase: 'visiting',
        visited: result.visitedOrder,
        path: result.path,
        index: 0,
        accumulator: 0,
        lastFrame: 0,
        onComplete,
      }
      setIsPlaying(true)
      tick(speed)
    },
    [clearPaint, stop, tick],
  )

  /** Paints a finished run with no animation — used when restoring a result. */
  const paintResult = useCallback(
    (result: SearchResult) => {
      clearPaint()
      for (const coord of result.visitedOrder) paint(coord, 'visited')
      for (const coord of result.path) paint(coord, 'path')
    },
    [clearPaint, paint],
  )

  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current)
  }, [])

  return { registerCell, play, stop, clearPaint, paintResult, isPlaying }
}

import { useEffect, useState, type RefObject } from 'react'

export interface BoardSize {
  rows: number
  cols: number
  cellSize: number
  /** Measured space, so callers can fit two boards into it side by side. */
  width: number
}

const MIN_COLS = 10
const MAX_COLS = 65
const MIN_ROWS = 8
const MAX_ROWS = 34

/** Width is rounded to this, to keep resize churn off the render path. */
const WIDTH_STEP = 8

/** Bigger touch targets on small screens, tighter cells on a desktop monitor. */
function pickCellSize(width: number): number {
  if (width < 480) return 20
  if (width < 900) return 24
  return 27
}

/**
 * Derives the grid's dimensions from the space the board is actually given,
 * so the visualiser fills a 1440px monitor and a tablet equally well instead
 * of hard-coding a 50×20 board and hoping.
 */
export function useBoardSize(ref: RefObject<HTMLElement | null>): BoardSize {
  const [size, setSize] = useState<BoardSize>({ rows: 21, cols: 45, cellSize: 27, width: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = (rawWidth: number, height: number) => {
      if (rawWidth === 0 || height === 0) return
      const cellSize = pickCellSize(rawWidth)
      const cols = Math.min(MAX_COLS, Math.max(MIN_COLS, Math.floor(rawWidth / cellSize)))
      const rows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.floor(height / cellSize)))
      // Quantised, because width is only used to fit two boards side by side and
      // nothing on screen moves for four pixels. Storing it raw would re-render
      // the whole grid on every frame of a window drag.
      const width = Math.round(rawWidth / WIDTH_STEP) * WIDTH_STEP

      // Only commit real changes — a resize storm must not rebuild the board
      // (and wipe the user's walls) on every intermediate pixel.
      setSize((current) =>
        current.rows === rows &&
        current.cols === cols &&
        current.cellSize === cellSize &&
        current.width === width
          ? current
          : { rows, cols, cellSize, width },
      )
    }

    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect
      measure(box.width, box.height)
    })

    observer.observe(element)
    measure(element.clientWidth, element.clientHeight)
    return () => observer.disconnect()
  }, [ref])

  return size
}

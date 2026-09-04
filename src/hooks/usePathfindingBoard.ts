import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BRUSH_WEIGHT,
  createGrid,
  sameCoord,
  type BoardGenerator,
  type Coord,
  type Grid,
} from '../algorithms/pathfinding'
import { systemRandom } from '../lib/random'

export type CellBase = 'empty' | 'wall' | 'start' | 'end'

/** Which property the pointer paints. */
export type Brush = 'walls' | 'terrain'

/** What a pointer drag is currently doing, decided on pointer-down. */
type DragMode =
  | 'draw-wall'
  | 'erase-wall'
  | 'draw-terrain'
  | 'erase-terrain'
  | 'move-start'
  | 'move-end'
  | null

export interface BoardState {
  grid: Grid
  start: Coord
  end: Coord
}

interface BoardOptions {
  brush: Brush
  onEdit?: () => void
}

function defaultEndpoints(rows: number, cols: number): { start: Coord; end: Coord } {
  const row = Math.floor(rows / 2)
  return {
    start: { row, col: Math.max(1, Math.floor(cols * 0.2)) },
    end: { row, col: Math.min(cols - 2, Math.floor(cols * 0.8)) },
  }
}

function createBoard(rows: number, cols: number): BoardState {
  return { grid: createGrid(rows, cols), ...defaultEndpoints(rows, cols) }
}

/**
 * Owns everything the user can edit about the board: walls, terrain cost, and
 * where the two endpoints sit. Pure grid data goes in, pure grid data comes out
 * — the search algorithms never see this hook, and it never sees them.
 */
export function usePathfindingBoard(rows: number, cols: number, options: BoardOptions) {
  const [board, setBoard] = useState<BoardState>(() => createBoard(rows, cols))
  const [size, setSize] = useState({ rows, cols })
  const dragMode = useRef<DragMode>(null)

  // These are inputs to event handlers, not to rendering: keeping the newest in
  // a ref means the pointer callbacks stay referentially stable through a whole
  // drag, which is what lets the memoised cells skip re-rendering.
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  // The board is sized by its container, so a resize rebuilds it from scratch.
  // Adjusting during render (rather than in an effect) means the new board is
  // the first thing painted — no frame showing a stale grid at the new size.
  if (size.rows !== rows || size.cols !== cols) {
    setSize({ rows, cols })
    setBoard(createBoard(rows, cols))
  }

  const isEndpoint = useCallback(
    (coord: Coord) => sameCoord(coord, board.start) || sameCoord(coord, board.end),
    [board.start, board.end],
  )

  /**
   * Writes one field of one cell. Copies only the row that changed, so every
   * untouched row keeps its identity and its cells bail out of re-rendering —
   * the difference between a smooth drag and a stuttering one.
   */
  const updateCell = useCallback(
    (coord: Coord, patch: { isWall?: boolean; weight?: number }) => {
      setBoard((current) => {
        if (sameCoord(coord, current.start) || sameCoord(coord, current.end)) return current
        const node = current.grid[coord.row][coord.col]
        const unchanged =
          (patch.isWall === undefined || patch.isWall === node.isWall) &&
          (patch.weight === undefined || patch.weight === node.weight)
        if (unchanged) return current

        const grid = current.grid.slice()
        const row = grid[coord.row].slice()
        row[coord.col] = { ...node, ...patch }
        grid[coord.row] = row
        return { ...current, grid }
      })
    },
    [],
  )

  // A cell is either a wall or ground with a cost — never both. Painting one
  // clears the other, so the board can't hold a weighted wall nobody can enter.
  const setWall = useCallback(
    (coord: Coord, isWall: boolean) => updateCell(coord, { isWall, weight: 1 }),
    [updateCell],
  )

  const setTerrain = useCallback(
    (coord: Coord, heavy: boolean) =>
      updateCell(coord, { weight: heavy ? BRUSH_WEIGHT : 1, isWall: false }),
    [updateCell],
  )

  const moveEndpoint = useCallback((which: 'start' | 'end', coord: Coord) => {
    setBoard((current) => {
      const other = which === 'start' ? current.end : current.start
      if (sameCoord(coord, other)) return current
      if (current.grid[coord.row][coord.col].isWall) return current
      if (sameCoord(coord, current[which])) return current
      return { ...current, [which]: coord }
    })
  }, [])

  const handlePointerDown = useCallback(
    (coord: Coord) => {
      latest.current.onEdit?.()

      if (sameCoord(coord, board.start)) {
        dragMode.current = 'move-start'
        return
      }
      if (sameCoord(coord, board.end)) {
        dragMode.current = 'move-end'
        return
      }

      const node = board.grid[coord.row][coord.col]

      // Pointer-down decides the whole drag: starting on something erases, and
      // starting on blank ground draws. One gesture never does both.
      if (latest.current.brush === 'terrain') {
        const erasing = node.weight > 1
        dragMode.current = erasing ? 'erase-terrain' : 'draw-terrain'
        setTerrain(coord, !erasing)
      } else {
        const erasing = node.isWall
        dragMode.current = erasing ? 'erase-wall' : 'draw-wall'
        setWall(coord, !erasing)
      }
    },
    [board.grid, board.start, board.end, setTerrain, setWall],
  )

  const handlePointerEnter = useCallback(
    (coord: Coord) => {
      const mode = dragMode.current
      if (!mode) return
      latest.current.onEdit?.()

      if (mode === 'move-start') moveEndpoint('start', coord)
      else if (mode === 'move-end') moveEndpoint('end', coord)
      else if (isEndpoint(coord)) return
      else if (mode === 'draw-terrain' || mode === 'erase-terrain') {
        setTerrain(coord, mode === 'draw-terrain')
      } else {
        setWall(coord, mode === 'draw-wall')
      }
    },
    [isEndpoint, moveEndpoint, setTerrain, setWall],
  )

  const handlePointerUp = useCallback(() => {
    dragMode.current = null
  }, [])

  // A drag that ends outside the board still has to end.
  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [handlePointerUp])

  /** Hands the current board to a generator and keeps whatever it returns. */
  const generate = useCallback((generator: BoardGenerator) => {
    setBoard((current) => ({
      ...current,
      grid: generator(current.grid, current.start, current.end, systemRandom),
    }))
  }, [])

  const clearWalls = useCallback(() => {
    setBoard((current) => ({
      ...current,
      grid: current.grid.map((row) =>
        row.some((node) => node.isWall)
          ? row.map((node) => (node.isWall ? { ...node, isWall: false } : node))
          : row,
      ),
    }))
  }, [])

  const clearTerrain = useCallback(() => {
    setBoard((current) => ({
      ...current,
      grid: current.grid.map((row) =>
        row.some((node) => node.weight > 1)
          ? row.map((node) => (node.weight > 1 ? { ...node, weight: 1 } : node))
          : row,
      ),
    }))
  }, [])

  const resetBoard = useCallback(() => {
    setBoard(createBoard(rows, cols))
  }, [rows, cols])

  const hasWalls = board.grid.some((row) => row.some((node) => node.isWall))
  const hasTerrain = board.grid.some((row) => row.some((node) => node.weight > 1))

  return {
    board,
    hasWalls,
    hasTerrain,
    handlePointerDown,
    handlePointerEnter,
    handlePointerUp,
    generate,
    clearWalls,
    clearTerrain,
    resetBoard,
  }
}

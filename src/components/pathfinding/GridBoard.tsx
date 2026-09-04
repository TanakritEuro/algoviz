import { useCallback, useEffect, useRef } from 'react'
import type { Coord } from '../../algorithms/pathfinding'
import { sameCoord } from '../../algorithms/pathfinding'
import type { BoardState, CellBase } from '../../hooks/usePathfindingBoard'
import { Cell } from './Cell'

interface GridBoardProps {
  board: BoardState
  cellSize: number
  disabled: boolean
  registerCell: (index: number, element: HTMLElement | null) => void
  onPointerDown: (coord: Coord) => void
  onPointerEnter: (coord: Coord) => void
}

function baseStateOf(board: BoardState, coord: Coord, isWall: boolean): CellBase {
  if (sameCoord(coord, board.start)) return 'start'
  if (sameCoord(coord, board.end)) return 'end'
  return isWall ? 'wall' : 'empty'
}

export function GridBoard({
  board,
  cellSize,
  disabled,
  registerCell,
  onPointerDown,
  onPointerEnter,
}: GridBoardProps) {
  // The board hook's handlers change identity whenever the board changes. Routing
  // them through refs keeps the props each Cell receives stable, so `memo` can
  // actually skip the ~2,000 cells a drag does not touch.
  const handlers = useRef({ onPointerDown, onPointerEnter, disabled })
  useEffect(() => {
    handlers.current = { onPointerDown, onPointerEnter, disabled }
  })

  const handleDown = useCallback((row: number, col: number) => {
    if (handlers.current.disabled) return
    handlers.current.onPointerDown({ row, col })
  }, [])

  const handleEnter = useCallback((row: number, col: number) => {
    if (handlers.current.disabled) return
    handlers.current.onPointerEnter({ row, col })
  }, [])

  const cols = board.grid[0].length

  return (
    <div
      role="application"
      aria-label="Pathfinding grid. Drag to draw walls, or drag the start and end markers to move them."
      // When editing is off the board must not swallow touch gestures: a
      // `touch-none` board that ignores drags would also block page scrolling,
      // stranding the reader on a screen they cannot move.
      className={`grid select-none overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] panel-shadow ${
        disabled ? 'touch-auto' : 'touch-none'
      }`}
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridAutoRows: `${cellSize}px`,
        width: cols * cellSize,
        cursor: disabled ? 'default' : 'crosshair',
      }}
    >
      {board.grid.map((row) =>
        row.map((node) => {
          const index = node.row * cols + node.col
          return (
            <Cell
              key={index}
              index={index}
              row={node.row}
              col={node.col}
              weight={node.weight}
              base={baseStateOf(board, node, node.isWall)}
              registerCell={registerCell}
              onDown={handleDown}
              onEnter={handleEnter}
            />
          )
        }),
      )}
    </div>
  )
}

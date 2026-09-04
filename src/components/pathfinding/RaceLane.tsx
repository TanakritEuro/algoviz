import type { AlgorithmEntry, Coord, SearchResult } from '../../algorithms/pathfinding'
import type { BoardState } from '../../hooks/usePathfindingBoard'
import { GridBoard } from './GridBoard'

interface RaceLaneProps {
  algorithm: AlgorithmEntry
  board: BoardState
  cellSize: number
  result: SearchResult | null
  /** True for whichever lane explored fewer nodes — the winner gets the accent. */
  isLeading: boolean
  disabled: boolean
  registerCell: (index: number, element: HTMLElement | null) => void
  onPointerDown: (coord: Coord) => void
  onPointerEnter: (coord: Coord) => void
}

/**
 * One side of a race: a board, plus the two numbers that decide the argument.
 *
 * Both lanes render the *same* board state, so drawing a wall on either one
 * updates both — the whole point is that the two algorithms are solving an
 * identical problem, and letting them diverge would make the comparison a lie.
 */
export function RaceLane({
  algorithm,
  board,
  cellSize,
  result,
  isLeading,
  disabled,
  registerCell,
  onPointerDown,
  onPointerEnter,
}: RaceLaneProps) {
  const steps = result && result.found ? result.path.length - 1 : null

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 px-0.5">
        <span
          className={`truncate text-sm font-medium ${
            isLeading ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
          }`}
        >
          {algorithm.name}
        </span>
        <span className="shrink-0 font-mono text-xs text-[var(--color-ink-muted)]">
          {result ? (
            <>
              {result.visitedOrder.length.toLocaleString()} nodes
              {steps === null ? ' · no path' : ` · ${steps} steps`}
            </>
          ) : (
            '—'
          )}
        </span>
      </div>

      <GridBoard
        board={board}
        cellSize={cellSize}
        disabled={disabled}
        registerCell={registerCell}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
      />
    </div>
  )
}

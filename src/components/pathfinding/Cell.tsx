import { memo } from 'react'
import { weightTier } from '../../algorithms/pathfinding'
import type { CellBase } from '../../hooks/usePathfindingBoard'

interface CellProps {
  row: number
  col: number
  index: number
  base: CellBase
  weight: number
  registerCell: (index: number, element: HTMLElement | null) => void
  onDown: (row: number, col: number) => void
  onEnter: (row: number, col: number) => void
}

/**
 * One grid square. Memoised on its data only: during a search the player mutates
 * `data-state` on the DOM node directly, so this component does not re-render
 * while thousands of cells are being painted.
 */
function CellImpl({ row, col, index, base, weight, registerCell, onDown, onEnter }: CellProps) {
  return (
    <div
      ref={(element) => registerCell(index, element)}
      className="cell"
      data-state={base}
      data-weight={weight > 1 ? weightTier(weight) : undefined}
      onPointerDown={(event) => {
        event.preventDefault()
        onDown(row, col)
      }}
      onPointerEnter={() => onEnter(row, col)}
    />
  )
}

export const Cell = memo(CellImpl)

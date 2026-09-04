import { memo } from 'react'
import type { SortFrame } from '../../hooks/useSortPlayer'

interface BarChartProps {
  frame: SortFrame
  maxValue: number
}

type BarState = 'idle' | 'compare' | 'move' | 'sorted'

function BarChartImpl({ frame, maxValue }: BarChartProps) {
  const comparing = new Set(frame.comparing)
  const moving = new Set(frame.moving)
  const count = frame.values.length

  // Bars get thin fast. Below this width the gap costs more than it clarifies.
  const gap = count > 70 ? 1 : count > 40 ? 2 : 3

  const stateOf = (index: number): BarState => {
    if (moving.has(index)) return 'move'
    if (comparing.has(index)) return 'compare'
    if (frame.sorted[index]) return 'sorted'
    return 'idle'
  }

  return (
    <div
      role="img"
      aria-label={`Array of ${count} values being sorted`}
      className="flex h-full w-full items-end overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 panel-shadow"
      style={{ gap: `${gap}px` }}
    >
      {frame.values.map((value, index) => (
        <div
          // Bars are identified by position, not value: a swap is meant to look
          // like two columns changing height, not like the list reordering.
          key={index}
          className="bar"
          data-state={stateOf(index)}
          style={{ height: `${(value / maxValue) * 100}%` }}
        />
      ))}
    </div>
  )
}

export const BarChart = memo(BarChartImpl)

import { TERRAIN_WEIGHTS } from '../../algorithms/pathfinding'

const STATES: Array<{ label: string; swatch: string }> = [
  { label: 'Start', swatch: 'bg-[var(--color-start)]' },
  { label: 'Target', swatch: 'bg-[var(--color-goal)]' },
  { label: 'Wall', swatch: 'bg-[var(--color-wall)]' },
  { label: 'Visited', swatch: 'bg-[var(--color-visited)]' },
  { label: 'Path', swatch: 'bg-[var(--color-path)]' },
]

const TIERS: Array<{ tier: string; weight: number }> = [
  { tier: 'light', weight: TERRAIN_WEIGHTS[0] },
  { tier: 'medium', weight: TERRAIN_WEIGHTS[1] },
  { tier: 'heavy', weight: TERRAIN_WEIGHTS[2] },
]

export function Legend() {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {STATES.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]"
          >
            <span className={`h-3 w-3 rounded-[3px] ${item.swatch}`} />
            {item.label}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
        <span className="text-[var(--color-ink-faint)]">Terrain cost</span>
        <ul className="flex items-center gap-1.5">
          {TIERS.map((item) => (
            <li key={item.tier} className="flex items-center gap-1">
              {/* Reuses the real cell styling, so the key cannot drift from the board. */}
              <span
                className="cell h-4 w-4 rounded-[3px] border-0"
                data-weight={item.tier}
                aria-hidden
              />
              <span className="font-mono text-[11px]">×{item.weight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

import {
  BOARD_GENERATORS,
  getAlgorithm,
  HEURISTIC_LABELS,
  PATHFINDING_ALGORITHMS,
} from '../../algorithms/pathfinding'
import type { HeuristicName } from '../../algorithms/pathfinding'
import type { Brush } from '../../hooks/usePathfindingBoard'
import { SPEED_ORDER, SPEEDS, type SpeedName } from '../../lib/speed'
import { Button } from '../ui/Button'
import { SegmentedControl } from '../ui/SegmentedControl'
import { Select } from '../ui/Select'

interface ControlBarProps {
  algorithmId: string
  heuristic: HeuristicName
  speed: SpeedName
  brush: Brush
  isPlaying: boolean
  hasWalls: boolean
  hasTerrain: boolean
  onAlgorithmChange: (id: string) => void
  onHeuristicChange: (heuristic: HeuristicName) => void
  onSpeedChange: (speed: SpeedName) => void
  onBrushChange: (brush: Brush) => void
  onGenerate: (generatorId: string) => void
  onVisualize: () => void
  onStop: () => void
  onClearPath: () => void
  onClearWalls: () => void
  onClearTerrain: () => void
  onReset: () => void
  /** Phone width: the board is view-only, so editing controls have nothing to act on. */
  isCompact: boolean
  isRacing: boolean
  rivalId: string
  onRacingChange: (racing: boolean) => void
  onRivalChange: (id: string) => void
}

const ALGORITHM_OPTIONS = PATHFINDING_ALGORITHMS.map((algorithm) => ({
  value: algorithm.id,
  label: algorithm.name,
}))

const SPEED_OPTIONS = SPEED_ORDER.map((id) => ({ value: id, label: SPEEDS[id].label }))

const HEURISTIC_OPTIONS = (Object.keys(HEURISTIC_LABELS) as HeuristicName[]).map((id) => ({
  value: id,
  label: HEURISTIC_LABELS[id],
}))

const BRUSH_OPTIONS: ReadonlyArray<{ value: Brush; label: string }> = [
  { value: 'walls', label: 'Walls' },
  { value: 'terrain', label: 'Terrain' },
]

function GroupLabel({ children }: { children: string }) {
  return (
    <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--color-ink-faint)] uppercase">
      {children}
    </span>
  )
}

function Divider() {
  return <span className="hidden h-5 w-px bg-[var(--color-line)] sm:block" />
}

export function ControlBar({
  algorithmId,
  heuristic,
  speed,
  brush,
  isPlaying,
  hasWalls,
  hasTerrain,
  onAlgorithmChange,
  onHeuristicChange,
  onSpeedChange,
  onBrushChange,
  onGenerate,
  onVisualize,
  onStop,
  onClearPath,
  onClearWalls,
  onClearTerrain,
  onReset,
  isCompact,
  isRacing,
  rivalId,
  onRacingChange,
  onRivalChange,
}: ControlBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/80 p-3 backdrop-blur">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-4">
        <Select
          label="Algorithm"
          value={algorithmId}
          options={ALGORITHM_OPTIONS}
          onChange={onAlgorithmChange}
          disabled={isPlaying}
        />

        {/* Only meaningful for A* and Greedy — hiding it elsewhere keeps the bar
            from advertising a setting that would do nothing. */}
        {getAlgorithm(algorithmId).usesHeuristic ? (
          <Select
            label="Heuristic"
            value={heuristic}
            options={HEURISTIC_OPTIONS}
            onChange={onHeuristicChange}
            disabled={isPlaying}
          />
        ) : null}

        <Select
          label="Speed"
          value={speed}
          options={SPEED_OPTIONS}
          onChange={onSpeedChange}
          disabled={isPlaying}
        />

        {/* The brush picks what a drag paints, and at this width there are no
            drags — offering the choice would promise something that cannot happen. */}
        {isCompact ? null : (
          <SegmentedControl
            label="Draw"
            value={brush}
            options={BRUSH_OPTIONS}
            onChange={onBrushChange}
            disabled={isPlaying}
          />
        )}

        <div className="ml-auto flex items-center gap-2 self-end pb-0.5">
          {isPlaying ? (
            <Button variant="primary" onClick={onStop} className="min-w-32">
              Stop
            </Button>
          ) : (
            <Button variant="primary" onClick={onVisualize} className="min-w-32">
              Visualize
              <kbd
                aria-hidden
                className="rounded border border-black/20 bg-black/10 px-1 font-mono text-[10px]"
              >
                space
              </kbd>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--color-line-soft)] pt-3">
        <GroupLabel>Generate</GroupLabel>
        {BOARD_GENERATORS.map((generator) => (
          <Button
            key={generator.id}
            title={generator.hint}
            // The visible label is short because the group heading supplies the
            // verb, but assistive tech reads buttons out of that context — and
            // "Terrain" alone appears twice in this row.
            aria-label={`Generate ${generator.label.toLowerCase()}`}
            disabled={isPlaying}
            onClick={() => onGenerate(generator.id)}
          >
            {generator.label}
          </Button>
        ))}

        <Divider />

        <GroupLabel>Clear</GroupLabel>
        <Button aria-label="Clear path" onClick={onClearPath} disabled={isPlaying}>
          Path
        </Button>
        <Button aria-label="Clear walls" onClick={onClearWalls} disabled={isPlaying || !hasWalls}>
          Walls
        </Button>
        <Button
          aria-label="Clear terrain"
          onClick={onClearTerrain}
          disabled={isPlaying || !hasTerrain}
        >
          Terrain
        </Button>

        <Divider />

        {/* Two boards side by side need width that simply is not there. */}
        {isCompact ? null : (
        <Button
          onClick={() => onRacingChange(!isRacing)}
          disabled={isPlaying}
          aria-pressed={isRacing}
          title="Run two algorithms on the same board at the same time"
          className={isRacing ? "border-[var(--color-accent)] text-[var(--color-accent)]" : ""}
        >
          {isRacing ? "Racing" : "Race"}
        </Button>
        )}
        {isRacing && !isCompact ? (
          <label className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
            vs
            <select
              value={rivalId}
              disabled={isPlaying}
              aria-label="Opponent algorithm"
              onChange={(event) => onRivalChange(event.target.value)}
              className="h-9 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-2.5 text-sm text-[var(--color-ink)] transition-colors hover:border-[var(--color-line-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ALGORITHM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <Divider />

        <Button variant="danger" onClick={onReset} disabled={isPlaying}>
          Reset board
        </Button>
      </div>
    </div>
  )
}

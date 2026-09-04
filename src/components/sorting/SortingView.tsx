import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BASELINE_SORT_ID,
  compareSortToBaseline,
  getSortAlgorithm,
  SORTING_ALGORITHMS,
  type SortInsight,
  type SortResult,
} from '../../algorithms/sorting'
import { useSortPlayer } from '../../hooks/useSortPlayer'
import { systemRandom } from '../../lib/random'
import { SPEED_ORDER, SPEEDS, type SpeedName } from '../../lib/speed'
import { EducationPanel } from '../shared/EducationPanel'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Slider } from '../ui/Slider'
import { BarChart } from './BarChart'
import { SortStatsPanel } from './SortStatsPanel'

const MIN_SIZE = 10
const MAX_SIZE = 120
const MAX_VALUE = 100

const ALGORITHM_OPTIONS = SORTING_ALGORITHMS.map((algorithm) => ({
  value: algorithm.id,
  label: algorithm.name,
}))

const SPEED_OPTIONS = SPEED_ORDER.map((id) => ({ value: id, label: SPEEDS[id].label }))

/** Distinct values, so equal-height bars never hide a swap that did happen. */
function shuffledArray(size: number): number[] {
  const values = Array.from({ length: size }, (_, i) =>
    Math.round(((i + 1) / size) * (MAX_VALUE - 4) + 4),
  )
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(systemRandom() * (i + 1))
    ;[values[i], values[j]] = [values[j], values[i]]
  }
  return values
}

function isTextEntry(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable)
  )
}

export function SortingView() {
  const [algorithmId, setAlgorithmId] = useState('bubble')
  const [speed, setSpeed] = useState<SpeedName>('medium')
  const [size, setSize] = useState(50)
  const [values, setValues] = useState(() => shuffledArray(50))
  const [result, setResult] = useState<SortResult | null>(null)
  const [insight, setInsight] = useState<SortInsight | null>(null)

  const { frame, isPlaying, play, stop, reset } = useSortPlayer(values)
  const algorithm = getSortAlgorithm(algorithmId)

  /** Replaces the array and drops whatever run was on screen. */
  const load = useCallback(
    (next: number[]) => {
      setValues(next)
      setResult(null)
      setInsight(null)
      reset(next)
    },
    [reset],
  )

  const shuffle = useCallback(() => load(shuffledArray(size)), [load, size])

  const handleSizeChange = useCallback(
    (next: number) => {
      setSize(next)
      load(shuffledArray(next))
    },
    [load],
  )

  const sort = useCallback(() => {
    // Always sort the pristine array, never the half-finished frame on screen —
    // hitting Sort twice must show the same run, not sort an already-sorted list.
    const run = getSortAlgorithm(algorithmId).run(values)

    // The baseline runs on the same array, so the summary can quote a real
    // saving rather than restate the big-O the panel already lists.
    const isBaseline = algorithmId === BASELINE_SORT_ID
    const baseline = isBaseline ? run : getSortAlgorithm(BASELINE_SORT_ID).run(values)

    setResult(run)
    setInsight(compareSortToBaseline(run, baseline, isBaseline))
    play(values, run, speed)
  }, [algorithmId, play, speed, values])

  // Changing the algorithm invalidates the stats, which describe the old run.
  const lastAlgorithm = useRef(algorithmId)
  useEffect(() => {
    if (lastAlgorithm.current === algorithmId) return
    lastAlgorithm.current = algorithmId
    setResult(null)
    setInsight(null)
    reset(values)
  }, [algorithmId, reset, values])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextEntry(event.target)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.code === 'Space') {
        if (event.target instanceof HTMLElement && event.target.tagName === 'BUTTON') return
        event.preventDefault()
        if (isPlaying) stop()
        else sort()
      } else if (event.key.toLowerCase() === 'r') {
        if (!isPlaying) shuffle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPlaying, shuffle, sort, stop])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/80 p-3 backdrop-blur">
        <Select
          label="Algorithm"
          value={algorithmId}
          options={ALGORITHM_OPTIONS}
          onChange={setAlgorithmId}
          disabled={isPlaying}
        />
        <Select
          label="Speed"
          value={speed}
          options={SPEED_OPTIONS}
          onChange={setSpeed}
          disabled={isPlaying}
        />
        <Slider
          label="Array size"
          value={size}
          min={MIN_SIZE}
          max={MAX_SIZE}
          disabled={isPlaying}
          onChange={handleSizeChange}
        />

        <div className="ml-auto flex items-center gap-2 self-end pb-0.5">
          {isPlaying ? (
            <Button variant="primary" onClick={stop} className="min-w-32">
              Stop
            </Button>
          ) : (
            <Button variant="primary" onClick={sort} className="min-w-32">
              Sort
              <kbd
                aria-hidden
                className="rounded border border-black/20 bg-black/10 px-1 font-mono text-[10px]"
              >
                space
              </kbd>
            </Button>
          )}
          <Button onClick={shuffle} disabled={isPlaying}>
            Shuffle
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div style={{ height: 'clamp(320px, calc(100dvh - 260px), 760px)' }}>
          <BarChart frame={frame} maxValue={MAX_VALUE} />
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/70 p-4">
          <SortStatsPanel
            algorithm={algorithm}
            live={frame}
            result={result}
            insight={insight}
            isPlaying={isPlaying}
            size={size}
          />

          <div className="border-t border-[var(--color-line-soft)] pt-4">
            <EducationPanel
              name={algorithm.shortName}
              badge={algorithm.complexity.average}
              blurb={algorithm.blurb}
              facts={[
                { label: "Best case", value: algorithm.complexity.best },
                { label: "Average", value: algorithm.complexity.average },
                { label: "Worst case", value: algorithm.complexity.worst },
                { label: "Space", value: algorithm.complexity.space },
                { label: "Stable", value: algorithm.stable ? "yes" : "no" },
                { label: "In place", value: algorithm.inPlace ? "yes" : "no" },
              ]}
              pseudocode={algorithm.pseudocode}
            />
          </div>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--color-line-soft)] pt-4">
            {[
              { label: 'Comparing', swatch: 'bg-[var(--color-accent)]' },
              { label: 'Moving', swatch: 'bg-[var(--color-goal)]' },
              { label: 'Sorted', swatch: 'bg-[var(--color-start)]' },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]"
              >
                <span className={`h-3 w-3 rounded-[3px] ${item.swatch}`} />
                {item.label}
              </li>
            ))}
          </ul>

          <p className="text-xs leading-relaxed text-[var(--color-ink-faint)]">
            Every algorithm runs at the same operations-per-second, so a slower one genuinely takes
            longer to watch — that is the comparison, not a label. Try bubble sort and merge sort on
            120 bars back to back.
          </p>
          <p className="text-xs leading-relaxed text-[var(--color-ink-faint)]">
            <kbd className="rounded border border-[var(--color-line)] px-1 font-mono">space</kbd>{' '}
            sorts ·{' '}
            <kbd className="rounded border border-[var(--color-line)] px-1 font-mono">R</kbd>{' '}
            shuffles
          </p>
        </aside>
      </div>
    </div>
  )
}

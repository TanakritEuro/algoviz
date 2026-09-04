import { asPercent } from '../../algorithms/pathfinding'
import type { SortAlgorithmEntry, SortInsight, SortResult } from '../../algorithms/sorting'

interface SortStatsPanelProps {
  algorithm: SortAlgorithmEntry
  /** Work done so far by the run on screen. Ticks up while it plays. */
  live: { comparisons: number; swaps: number; writes: number }
  /** The completed run, or null when nothing has been started on this array. */
  result: SortResult | null
  /** How this run measures up against bubble sort on the same array. */
  insight: SortInsight | null
  isPlaying: boolean
  size: number
}

/** Below this the difference is noise, not a finding worth a sentence. */
const NOTABLE = 0.02

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-raised)] px-3 py-2.5">
      <span className="text-[10px] font-medium tracking-[0.09em] text-[var(--color-ink-faint)] uppercase">
        {label}
      </span>
      <span className="font-mono text-lg leading-none text-[var(--color-ink)]">{value}</span>
    </div>
  )
}

export function SortStatsPanel({
  algorithm,
  live,
  result,
  insight,
  isPlaying,
  size,
}: SortStatsPanelProps) {
  // The counters belong to the run being watched, so they read '—' until one
  // starts and then climb with it, rather than jumping to the final total.
  const started = result !== null
  const count = (value: number) => (started ? value.toLocaleString() : '—')

  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Comparisons" value={count(live.comparisons)} />
        <Stat label="Swaps" value={count(live.swaps)} />
        <Stat label="Array writes" value={count(live.writes)} />
        <Stat
          label="Sort time"
          // The algorithm's own runtime, not the animation's. Held back until
          // the run finishes so it cannot be mistaken for elapsed playback.
          value={result && !isPlaying ? `${result.durationMs.toFixed(2)} ms` : '—'}
        />
      </div>

      <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
        {!started ? (
          'Pick an algorithm and hit Sort. Blue bars are being compared, red are moving, green are settled for good.'
        ) : isPlaying ? (
          <>
            <span className="text-[var(--color-ink)]">{algorithm.shortName}</span> is working
            through {size} values —{' '}
            <span className="text-[var(--color-accent)]">
              {live.comparisons.toLocaleString()} comparisons
            </span>{' '}
            so far, of {result.comparisons.toLocaleString()} it will need.
          </>
        ) : (
          <>
            <span className="text-[var(--color-ink)]">{algorithm.shortName}</span> ordered {size}{' '}
            values with{' '}
            <span className="text-[var(--color-accent)]">
              {result.comparisons.toLocaleString()} comparisons
            </span>{' '}
            and{' '}
            <span className="text-[var(--color-goal)]">
              {result.writes.toLocaleString()} array writes
            </span>
            {result.swaps === 0
              ? ' — no swaps at all, because it moves data through a buffer rather than exchanging pairs.'
              : ` (${result.swaps.toLocaleString()} of them swaps).`}
            {insight && !insight.isBaseline && insight.comparisonsSaved > NOTABLE ? (
              <>
                {' That is '}
                <span className="text-[var(--color-start)]">
                  {asPercent(insight.comparisonsSaved)} fewer comparisons
                </span>{' '}
                than bubble sort needed on the same {size} values (
                {insight.baselineComparisons.toLocaleString()}).
              </>
            ) : null}
            {insight?.isBaseline ? (
              <> It is the baseline the other four are measured against.</>
            ) : null}
          </>
        )}
      </p>
    </section>
  )
}

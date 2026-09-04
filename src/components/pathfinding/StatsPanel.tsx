import type {
  AlgorithmEntry,
  HeuristicName,
  RunInsight,
  SearchResult,
} from '../../algorithms/pathfinding'
import { RunSummary } from './RunSummary'

interface StatsPanelProps {
  algorithm: AlgorithmEntry
  result: SearchResult | null
  insight: RunInsight | null
  heuristic: HeuristicName
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-raised)] px-3 py-2.5">
      <span className="text-[10px] font-medium tracking-[0.09em] text-[var(--color-ink-faint)] uppercase">
        {label}
      </span>
      <span
        className={`font-mono text-lg leading-none ${
          muted ? 'text-[var(--color-ink-muted)]' : 'text-[var(--color-ink)]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export function StatsPanel({ algorithm, result, insight, heuristic }: StatsPanelProps) {
  const steps = result && result.found ? result.path.length - 1 : 0

  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="Nodes visited"
          value={result ? result.visitedOrder.length.toLocaleString() : '—'}
          muted={!result}
        />
        <Stat
          label="Path length"
          value={result ? (result.found ? `${steps} steps` : 'none') : '—'}
          muted={!result}
        />
        <Stat
          label="Path cost"
          value={result ? (result.found ? String(result.cost) : '—') : '—'}
          muted={!result}
        />
        <Stat
          label="Search time"
          value={result ? `${result.durationMs.toFixed(2)} ms` : '—'}
          muted={!result}
        />
      </div>

      <RunSummary algorithm={algorithm} heuristic={heuristic} insight={insight} />
    </section>
  )
}

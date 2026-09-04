import { asPercent, type AlgorithmEntry, type HeuristicName, type RunInsight } from '../../algorithms/pathfinding'
import { HEURISTIC_LABELS } from '../../algorithms/pathfinding'

interface RunSummaryProps {
  algorithm: AlgorithmEntry
  heuristic: HeuristicName
  insight: RunInsight | null
}

/** Below this the difference is noise, not a finding worth a sentence. */
const NOTABLE = 0.02

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--color-ink)]">{children}</span>
}

/**
 * The one-line verdict after a run.
 *
 * Every clause is built from numbers actually measured on this board against a
 * Dijkstra run of the same board — so the sentence changes when the result does,
 * and it says "explored 41% more" just as readily as "41% fewer".
 */
export function RunSummary({ algorithm, heuristic, insight }: RunSummaryProps) {
  if (!insight) {
    return (
      <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
        Draw a few walls, then hit Visualize to watch the search unfold.
      </p>
    )
  }

  if (!insight.found) {
    return (
      <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
        <Strong>{algorithm.shortName}</Strong> exhausted every reachable node (
        {insight.nodesExplored.toLocaleString()}) without reaching the target — the walls seal it
        off completely.
      </p>
    )
  }

  const heuristicClause = algorithm.usesHeuristic
    ? ` using the ${HEURISTIC_LABELS[heuristic]} heuristic`
    : ''

  return (
    <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
      <Strong>{algorithm.shortName}</Strong> reached the target in{' '}
      <span className="text-[var(--color-path)]">{insight.steps} steps</span>
      {heuristicClause}, exploring {insight.nodesExplored.toLocaleString()} nodes
      {insight.isBaseline ? (
        <> — the baseline every other algorithm here is measured against.</>
      ) : Math.abs(insight.nodesSaved) < NOTABLE ? (
        <> — about as many as Dijkstra needed on this board.</>
      ) : insight.nodesSaved > 0 ? (
        <>
          {' — '}
          <span className="text-[var(--color-start)]">
            {asPercent(insight.nodesSaved)} fewer
          </span>{' '}
          than Dijkstra explored on the same board.
        </>
      ) : (
        <>
          {' — '}
          <span className="text-[var(--color-goal)]">{asPercent(insight.nodesSaved)} more</span>{' '}
          than Dijkstra explored on the same board.
        </>
      )}
      {/* The second half of the trade: what the saving cost, if anything. */}
      {!insight.isBaseline && insight.costOverhead > NOTABLE ? (
        <>
          {' '}
          The route it settled for costs {insight.cost} against the cheapest{' '}
          {insight.optimalCost} — <Strong>{asPercent(insight.costOverhead)} more expensive</Strong>.
        </>
      ) : null}
      {!insight.isBaseline && insight.costOverhead <= NOTABLE && algorithm.optimality !== 'none' ? (
        <> The route is the cheapest available.</>
      ) : null}
    </p>
  )
}

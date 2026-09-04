import type { SearchResult } from './types'

/**
 * The algorithm every other one is measured against.
 *
 * Dijkstra is the right yardstick because it is the honest baseline: it always
 * returns a cheapest route, and it explores without any hint about where the
 * target is. "Fewer nodes than Dijkstra" is therefore a claim about the value of
 * the heuristic, and "more expensive than Dijkstra" is a claim about what an
 * algorithm gave up to be fast.
 */
export const BASELINE_ALGORITHM_ID = 'dijkstra'

export interface RunInsight {
  found: boolean
  /** Moves from start to target. */
  steps: number
  /** Traversal cost of the route taken, terrain included. */
  cost: number
  nodesExplored: number
  baselineNodes: number
  /**
   * Share of the baseline's exploration avoided, as a fraction.
   * 0.38 means "explored 38% fewer nodes than Dijkstra"; a negative value means
   * it explored more.
   */
  nodesSaved: number
  /** The cheapest cost available on this board, per the baseline. */
  optimalCost: number
  /** How much dearer this route is than the cheapest. 0 means it is optimal. */
  costOverhead: number
  /** True when the run *is* the baseline, so there is nothing to compare to. */
  isBaseline: boolean
}

/**
 * Measures one run against the baseline run on the same board.
 *
 * Both results must come from the same grid, start and end — otherwise the
 * percentages are comparing two different problems and mean nothing.
 */
export function compareToBaseline(
  result: SearchResult,
  baseline: SearchResult,
  isBaseline: boolean,
): RunInsight {
  const steps = result.found ? result.path.length - 1 : 0
  const optimalCost = baseline.found ? baseline.cost : 0

  return {
    found: result.found,
    steps,
    cost: result.cost,
    nodesExplored: result.visitedOrder.length,
    baselineNodes: baseline.visitedOrder.length,
    nodesSaved:
      baseline.visitedOrder.length === 0
        ? 0
        : (baseline.visitedOrder.length - result.visitedOrder.length) /
          baseline.visitedOrder.length,
    optimalCost,
    // A route can only be *dearer* than the cheapest one, never cheaper — but
    // clamping at zero also keeps floating-point noise out of the sentence.
    costOverhead:
      optimalCost === 0 || !result.found ? 0 : Math.max(0, (result.cost - optimalCost) / optimalCost),
    isBaseline,
  }
}

/** Formats a fraction as a whole-number percentage, e.g. 0.384 → "38%". */
export function asPercent(fraction: number): string {
  return `${Math.round(Math.abs(fraction) * 100)}%`
}

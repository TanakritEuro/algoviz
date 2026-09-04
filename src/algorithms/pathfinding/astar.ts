import { bestFirstSearch } from './bestFirst'
import type { PathfindingAlgorithm } from './types'

/**
 * A* — f = g + h.
 *
 * Dijkstra with a sense of direction. Because the heuristic never overestimates
 * the remaining distance (see `heuristics.ts`), A* keeps Dijkstra's guarantee of
 * a cheapest path while refusing to waste expansions on nodes pointing away from
 * the target. On an open board the difference is dramatic; behind a long wall the
 * heuristic misleads it into a dead end first, and the advantage narrows.
 */
export const astar: PathfindingAlgorithm = (grid, start, end, options) =>
  bestFirstSearch({ gWeight: 1, useHeuristic: true }, grid, start, end, options)

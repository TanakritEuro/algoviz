import { bestFirstSearch } from './bestFirst'
import type { PathfindingAlgorithm } from './types'

/**
 * Greedy Best-First Search — f = h.
 *
 * Scores nodes purely on how close they *look* to the target and ignores what
 * the journey has cost. That makes it fast and often startlingly direct, but it
 * will happily accept an expensive or roundabout route, because by the time the
 * cost is paid it has already stopped tracking it. The useful contrast with A*:
 * same heuristic, one term removed, optimality gone.
 */
export const greedyBestFirst: PathfindingAlgorithm = (grid, start, end, options) =>
  bestFirstSearch({ gWeight: 0, useHeuristic: true }, grid, start, end, options)

import { bestFirstSearch } from './bestFirst'
import type { PathfindingAlgorithm } from './types'

/**
 * Dijkstra's algorithm — f = g.
 *
 * Always expands the cheapest-so-far node, which means it grows outward in rings
 * of equal *cost* rather than equal step count. That is what lets it route around
 * heavy terrain that BFS would plough straight through, and it is why the result
 * is guaranteed cheapest. The price is that it has no notion of where the target
 * is: it explores just as eagerly in the wrong direction as the right one.
 */
export const dijkstra: PathfindingAlgorithm = (grid, start, end, options) =>
  bestFirstSearch({ gWeight: 1, useHeuristic: false }, grid, start, end, options)

import type { Coord, HeuristicName } from './types'

export type Heuristic = (from: Coord, to: Coord) => number

/**
 * Distance ignoring walls, counting only orthogonal moves. On a 4-way grid this
 * is *admissible* — it never overestimates, because you cannot reach the target
 * in fewer than |dRow| + |dCol| moves — which is exactly what A* needs to stay
 * optimal. It stays admissible on weighted terrain too, since the cheapest cell
 * still costs 1.
 */
export const manhattan: Heuristic = (from, to) =>
  Math.abs(from.row - to.row) + Math.abs(from.col - to.col)

/**
 * Straight-line distance. Also admissible, but *less informed* on a 4-way grid:
 * it consistently underestimates the true step count (it "allows" diagonals the
 * search cannot take), so A* explores noticeably more nodes with it. Worth
 * toggling between the two to see that trade-off on screen.
 */
export const euclidean: Heuristic = (from, to) =>
  Math.hypot(from.row - to.row, from.col - to.col)

export const HEURISTICS: Record<HeuristicName, Heuristic> = {
  manhattan,
  euclidean,
}

export const HEURISTIC_LABELS: Record<HeuristicName, string> = {
  manhattan: 'Manhattan',
  euclidean: 'Euclidean',
}

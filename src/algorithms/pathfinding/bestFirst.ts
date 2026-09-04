import { getNeighbors, nodeIndex, now, pathCost, reconstructPath, sameCoord } from './grid'
import { HEURISTICS } from './heuristics'
import { MinHeap } from './minHeap'
import type { Coord, Grid, SearchOptions, SearchResult } from './types'

interface QueueEntry {
  index: number
  row: number
  col: number
  priority: number
  /** Insertion order — breaks ties deterministically so runs are reproducible. */
  seq: number
}

export interface BestFirstConfig {
  /**
   * Multiplier on g, the cost accumulated so far.
   * 1 = the path travelled matters (Dijkstra, A*), 0 = it is ignored (Greedy).
   */
  gWeight: number
  /** Whether to add h, the estimated cost remaining. */
  useHeuristic: boolean
}

/**
 * The one search behind Dijkstra, A* and Greedy Best-First.
 *
 * All three repeatedly expand the most promising node in a priority queue; they
 * differ *only* in how "promising" is scored:
 *
 *   Dijkstra   f = g          — cheapest so far; no idea where the target is
 *   A*         f = g + h      — cheapest so far, biased toward the target
 *   Greedy     f = h          — pure beeline; forgets what the trip has cost
 *
 * Writing it once makes the relationship the code's main statement: A* is not a
 * different algorithm from Dijkstra, it is Dijkstra plus a hint, and it collapses
 * back into Dijkstra the moment that hint is zero.
 */
export function bestFirstSearch(
  config: BestFirstConfig,
  grid: Grid,
  start: Coord,
  end: Coord,
  options: SearchOptions = {},
): SearchResult {
  const startedAt = now()
  const cols = grid[0].length
  const total = grid.length * cols
  const heuristic = HEURISTICS[options.heuristic ?? 'manhattan']

  const cameFrom = new Int32Array(total).fill(-1)
  const gScore = new Float64Array(total).fill(Number.POSITIVE_INFINITY)
  // "Closed" = already expanded. Instead of decrease-key we push duplicates and
  // skip stale ones on pop, which is simpler and faster in practice.
  const closed = new Uint8Array(total)
  const visitedOrder: Coord[] = []

  const open = new MinHeap<QueueEntry>((a, b) =>
    a.priority === b.priority ? a.seq - b.seq : a.priority - b.priority,
  )
  let seq = 0

  const estimate = (coord: Coord) => (config.useHeuristic ? heuristic(coord, end) : 0)

  const startIndex = nodeIndex(start, cols)
  gScore[startIndex] = 0
  open.push({
    index: startIndex,
    row: start.row,
    col: start.col,
    priority: estimate(start),
    seq: seq++,
  })

  let found = false

  while (!open.isEmpty()) {
    const current = open.pop() as QueueEntry
    if (closed[current.index]) continue // a stale duplicate; the good one already ran
    closed[current.index] = 1
    visitedOrder.push({ row: current.row, col: current.col })

    if (sameCoord(current, end)) {
      found = true
      break
    }

    for (const neighbor of getNeighbors(grid, current, options)) {
      const index = nodeIndex(neighbor, cols)
      if (closed[index]) continue

      // Terrain weight is the cost of *entering* a cell, so heavy ground makes
      // a route expensive without making it any longer in steps.
      const tentativeG = gScore[current.index] + neighbor.weight
      if (tentativeG >= gScore[index]) continue

      gScore[index] = tentativeG
      cameFrom[index] = current.index
      open.push({
        index,
        row: neighbor.row,
        col: neighbor.col,
        priority: config.gWeight * tentativeG + estimate(neighbor),
        seq: seq++,
      })
    }
  }

  const path = found ? reconstructPath(grid, cameFrom, start, end) : []

  return {
    visitedOrder,
    path,
    found,
    cost: pathCost(grid, path),
    durationMs: now() - startedAt,
  }
}

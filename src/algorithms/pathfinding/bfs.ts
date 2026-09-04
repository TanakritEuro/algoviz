import { getNeighbors, nodeIndex, now, pathCost, reconstructPath, sameCoord } from './grid'
import type { Coord, Grid, PathfindingAlgorithm, SearchOptions, SearchResult } from './types'

/**
 * Breadth-First Search.
 *
 * Explores the grid in rings of equal *step count* from the start, so the first
 * time it reaches the end it has used the fewest possible moves. That makes it
 * optimal on an unweighted grid — and blind to terrain weights, since every edge
 * is treated as costing exactly one step.
 */
export const bfs: PathfindingAlgorithm = (
  grid: Grid,
  start: Coord,
  end: Coord,
  options: SearchOptions = {},
): SearchResult => {
  const startedAt = now()
  const cols = grid[0].length
  const total = grid.length * cols

  const cameFrom = new Int32Array(total).fill(-1)
  const seen = new Uint8Array(total)
  const visitedOrder: Coord[] = []

  // A plain array with a moving head pointer: O(1) dequeue without shift().
  const queue: Coord[] = [start]
  let head = 0
  seen[nodeIndex(start, cols)] = 1

  let found = false

  while (head < queue.length) {
    const current = queue[head]
    head += 1
    // Normalised to a bare coord: the recording is plain data for the UI, not a
    // set of references into the grid the caller handed us.
    visitedOrder.push({ row: current.row, col: current.col })

    if (sameCoord(current, end)) {
      found = true
      break
    }

    for (const neighbor of getNeighbors(grid, current, options)) {
      const index = nodeIndex(neighbor, cols)
      if (seen[index]) continue
      seen[index] = 1
      cameFrom[index] = nodeIndex(current, cols)
      queue.push(neighbor)
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

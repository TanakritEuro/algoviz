import { getNeighbors, nodeIndex, now, pathCost, reconstructPath, sameCoord } from './grid'
import type { Coord, PathfindingAlgorithm, SearchResult } from './types'

/**
 * Depth-First Search.
 *
 * Commits to one direction and follows it until it runs out of room, then backs
 * up and tries the next branch. It will find *a* path if one exists, but it has
 * no reason to be a good one — the route it returns is whatever the first
 * successful dive happened to trace, often wandering the whole board to reach a
 * target a few cells away.
 *
 * Included precisely because it looks wrong on screen: it is the clearest
 * demonstration of why the queue discipline, not the traversal, is what makes
 * BFS and Dijkstra optimal.
 */
export const dfs: PathfindingAlgorithm = (grid, start, end, options = {}): SearchResult => {
  const startedAt = now()
  const cols = grid[0].length
  const total = grid.length * cols

  const cameFrom = new Int32Array(total).fill(-1)
  const visited = new Uint8Array(total)
  const visitedOrder: Coord[] = []

  const stack: Coord[] = [start]
  let found = false

  while (stack.length > 0) {
    const current = stack.pop() as Coord
    const index = nodeIndex(current, cols)
    // Nodes can be stacked more than once before being reached; the first pop wins.
    if (visited[index]) continue
    visited[index] = 1
    visitedOrder.push({ row: current.row, col: current.col })

    if (sameCoord(current, end)) {
      found = true
      break
    }

    const neighbors = getNeighbors(grid, current, options)
    // Reversed so the stack pops neighbours in the same order the other searches
    // visit them — the difference on screen is then the algorithm, not the axes.
    for (let i = neighbors.length - 1; i >= 0; i -= 1) {
      const neighbor = neighbors[i]
      const neighborIndex = nodeIndex(neighbor, cols)
      if (visited[neighborIndex]) continue
      // Overwrite freely: the parent that matters is the one set by the dive that
      // actually reaches this node, which is the last one written before its pop.
      cameFrom[neighborIndex] = index
      stack.push({ row: neighbor.row, col: neighbor.col })
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

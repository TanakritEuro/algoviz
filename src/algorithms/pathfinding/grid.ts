import type { Coord, Grid, GridNode, SearchOptions } from './types'

/**
 * The three costs terrain can take, cheapest first. Three tiers is enough to
 * make cost visibly beat distance on screen without turning the board into a
 * heat map nobody can read. Defined here so generators, the brush and the CSS
 * tiers all agree on what "heavy" means.
 */
export const TERRAIN_WEIGHTS = [2, 5, 9] as const

/** What the manual terrain brush paints. */
export const BRUSH_WEIGHT = 5

export type WeightTier = 'none' | 'light' | 'medium' | 'heavy'

export function weightTier(weight: number): WeightTier {
  if (weight <= 1) return 'none'
  if (weight <= 3) return 'light'
  if (weight <= 6) return 'medium'
  return 'heavy'
}

export function createGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col): GridNode => ({ row, col, isWall: false, weight: 1 })),
  )
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((node) => ({ ...node })))
}

export function nodeKey(coord: Coord): string {
  return `${coord.row},${coord.col}`
}

/** Stable index into a flat array of size rows*cols — used for O(1) bookkeeping. */
export function nodeIndex(coord: Coord, cols: number): number {
  return coord.row * cols + coord.col
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col
}

export function inBounds(grid: Grid, row: number, col: number): boolean {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length
}

const ORTHOGONAL: ReadonlyArray<readonly [number, number]> = [
  [-1, 0], // up
  [0, 1], // right
  [1, 0], // down
  [0, -1], // left
]

const DIAGONAL: ReadonlyArray<readonly [number, number]> = [
  [-1, 1],
  [1, 1],
  [1, -1],
  [-1, -1],
]

/**
 * Walkable neighbours of a node. Walls are excluded here rather than inside each
 * algorithm, so every search shares exactly one definition of "can I go there?".
 */
export function getNeighbors(grid: Grid, node: Coord, options: SearchOptions = {}): GridNode[] {
  const offsets = options.allowDiagonal ? [...ORTHOGONAL, ...DIAGONAL] : ORTHOGONAL
  const neighbors: GridNode[] = []

  for (const [dRow, dCol] of offsets) {
    const row = node.row + dRow
    const col = node.col + dCol
    if (!inBounds(grid, row, col)) continue
    const neighbor = grid[row][col]
    if (neighbor.isWall) continue
    neighbors.push(neighbor)
  }

  return neighbors
}

/**
 * Walks `cameFrom` backwards from `end` to build the path. Returns start → end
 * inclusive, or an empty array when `end` was never reached.
 */
export function reconstructPath(
  grid: Grid,
  cameFrom: Int32Array,
  start: Coord,
  end: Coord,
): Coord[] {
  const cols = grid[0].length
  const path: Coord[] = []
  let current = nodeIndex(end, cols)
  const startIndex = nodeIndex(start, cols)

  while (current !== -1) {
    path.push({ row: Math.floor(current / cols), col: current % cols })
    if (current === startIndex) break
    current = cameFrom[current]
  }

  // We never reached the start, so `end` is unreachable.
  if (path.length === 0 || nodeIndex(path[path.length - 1], cols) !== startIndex) return []

  return path.reverse()
}

/** Total traversal cost of a path: the weight of every node *entered*. */
export function pathCost(grid: Grid, path: Coord[]): number {
  let cost = 0
  for (let i = 1; i < path.length; i += 1) {
    cost += grid[path[i].row][path[i].col].weight
  }
  return cost
}

/** Monotonic clock that works in the browser and in Node-based tests. */
export function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

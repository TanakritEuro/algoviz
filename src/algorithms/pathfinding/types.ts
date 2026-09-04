/**
 * Core types for the pathfinding layer.
 *
 * Everything in `src/algorithms` is deliberately framework-agnostic: no React,
 * no DOM, no timers. An algorithm takes a grid and returns a *recording* of the
 * search (the order nodes were expanded + the resulting path). The UI is then
 * free to replay that recording at whatever speed it likes.
 */

export interface Coord {
  row: number
  col: number
}

export interface GridNode extends Coord {
  isWall: boolean
  /** Traversal cost of entering this node. 1 = normal, >1 = weighted terrain. */
  weight: number
}

export type Grid = GridNode[][]

export type HeuristicName = 'manhattan' | 'euclidean'

export interface SearchOptions {
  /** Only meaningful for heuristic-driven searches (A*, Greedy Best-First). */
  heuristic?: HeuristicName
  /** Allow diagonal movement. Off by default — the classic 4-way grid. */
  allowDiagonal?: boolean
}

export interface SearchResult {
  /** Nodes in the order the algorithm expanded them — this drives the animation. */
  visitedOrder: Coord[]
  /** Start → end inclusive. Empty when no path exists. */
  path: Coord[]
  found: boolean
  /** Sum of the weights of every node entered along the path (start excluded). */
  cost: number
  /** Wall-clock time of the pure search, excluding any rendering. */
  durationMs: number
}

export type PathfindingAlgorithm = (
  grid: Grid,
  start: Coord,
  end: Coord,
  options?: SearchOptions,
) => SearchResult

export type Optimality = 'cost' | 'steps' | 'none'

export interface AlgorithmMeta {
  id: string
  name: string
  /** Short label for tight UI spots, e.g. "A*". */
  shortName: string
  /**
   * What, if anything, the algorithm promises about the route it returns.
   *   'cost'  — always the cheapest route, terrain weights included
   *   'steps' — always the fewest moves, but blind to terrain cost
   *   'none'  — finds a route, makes no claim about it
   */
  optimality: Optimality
  /** Does it take terrain weights into account when choosing where to go? */
  weighted: boolean
  /** Does it consult a heuristic, i.e. should the heuristic picker apply? */
  usesHeuristic: boolean
  /** Plain-English explanation for the education panel. */
  blurb: string
  complexity: { time: string; space: string }
  pseudocode: string[]
}

export interface AlgorithmEntry extends AlgorithmMeta {
  run: PathfindingAlgorithm
}

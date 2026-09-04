import { describe, expect, it } from 'vitest'
import { astar } from './astar'
import { bfs } from './bfs'
import { dfs } from './dfs'
import { dijkstra } from './dijkstra'
import { greedyBestFirst } from './greedy'
import { createGrid, pathCost, sameCoord } from './grid'
import { MinHeap } from './minHeap'
import { parseGrid } from './parse'
import type { Coord, Grid, SearchResult } from './types'

/** Deterministic PRNG, so a failing maze is a maze we can look at again. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomBoard(seed: number, rows = 18, cols = 26) {
  const random = mulberry32(seed)
  const grid = createGrid(rows, cols)
  const start: Coord = { row: 0, col: 0 }
  const end: Coord = { row: rows - 1, col: cols - 1 }

  for (const row of grid) {
    for (const node of row) {
      if (sameCoord(node, start) || sameCoord(node, end)) continue
      const roll = random()
      if (roll < 0.25) node.isWall = true
      else if (roll < 0.45) node.weight = 2 + Math.floor(random() * 8)
    }
  }

  return { grid, start, end }
}

function assertValidPath(grid: Grid, result: SearchResult, start: Coord, end: Coord) {
  expect(result.path[0]).toEqual(start)
  expect(result.path.at(-1)).toEqual(end)
  for (const step of result.path) {
    expect(grid[step.row][step.col].isWall).toBe(false)
  }
  for (let i = 1; i < result.path.length; i += 1) {
    const a = result.path[i - 1]
    const b = result.path[i]
    expect(Math.abs(a.row - b.row) + Math.abs(a.col - b.col)).toBe(1)
  }
  // A path that revisits a node is a bug, however cheap it looks.
  const seen = new Set(result.path.map((coord) => `${coord.row},${coord.col}`))
  expect(seen.size).toBe(result.path.length)
}

describe('MinHeap', () => {
  it('pops items in priority order', () => {
    const heap = new MinHeap<number>((a, b) => a - b)
    for (const value of [5, 3, 9, 1, 7, 1, 8]) heap.push(value)

    const popped: number[] = []
    while (!heap.isEmpty()) popped.push(heap.pop() as number)
    expect(popped).toEqual([1, 1, 3, 5, 7, 8, 9])
  })

  it('agrees with a sorted array on random input', () => {
    const random = mulberry32(42)
    const values = Array.from({ length: 500 }, () => Math.floor(random() * 1000))
    const heap = new MinHeap<number>((a, b) => a - b)
    for (const value of values) heap.push(value)

    const popped: number[] = []
    while (!heap.isEmpty()) popped.push(heap.pop() as number)
    expect(popped).toEqual([...values].sort((a, b) => a - b))
    expect(heap.pop()).toBeUndefined()
  })

  it('tracks its size and peeks without removing', () => {
    const heap = new MinHeap<number>((a, b) => a - b)
    heap.push(4)
    heap.push(2)
    expect(heap.size).toBe(2)
    expect(heap.peek()).toBe(2)
    expect(heap.size).toBe(2)
  })
})

describe('Dijkstra and A* agree', () => {
  // The headline correctness property: A* only earns the right to explore less
  // if it still returns a route of exactly the same cost.
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('return the same path cost on maze seed %i', (seed) => {
    const { grid, start, end } = randomBoard(seed)
    const viaDijkstra = dijkstra(grid, start, end)
    const viaAstar = astar(grid, start, end, { heuristic: 'manhattan' })

    expect(viaAstar.found).toBe(viaDijkstra.found)
    if (!viaDijkstra.found) return

    expect(viaAstar.cost).toBe(viaDijkstra.cost)
    assertValidPath(grid, viaDijkstra, start, end)
    assertValidPath(grid, viaAstar, start, end)
  })

  it('agree regardless of which admissible heuristic A* uses', () => {
    const { grid, start, end } = randomBoard(11)
    const baseline = dijkstra(grid, start, end).cost
    expect(astar(grid, start, end, { heuristic: 'manhattan' }).cost).toBe(baseline)
    expect(astar(grid, start, end, { heuristic: 'euclidean' }).cost).toBe(baseline)
  })

  it('A* explores fewer nodes than Dijkstra on an open board', () => {
    const grid = createGrid(21, 41)
    const start = { row: 10, col: 2 }
    const end = { row: 10, col: 38 }

    const viaDijkstra = dijkstra(grid, start, end)
    const viaAstar = astar(grid, start, end, { heuristic: 'manhattan' })

    expect(viaAstar.cost).toBe(viaDijkstra.cost)
    expect(viaAstar.visitedOrder.length).toBeLessThan(viaDijkstra.visitedOrder.length)
  })

  it('Manhattan is better informed than Euclidean on a 4-way grid', () => {
    const grid = createGrid(21, 41)
    const start = { row: 10, col: 2 }
    const end = { row: 4, col: 38 }

    const manhattanRun = astar(grid, start, end, { heuristic: 'manhattan' })
    const euclideanRun = astar(grid, start, end, { heuristic: 'euclidean' })

    expect(manhattanRun.cost).toBe(euclideanRun.cost)
    expect(manhattanRun.visitedOrder.length).toBeLessThan(euclideanRun.visitedOrder.length)
  })
})

describe('weighted terrain', () => {
  const heavyCorridor = `
    S99999.
    ......E
  `

  it('Dijkstra pays to go around heavy terrain; BFS walks straight through it', () => {
    const { grid, start, end } = parseGrid(heavyCorridor)
    const viaBfs = bfs(grid, start, end)
    const viaDijkstra = dijkstra(grid, start, end)

    // BFS wins on step count...
    expect(viaBfs.path.length - 1).toBeLessThanOrEqual(viaDijkstra.path.length - 1)
    // ...and loses badly on what the trip actually costs.
    expect(viaDijkstra.cost).toBeLessThan(viaBfs.cost)
    expect(pathCost(grid, viaDijkstra.path)).toBe(viaDijkstra.cost)
  })

  it('A* makes the same detour as Dijkstra', () => {
    const { grid, start, end } = parseGrid(heavyCorridor)
    expect(astar(grid, start, end).cost).toBe(dijkstra(grid, start, end).cost)
  })
})

describe('the non-optimal searches', () => {
  it('Greedy finds a valid route but never a cheaper one than Dijkstra', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { grid, start, end } = randomBoard(seed)
      const optimal = dijkstra(grid, start, end)
      const viaGreedy = greedyBestFirst(grid, start, end)

      expect(viaGreedy.found).toBe(optimal.found)
      if (!optimal.found) continue
      assertValidPath(grid, viaGreedy, start, end)
      expect(viaGreedy.cost).toBeGreaterThanOrEqual(optimal.cost)
    }
  })

  it('DFS wanders the board to reach a target one cell away', () => {
    // The target sits directly below the start. BFS takes the single step; DFS
    // commits to its first direction and tours the whole board before coming
    // back for it. This is the behaviour the visualiser is meant to make obvious.
    const { grid, start, end } = parseGrid(`
      S....
      E....
      .....
    `)
    const viaDfs = dfs(grid, start, end)
    const viaBfs = bfs(grid, start, end)

    expect(viaDfs.found).toBe(true)
    assertValidPath(grid, viaDfs, start, end)
    expect(viaBfs.path).toHaveLength(2)
    expect(viaDfs.path.length).toBeGreaterThan(6)
  })

  it('DFS is never shorter than BFS, and usually much longer', () => {
    // The guarantee only runs one way: DFS finding an optimal route on some
    // board is luck, not a property, so the assertion has to allow for it.
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { grid, start, end } = randomBoard(seed)
      const viaBfs = bfs(grid, start, end)
      const viaDfs = dfs(grid, start, end)
      if (!viaBfs.found) continue
      expect(viaDfs.path.length).toBeGreaterThanOrEqual(viaBfs.path.length)
    }
  })

  it('DFS still produces a walkable path through a maze', () => {
    for (const seed of [3, 6, 9]) {
      const { grid, start, end } = randomBoard(seed)
      const result = dfs(grid, start, end)
      if (!result.found) continue
      assertValidPath(grid, result, start, end)
    }
  })
})

describe('every algorithm', () => {
  const ALGORITHMS = { bfs, dijkstra, astar, greedy: greedyBestFirst, dfs }
  const NAMES = Object.keys(ALGORITHMS) as Array<keyof typeof ALGORITHMS>

  it.each(NAMES)('%s reports failure when the target is sealed off', (name) => {
    const { grid, start, end } = parseGrid(`
      S.#.
      ..#E
    `)
    const result = ALGORITHMS[name](grid, start, end)
    expect(result.found).toBe(false)
    expect(result.path).toEqual([])
  })

  it.each(NAMES)('%s agrees start and end are reachable when they are', (name) => {
    const { grid, start, end } = randomBoard(2)
    const reachable = bfs(grid, start, end).found
    expect(ALGORITHMS[name](grid, start, end).found).toBe(reachable)
  })

  it.each(NAMES)('%s never mutates the grid it was given', (name) => {
    const { grid, start, end } = randomBoard(5)
    const before = JSON.stringify(grid)
    ALGORITHMS[name](grid, start, end)
    expect(JSON.stringify(grid)).toBe(before)
  })
})

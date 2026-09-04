import { describe, expect, it } from 'vitest'
import { bfs } from './bfs'
import { dijkstra } from './dijkstra'
import { randomTerrain, randomWalls, recursiveDivisionMaze } from './generators'
import { createGrid, sameCoord, TERRAIN_WEIGHTS } from './grid'
import type { Coord, Grid } from './types'
import { seededRandom } from '../../lib/random'

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function blankBoard(rows = 21, cols = 39) {
  return {
    grid: createGrid(rows, cols),
    start: { row: 10, col: 3 } as Coord,
    end: { row: 10, col: 35 } as Coord,
  }
}

function countWalls(grid: Grid): number {
  return grid.reduce((total, row) => total + row.filter((node) => node.isWall).length, 0)
}

function countWeighted(grid: Grid): number {
  return grid.reduce((total, row) => total + row.filter((node) => node.weight > 1).length, 0)
}

describe('recursive division maze', () => {
  it.each(SEEDS)('leaves a solvable board on seed %i', (seed) => {
    const { grid, start, end } = blankBoard()
    const maze = recursiveDivisionMaze(grid, start, end, seededRandom(seed))

    // The whole point of the algorithm: connectivity is structural, not luck.
    expect(bfs(maze, start, end).found).toBe(true)
  })

  it('actually builds walls', () => {
    const { grid, start, end } = blankBoard()
    const maze = recursiveDivisionMaze(grid, start, end, seededRandom(1))
    expect(countWalls(maze)).toBeGreaterThan(40)
  })

  it('never walls in the endpoints', () => {
    for (const seed of SEEDS) {
      const { grid, start, end } = blankBoard()
      const maze = recursiveDivisionMaze(grid, start, end, seededRandom(seed))
      expect(maze[start.row][start.col].isWall).toBe(false)
      expect(maze[end.row][end.col].isWall).toBe(false)
    }
  })

  it('is reproducible from its seed, and different between seeds', () => {
    const { grid, start, end } = blankBoard()
    const a = recursiveDivisionMaze(grid, start, end, seededRandom(7))
    const b = recursiveDivisionMaze(grid, start, end, seededRandom(7))
    const c = recursiveDivisionMaze(grid, start, end, seededRandom(8))

    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c))
  })

  it('does not mutate the board it was given', () => {
    const { grid, start, end } = blankBoard()
    const before = JSON.stringify(grid)
    recursiveDivisionMaze(grid, start, end, seededRandom(3))
    expect(JSON.stringify(grid)).toBe(before)
  })

  it('preserves existing terrain weights', () => {
    const { grid, start, end } = blankBoard()
    grid[5][5].weight = 9
    const maze = recursiveDivisionMaze(grid, start, end, seededRandom(2))
    expect(maze[5][5].weight).toBe(9)
  })

  it('survives a board too small to have an interior', () => {
    // A 2x2 board is all border. Nothing to divide, but the endpoints still have
    // to come back walkable rather than buried under the outer ring.
    const grid = createGrid(2, 2)
    const start = { row: 0, col: 0 }
    const end = { row: 1, col: 1 }

    expect(() => recursiveDivisionMaze(grid, start, end, seededRandom(1))).not.toThrow()
    const maze = recursiveDivisionMaze(grid, start, end, seededRandom(1))
    expect(maze[start.row][start.col].isWall).toBe(false)
    expect(maze[end.row][end.col].isWall).toBe(false)
  })

  // The bug this catches: the gap punched in each wall used to be chosen from
  // the range *including* the enclosing ring. When a board's row or column count
  // put the outer border on an odd index, the gap could land on that border —
  // already a wall — so the wall had no opening at all and sealed off a whole
  // region. A 21x39 board never triggers it; a 24x39 board (what the app
  // actually renders at 1440px) fails about half the time.
  const SHAPES: Array<[number, number]> = [
    [21, 39], // odd  x odd
    [24, 39], // even x odd  — the shape that shipped broken
    [21, 40], // odd  x even
    [24, 40], // even x even
    [20, 20],
    [13, 61],
    [34, 65], // the largest the board can be
    [8, 10], // the smallest
  ]

  it.each(SHAPES)('stays solvable on a %ix%i board, whatever the parity', (rows, cols) => {
    const start = { row: Math.floor(rows / 2), col: Math.max(1, Math.floor(cols * 0.2)) }
    const end = { row: Math.floor(rows / 2), col: Math.min(cols - 2, Math.floor(cols * 0.8)) }

    for (const seed of SEEDS) {
      const maze = recursiveDivisionMaze(createGrid(rows, cols), start, end, seededRandom(seed))
      expect(bfs(maze, start, end).found).toBe(true)
    }
  })

  it.each(SHAPES)('leaves most of a %ix%i board reachable, not a sealed pocket', (rows, cols) => {
    // Solvable is not enough: an endpoint could sit in a small sealed room that
    // happens to contain both. The maze should open up most of the board.
    const start = { row: Math.floor(rows / 2), col: Math.max(1, Math.floor(cols * 0.2)) }
    const end = { row: Math.floor(rows / 2), col: Math.min(cols - 2, Math.floor(cols * 0.8)) }
    const interior = (rows - 2) * (cols - 2)

    for (const seed of SEEDS) {
      const maze = recursiveDivisionMaze(createGrid(rows, cols), start, end, seededRandom(seed))
      const reachable = bfs(maze, start, { row: -1, col: -1 }).visitedOrder.length
      const open = maze.flat().filter((node) => !node.isWall).length
      // Every open cell should be reachable from the start — that is what
      // "connected by construction" actually claims.
      expect(reachable).toBe(open)
      expect(open).toBeGreaterThan(interior * 0.3)
    }
  })

  it('keeps endpoints reachable wherever they are placed, including on wall parity', () => {
    // Both-even coordinates are the case the carve-a-neighbour rule exists for.
    const placements: Array<[Coord, Coord]> = [
      [{ row: 10, col: 4 }, { row: 4, col: 30 }],
      [{ row: 2, col: 2 }, { row: 18, col: 36 }],
      [{ row: 0, col: 0 }, { row: 20, col: 38 }],
      [{ row: 11, col: 5 }, { row: 9, col: 33 }],
      [{ row: 6, col: 12 }, { row: 6, col: 13 }],
    ]

    for (const [start, end] of placements) {
      for (const seed of SEEDS) {
        const maze = recursiveDivisionMaze(createGrid(21, 39), start, end, seededRandom(seed))
        expect(bfs(maze, start, end).found).toBe(true)
      }
    }
  })
})

describe('random walls', () => {
  it.each(SEEDS)('produces a solvable board on seed %i', (seed) => {
    const { grid, start, end } = blankBoard()
    const board = randomWalls(grid, start, end, seededRandom(seed))
    expect(bfs(board, start, end).found).toBe(true)
  })

  it('leaves the endpoints clear', () => {
    const { grid, start, end } = blankBoard()
    const board = randomWalls(grid, start, end, seededRandom(4))
    expect(board[start.row][start.col].isWall).toBe(false)
    expect(board[end.row][end.col].isWall).toBe(false)
  })

  it('replaces previous walls rather than adding to them', () => {
    const { grid, start, end } = blankBoard()
    for (const node of grid[0]) node.isWall = true
    const board = randomWalls(grid, start, end, seededRandom(6))
    // The old solid row must be gone, not merely built upon.
    expect(board[0].every((node) => node.isWall)).toBe(false)
  })
})

describe('random terrain', () => {
  it('weights a meaningful share of the board', () => {
    const { grid, start, end } = blankBoard()
    const board = randomTerrain(grid, start, end, seededRandom(1))
    const weighted = countWeighted(board)
    expect(weighted).toBeGreaterThan(20)
    expect(weighted).toBeLessThan(board.length * board[0].length)
  })

  it('only ever uses the declared terrain costs', () => {
    const { grid, start, end } = blankBoard()
    const board = randomTerrain(grid, start, end, seededRandom(5))
    for (const row of board) {
      for (const node of row) {
        if (node.weight === 1) continue
        expect(TERRAIN_WEIGHTS).toContain(node.weight)
      }
    }
  })

  it('never weights a wall, a start or an end', () => {
    const { grid, start, end } = blankBoard()
    grid[4][10].isWall = true
    grid[4][11].isWall = true
    const board = randomTerrain(grid, start, end, seededRandom(3))

    for (const row of board) {
      for (const node of row) {
        if (node.isWall) expect(node.weight).toBe(1)
      }
    }
    expect(board[start.row][start.col].weight).toBe(1)
    expect(board[end.row][end.col].weight).toBe(1)
  })

  it('leaves walls exactly as it found them', () => {
    const { grid, start, end } = blankBoard()
    const maze = recursiveDivisionMaze(grid, start, end, seededRandom(2))
    const withTerrain = randomTerrain(maze, start, end, seededRandom(2))

    for (let row = 0; row < maze.length; row += 1) {
      for (let col = 0; col < maze[0].length; col += 1) {
        expect(withTerrain[row][col].isWall).toBe(maze[row][col].isWall)
      }
    }
  })

  it('replaces previous terrain rather than layering on it', () => {
    const { grid, start, end } = blankBoard()
    const first = randomTerrain(grid, start, end, seededRandom(1))
    const second = randomTerrain(first, start, end, seededRandom(2))
    expect(JSON.stringify(second)).not.toBe(JSON.stringify(first))
    // Cost stays in range: two passes must not compound into 4 or 81.
    for (const row of second) {
      for (const node of row) {
        if (node.weight > 1) expect(TERRAIN_WEIGHTS).toContain(node.weight)
      }
    }
  })
})

describe('terrain makes cost and distance disagree', () => {
  it('gives Dijkstra a cheaper route than BFS on an open weighted board', () => {
    // The scenario the whole weighted-terrain feature exists to produce: a board
    // where the cheapest route is not the one with the fewest steps. It needs an
    // *open* board — a perfect maze has only one route, so on a maze every
    // algorithm is forced into the same answer and there is nothing to compare.
    let disagreements = 0

    for (const seed of SEEDS) {
      const { grid, start, end } = blankBoard()
      const board = randomTerrain(grid, start, end, seededRandom(seed))

      const viaBfs = bfs(board, start, end)
      const viaDijkstra = dijkstra(board, start, end)
      expect(viaBfs.found).toBe(true)
      expect(viaDijkstra.found).toBe(true)

      // Dijkstra can never be beaten on cost; BFS can never be beaten on steps.
      expect(viaDijkstra.cost).toBeLessThanOrEqual(viaBfs.cost)
      expect(viaBfs.path.length).toBeLessThanOrEqual(viaDijkstra.path.length)

      if (viaDijkstra.cost < viaBfs.cost) disagreements += 1
    }

    // Not every seed has to disagree, but a feature that never changes the
    // answer on any of ten boards would not be worth shipping.
    expect(disagreements).toBeGreaterThan(SEEDS.length / 2)
  })

  it('leaves a maze solvable once terrain is layered onto it', () => {
    for (const seed of SEEDS) {
      const { grid, start, end } = blankBoard()
      const random = seededRandom(seed)
      const board = randomTerrain(
        recursiveDivisionMaze(grid, start, end, random),
        start,
        end,
        random,
      )
      expect(dijkstra(board, start, end).found).toBe(true)
    }
  })

  it('keeps endpoints walkable through both passes', () => {
    for (const seed of SEEDS) {
      const { grid, start, end } = blankBoard()
      const random = seededRandom(seed)
      const board = randomTerrain(recursiveDivisionMaze(grid, start, end, random), start, end, random)

      for (const cell of [start, end]) {
        expect(board[cell.row][cell.col].isWall).toBe(false)
        expect(board[cell.row][cell.col].weight).toBe(1)
      }
      expect(sameCoord(start, end)).toBe(false)
    }
  })
})

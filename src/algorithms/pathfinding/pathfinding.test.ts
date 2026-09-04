import { describe, expect, it } from 'vitest'
import { bfs } from './bfs'
import { createGrid, getNeighbors, pathCost, sameCoord } from './grid'
import { parseGrid } from './parse'

describe('grid helpers', () => {
  it('creates a grid of the requested shape with sane defaults', () => {
    const grid = createGrid(3, 5)
    expect(grid).toHaveLength(3)
    expect(grid[0]).toHaveLength(5)
    expect(grid[2][4]).toEqual({ row: 2, col: 4, isWall: false, weight: 1 })
  })

  it('returns four orthogonal neighbours in open space and clips at edges', () => {
    const grid = createGrid(3, 3)
    expect(getNeighbors(grid, { row: 1, col: 1 })).toHaveLength(4)
    expect(getNeighbors(grid, { row: 0, col: 0 })).toHaveLength(2)
  })

  it('never returns a wall as a neighbour', () => {
    const grid = createGrid(3, 3)
    grid[0][1].isWall = true
    const neighbors = getNeighbors(grid, { row: 1, col: 1 })
    expect(neighbors).toHaveLength(3)
    expect(neighbors.some((n) => n.row === 0 && n.col === 1)).toBe(false)
  })

  it('includes diagonals only when asked', () => {
    const grid = createGrid(3, 3)
    expect(getNeighbors(grid, { row: 1, col: 1 }, { allowDiagonal: true })).toHaveLength(8)
  })
})

describe('parseGrid', () => {
  it('reads walls, weights and endpoints out of an ASCII map', () => {
    const { grid, start, end } = parseGrid(`
      S.#
      .5E
    `)
    expect(start).toEqual({ row: 0, col: 0 })
    expect(end).toEqual({ row: 1, col: 2 })
    expect(grid[0][2].isWall).toBe(true)
    expect(grid[1][1].weight).toBe(5)
  })
})

describe('bfs', () => {
  it('finds the minimum number of steps on an open grid', () => {
    const { grid, start, end } = parseGrid(`
      S...
      ....
      ...E
    `)
    const result = bfs(grid, start, end)

    expect(result.found).toBe(true)
    // 3 columns + 2 rows of travel = 5 moves, so 6 nodes including the start.
    expect(result.path).toHaveLength(6)
    expect(result.path[0]).toEqual(start)
    expect(result.path.at(-1)).toEqual(end)
  })

  it('produces a contiguous path of walkable nodes', () => {
    const { grid, start, end } = parseGrid(`
      S.....
      ####..
      ....#.
      .E....
    `)
    const result = bfs(grid, start, end)

    expect(result.found).toBe(true)
    for (const step of result.path) {
      expect(grid[step.row][step.col].isWall).toBe(false)
    }
    for (let i = 1; i < result.path.length; i += 1) {
      const a = result.path[i - 1]
      const b = result.path[i]
      expect(Math.abs(a.row - b.row) + Math.abs(a.col - b.col)).toBe(1)
    }
  })

  it('reports no path when the end is walled off', () => {
    const { grid, start, end } = parseGrid(`
      S.#.
      ..#E
    `)
    const result = bfs(grid, start, end)

    expect(result.found).toBe(false)
    expect(result.path).toEqual([])
    expect(result.cost).toBe(0)
  })

  it('expands the start first and stops as soon as the end is reached', () => {
    const { grid, start, end } = parseGrid(`
      S..
      ...
      ..E
    `)
    const result = bfs(grid, start, end)

    expect(result.visitedOrder[0]).toEqual(start)
    expect(result.visitedOrder.at(-1)).toEqual(end)
    expect(result.visitedOrder.filter((c) => sameCoord(c, end))).toHaveLength(1)
  })

  it('ignores terrain weight — it optimises steps, not cost', () => {
    // The direct route runs through expensive terrain; a cost-aware search would
    // detour, but BFS takes the shorter-in-steps path regardless.
    const { grid, start, end } = parseGrid(`
      S9E
      ...
    `)
    const result = bfs(grid, start, end)

    expect(result.path).toHaveLength(3)
    expect(pathCost(grid, result.path)).toBe(10)
  })
})

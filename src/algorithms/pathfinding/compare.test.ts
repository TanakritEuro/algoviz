import { describe, expect, it } from 'vitest'
import { astar } from './astar'
import { asPercent, compareToBaseline } from './compare'
import { dfs } from './dfs'
import { dijkstra } from './dijkstra'
import { greedyBestFirst } from './greedy'
import { randomTerrain } from './generators'
import { createGrid } from './grid'
import { parseGrid } from './parse'
import { seededRandom } from '../../lib/random'

function openBoard(rows = 21, cols = 41) {
  return {
    grid: createGrid(rows, cols),
    start: { row: 10, col: 3 },
    end: { row: 4, col: 37 },
  }
}

describe('compareToBaseline', () => {
  it('reports how much exploration A* saved over Dijkstra', () => {
    const { grid, start, end } = openBoard()
    const baseline = dijkstra(grid, start, end)
    const insight = compareToBaseline(astar(grid, start, end), baseline, false)

    expect(insight.found).toBe(true)
    expect(insight.nodesSaved).toBeGreaterThan(0)
    expect(insight.nodesExplored).toBeLessThan(insight.baselineNodes)
    // A* is optimal, so it saves work without paying for it.
    expect(insight.costOverhead).toBe(0)
    expect(insight.cost).toBe(insight.optimalCost)
  })

  it('reports a negative saving when an algorithm explores more', () => {
    const { grid, start, end } = openBoard()
    const baseline = dijkstra(grid, start, end)
    // Comparing the baseline against a deliberately smaller run: the sign of
    // nodesSaved has to flip, or the sentence would claim a saving that is a loss.
    const cheaper = greedyBestFirst(grid, start, end)
    const insight = compareToBaseline(baseline, cheaper, false)

    expect(insight.nodesSaved).toBeLessThan(0)
  })

  it('charges Greedy for the detour it takes on weighted ground', () => {
    const { grid, start, end } = openBoard()
    const board = randomTerrain(grid, start, end, seededRandom(4))
    const baseline = dijkstra(board, start, end)
    const insight = compareToBaseline(greedyBestFirst(board, start, end), baseline, false)

    expect(insight.optimalCost).toBe(baseline.cost)
    // Greedy ignores accumulated cost, so on weighted ground it should land on a
    // dearer route — and the overhead must be reported, not rounded away.
    expect(insight.cost).toBeGreaterThan(insight.optimalCost)
    expect(insight.costOverhead).toBeGreaterThan(0)
  })

  it('never reports a route as cheaper than the cheapest', () => {
    const { grid, start, end } = openBoard()
    const baseline = dijkstra(grid, start, end)

    for (const algorithm of [astar, dfs, greedyBestFirst, dijkstra]) {
      const insight = compareToBaseline(algorithm(grid, start, end), baseline, false)
      expect(insight.costOverhead).toBeGreaterThanOrEqual(0)
    }
  })

  it('flags the baseline as having nothing to compare against', () => {
    const { grid, start, end } = openBoard()
    const baseline = dijkstra(grid, start, end)
    const insight = compareToBaseline(baseline, baseline, true)

    expect(insight.isBaseline).toBe(true)
    expect(insight.nodesSaved).toBe(0)
    expect(insight.costOverhead).toBe(0)
  })

  it('stays finite when the target is unreachable', () => {
    const { grid, start, end } = parseGrid(`
      S.#.
      ..#E
    `)
    const baseline = dijkstra(grid, start, end)
    const insight = compareToBaseline(dfs(grid, start, end), baseline, false)

    expect(insight.found).toBe(false)
    expect(insight.steps).toBe(0)
    expect(Number.isFinite(insight.nodesSaved)).toBe(true)
    expect(Number.isFinite(insight.costOverhead)).toBe(true)
    expect(insight.costOverhead).toBe(0)
  })

  it('stays finite when start and target are the same cell', () => {
    const grid = createGrid(9, 9)
    const cell = { row: 4, col: 4 }
    const baseline = dijkstra(grid, cell, cell)
    const insight = compareToBaseline(astar(grid, cell, cell), baseline, false)

    expect(insight.optimalCost).toBe(0)
    expect(insight.costOverhead).toBe(0)
    expect(Number.isFinite(insight.nodesSaved)).toBe(true)
  })
})

describe('asPercent', () => {
  it('renders a fraction as a whole-number percentage', () => {
    expect(asPercent(0.384)).toBe('38%')
    expect(asPercent(0.385)).toBe('39%')
    expect(asPercent(1)).toBe('100%')
    expect(asPercent(0)).toBe('0%')
  })

  it('drops the sign, because the wording carries the direction', () => {
    expect(asPercent(-0.5)).toBe('50%')
  })
})

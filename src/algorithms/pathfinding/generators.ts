import { bfs } from './bfs'
import { cloneGrid, inBounds, nodeKey, sameCoord, TERRAIN_WEIGHTS } from './grid'
import type { Coord, Grid } from './types'
import { pickOne, randomInt, type Random } from '../../lib/random'

/**
 * A generator takes the current board and returns a new one. It never mutates
 * its input — same contract as the search algorithms, for the same reason: the
 * UI can hold on to the old board (to compare, to undo) without surprises.
 *
 * Each generator changes one axis and leaves the other alone, so "maze" and
 * "terrain" compose: generate a maze, then scatter terrain through it.
 */
export type BoardGenerator = (grid: Grid, start: Coord, end: Coord, random: Random) => Grid

function clearWalls(grid: Grid): Grid {
  const next = cloneGrid(grid)
  for (const row of next) for (const node of row) node.isWall = false
  return next
}

/** Every index of the given parity in [from, to]. */
function indicesWithParity(from: number, to: number, parity: 0 | 1): number[] {
  const out: number[] = []
  for (let i = from; i <= to; i += 1) if (Math.abs(i % 2) === parity) out.push(i)
  return out
}

/**
 * Recursive division.
 *
 * Start with an empty room. Draw a wall across it, punch one gap in that wall,
 * then recurse into the two halves.
 *
 * The parity rule — walls only on *even* rows and columns, gaps only on *odd*
 * ones — is what makes it work, and it is not decoration. Without it two
 * perpendicular walls from sibling chambers can meet at a gap and seal it from
 * all four sides; the gap stays open and reaches nothing. With it, a gap at an
 * odd coordinate always has odd-coordinate neighbours, and no wall can ever sit
 * on those. Every cell with both coordinates odd is therefore guaranteed open,
 * and the board is connected by construction rather than by luck.
 */
export const recursiveDivisionMaze: BoardGenerator = (grid, start, end, random) => {
  const next = clearWalls(grid)
  const rows = next.length
  const cols = next[0].length

  // The outer ring is the first chamber wall; the parity scheme is defined
  // relative to it, so it has to be there.
  for (let col = 0; col < cols; col += 1) {
    next[0][col].isWall = true
    next[rows - 1][col].isWall = true
  }
  for (let row = 0; row < rows; row += 1) {
    next[row][0].isWall = true
    next[row][cols - 1].isWall = true
  }

  const divide = (top: number, bottom: number, left: number, right: number): void => {
    if (bottom < top || right < left) return

    const height = bottom - top + 1
    const width = right - left + 1
    const horizontal = height === width ? random() < 0.5 : height > width

    if (horizontal) {
      const wallRows = indicesWithParity(top, bottom, 0)
      // The gap must be a cell *inside* the chamber. Picking from the enclosing
      // ring (left-1 / right+1) can land it on the outer border, which is already
      // a wall — the "gap" would then be solid and the wall would seal the room
      // instead of splitting it. That only bites when the board's row or column
      // count makes a border land on an odd index, which is why it survived a
      // suite that only ever tested one board shape.
      const gapCols = indicesWithParity(left, right, 1)
      if (wallRows.length === 0 || gapCols.length === 0) return

      const wallRow = pickOne(random, wallRows)
      const gapCol = pickOne(random, gapCols)
      for (let col = left - 1; col <= right + 1; col += 1) {
        if (col !== gapCol) next[wallRow][col].isWall = true
      }

      divide(top, wallRow - 1, left, right)
      divide(wallRow + 1, bottom, left, right)
    } else {
      const wallCols = indicesWithParity(left, right, 0)
      // Interior only — same reason as above.
      const gapRows = indicesWithParity(top, bottom, 1)
      if (wallCols.length === 0 || gapRows.length === 0) return

      const wallCol = pickOne(random, wallCols)
      const gapRow = pickOne(random, gapRows)
      for (let row = top - 1; row <= bottom + 1; row += 1) {
        if (row !== gapRow) next[row][wallCol].isWall = true
      }

      divide(top, bottom, left, wallCol - 1)
      divide(top, bottom, wallCol + 1, right)
    }
  }

  divide(1, rows - 2, 1, cols - 2)

  // The endpoints go wherever the user put them, including on top of a wall.
  // Carving one open is safe on its own *unless* both its coordinates are even,
  // which is the one case where none of its neighbours is guaranteed open — so
  // there we carve a neighbour too. That neighbour has an odd coordinate, and so
  // borders an odd/odd cell, which the parity rule promises is open.
  for (const cell of [start, end]) {
    next[cell.row][cell.col].isWall = false
    if (cell.row % 2 === 0 && cell.col % 2 === 0) {
      const neighbor = [
        { row: cell.row - 1, col: cell.col },
        { row: cell.row + 1, col: cell.col },
        { row: cell.row, col: cell.col - 1 },
        { row: cell.row, col: cell.col + 1 },
      ].find((candidate) => inBounds(next, candidate.row, candidate.col))
      if (neighbor) next[neighbor.row][neighbor.col].isWall = false
    }
  }

  return next
}

const WALL_DENSITY = 0.28
const SOLVABLE_ATTEMPTS = 12

/**
 * Scattered obstacles. Unlike recursive division this has no structural reason
 * to stay connected, so we generate, check with the BFS we already have, and try
 * again — reusing the search as a test of the board is cheaper and more honest
 * than a second connectivity implementation that could disagree with it.
 */
export const randomWalls: BoardGenerator = (grid, start, end, random) => {
  let last = grid

  for (let attempt = 0; attempt < SOLVABLE_ATTEMPTS; attempt += 1) {
    const next = clearWalls(grid)
    for (const row of next) {
      for (const node of row) {
        if (sameCoord(node, start) || sameCoord(node, end)) continue
        node.isWall = random() < WALL_DENSITY
      }
    }
    last = next
    if (bfs(next, start, end).found) return next
  }

  // Twelve unlucky rolls in a row: hand back the last board anyway. The app
  // reports "no path" perfectly well, and a wedged button would be worse.
  return last
}

const BLOB_MIN = 6
const BLOB_MAX = 34

/**
 * Weighted terrain: patches of ground that cost more to cross.
 *
 * Grown as blobs from random seed points rather than sprinkled per-cell, because
 * isolated expensive pixels are noise — a search routes around them without the
 * viewer ever seeing why. Contiguous patches are what make Dijkstra visibly bend
 * around a cost that BFS walks straight through.
 */
export const randomTerrain: BoardGenerator = (grid, start, end, random) => {
  const next = cloneGrid(grid)
  for (const row of next) for (const node of row) node.weight = 1

  const rows = next.length
  const cols = next[0].length
  const blobCount = Math.max(3, Math.round((rows * cols) / 110))

  for (let blob = 0; blob < blobCount; blob += 1) {
    const weight = pickOne(random, TERRAIN_WEIGHTS)
    const target = randomInt(random, BLOB_MIN, BLOB_MAX)
    const origin: Coord = {
      row: randomInt(random, 0, rows - 1),
      col: randomInt(random, 0, cols - 1),
    }

    // Flood outward from the seed, taking neighbours in a shuffled order so the
    // patch comes out ragged instead of a perfect diamond.
    const frontier: Coord[] = [origin]
    const claimed = new Set<string>()

    while (frontier.length > 0 && claimed.size < target) {
      const index = Math.floor(random() * frontier.length)
      const cell = frontier.splice(index, 1)[0]
      const key = nodeKey(cell)
      if (claimed.has(key)) continue
      claimed.add(key)

      const node = next[cell.row][cell.col]
      // Terrain is a property of open ground: walls and endpoints keep their own
      // meaning, and a weighted wall would be a cost nobody can ever pay.
      if (!node.isWall && !sameCoord(cell, start) && !sameCoord(cell, end)) {
        node.weight = weight
      }

      for (const [dRow, dCol] of [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ]) {
        const row = cell.row + dRow
        const col = cell.col + dCol
        if (!inBounds(next, row, col)) continue
        if (claimed.has(`${row},${col}`)) continue
        frontier.push({ row, col })
      }
    }
  }

  return next
}

export interface GeneratorEntry {
  id: string
  label: string
  /** One line for the button's tooltip — what this actually does to the board. */
  hint: string
  run: BoardGenerator
}

export const BOARD_GENERATORS: GeneratorEntry[] = [
  {
    id: 'maze',
    label: 'Maze',
    hint: 'Recursive division — always solvable, by construction',
    run: recursiveDivisionMaze,
  },
  {
    id: 'walls',
    label: 'Random walls',
    hint: 'Scattered obstacles, re-rolled until a route exists',
    run: randomWalls,
  },
  {
    id: 'terrain',
    label: 'Terrain',
    hint: 'Patches of costly ground — where Dijkstra and A* earn their keep',
    run: randomTerrain,
  },
]

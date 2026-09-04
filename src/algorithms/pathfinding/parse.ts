import { createGrid } from './grid'
import type { Coord, Grid } from './types'

export interface ParsedGrid {
  grid: Grid
  start: Coord
  end: Coord
}

/**
 * Builds a grid from an ASCII map. Handy for tests and for hand-authored demo
 * mazes, and much easier to read in a diff than nested array literals.
 *
 *   '.' walkable   '#' wall   'S' start   'E' end   '2'-'9' weighted terrain
 */
export function parseGrid(ascii: string): ParsedGrid {
  const lines = ascii
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const rows = lines.length
  const cols = lines[0].length
  if (lines.some((line) => line.length !== cols)) {
    throw new Error('parseGrid: every row must be the same width')
  }

  const grid = createGrid(rows, cols)
  let start: Coord | null = null
  let end: Coord | null = null

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const char = lines[row][col]
      const node = grid[row][col]
      if (char === '#') node.isWall = true
      else if (char === 'S') start = { row, col }
      else if (char === 'E') end = { row, col }
      else if (char >= '2' && char <= '9') node.weight = Number(char)
    }
  }

  if (!start || !end) throw new Error('parseGrid: map must contain both S and E')
  return { grid, start, end }
}

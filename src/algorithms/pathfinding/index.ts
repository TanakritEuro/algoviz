import { astar } from './astar'
import { bfs } from './bfs'
import { dfs } from './dfs'
import { dijkstra } from './dijkstra'
import { greedyBestFirst } from './greedy'
import type { AlgorithmEntry } from './types'

/**
 * The single source of truth for "which algorithms exist". The dropdown, the
 * education panel and the stats summary all read from here, so adding an
 * algorithm is one entry — no UI changes required.
 */
export const PATHFINDING_ALGORITHMS: AlgorithmEntry[] = [
  {
    id: 'bfs',
    name: 'Breadth-First Search',
    shortName: 'BFS',
    optimality: 'steps',
    weighted: false,
    usesHeuristic: false,
    blurb:
      'Explores the grid in expanding rings, visiting every node one step away before any node two steps away. Because it never skips ahead, the first time it touches the target it has used the fewest possible moves. It treats every cell as equally cheap, so heavy terrain does not slow it down — or steer it away.',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    pseudocode: [
      'queue ← [start]',
      'seen ← {start}',
      'while queue is not empty:',
      '    current ← queue.dequeue()',
      '    if current is end: return path',
      '    for neighbor in neighbors(current):',
      '        if neighbor in seen: continue',
      '        seen.add(neighbor)',
      '        cameFrom[neighbor] ← current',
      '        queue.enqueue(neighbor)',
      'return "no path"',
    ],
    run: bfs,
  },
  {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    shortName: 'Dijkstra',
    optimality: 'cost',
    weighted: true,
    usesHeuristic: false,
    blurb:
      'Always expands whichever discovered node is cheapest to reach so far, so it grows in rings of equal cost rather than equal step count. That is what lets it route around heavy terrain instead of ploughing through it, and why the route it returns is guaranteed cheapest. Its weakness is that it has no idea where the target is — it searches just as hard in the wrong direction.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V)' },
    pseudocode: [
      'g[start] ← 0, g[everything else] ← ∞',
      'open ← min-heap containing (start, 0)',
      'while open is not empty:',
      '    current ← open.pop()          // cheapest known',
      '    if current is end: return path',
      '    for neighbor in neighbors(current):',
      '        tentative ← g[current] + weight(neighbor)',
      '        if tentative < g[neighbor]:',
      '            g[neighbor] ← tentative',
      '            cameFrom[neighbor] ← current',
      '            open.push(neighbor, tentative)',
      'return "no path"',
    ],
    run: dijkstra,
  },
  {
    id: 'astar',
    name: 'A* Search',
    shortName: 'A*',
    optimality: 'cost',
    weighted: true,
    usesHeuristic: true,
    blurb:
      'Dijkstra with a sense of direction. It ranks nodes by cost-so-far plus an estimate of the distance remaining, so it pushes toward the target instead of spreading evenly. Because that estimate never overstates the true distance, A* keeps the guarantee of a cheapest path while typically exploring a fraction of the nodes. Put a long wall in its way and watch the advantage narrow — the estimate leads it into the dead end first.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V)' },
    pseudocode: [
      'g[start] ← 0',
      'open ← min-heap containing (start, h(start))',
      'while open is not empty:',
      '    current ← open.pop()          // lowest f = g + h',
      '    if current is end: return path',
      '    for neighbor in neighbors(current):',
      '        tentative ← g[current] + weight(neighbor)',
      '        if tentative < g[neighbor]:',
      '            g[neighbor] ← tentative',
      '            cameFrom[neighbor] ← current',
      '            open.push(neighbor, tentative + h(neighbor))',
      'return "no path"',
    ],
    run: astar,
  },
  {
    id: 'greedy',
    name: 'Greedy Best-First Search',
    shortName: 'Greedy',
    optimality: 'none',
    weighted: false,
    usesHeuristic: true,
    blurb:
      'Takes A*, throws away the cost-so-far term, and ranks nodes purely on how close they look to the target. The result is fast and often strikingly direct — and quite willing to accept an expensive detour, because it stopped tracking what the trip costs. The cleanest illustration of what that one dropped term in A* is actually buying you.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V)' },
    pseudocode: [
      'open ← min-heap containing (start, h(start))',
      'while open is not empty:',
      '    current ← open.pop()          // lowest h alone',
      '    if current is end: return path',
      '    for neighbor in neighbors(current):',
      '        if neighbor already reached: continue',
      '        cameFrom[neighbor] ← current',
      '        open.push(neighbor, h(neighbor))',
      'return "no path"',
    ],
    run: greedyBestFirst,
  },
  {
    id: 'dfs',
    name: 'Depth-First Search',
    shortName: 'DFS',
    optimality: 'none',
    weighted: false,
    usesHeuristic: false,
    blurb:
      'Picks a direction and follows it until it runs out of room, then backtracks and tries the next branch. It will find a route if one exists, but it has no reason to be a good one — expect it to wander most of the board to reach a target a few cells away. It is here because looking wrong is the point: it shows that what makes BFS optimal is the queue, not the traversal.',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    pseudocode: [
      'stack ← [start]',
      'while stack is not empty:',
      '    current ← stack.pop()',
      '    if current already visited: continue',
      '    mark current visited',
      '    if current is end: return path',
      '    for neighbor in neighbors(current):',
      '        if neighbor already visited: continue',
      '        cameFrom[neighbor] ← current',
      '        stack.push(neighbor)',
      'return "no path"',
    ],
    run: dfs,
  },
]

export function getAlgorithm(id: string): AlgorithmEntry {
  const entry = PATHFINDING_ALGORITHMS.find((algorithm) => algorithm.id === id)
  if (!entry) throw new Error(`Unknown pathfinding algorithm: ${id}`)
  return entry
}

export * from './compare'
export * from './grid'
export * from './generators'
export * from './heuristics'
export * from './types'

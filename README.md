# AlgoViz

An interactive visualizer for pathfinding and sorting algorithms — built to make the
behaviour of classic CS algorithms legible at a glance. Draw walls on a grid, drop a
start and a target, pick an algorithm, and watch it search.

Every algorithm here is implemented from scratch. No pathfinding libraries — the
point is the implementation, not the integration.

Ten algorithms, a per-algorithm education panel, a measured comparison after every
run, and a race mode that runs two searches on one board at once. Light and dark
themes, responsive down to a phone. 302 tests over the algorithm layer.

## Screenshots

<!-- Drop your own captures in docs/ and point these at them. The four worth having,
     because each shows something the others do not: -->

| | |
| --- | --- |
| **A\* on weighted terrain** — the tight beam toward the target _(screenshot)_ | **Race mode** — A\* beside Dijkstra on one board _(screenshot)_ |
| **Sorting** — merge sort mid-run, live counters _(GIF)_ | **Light theme** — same board, other palette _(screenshot)_ |

## Algorithms

### Pathfinding

| Algorithm | Guarantee | Uses terrain cost? | Heuristic | Time | Space |
| --- | --- | --- | --- | --- | --- |
| Breadth-First Search | Fewest **steps** | No | — | O(V + E) | O(V) |
| Dijkstra's | Lowest **cost** | Yes | — | O((V + E) log V) | O(V) |
| A* | Lowest **cost** | Yes | Manhattan / Euclidean | O((V + E) log V) | O(V) |
| Greedy Best-First | None | No | Manhattan / Euclidean | O((V + E) log V) | O(V) |
| Depth-First Search | None | No | — | O(V + E) | O(V) |

Dijkstra, A* and Greedy are one search — `bestFirstSearch` — under three different
priority functions, because that *is* the relationship between them:

```
Dijkstra   f = g        cheapest so far, no idea where the target is
A*         f = g + h    cheapest so far, biased toward the target
Greedy     f = h        pure beeline, forgets what the trip has cost
```

A* is not a different algorithm from Dijkstra; it is Dijkstra plus a hint, and it
collapses back into Dijkstra the moment that hint is zero.

Measured on one board with a single wall between start and target, all four complete
searches returning the same 32-step route:

| | Nodes expanded |
| --- | --- |
| BFS | 676 |
| Dijkstra's | 676 |
| A* (Manhattan) | **193** |
| Greedy Best-First | 49 |

DFS on the same board expanded only 217 nodes — and returned a **216-step** path for a
journey the others made in 32. Cheap to run, useless as a route.

Swapping A* to the Euclidean heuristic on an open board took it from 175 nodes to 239
for an identical route: both estimates are admissible, so both stay optimal, but
Euclidean is the less informed of the two on a 4-way grid.

### Board generation

| Generator | What it does |
| --- | --- |
| **Maze** | Recursive division — solvable by construction, not by retry |
| **Random walls** | Scattered obstacles, re-rolled until a route exists |
| **Terrain** | Blobs of ground that cost ×2, ×5 or ×9 to cross |

Recursive division draws a wall across a room, punches one gap in it, and recurses
into both halves. "Connected by construction" is the claim, and I got it wrong twice
before it was true — both times because a gap that exists is not the same as a gap you
can walk through:

1. **Perpendicular walls can seal a gap.** Two walls from sibling chambers meeting at
   the gap leave it open but walled on all four sides. The fix is the parity rule:
   walls only on even rows and columns, gaps only on odd ones. A gap at an odd
   coordinate always has odd-coordinate neighbours, and no wall can ever sit on those.
2. **The gap can land on the outer border.** Choosing it from the range that includes
   the enclosing ring meant it could fall on a border cell that was already a wall —
   so the "gap" was solid and the wall sealed the room instead of splitting it. Gaps
   now come from the chamber interior only.

The second one is the more instructive failure. It only triggers when the board's row
or column count puts a border on an odd index, and every test I had used a 21×39
board — odd by odd, the one shape where it cannot happen. The app renders 24×39. The
suite was green and the feature was broken in front of me. The regression test now runs
eight board shapes across both parities, and fails on six of them if either fix is
reverted.

Terrain is grown as blobs from random seed points rather than sprinkled per cell.
Isolated expensive pixels are noise — a search routes around them and the viewer never
sees why. Contiguous patches are what make the detour legible.

### Where weighted terrain pays off

One generated terrain board, three algorithms:

| | Steps | Cost | Nodes expanded |
| --- | --- | --- | --- |
| BFS | **24** | 84 | 593 |
| Dijkstra | 30 | **30** | 654 |
| A* (Manhattan) | 30 | **30** | **135** |

This is the whole argument for weights on one screen. BFS takes the short route and
pays 84 to cross the heavy ground, because every cell looks identical to it. Dijkstra
spends six extra steps going around and pays 30. A* gets the same answer for a fifth
of the work.

### Sorting

| Algorithm | Best | Average | Worst | Space | Stable | In place |
| --- | --- | --- | --- | --- | --- | --- |
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | yes | yes |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | yes | yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | yes | no |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | no | yes |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | no | yes |

Sorting 50 shuffled values, measured in the running app:

| | Comparisons | Swaps | Array writes |
| --- | --- | --- | --- |
| Bubble | 1,224 | 531 | 1,062 |
| Insertion | 577 | 531 | 1,062 |
| Heap | 418 | 245 | 490 |
| Quick | 274 | 133 | 266 |
| Merge | **220** | **0** | 286 |

Merge sort records zero swaps — it does not exchange pairs, it copies a run into a
buffer and writes the values back in order. That buffer is exactly why it is the one
algorithm here that is not in place, and the stats panel shows the trade rather than
asserting it.

Each algorithm runs through a `SortRecorder` — a working array that writes down every
comparison, swap and write done to it. The counters cannot drift from the real work,
because there is no second place to remember to increment them, and each sort still
reads like the textbook version:

```ts
for (let i = 0; i < end; i += 1) {
  if (tape.compareAt(i, i + 1) > 0) {
    tape.swap(i, i + 1)
    swapped = true
  }
}
```

The recording is a list of operations, not a list of array snapshots. Bubble sort on
100 elements takes around 10,000 steps; storing the whole array at each one would be a
million numbers to describe work that four fields express exactly.

Pacing is in **operations per second**, shared across all five algorithms, rather than
a fixed run time. A fixed duration would be smoother and completely dishonest — bubble
and merge sort would finish together, hiding the one thing the view exists to show. At
a shared rate, doing twenty times the work genuinely takes twenty times as long.

## The educational layer

This is the part that separates it from a generic clone.

**A collapsible panel per algorithm** — plain-English explanation, complexity, and the
actual pseudocode — reading from the same registry entry that populates the dropdown,
so an algorithm and its explanation cannot drift apart.

**A measured verdict after every run.** Each search silently runs Dijkstra on the same
board and compares, so the sentence quotes numbers rather than restating a big-O label:

> **A\*** reached the target in 26 steps using the Manhattan heuristic, exploring 55
> nodes — **91% fewer** than Dijkstra explored on the same board. The route is the
> cheapest available.

> **Greedy** reached the target in 24 steps using the Manhattan heuristic, exploring 25
> nodes — 96% fewer than Dijkstra explored on the same board. The route it settled for
> costs 34 against the cheapest 26 — **31% more expensive**.

Every clause is built from the run that just happened, so it says "explored 41% more"
as readily as "41% fewer", and it charges an algorithm for what it gave up to be fast.
The sorting view does the same against bubble sort: *"81% fewer comparisons than bubble
sort needed on the same 50 values (1,210)."*

**Race mode** runs two algorithms on one board, in two lanes, started on the same
frame. Both lanes render the *same* board state — draw a wall on either and both
update — because letting them diverge would make the comparison meaningless. The lane
that expanded fewer nodes gets the accent colour; a tie highlights neither.

## Running it locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm test         # unit tests for the algorithm layer (Vitest)
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

The app is fully client-side and builds to static files, so `dist/` deploys as-is to
Vercel, Netlify or GitHub Pages.

## Controls

### Pathfinding

| Action | How |
| --- | --- |
| Draw | Click and drag on empty cells |
| Erase | Click and drag starting on something you already drew |
| Switch brush | The **Draw: Walls / Terrain** toggle |
| Move an endpoint | Drag the green (start) or red (target) marker |
| Run the search | **Space**, or the Visualize button |
| Generate a maze | **M** |
| Generate terrain | **T** |
| Clear the path | **C** |
| Reset the board | **R** |

### Sorting

| Action | How |
| --- | --- |
| Run the sort | **Space**, or the Sort button |
| Shuffle | **R**, or the Shuffle button |
| Change array size | The Array size slider (10–120) |

Space stands aside when a button has focus, since space activates the focused button;
the letter shortcuts stay live, because otherwise every shortcut would die the moment
you clicked anything.

## Architecture

The split that matters is between *what the algorithm does* and *how it looks*:

```
src/
├─ algorithms/pathfinding/   Pure TypeScript. No React, no DOM, no timers.
│  ├─ types.ts               Grid/result contracts shared by every algorithm
│  ├─ grid.ts                Neighbours, path reconstruction, path cost
│  ├─ bfs.ts, dfs.ts         Queue- and stack-driven traversals
│  ├─ bestFirst.ts           The priority-queue search behind the next three
│  ├─ dijkstra.ts, astar.ts, greedy.ts   Three configs of that one search
│  ├─ minHeap.ts             Binary heap — the O(log n) pop those depend on
│  ├─ heuristics.ts          Manhattan and Euclidean, and why each is admissible
│  ├─ generators.ts          Recursive division, random walls, terrain blobs
│  ├─ compare.ts             Measuring a run against the Dijkstra baseline
│  ├─ parse.ts               ASCII → grid, for readable test fixtures
│  └─ index.ts               Registry: metadata + complexity + pseudocode
├─ algorithms/sorting/       Also pure. Same record-then-replay contract.
│  ├─ recorder.ts            The tape every sort writes through
│  ├─ compare.ts             Measuring a run against the bubble-sort baseline
│  ├─ bubble.ts, insertion.ts, merge.ts, quick.ts, heap.ts
│  └─ index.ts               Registry: complexity, stability, pseudocode
├─ hooks/
│  ├─ useVisualPlayer.ts     Replays a recorded search onto the board (rAF)
│  ├─ useSortPlayer.ts       Replays a recorded sort onto the bars (rAF)
│  ├─ usePathfindingBoard.ts Walls, endpoints, drag interactions
│  └─ useBoardSize.ts        Grid dimensions from available space
├─ lib/
│  ├─ random.ts             Seeded PRNG — a maze you can reproduce
│  └─ speed.ts              Animation pacing
└─ components/               Presentation only
```

Two decisions worth calling out:

**Algorithms return a recording, not a callback stream.** Each one runs to completion
synchronously and returns `{ visitedOrder, path, cost, durationMs }`. The UI then
replays that recording at whatever speed it likes. This keeps the algorithms pure and
directly unit-testable, makes "instant" mode free, and means the reported search time
measures the algorithm rather than the animation.

**The animation writes to the DOM, not to React state.** A 24×39 board is ~950 nodes;
reconciling that tree every frame would dominate the frame budget and make *Fast* feel
worse than *Slow*. The player sets `data-state` on cell elements directly and CSS does
the rest. React still owns the board's structure — walls, weights, endpoints — and the
overlay is swept clean on every discrete action so the two layers cannot drift apart.

## Tests

```bash
npm test
```

302 tests over the algorithm layer. The headline one: **Dijkstra and A* return exactly
the same path cost across eight seeded random mazes** — A* only earns the right to
explore less if the route it finds is still optimal. Alongside that:

- the min-heap agrees with a sorted array on 500 random pushes;
- Dijkstra detours around heavy terrain that BFS walks straight through, and A* makes
  the same detour;
- Greedy never returns a cheaper route than Dijkstra, and DFS never a shorter one
  than BFS (one-directional guarantees — DFS finding an optimal route on some board
  is luck, and the assertion has to allow for it);
- every algorithm agrees on whether the target is reachable, and none of them mutates
  the grid it was handed;
- generated mazes are solvable across ten seeds and five endpoint placements — the
  test that caught the parity bug described above;
- every sort is checked against eleven inputs (empty, single, sorted, reversed, all
  identical, duplicates, negatives, random) and, crucially, **replaying its recording
  reproduces its own output** — if that failed, the animation would be showing work
  the algorithm never did;
- quick sort stays near n log n on already-sorted input, the case that catches a naive
  last-element pivot;
- the comparison numbers stay finite in every degenerate case — an unreachable target,
  a start that is also the end, an empty array — because a percentage that renders as
  NaN in the summary would be worse than no summary at all;
- terrain never lands on a wall or an endpoint, only ever uses the declared costs, and
  on an open board gives Dijkstra a cheaper route than BFS on most seeds.

Fixtures are written as ASCII maps (`parse.ts`), so a test case reads as a picture:

```
S99999.
......E
```

## Roadmap

- [x] 1. Scaffold — Vite + React + TypeScript + Tailwind
- [x] 2. Grid, wall drawing, draggable endpoints
- [x] 3. BFS end-to-end + the animation pipeline
- [x] 4. Dijkstra, A*, DFS, Greedy Best-First
- [x] 5. Maze generation and weighted terrain
- [x] 6. Sorting visualizer
- [x] 7. Education panel (pseudocode, complexity), run comparisons, race mode
- [x] 8. Polish — light theme, responsiveness, README

## Themes and responsiveness

Light and dark, following the OS by default and remembering an explicit choice in
`localStorage`. A blocking script in `index.html` applies the saved theme before first
paint, because rendering dark and then flipping is worse than either theme on its own.

The theme is one block of CSS variables. Every component reads colour through a token,
so adding light was a second `:root[data-theme='light']` block rather than a pass over
every component — the reason the tokens were set up that way in step 1.

| Width | Behaviour |
| --- | --- |
| ≥ 1024px | Board and side panel side by side; race mode available |
| 768–1023px | Panel moves below the board; everything still editable |
| ≤ 640px | **View-only board** — generate, run and read, but no drawing |

The phone rule is deliberate. The board needs `touch-action: none` to receive drags,
and a board that swallows touch gestures on a screen it nearly fills leaves the reader
unable to scroll the page at all. Below 640px the board releases touch, drawing is
disabled, and the brush and race controls are hidden rather than shown doing nothing.
Generators, algorithms and the education panel all still work, so the phone gets the
whole app minus the one interaction that does not suit it.

## Deploying

`npm run build` emits a static `dist/` — no backend, no environment variables.

Live at **<https://tanakriteuro.github.io/algoviz/>**. `.github/workflows/deploy.yml` tests,
builds and publishes to GitHub Pages on every push to `main` (repo Settings → Pages →
Source: GitHub Actions). Pages serves it from a subpath, so `vite.config.ts` sets
`base: '/algoviz/'`; change it if the repo is renamed, or the asset URLs will 404.

The old Vercel URL (<https://algoviz-tau.vercel.app>) permanently redirects here via
`vercel.json`.

## What I learned

<!-- Personalize this — it is the part a reader remembers. What the build actually
     taught me, rather than what the algorithms are: -->

- **A* is not a separate algorithm from Dijkstra.** It is Dijkstra plus a hint, and it
  collapses back into Dijkstra the moment the hint is zero. Writing all three
  best-first searches as one function with different priority terms made that obvious
  in a way three separate files never would have.
- **"Optimal" needs a unit.** BFS guarantees the fewest *steps*; Dijkstra guarantees
  the lowest *cost*. A boolean `guaranteesShortest` field was fine until weighted
  terrain arrived and the two stopped meaning the same thing.
- **A green test suite is only as good as its inputs.** The maze generator shipped
  broken because every test used a 21×39 board — odd by odd, the one shape where the
  bug cannot occur. Driving the real app found in seconds what 82 passing tests missed.
- **Two layers touching the same DOM will drift.** Letting the animation write cell
  attributes directly is what keeps 60fps, and it also produced the subtlest bug in
  the project: a resize rebuilt the grid, React reused the cell indices, and the old
  paint stayed on a board that no longer existed.
- **Where the frame budget actually goes.** ~950 grid cells needed to bypass React
  reconciliation; 120 sorting bars did not. Same architecture, different amount of
  machinery, decided by measuring rather than by applying the first answer twice.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Vitest · oxlint

No state library, no component library, no algorithm library. The dependency list is
React and the build tooling — everything on screen is in `src/`.

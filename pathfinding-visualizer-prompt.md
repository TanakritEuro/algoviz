# Claude Code Prompt: Pathfinding & Sorting Algorithm Visualizer

Build a web app called **AlgoViz** — an interactive visualizer for pathfinding and sorting algorithms, meant as a portfolio piece demonstrating CS fundamentals (data structures, algorithms, complexity analysis).

## Tech stack
- React + TypeScript + Vite
- Tailwind CSS for styling
- No backend needed — everything runs client-side
- Deployable as a static site (Vercel/Netlify/GitHub Pages)

## Core feature: Pathfinding visualizer

A grid-based canvas where users can:
- Click and drag to draw walls/obstacles
- Place a start node and end node (draggable after placement)
- Choose an algorithm from: Dijkstra's, A* (with Manhattan/Euclidean heuristic toggle), BFS, DFS, Greedy Best-First Search
- Hit "Visualize" to animate the algorithm step-by-step: show nodes as they're visited (color-coded by state — unvisited, visited/frontier, current, path), then animate the final shortest path once found
- Adjustable animation speed (slow/medium/fast/instant)
- Generate random maze / random weighted terrain (some cells cost more to traverse, for Dijkstra/A* to shine)
- Clear board / clear walls only / reset buttons
- Live stats panel: nodes visited, path length, time taken (ms), and whether the algorithm guarantees shortest path

## Secondary feature: Sorting visualizer

A separate view/tab with:
- Bar chart representation of an array
- Algorithms: Bubble Sort, Merge Sort, Quick Sort, Heap Sort, Insertion Sort
- Adjustable array size and animation speed
- Color-coded bars (comparing, swapping, sorted)
- Live stats: comparisons, swaps, time complexity shown (e.g. "O(n log n)")

## Educational layer (this is what differentiates it from generic clones)
- A collapsible side panel per algorithm with: short plain-English explanation, time/space complexity, and pseudocode
- After a run, show a one-line summary like "A* found the shortest path in 143 steps using the Manhattan heuristic — 38% fewer nodes explored than Dijkstra"
- Optional: "race mode" — run two algorithms side-by-side on the same maze to visually compare efficiency

## UI/UX requirements
- Clean, modern, dark-mode-friendly design — this needs to look portfolio-worthy, not like a bootcamp clone
- Fully responsive down to tablet width; mobile can be view-only if drag interactions are too fiddly
- Smooth animations (use requestAnimationFrame or a small animation queue, not blocking setTimeout chains)
- Keyboard shortcuts are a nice-to-have (space to run, R to reset)

## Code quality expectations
- Clean separation between algorithm logic (pure functions, framework-agnostic, unit-testable) and rendering/UI
- Algorithms should be implemented from scratch (no pathfinding libraries) — the point is to demonstrate understanding
- Add a few unit tests for the core algorithms (e.g. verify A* and Dijkstra return the same path cost on the same maze)
- Include a README with: project description, screenshots/GIF placeholder, algorithms implemented, how to run locally, and a "what I learned" section I can personalize later

## Build order
1. Scaffold the project (Vite + React + TS + Tailwind)
2. Build the grid component and manual wall/start/end placement first, no algorithms yet
3. Implement BFS end-to-end (simplest) including animation pipeline
4. Layer in Dijkstra, A*, DFS, Greedy BFS reusing the same animation pipeline
5. Add maze generation and weighted terrain
6. Build the sorting visualizer as a separate route/tab
7. Add the educational side panel and stats
8. Polish: dark mode, responsiveness, README

Please start by scaffolding the project and building steps 1–3, then pause so I can review before continuing.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BASELINE_ALGORITHM_ID,
  BOARD_GENERATORS,
  compareToBaseline,
  getAlgorithm,
} from '../../algorithms/pathfinding'
import type {
  HeuristicName,
  Optimality,
  RunInsight,
  SearchResult,
} from '../../algorithms/pathfinding'
import { useBoardSize } from '../../hooks/useBoardSize'
import { COMPACT_QUERY, useMediaQuery } from '../../hooks/useMediaQuery'
import { usePathfindingBoard, type Brush } from '../../hooks/usePathfindingBoard'
import { useVisualPlayer } from '../../hooks/useVisualPlayer'
import type { SpeedName } from '../../lib/speed'
import { EducationPanel } from '../shared/EducationPanel'
import { ControlBar } from './ControlBar'
import { GridBoard } from './GridBoard'
import { Legend } from './Legend'
import { RaceLane } from './RaceLane'
import { StatsPanel } from './StatsPanel'

/** Plain-English version of what each guarantee actually promises. */
const OPTIMALITY_LABEL: Record<Optimality, string> = {
  cost: 'cheapest route',
  steps: 'fewest steps',
  none: 'none',
}

/** A control that owns every keystroke while focused. */
function isTextEntry(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable)
  )
}

/**
 * Space activates a focused button, so the shortcut must stand aside — otherwise
 * clicking "Clear walls" and pressing space would both re-click it and start a
 * run. Letter shortcuts have no such conflict and stay live: the alternative is
 * that every shortcut dies the moment the user touches a button, since focus
 * stays there afterwards.
 */
function ownsSpace(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.tagName === 'BUTTON'
}

export function PathfindingView() {
  const measureRef = useRef<HTMLDivElement>(null)
  const { rows, cols, cellSize, width } = useBoardSize(measureRef)
  // Phones get a view-only board — see useMediaQuery for why.
  const isCompact = useMediaQuery(COMPACT_QUERY)

  const [algorithmId, setAlgorithmId] = useState('bfs')
  const [heuristic, setHeuristic] = useState<HeuristicName>('manhattan')
  const [speed, setSpeed] = useState<SpeedName>('medium')
  const [brush, setBrush] = useState<Brush>('walls')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [insight, setInsight] = useState<RunInsight | null>(null)

  // Race mode: a second algorithm run on the same board, at the same time.
  const [isRacing, setIsRacing] = useState(false)
  const [rivalId, setRivalId] = useState('dijkstra')
  const [rivalResult, setRivalResult] = useState<SearchResult | null>(null)

  // Two independent players. Each owns its own map of cell elements, so the two
  // boards paint without knowing about each other; when the race is off, the
  // second simply never has any cells registered with it.
  const main = useVisualPlayer(cols)
  const rival = useVisualPlayer(cols)
  // Destructured, because the hooks return a fresh object every render while the
  // functions inside are stable. Depending on the objects would re-create every
  // callback below on each render — and re-subscribe the key handler with them.
  const { registerCell, play, clearPaint, stop: stopMain } = main
  const {
    registerCell: registerRivalCell,
    play: playRival,
    clearPaint: clearRivalPaint,
    stop: stopRival,
  } = rival
  const isPlaying = main.isPlaying || rival.isPlaying

  const stop = useCallback(() => {
    stopMain()
    stopRival()
  }, [stopMain, stopRival])

  /**
   * Two boards have to share the width, and shrinking the cells rather than the
   * grid means toggling the race keeps whatever maze is already drawn — changing
   * the column count would rebuild the board and throw it away.
   */
  // One source of truth for whether a race is actually on: the toggle can be
  // left enabled while the window shrinks past the width two boards need, and
  // the renderer and the run logic must not disagree about that.
  const racing = isRacing && !isCompact

  const raceCellSize = Math.max(5, Math.floor((width - 16) / 2 / cols))
  const laneCellSize = racing ? Math.min(cellSize, raceCellSize) : cellSize

  // Fewer nodes expanded wins. Ties leave neither lane highlighted, because
  // calling a dead heat a victory would be the wrong lesson.
  const leader: 'main' | 'rival' | null =
    !result || !rivalResult || result.visitedOrder.length === rivalResult.visitedOrder.length
      ? null
      : result.visitedOrder.length < rivalResult.visitedOrder.length
        ? 'main'
        : 'rival'

  // Any edit invalidates the last run, so the numbers on screen always describe
  // the board the user is actually looking at. The ref keeps `handleEdit` stable
  // and cheap — it is called on every cell a drag passes over.
  const hasResult = useRef(false)
  useEffect(() => {
    hasResult.current = result !== null
  }, [result])

  const handleEdit = useCallback(() => {
    if (!hasResult.current) return
    hasResult.current = false
    clearPaint()
    clearRivalPaint()
    setResult(null)
    setInsight(null)
    setRivalResult(null)
  }, [clearPaint, clearRivalPaint])

  const board = usePathfindingBoard(rows, cols, { brush, onEdit: handleEdit })
  const algorithm = getAlgorithm(algorithmId)

  // A resize rebuilds the board from scratch, retiring the last run along with
  // the walls it searched around. Dropping the stats is a render-time state
  // adjustment; wiping the DOM overlay is genuine external-system cleanup.
  const [lastSize, setLastSize] = useState({ rows, cols })
  if (lastSize.rows !== rows || lastSize.cols !== cols) {
    setLastSize({ rows, cols })
    setResult(null)
    setInsight(null)
    setRivalResult(null)
  }
  useEffect(() => {
    stop()
    clearPaint()
    clearRivalPaint()
  }, [rows, cols, clearPaint, clearRivalPaint, stop])

  const visualize = useCallback(() => {
    const { grid, start, end } = board.board
    const run = getAlgorithm(algorithmId).run(grid, start, end, { heuristic })

    // Run the baseline too, silently, so the summary can say *how much* better
    // or worse this was rather than just quoting its own numbers. It is a
    // sub-millisecond search on a board this size — cheaper than the animation
    // frame it happens on.
    const isBaseline = algorithmId === BASELINE_ALGORITHM_ID
    const baseline = isBaseline
      ? run
      : getAlgorithm(BASELINE_ALGORITHM_ID).run(grid, start, end)

    setResult(run)
    setInsight(compareToBaseline(run, baseline, isBaseline))
    play(run, speed)

    if (racing) {
      // Same board, same speed, started on the same frame — the only variable
      // left is the algorithm, which is the entire point of the mode.
      const rivalRun = getAlgorithm(rivalId).run(grid, start, end, { heuristic })
      setRivalResult(rivalRun)
      playRival(rivalRun, speed)
    } else {
      setRivalResult(null)
    }
  }, [algorithmId, board.board, heuristic, play, playRival, racing, rivalId, speed])

  const clearPath = useCallback(() => {
    stop()
    clearPaint()
    clearRivalPaint()
    setResult(null)
    setInsight(null)
    setRivalResult(null)
  }, [clearPaint, clearRivalPaint, stop])

  const generate = useCallback(
    (generatorId: string) => {
      const generator = BOARD_GENERATORS.find((entry) => entry.id === generatorId)
      if (!generator) return
      clearPath()
      board.generate(generator.run)
    },
    [board, clearPath],
  )

  const clearWalls = useCallback(() => {
    clearPath()
    board.clearWalls()
  }, [board, clearPath])

  const clearTerrain = useCallback(() => {
    clearPath()
    board.clearTerrain()
  }, [board, clearPath])

  const toggleRace = useCallback(
    (racing: boolean) => {
      // Switching modes swaps the boards out from under the paint layer, so the
      // run on screen has to be retired with them.
      clearPath()
      setIsRacing(racing)
    },
    [clearPath],
  )

  const resetBoard = useCallback(() => {
    clearPath()
    board.resetBoard()
  }, [board, clearPath])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextEntry(event.target)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.code === 'Space') {
        if (ownsSpace(event.target)) return
        event.preventDefault()
        if (isPlaying) stop()
        else visualize()
      } else if (event.key.toLowerCase() === 'r') {
        resetBoard()
      } else if (event.key.toLowerCase() === 'c') {
        clearPath()
      } else if (event.key.toLowerCase() === 'm') {
        generate('maze')
      } else if (event.key.toLowerCase() === 't') {
        generate('terrain')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [clearPath, generate, isPlaying, resetBoard, stop, visualize])

  return (
    <div className="flex flex-col gap-4">
      <ControlBar
        algorithmId={algorithmId}
        heuristic={heuristic}
        speed={speed}
        brush={brush}
        isPlaying={isPlaying}
        hasWalls={board.hasWalls}
        hasTerrain={board.hasTerrain}
        onAlgorithmChange={setAlgorithmId}
        onHeuristicChange={setHeuristic}
        onSpeedChange={setSpeed}
        onBrushChange={setBrush}
        onGenerate={generate}
        onVisualize={visualize}
        onStop={stop}
        onClearPath={clearPath}
        onClearWalls={clearWalls}
        onClearTerrain={clearTerrain}
        onReset={resetBoard}
        isCompact={isCompact}
        isRacing={isRacing}
        rivalId={rivalId}
        onRacingChange={toggleRace}
        onRivalChange={setRivalId}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/*
          The board sizes itself to this box, so this box must never size itself
          to the board — that loop would oscillate on resize. Its height comes
          from the viewport instead, clamped to something sane at either end.
        */}
        <div
          ref={measureRef}
          className="w-full overflow-hidden"
          style={{ height: 'clamp(340px, calc(100dvh - 320px), 780px)' }}
        >
          {racing ? (
            <div className="grid grid-cols-2 gap-4">
              <RaceLane
                algorithm={algorithm}
                board={board.board}
                cellSize={laneCellSize}
                result={result}
                isLeading={leader === 'main'}
                disabled={isPlaying || isCompact}
                registerCell={registerCell}
                onPointerDown={board.handlePointerDown}
                onPointerEnter={board.handlePointerEnter}
              />
              <RaceLane
                algorithm={getAlgorithm(rivalId)}
                board={board.board}
                cellSize={laneCellSize}
                result={rivalResult}
                isLeading={leader === 'rival'}
                disabled={isPlaying || isCompact}
                registerCell={registerRivalCell}
                onPointerDown={board.handlePointerDown}
                onPointerEnter={board.handlePointerEnter}
              />
            </div>
          ) : (
            <GridBoard
              board={board.board}
              cellSize={cellSize}
              disabled={isPlaying || isCompact}
              registerCell={registerCell}
              onPointerDown={board.handlePointerDown}
              onPointerEnter={board.handlePointerEnter}
            />
          )}
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/70 p-4">
          <StatsPanel
            algorithm={algorithm}
            result={result}
            insight={insight}
            heuristic={heuristic}
          />
          <div className="border-t border-[var(--color-line-soft)] pt-4">
            <EducationPanel
              name={algorithm.shortName}
              badge={algorithm.complexity.time}
              blurb={algorithm.blurb}
              facts={[
                { label: 'Time', value: algorithm.complexity.time },
                { label: 'Space', value: algorithm.complexity.space },
                { label: 'Guarantee', value: OPTIMALITY_LABEL[algorithm.optimality] },
                { label: 'Terrain aware', value: algorithm.weighted ? 'yes' : 'no' },
                { label: 'Uses a heuristic', value: algorithm.usesHeuristic ? 'yes' : 'no' },
              ]}
              pseudocode={algorithm.pseudocode}
            />
          </div>

          <div className="border-t border-[var(--color-line-soft)] pt-4">
            <Legend />
          </div>
          {isCompact ? (
            <p className="text-xs leading-relaxed text-[var(--color-ink-faint)]">
              The board is view-only at this width — drawing would fight the page scroll. Use{' '}
              <em>Generate</em> to build a board, and a tablet or wider screen to draw on one.
            </p>
          ) : (
          <p className="text-xs leading-relaxed text-[var(--color-ink-faint)]">
            Drag on the grid to draw, drag again over what you drew to erase it, and drag the green
            or red marker to move an endpoint. Switch the brush to <em>Terrain</em> to paint ground
            that costs more to cross — the difference Dijkstra and A* can see and BFS cannot.
          </p>
          )}
          <p className="text-xs leading-relaxed text-[var(--color-ink-faint)]">
            <kbd className="rounded border border-[var(--color-line)] px-1 font-mono">space</kbd>{' '}
            runs · <kbd className="rounded border border-[var(--color-line)] px-1 font-mono">M</kbd>{' '}
            maze · <kbd className="rounded border border-[var(--color-line)] px-1 font-mono">T</kbd>{' '}
            terrain · <kbd className="rounded border border-[var(--color-line)] px-1 font-mono">C</kbd>{' '}
            clear path ·{' '}
            <kbd className="rounded border border-[var(--color-line)] px-1 font-mono">R</kbd> reset
          </p>
        </aside>
      </div>
    </div>
  )
}

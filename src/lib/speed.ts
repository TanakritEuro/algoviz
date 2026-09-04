export type SpeedName = 'slow' | 'medium' | 'fast' | 'instant'

export interface SpeedSetting {
  id: SpeedName
  label: string
  /** Milliseconds between two expanded nodes. 0 paints the whole run at once. */
  msPerVisit: number
  /** The final path is always drawn a little slower — it is the payoff shot. */
  msPerPathStep: number
}

export const SPEEDS: Record<SpeedName, SpeedSetting> = {
  slow: { id: 'slow', label: 'Slow', msPerVisit: 34, msPerPathStep: 70 },
  medium: { id: 'medium', label: 'Medium', msPerVisit: 11, msPerPathStep: 34 },
  fast: { id: 'fast', label: 'Fast', msPerVisit: 3, msPerPathStep: 14 },
  instant: { id: 'instant', label: 'Instant', msPerVisit: 0, msPerPathStep: 0 },
}

export const SPEED_ORDER: SpeedName[] = ['slow', 'medium', 'fast', 'instant']

/**
 * Sorting is paced in operations per second rather than a fixed run time.
 *
 * A fixed duration would be smoother to watch and completely dishonest: bubble
 * sort and merge sort would finish together, hiding the one thing the view
 * exists to show. At a shared rate, doing twenty times the work genuinely takes
 * twenty times as long — the efficiency difference becomes something you sit
 * through rather than something you read off a label.
 */
export const SORT_OPS_PER_SECOND: Record<SpeedName, number> = {
  slow: 30,
  medium: 220,
  fast: 1600,
  instant: Number.POSITIVE_INFINITY,
}

/**
 * Even so, bubble sort on 120 bars is ~14,000 operations, which at the slow rate
 * would run for eight minutes. Past this ceiling the rate scales up so the run
 * stays watchable; the relative ordering of the algorithms survives, because
 * every one of them gets the same treatment.
 */
export const MAX_SORT_RUN_SECONDS = 25

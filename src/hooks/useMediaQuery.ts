import { useEffect, useState } from 'react'

function readQuery(query: string): boolean {
  return typeof window !== 'undefined' && window.matchMedia(query).matches
}

/**
 * Subscribes to a media query. Used for behaviour that CSS cannot express —
 * whether the board accepts drawing at all — rather than for styling, which
 * stays in Tailwind's breakpoints where it belongs.
 */
export function useMediaQuery(query: string): boolean {
  // The query is stored beside its answer so a changed query can be re-read
  // during render, rather than leaving a stale answer on screen until the next
  // change event happens to fire.
  const [state, setState] = useState(() => ({ query, matches: readQuery(query) }))
  if (state.query !== query) setState({ query, matches: readQuery(query) })

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setState({ query, matches: event.matches })
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return state.matches
}

/**
 * Phone-sized. Below this the board is view-only: a drag would be fighting the
 * page scroll, and losing that fight leaves the user unable to scroll at all.
 */
export const COMPACT_QUERY = '(max-width: 640px)'

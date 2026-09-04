import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'algoviz:theme'

function systemTheme(): Theme {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    // Private browsing, blocked storage — a missing preference is not an error.
    return null
  }
}

/**
 * The active theme, applied as `data-theme` on `<html>`.
 *
 * The initial value is read off the element rather than recomputed, because a
 * blocking script in index.html has already set it before first paint. Deciding
 * again here would risk disagreeing with what is on screen.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'dark'
    const applied = document.documentElement.dataset.theme
    if (applied === 'light' || applied === 'dark') return applied
    return storedTheme() ?? systemTheme()
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // The theme still applies for this session; it just will not be remembered.
    }
  }, [theme])

  // Follow the OS only while the user has expressed no preference of their own.
  useEffect(() => {
    if (storedTheme()) return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (event: MediaQueryListEvent) => setThemeState(event.matches ? 'light' : 'dark')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}

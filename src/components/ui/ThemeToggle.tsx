import type { Theme } from '../../hooks/useTheme'

interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={onToggle}
      // The icon alone carries no name, so the label has to say what pressing it does.
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]"
    >
      <svg viewBox="0 0 20 20" aria-hidden className="h-4 w-4" fill="currentColor">
        {theme === 'dark' ? (
          // Moon: what you are in, not what you would get.
          <path d="M16.3 12.6A6.8 6.8 0 0 1 7.4 3.7a6.8 6.8 0 1 0 8.9 8.9Z" />
        ) : (
          <>
            <circle cx="10" cy="10" r="3.6" />
            <path
              d="M10 1.6v2.2M10 16.2v2.2M18.4 10h-2.2M3.8 10H1.6M15.9 4.1l-1.6 1.6M5.7 14.3l-1.6 1.6M15.9 15.9l-1.6-1.6M5.7 5.7 4.1 4.1"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </button>
  )
}

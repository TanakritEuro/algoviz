import type { ReactNode } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { ThemeToggle } from '../ui/ThemeToggle'

export type ViewId = 'pathfinding' | 'sorting'

interface AppShellProps {
  view: ViewId
  onViewChange: (view: ViewId) => void
  children: ReactNode
}

const TABS: Array<{ id: ViewId; label: string }> = [
  { id: 'pathfinding', label: 'Pathfinding' },
  { id: 'sorting', label: 'Sorting' },
]

export function AppShell({ view, onViewChange, children }: AppShellProps) {
  const { theme, toggle } = useTheme()

  return (
    <div className="app-backdrop min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-[var(--color-line-soft)] bg-[var(--color-canvas)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-2.5">
            <span className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              Algo<span className="text-[var(--color-accent)]">Viz</span>
            </span>
            <span className="hidden text-xs text-[var(--color-ink-faint)] sm:inline">
              pathfinding &amp; sorting, one step at a time
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
          <nav className="flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-current={view === tab.id ? 'page' : undefined}
                onClick={() => onViewChange(tab.id)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  view === tab.id
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-ink)]'
                    : 'text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">{children}</main>
    </div>
  )
}

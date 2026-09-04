import type { ReactNode } from 'react'

interface CollapsiblePanelProps {
  title: string
  /** Small label on the right of the header, e.g. the algorithm's complexity. */
  badge?: string
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * Built on native `<details>` rather than a button and a state flag: it is
 * keyboard-operable and announced correctly by screen readers without any of
 * that being reimplemented here, and it still collapses if the JS never runs.
 */
export function CollapsiblePanel({
  title,
  badge,
  defaultOpen = false,
  children,
}: CollapsiblePanelProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface-raised)]/60 [&[open]>summary]:border-b [&[open]>summary]:border-[var(--color-line-soft)]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--color-ink)] select-none hover:text-[var(--color-accent)]">
        <svg
          viewBox="0 0 12 12"
          aria-hidden
          className="h-3 w-3 shrink-0 text-[var(--color-ink-faint)] transition-transform duration-150 group-open:rotate-90"
        >
          <path d="M4 2.5 L8 6 L4 9.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {badge ? (
          <span className="shrink-0 font-mono text-[11px] text-[var(--color-ink-faint)]">
            {badge}
          </span>
        ) : null}
      </summary>
      <div className="px-3 py-3">{children}</div>
    </details>
  )
}

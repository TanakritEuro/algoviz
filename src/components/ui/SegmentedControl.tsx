interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (value: T) => void
  disabled?: boolean
}

/**
 * A two-or-three-way switch. Used where a dropdown would hide the fact that a
 * choice exists at all — the terrain brush is easy to miss unless both of its
 * states are on screen.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--color-ink-faint)] uppercase">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="flex h-9 items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-1"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              value === option.value
                ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

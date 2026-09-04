import type { ReactNode } from 'react'

interface SelectProps<T extends string> {
  label: string
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (value: T) => void
  disabled?: boolean
  hint?: ReactNode
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  hint,
}: SelectProps<T>) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--color-ink-faint)] uppercase">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-2.5 text-sm text-[var(--color-ink)] transition-colors hover:border-[var(--color-line-strong)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className="text-xs text-[var(--color-ink-faint)]">{hint}</span> : null}
    </label>
  )
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  disabled?: boolean
  onChange: (value: number) => void
}

export function Slider({ label, value, min, max, step = 1, disabled, onChange }: SliderProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline gap-2 text-[11px] font-medium tracking-[0.08em] text-[var(--color-ink-faint)] uppercase">
        {label}
        <span className="font-mono text-xs tracking-normal text-[var(--color-ink-muted)] normal-case">
          {value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 w-44 cursor-pointer accent-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
      />
    </label>
  )
}

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[var(--shadow-accent)] hover:bg-[var(--color-accent-hover)]',
  ghost:
    'bg-[var(--color-surface-raised)] text-[var(--color-ink)] border border-[var(--color-line)] hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-hover)]',
  danger:
    'bg-transparent text-[var(--color-ink-muted)] border border-[var(--color-line)] hover:border-[var(--color-danger-line)] hover:text-[var(--color-danger-ink)]',
}

export function Button({ variant = 'ghost', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

import { CollapsiblePanel } from '../ui/CollapsiblePanel'

export interface Fact {
  label: string
  value: string
}

interface EducationPanelProps {
  name: string
  /** Shown collapsed in the header — the number people scan for. */
  badge?: string
  blurb: string
  facts: Fact[]
  pseudocode: string[]
}

/**
 * The "why", next to the "what". Shared by both visualisers, because the thing
 * worth explaining — plain English, the complexity, and the actual steps — has
 * the same shape whether the algorithm is searching a grid or sorting an array.
 */
export function EducationPanel({ name, badge, blurb, facts, pseudocode }: EducationPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <CollapsiblePanel title={`How ${name} works`} badge={badge} defaultOpen>
        <p className="text-[13px] leading-relaxed text-[var(--color-ink-muted)]">{blurb}</p>
      </CollapsiblePanel>

      <CollapsiblePanel title="Complexity">
        <dl className="flex flex-col gap-1.5">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-baseline justify-between gap-4 text-xs">
              <dt className="text-[var(--color-ink-faint)]">{fact.label}</dt>
              <dd className="font-mono text-[var(--color-ink-muted)]">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </CollapsiblePanel>

      <CollapsiblePanel title="Pseudocode">
        {/* Indentation carries the structure, so it must survive: `pre` keeps it,
            and the horizontal scroll keeps a long line from widening the panel. */}
        <pre className="overflow-x-auto font-mono text-[11px] leading-[1.7] text-[var(--color-ink-muted)]">
          <code>{pseudocode.join('\n')}</code>
        </pre>
      </CollapsiblePanel>
    </div>
  )
}

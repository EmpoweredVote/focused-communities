import { useRef, useEffect, useState } from 'react'
import type { Chair } from '../types'

interface StanceCardProps {
  // Chair.description is null for most chairs; a Stance is assignable here too.
  stance: Pick<Chair, 'text' | 'description' | 'supportingPoints' | 'examplePerspectives'>
  isHighlighted: boolean
}

export function StanceCard({ stance, isHighlighted }: StanceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // A chair with no description, supporting points or examples has nothing to expand into,
  // so it stays a plain, non-interactive card rather than opening an empty panel.
  const examples = (stance.examplePerspectives ?? []).filter((e) => e.trim())
  const points = (stance.supportingPoints ?? []).filter((p) => p.trim())
  const hasExamples = examples.length > 0
  const hasPoints = points.length > 0
  const hasDescription = !!stance.description?.trim()
  const hasDetail = hasDescription || hasPoints || hasExamples

  useEffect(() => {
    if (expanded && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [expanded])

  return (
    <div
      ref={cardRef}
      onClick={hasDetail ? () => setExpanded(prev => !prev) : undefined}
      className={[
        'border rounded-lg p-4 transition-all shadow-sm',
        hasDetail ? 'cursor-pointer hover:shadow-md' : '',
        isHighlighted
          ? 'bg-ev-yellow-light border-ev-yellow'
          : 'bg-surface-card border-border-light border-l-4 border-l-transparent',
        !isHighlighted && hasDetail ? 'hover:border-border-medium hover:border-l-ev-teal-light' : '',
      ].join(' ')}
    >
      {/* Headline — always visible */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-text-body leading-snug flex-1">{stance.text}</p>
        {hasDetail && (
          <span className="text-text-muted text-sm flex-shrink-0 mt-0.5" aria-hidden="true">
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* Expanded content */}
      {expanded && hasDetail && (
        <div className="mt-3 md:max-h-80 md:overflow-y-auto">
          {hasDescription && (
            <p className="text-text-secondary text-sm leading-relaxed mb-3">
              {stance.description}
            </p>
          )}
          {hasPoints && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                Supporting Points
              </p>
              {/* Unordered on purpose: nothing here may read as a rung number. */}
              <ul className="list-disc pl-5 space-y-1">
                {points.map((point, i) => (
                  <li key={i} className="text-sm text-text-secondary">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasExamples && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                Example Perspectives
              </p>
              <ul className="space-y-2">
                {examples.map((perspective, i) => (
                  <li key={i} className="text-sm text-text-secondary italic">
                    &ldquo;{perspective}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

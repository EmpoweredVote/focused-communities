import { useRef, useEffect, useState } from 'react'
import type { DisplayStance } from '../hooks/useStances'

interface StanceCardProps {
  stance: DisplayStance
  isHighlighted: boolean
}

export function StanceCard({ stance, isHighlighted }: StanceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [expanded])

  return (
    <div
      ref={cardRef}
      onClick={() => setExpanded(prev => !prev)}
      className={[
        'border rounded-lg p-4 cursor-pointer transition-colors',
        isHighlighted ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300',
      ].join(' ')}
    >
      {/* Headline — always visible */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-gray-900 leading-snug flex-1">{stance.text}</p>
        <span className="text-gray-400 text-sm flex-shrink-0 mt-0.5" aria-hidden="true">
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 md:max-h-80 md:overflow-y-auto">
          {stance.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              {stance.description}
            </p>
          )}
          {stance.examplePerspectives && stance.examplePerspectives.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Example Perspectives
              </p>
              <ul className="space-y-2">
                {stance.examplePerspectives.map((perspective, i) => (
                  <li key={i} className="text-sm text-gray-600 italic">
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

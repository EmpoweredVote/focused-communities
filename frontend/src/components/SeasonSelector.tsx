import { useId } from 'react'
import type { SeasonSummary } from '../types'

interface SeasonSelectorProps {
  seasons: SeasonSummary[]
  value: number
  onChange: (seasonNumber: number) => void
}

function optionLabel(season: SeasonSummary): string {
  switch (season.status) {
    case 'open':
      return `${season.name} (current)`
    case 'closed':
      return `${season.name} (past wording)`
    case 'draft':
      return `${season.name} (draft, not published)`
  }
}

export function SeasonSelector({ seasons, value, onChange }: SeasonSelectorProps) {
  const id = useId()

  // Nothing to switch between.
  if (seasons.length < 2) return null

  const selected = seasons.find((s) => s.number === value)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-text-muted">
        Season
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-surface-card text-text-body border border-border-medium rounded px-3 py-2 focus:outline-2 focus:outline-offset-2 focus:outline-ev-teal"
      >
        {seasons.map((s) => (
          <option key={s.number} value={s.number}>
            {optionLabel(s)}
          </option>
        ))}
      </select>
      {selected?.status === 'draft' && (
        <p className="text-sm text-text-body bg-ev-yellow-light border border-ev-yellow rounded px-2 py-1">
          Draft wording. This season is not visible to the public.
        </p>
      )}
    </div>
  )
}

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
    default:
      // A status the API adds later still gets a readable option.
      return season.name
  }
}

function DraftNotice({ id, show }: { id: string; show: boolean }) {
  // The live region is always mounted so that text added later is announced.
  return (
    <div id={id} role="status">
      {show && (
        <p className="text-sm text-text-body bg-ev-yellow-light border border-ev-yellow rounded px-2 py-1">
          Draft wording. This season is not visible to the public.
        </p>
      )}
    </div>
  )
}

export function SeasonSelector({ seasons, value, onChange }: SeasonSelectorProps) {
  const id = useId()
  const noticeId = `${id}-notice`

  // Nothing to switch between. A lone draft still has to say it is unpublished.
  if (seasons.length < 2) {
    if (seasons.length === 1 && seasons[0].status === 'draft') {
      return <DraftNotice id={noticeId} show />
    }
    return null
  }

  const selected = seasons.find((s) => s.number === value)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-text-muted">
        Season
      </label>
      <select
        id={id}
        // A value matching no season shows a neutral placeholder rather than
        // silently displaying the first season while the page shows another.
        value={selected ? value : ''}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={noticeId}
        className="bg-surface-card text-text-body border border-border-medium rounded px-3 py-2 focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring"
      >
        {!selected && (
          <option value="" disabled>
            Choose a season
          </option>
        )}
        {seasons.map((s) => (
          <option key={s.number} value={s.number}>
            {optionLabel(s)}
          </option>
        ))}
      </select>
      <DraftNotice id={noticeId} show={selected?.status === 'draft'} />
    </div>
  )
}

import type { ChangeClass, SeasonView } from '../types'

interface SeasonNotesProps {
  view: SeasonView
}

// Patch-note labels. Each says what happened to the question's meaning, since
// a reader needs to tell a cosmetic rewording from a real change.
const CHANGE_LABEL: Record<Exclude<ChangeClass, null>, { title: string; detail: string }> = {
  editorial: {
    title: 'Editorial change',
    detail: 'Spelling, punctuation or style only. The meaning is unchanged.',
  },
  clarifying: {
    title: 'Clarifying change',
    detail: 'Reworded to be clearer. The question still asks the same thing.',
  },
  substantive: {
    title: 'Substantive change',
    detail: 'The meaning changed. This season asks something different from before.',
  },
}

export function SeasonNotes({ view }: SeasonNotesProps) {
  const { changeClass, seasonNote, topicNote, rationale, isFallback, season } = view
  const label = changeClass ? CHANGE_LABEL[changeClass] : undefined

  if (!label && !seasonNote && !topicNote && !rationale && !isFallback) return null

  return (
    <section
      aria-label="Season notes"
      className="mt-4 flex flex-col gap-3 border border-border-light bg-surface-card rounded-lg p-4 text-sm"
    >
      {isFallback && (
        <p
          data-testid="season-fallback"
          className="text-text-body bg-ev-yellow-light border border-ev-yellow rounded px-2 py-1"
        >
          The season you asked for is not available. You are reading {season.name} instead.
        </p>
      )}

      {label && (
        <p className="text-text-body">
          <span className="font-semibold">{label.title}.</span> {label.detail}
        </p>
      )}

      {seasonNote && (
        <div>
          <h3 className="font-semibold text-text-body mb-1">Why this season changed</h3>
          <p className="text-text-secondary leading-relaxed">{seasonNote}</p>
        </div>
      )}

      {topicNote && (
        <div>
          <h3 className="font-semibold text-text-body mb-1">Why this topic changed</h3>
          <p className="text-text-secondary leading-relaxed">{topicNote}</p>
        </div>
      )}

      {rationale && (
        <div className="border-t border-border-light pt-3">
          <h3 className="font-semibold text-text-body mb-1">Compass rationale (internal)</h3>
          <p className="text-text-secondary leading-relaxed">{rationale}</p>
        </div>
      )}
    </section>
  )
}

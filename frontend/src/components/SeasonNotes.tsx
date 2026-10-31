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

// Shown above the question: the reader must learn this is not the season they
// asked for before reading the wording.
export function SeasonFallbackNotice({ view }: SeasonNotesProps) {
  if (!view.isFallback) return null
  return (
    <p
      data-testid="season-fallback"
      className="text-sm text-text-body bg-ev-yellow-light border border-ev-yellow rounded px-2 py-1"
    >
      The season you asked for is not available. You are reading {view.season.name} instead.
    </p>
  )
}

export function SeasonNotes({ view }: SeasonNotesProps) {
  const { changeClass } = view
  const label = changeClass ? CHANGE_LABEL[changeClass] : undefined
  // Explicit non-empty checks: an empty string must not render a titled, empty block.
  const seasonNote = view.seasonNote?.trim() ? view.seasonNote : null
  const topicNote = view.topicNote?.trim() ? view.topicNote : null
  const rationale = view.rationale?.trim() ? view.rationale : null

  if (!label && !seasonNote && !topicNote && !rationale) return null

  return (
    <section
      aria-label="Season notes"
      className="mt-4 flex flex-col gap-3 border border-border-light bg-surface-card rounded-lg p-4 text-sm"
    >
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

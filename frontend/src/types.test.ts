import { describe, it, expect } from 'vitest'
import type { Chair, SeasonView } from './types'

const chair: Chair = {
  text: 'chair text',
  description: null,
  supportingPoints: [],
  examplePerspectives: [],
  changeSince: null,
}

const view: SeasonView = {
  season: { number: 1, name: 'Season 1', status: 'open', openedAt: null, closedAt: null },
  questionText: 'question text',
  changeClass: null,
  seasonNote: null,
  topicNote: null,
  rationale: null,
  isFallback: false,
  chairs: [chair],
}

describe('season types', () => {
  it('permits a chair with a null description', () => {
    expect(view.chairs[0].description).toBeNull()
  })

  it('accepts editorial as a changeClass', () => {
    const edited: SeasonView = { ...view, changeClass: 'editorial' }
    expect(edited.changeClass).toBe('editorial')
  })
})
